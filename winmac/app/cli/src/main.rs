use std::env;
use std::fs;
use std::io::{Read, Write};
use std::process::ExitCode;
mod ui;

fn main() -> ExitCode {
    match command(&env::args().skip(1).collect::<Vec<_>>()) {
        Ok(code) => ExitCode::from((code & 0xff) as u8),
        Err(error) => {
            eprintln!("Error: {error:#}");
            ExitCode::FAILURE
        }
    }
}

fn number(text: &str) -> anyhow::Result<u64> {
    Ok(if let Some(hex) = text.strip_prefix("0x") {
        u64::from_str_radix(hex, 16)?
    } else {
        text.parse()?
    })
}

fn command(args: &[String]) -> anyhow::Result<u32> {
    if args.len() == 1 && matches!(args[0].as_str(), "--help" | "-h") {
        println!("Usage: winmac-cli [inspect] <file.exe>\n       winmac-cli run <file.exe> [--base <address>] [--max-instructions <count>]");
        return Ok(0);
    }
    if args.first().is_some_and(|a| a == "run") {
        let path = args
            .get(1)
            .ok_or_else(|| anyhow::anyhow!("run requires a PE file"))?;
        let mut options = winmac_runtime::RunOptions::default();
        let mut i = 2;
        while i < args.len() {
            let value = args
                .get(i + 1)
                .ok_or_else(|| anyhow::anyhow!("{} requires a value", args[i]))?;
            match args[i].as_str() {
                "--base" => options.load_base = Some(number(value)?),
                "--max-instructions" => options.max_instructions = number(value)?,
                flag => anyhow::bail!("Unknown option: {flag}"),
            }
            i += 2;
        }
        let result =
            winmac_runtime::run_pe_with_ui(&read_input(path)?, &options, &mut ui::NativeUi)?;
        std::io::stdout().lock().write_all(&result.stdout)?;
        std::io::stderr().lock().write_all(&result.stderr)?;
        eprintln!(
            "WinMac: guest exited with code {} ({} instructions, {} API calls)",
            result.exit_code,
            result.instructions,
            result.api_calls.len()
        );
        return Ok(result.exit_code);
    }
    match args {
        [path] if !path.starts_with('-') => inspect(path)?,
        [mode, path] if mode == "inspect" => inspect(path)?,
        _ => anyhow::bail!("Usage: winmac-cli [inspect] <file.exe> | run <file.exe> [--base <address>] [--max-instructions <count>]"),
    }
    Ok(0)
}

fn read_input(path: &str) -> anyhow::Result<Vec<u8>> {
    const MAX_FILE_SIZE: u64 = 64 * 1024 * 1024;
    let mut bytes = Vec::new();
    fs::File::open(path)?
        .take(MAX_FILE_SIZE + 1)
        .read_to_end(&mut bytes)?;
    anyhow::ensure!(
        bytes.len() as u64 <= MAX_FILE_SIZE,
        "PE file exceeds 64 MiB CLI limit"
    );
    Ok(bytes)
}

fn inspect(path: &str) -> anyhow::Result<()> {
    let bytes = read_input(path)?;
    let pe = winmac_pe::parse_pe(&bytes)?;

    println!("WinMac PE Inspector\n");
    println!("File: {}", path);
    println!("Architecture: {}", pe.coff_header.machine);
    println!("Format: {}", pe.optional_header.format);
    println!(
        "Entry Point: {:#010X}",
        pe.optional_header.address_of_entry_point
    );
    println!("Image Base: {:#018X}", pe.optional_header.image_base);
    println!(
        "Section Alignment: {}",
        pe.optional_header.section_alignment
    );
    println!("File Alignment: {}", pe.optional_header.file_alignment);
    println!("Image Size: {}", pe.optional_header.size_of_image);
    println!("Headers Size: {}", pe.optional_header.size_of_headers);
    println!("Subsystem: {}", pe.optional_header.subsystem);
    println!("Data Directories: {}", pe.data_directories.len());
    println!("\nSections ({}):", pe.sections.len());

    for sec in &pe.sections {
        println!("\n{}", sec.name_lossy());
        println!("  RVA:          {:#010X}", sec.virtual_address);
        println!("  Virtual Size: {:#010X}", sec.virtual_size);
        println!("  Raw Size:     {:#010X}", sec.size_of_raw_data);
        println!("  Raw Pointer:  {:#010X}", sec.pointer_to_raw_data);
    }

    let imports = winmac_loader::parse_import_table(&pe, &bytes)?;
    if imports.modules.is_empty() {
        println!("\nImports: none");
    } else {
        println!("\nImports:");
        for module in imports.modules {
            println!("  {}", module.dll_name.escape_default());
            for symbol in module.symbols {
                match symbol {
                    winmac_loader::ImportSymbol::ByName { hint, name } => {
                        println!("    {} (hint {})", name.escape_default(), hint);
                    }
                    winmac_loader::ImportSymbol::ByOrdinal { ordinal } => {
                        println!("    ordinal #{}", ordinal);
                    }
                }
            }
        }
    }

    let relocations = winmac_loader::parse_relocation_table(&pe, &bytes)?;
    let entries: usize = relocations.blocks.iter().map(|b| b.entries.len()).sum();
    println!(
        "\nRelocations: {} blocks, {} entries (including padding)",
        relocations.blocks.len(),
        entries
    );
    Ok(())
}
