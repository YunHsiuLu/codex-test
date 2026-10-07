//! Read-only import inspection. No symbol resolution or IAT writes.
use crate::{rva_to_file_offset, LoaderError};
use thiserror::Error;
use winmac_pe::{PeFormat, PeImage};

pub const MAX_IMPORT_STRING_BYTES: usize = 4096;
pub const MAX_IMPORT_MODULES: usize = 4096;
pub const MAX_IMPORT_SYMBOLS: usize = 65_536;
/// Global input-read budget, including repeated references (not a PE format limit).
pub const MAX_IMPORT_READ_BYTES: usize = 16 * 1024 * 1024;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ImportTable {
    pub modules: Vec<ImportModule>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ImportModule {
    pub dll_name: String,
    pub original_first_thunk: u32,
    pub first_thunk: u32,
    pub symbols: Vec<ImportSymbol>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ImportSymbol {
    ByName { hint: u16, name: String },
    ByOrdinal { ordinal: u16 },
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum ImportError {
    #[error("Import directory range is invalid (RVA {rva:#X}, size {size})")]
    DirectoryOutOfBounds { rva: u32, size: u32 },
    #[error("Import descriptor at RVA {rva:#X} is truncated by directory size")]
    DescriptorTruncated { rva: u32 },
    #[error("Import descriptor terminator is missing within directory size")]
    DescriptorTerminatorMissing,
    #[error("Import {kind} at RVA {rva:#X} has no readable file backing")]
    InvalidRva { kind: &'static str, rva: u32 },
    #[error("Import RVA arithmetic overflow")]
    AddressOverflow,
    #[error("Import string at RVA {rva:#X} has no terminator within {MAX_IMPORT_STRING_BYTES} bytes")]
    StringUnterminated { rva: u32 },
    #[error("Import string at RVA {rva:#X} is empty")]
    EmptyName { rva: u32 },
    #[error("Import descriptor at RVA {rva:#X} has a null name or thunk RVA")]
    NullDescriptorField { rva: u32 },
    #[error("Import thunk table at RVA {rva:#X} has no terminator within file-derived bound")]
    ThunkTerminatorMissing { rva: u32 },
    #[error("Import thunk value {value:#X} cannot fit in a 32-bit RVA")]
    RvaTooLarge { value: u64 },
    #[error("Import thunk value {value:#X} has nonzero reserved bits")]
    ReservedThunkBits { value: u64 },
    #[error("Import parsing exceeds safety limit: {kind}")]
    LimitExceeded { kind: &'static str },
}

struct Reader<'a> {
    pe: &'a PeImage,
    bytes: &'a [u8],
    remaining: usize,
}

impl Reader<'_> {
    // Translate every byte, so structures/strings cannot leak into file overlays,
    // RVA gaps or zero-fill. Adjacent RVAs may have nonadjacent file offsets.
    fn read<const N: usize>(&mut self, rva: u32, kind: &'static str) -> Result<[u8; N], ImportError> {
        self.remaining = self.remaining.checked_sub(N)
            .ok_or(ImportError::LimitExceeded { kind: "read bytes" })?;
        let mut result = [0; N];
        for (i, byte) in result.iter_mut().enumerate() {
            let address = rva.checked_add(u32::try_from(i).map_err(|_| ImportError::AddressOverflow)?)
                .ok_or(ImportError::AddressOverflow)?;
            if address >= self.pe.optional_header.size_of_image {
                return Err(ImportError::InvalidRva { kind, rva: address });
            }
            let offset = rva_to_file_offset(self.pe, self.bytes, address)
                .map_err(|_| ImportError::InvalidRva { kind, rva: address })?;
            *byte = *self.bytes.get(offset)
                .ok_or(ImportError::InvalidRva { kind, rva: address })?;
        }
        Ok(result)
    }

    fn string(&mut self, rva: u32) -> Result<String, ImportError> {
        let mut name = Vec::new();
        for i in 0..MAX_IMPORT_STRING_BYTES {
            let address = rva.checked_add(i as u32).ok_or(ImportError::AddressOverflow)?;
            let [byte] = self.read(address, "string")?;
            if byte == 0 {
                if name.is_empty() {
                    return Err(ImportError::EmptyName { rva });
                }
                return Ok(String::from_utf8_lossy(&name).into_owned());
            }
            name.push(byte);
        }
        Err(ImportError::StringUnterminated { rva })
    }

    fn symbols(&mut self, rva: u32, count: &mut usize) -> Result<Vec<ImportSymbol>, ImportError> {
        let (width, flag) = match self.pe.optional_header.format {
            PeFormat::Pe32 => (4u32, 1u64 << 31),
            PeFormat::Pe32Plus => (8u32, 1u64 << 63),
        };
        let mut symbols = Vec::new();
        let mut cursor = rva;
        for _ in 0..=self.bytes.len() / width as usize {
            let value = if width == 4 {
                u64::from(u32::from_le_bytes(self.read(cursor, "thunk")?))
            } else {
                u64::from_le_bytes(self.read(cursor, "thunk")?)
            };
            if value == 0 {
                return Ok(symbols);
            }
            if *count >= MAX_IMPORT_SYMBOLS {
                return Err(ImportError::LimitExceeded { kind: "total symbols" });
            }
            *count += 1;
            let symbol = if value & flag != 0 {
                if value & !(flag | 0xffff) != 0 {
                    return Err(ImportError::ReservedThunkBits { value });
                }
                ImportSymbol::ByOrdinal { ordinal: (value & 0xffff) as u16 }
            } else {
                let name_rva = u32::try_from(value).map_err(|_| ImportError::RvaTooLarge { value })?;
                // The Hint/Name RVA occupies bits 0..30 in either format.
                if name_rva & 0x8000_0000 != 0 {
                    return Err(ImportError::ReservedThunkBits { value });
                }
                let hint = u16::from_le_bytes(self.read(name_rva, "hint/name")?);
                let name = self.string(name_rva.checked_add(2).ok_or(ImportError::AddressOverflow)?)?;
                ImportSymbol::ByName { hint, name }
            };
            symbols.push(symbol);
            cursor = cursor.checked_add(width).ok_or(ImportError::AddressOverflow)?;
        }
        Err(ImportError::ThunkTerminatorMissing { rva })
    }
}

/// Inspect directory index 1. Its size bounds descriptors only, not names/thunks.
/// An absent directory or zero RVA means no imports. Policy limits are exported.
/// `OriginalFirstThunk == 0` reads FirstThunk as an unbound lookup table; bound
/// addresses cannot be resolved by this inspector and are rejected as malformed.
pub fn parse_import_table(pe: &PeImage, file_bytes: &[u8]) -> Result<ImportTable, LoaderError> {
    parse(pe, file_bytes).map_err(LoaderError::from)
}

fn parse(pe: &PeImage, file_bytes: &[u8]) -> Result<ImportTable, ImportError> {
    let mut table = ImportTable { modules: Vec::new() };
    let Some(directory) = pe.data_directories.get(1).filter(|d| d.virtual_address != 0) else {
        return Ok(table);
    };
    let start = directory.virtual_address;
    let end = start.checked_add(directory.size)
        .filter(|&end| end <= pe.optional_header.size_of_image)
        .ok_or(ImportError::DirectoryOutOfBounds { rva: start, size: directory.size })?;
    let mut reader = Reader { pe, bytes: file_bytes, remaining: MAX_IMPORT_READ_BYTES };
    let mut cursor = start;
    let mut count = 0;
    loop {
        if end - cursor < 20 {
            return Err(if cursor == end && cursor != start {
                ImportError::DescriptorTerminatorMissing
            } else { ImportError::DescriptorTruncated { rva: cursor } });
        }
        let descriptor: [u8; 20] = reader.read(cursor, "descriptor")?;
        if descriptor == [0; 20] {
            return Ok(table);
        }
        if table.modules.len() >= MAX_IMPORT_MODULES {
            return Err(ImportError::LimitExceeded { kind: "modules" });
        }
        // Fixed arrays and chunks avoid indexing untrusted-length slices.
        let mut fields = [0u32; 5];
        for (field, bytes) in fields.iter_mut().zip(descriptor.chunks_exact(4)) {
            let mut raw = [0; 4];
            raw.copy_from_slice(bytes);
            *field = u32::from_le_bytes(raw);
        }
        let [original_first_thunk, _, _, name_rva, first_thunk] = fields;
        let lookup = if original_first_thunk == 0 { first_thunk } else { original_first_thunk };
        if name_rva == 0 || lookup == 0 || first_thunk == 0 {
            return Err(ImportError::NullDescriptorField { rva: cursor });
        }
        let dll_name = reader.string(name_rva)?;
        let symbols = reader.symbols(lookup, &mut count)?;
        table.modules.push(ImportModule { dll_name, original_first_thunk, first_thunk, symbols });
        cursor = cursor.checked_add(20).ok_or(ImportError::AddressOverflow)?;
    }
}

#[cfg(test)]
mod tests;
