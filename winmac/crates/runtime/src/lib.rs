//! Experimental, bounded x86-64 interpreter for small Windows console and GUI PEs.
//! This does not execute guest instructions on the host CPU.
mod ui;
mod x64;
use thiserror::Error;
pub use ui::{MessageBox, UserInterface};
use winmac_loader::{map_image_at, parse_import_table, LoaderError};
use winmac_memory::{AddressSpace, MemoryError, Permissions};
use winmac_pe::{parse_pe, MachineType, PeError, PeFormat};
use winmac_win32::{Api, Console, ConsoleError};

const STACK_BASE: u64 = 0x0000_7fff_0000_0000;
const STACK_SIZE: usize = 1024 * 1024;
const API_BASE: u64 = 0xffff_0000_0000_0000;
const RETURN_SENTINEL: u64 = 0xffff_ffff_ffff_fff0;
pub const MAX_RUN_IMAGE_SIZE: u32 = 64 * 1024 * 1024;
pub const MAX_INSTRUCTIONS: u64 = 10_000_000;

#[derive(Debug, Clone)]
pub struct RunOptions {
    pub load_base: Option<u64>,
    pub max_instructions: u64,
}
impl Default for RunOptions {
    fn default() -> Self {
        Self {
            load_base: None,
            max_instructions: 100_000,
        }
    }
}
#[derive(Debug, PartialEq, Eq)]
pub struct RunResult {
    pub exit_code: u32,
    pub stdout: Vec<u8>,
    pub stderr: Vec<u8>,
    pub instructions: u64,
    pub api_calls: Vec<Api>,
}
#[derive(Debug, Error)]
pub enum RuntimeError {
    #[error(transparent)]
    Pe(#[from] PeError),
    #[error(transparent)]
    Loader(#[from] LoaderError),
    #[error(transparent)]
    Memory(#[from] MemoryError),
    #[error(transparent)]
    Console(#[from] ConsoleError),
    #[error("Runtime supports only AMD64 PE32+ console or GUI executables")]
    UnsupportedImage,
    #[error("GUI error: {0}")]
    Gui(String),
    #[error("Runtime does not support nonempty data directory {index}")]
    UnsupportedDirectory { index: usize },
    #[error("Unresolved import: {dll}!{symbol}")]
    UnresolvedImport { dll: String, symbol: String },
    #[error("Invalid or overlapping IAT range at RVA {rva:#X}")]
    InvalidIat { rva: u32 },
    #[error("Unsupported x64 instruction at {rip:#X}: opcode {opcode:#X}")]
    UnsupportedInstruction { rip: u64, opcode: u8 },
    #[error("Guest address overflow")]
    AddressOverflow,
    #[error("Instruction budget exhausted ({limit})")]
    InstructionLimit { limit: u64 },
    #[error("Invalid instruction limit; expected 1..={MAX_INSTRUCTIONS}")]
    InvalidInstructionLimit,
    #[error("Guest image exceeds runtime size limit ({MAX_RUN_IMAGE_SIZE} bytes)")]
    ImageTooLarge,
    #[error("Invalid Windows x64 call stack at {rsp:#X}")]
    InvalidCallStack { rsp: u64 },
}

struct Machine<'a> {
    ui: &'a mut dyn UserInterface,
    memory: AddressSpace,
    console: Console,
    apis: Vec<Api>,
    api_calls: Vec<Api>,
}

/// Load a PE, bind the explicit console API allowlist, then interpret its entry
/// point. Unsupported formats/features fail explicitly. No host DLLs are loaded.
pub fn run_pe(bytes: &[u8], options: &RunOptions) -> Result<RunResult, RuntimeError> {
    run_pe_with_ui(bytes, options, &mut ui::Headless)
}

/// Run with a synchronous host UI. Button results resume guest execution.
pub fn run_pe_with_ui(
    bytes: &[u8],
    options: &RunOptions,
    ui: &mut dyn UserInterface,
) -> Result<RunResult, RuntimeError> {
    if options.max_instructions == 0 || options.max_instructions > MAX_INSTRUCTIONS {
        return Err(RuntimeError::InvalidInstructionLimit);
    }
    let pe = parse_pe(bytes)?;
    if pe.coff_header.machine != MachineType::Amd64
        || pe.optional_header.format != PeFormat::Pe32Plus
        || !matches!(pe.optional_header.subsystem, 2 | 3)
        || pe.coff_header.characteristics & 0x2000 != 0
        || pe.optional_header.address_of_entry_point == 0
    {
        return Err(RuntimeError::UnsupportedImage);
    }
    if pe.optional_header.size_of_image > MAX_RUN_IMAGE_SIZE {
        return Err(RuntimeError::ImageTooLarge);
    }
    // TLS, load config/CFG, bound imports, delay imports and CLR require runtime
    // semantics this MVP cannot honor. Do not silently pretend to initialize them.
    for index in [9usize, 10, 11, 13, 14] {
        if pe
            .data_directories
            .get(index)
            .is_some_and(|d| d.virtual_address != 0 || d.size != 0)
        {
            return Err(RuntimeError::UnsupportedDirectory { index });
        }
    }
    let imports = parse_import_table(&pe, bytes)?;
    let base = options.load_base.unwrap_or(pe.optional_header.image_base);
    if base < 0x10000
        || base
            .checked_add(u64::from(pe.optional_header.size_of_image))
            .is_none_or(|end| end > STACK_BASE)
    {
        return Err(RuntimeError::UnsupportedImage);
    }
    let mut image = map_image_at(&pe, bytes, base)?;
    let entry = image
        .entry_point_va()?
        .ok_or(RuntimeError::UnsupportedImage)?;
    let mut apis = Vec::new();
    let mut iat_ranges = Vec::new();
    for module in &imports.modules {
        let start = module.first_thunk as usize;
        let size = module
            .symbols
            .len()
            .checked_add(1)
            .and_then(|n| n.checked_mul(8))
            .ok_or(RuntimeError::AddressOverflow)?;
        let end = start
            .checked_add(size)
            .ok_or(RuntimeError::AddressOverflow)?;
        // Require IAT including its sentinel to fit inside one backed section.
        let valid = pe.sections.iter().any(|s| {
            start >= s.virtual_address as usize
                && end <= s.virtual_address as usize + s.size_of_raw_data as usize
        });
        if !valid
            || image.memory.get(start..end).is_none()
            || iat_ranges.iter().any(|&(a, b)| start < b && a < end)
        {
            return Err(RuntimeError::InvalidIat {
                rva: module.first_thunk,
            });
        }
        iat_ranges.push((start, end));
        if image.memory.get(end - 8..end).is_none_or(|v| v != [0; 8]) {
            return Err(RuntimeError::InvalidIat {
                rva: module.first_thunk,
            });
        }
        for (i, symbol) in module.symbols.iter().enumerate() {
            let name = match symbol {
                winmac_loader::ImportSymbol::ByName { name, .. } => name.clone(),
                winmac_loader::ImportSymbol::ByOrdinal { ordinal } => format!("#{ordinal}"),
            };
            let api = Api::resolve(&module.dll_name, &name).ok_or_else(|| {
                RuntimeError::UnresolvedImport {
                    dll: module.dll_name.clone(),
                    symbol: name,
                }
            })?;
            let token = API_BASE + apis.len() as u64 * 16;
            apis.push(api);
            let offset = start + i * 8;
            image
                .memory
                .get_mut(offset..offset + 8)
                .ok_or(RuntimeError::InvalidIat {
                    rva: module.first_thunk,
                })?
                .copy_from_slice(&token.to_le_bytes());
        }
    }
    let mut memory = AddressSpace::default();
    let headers = pe.optional_header.size_of_headers as usize;
    memory.map(
        base,
        image
            .memory
            .get(..headers)
            .ok_or(RuntimeError::UnsupportedImage)?
            .to_vec(),
        Permissions::READ,
    )?;
    for section in &pe.sections {
        let start = section.virtual_address as usize;
        let span = section.virtual_size.max(section.size_of_raw_data) as usize;
        if span == 0 {
            continue;
        }
        let end = start
            .checked_add(span)
            .ok_or(RuntimeError::AddressOverflow)?;
        let contents = image
            .memory
            .get(start..end)
            .ok_or(RuntimeError::UnsupportedImage)?
            .to_vec();
        memory.map(
            base.checked_add(start as u64)
                .ok_or(RuntimeError::AddressOverflow)?,
            contents,
            Permissions {
                read: section.characteristics & 0x4000_0000 != 0,
                write: section.characteristics & 0x8000_0000 != 0,
                execute: section.characteristics & 0x2000_0000 != 0,
            },
        )?;
    }
    drop(image);
    memory.map(STACK_BASE, vec![0; STACK_SIZE], Permissions::READ_WRITE)?;
    let rsp = STACK_BASE + STACK_SIZE as u64 - 8;
    memory.write(rsp, &RETURN_SENTINEL.to_le_bytes())?;
    memory.fetch(entry)?;
    let mut machine = Machine {
        ui,
        memory,
        console: Console::default(),
        apis,
        api_calls: Vec::new(),
    };
    let mut cpu = x64::Cpu::new(entry, rsp);
    for instructions in 1..=options.max_instructions {
        if let Some(exit_code) = cpu.step(&mut machine)? {
            return Ok(RunResult {
                exit_code,
                stdout: machine.console.stdout,
                stderr: machine.console.stderr,
                instructions,
                api_calls: machine.api_calls,
            });
        }
    }
    Err(RuntimeError::InstructionLimit {
        limit: options.max_instructions,
    })
}

#[cfg(test)]
mod tests;
