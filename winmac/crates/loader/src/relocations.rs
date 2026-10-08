//! Base relocation metadata and rebasing of non-executable byte images.
use crate::{map_image, rva_to_file_offset, LoadedImage, LoaderError};
use thiserror::Error;
use winmac_pe::{MachineType, PeFormat, PeImage};

pub const MAX_RELOCATION_ENTRIES: usize = 1_048_576;
pub const MAX_RELOCATION_BLOCKS: usize = 65_536;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RelocationKind {
    Absolute,
    High,
    Low,
    HighLow,
    HighAdj { adjustment: i16 },
    Dir64,
    Unsupported { raw_type: u8 },
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RelocationEntry {
    pub offset: u16,
    pub target_rva: u32,
    pub kind: RelocationKind,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RelocationBlock {
    pub page_rva: u32,
    pub entries: Vec<RelocationEntry>,
}
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RelocationTable {
    pub blocks: Vec<RelocationBlock>,
}
#[derive(Debug, Error, PartialEq, Eq)]
pub enum RelocationError {
    #[error("Invalid relocation directory range")]
    InvalidDirectory,
    #[error("Relocation data at RVA {rva:#X} is not file backed")]
    Unreadable { rva: u32 },
    #[error("Invalid relocation block at RVA {rva:#X}, size {size}")]
    InvalidBlock { rva: u32, size: u32 },
    #[error("Relocation page RVA {rva:#X} is not 4 KiB aligned")]
    UnalignedPage { rva: u32 },
    #[error("HIGHADJ relocation at RVA {rva:#X} is missing its second slot")]
    MissingAdjustment { rva: u32 },
    #[error("Relocation target RVA {rva:#X} is outside the image")]
    InvalidTarget { rva: u32 },
    #[error("Relocation arithmetic overflow")]
    Overflow,
    #[error("Relocation safety limit exceeded")]
    LimitExceeded,
    #[error("Cannot rebase an image with stripped or absent relocations")]
    CannotRebase,
    #[error("Unsupported relocation at RVA {rva:#X}: {kind:?}")]
    Unsupported { rva: u32, kind: RelocationKind },
    #[error("Relocation targets overlap at RVA {rva:#X}")]
    OverlappingTargets { rva: u32 },
    #[error("Invalid load base {base:#X} for this image")]
    InvalidBase { base: u64 },
    #[error("Machine type and optional header format are incompatible")]
    MachineFormatMismatch,
}

fn read<const N: usize>(pe: &PeImage, bytes: &[u8], rva: u32) -> Result<[u8; N], RelocationError> {
    let mut result = [0; N];
    for (i, out) in result.iter_mut().enumerate() {
        let address = rva
            .checked_add(u32::try_from(i).map_err(|_| RelocationError::Overflow)?)
            .ok_or(RelocationError::Overflow)?;
        if address >= pe.optional_header.size_of_image {
            return Err(RelocationError::Unreadable { rva: address });
        }
        let offset = rva_to_file_offset(pe, bytes, address)
            .map_err(|_| RelocationError::Unreadable { rva: address })?;
        *out = *bytes
            .get(offset)
            .ok_or(RelocationError::Unreadable { rva: address })?;
    }
    Ok(result)
}

/// Parse directory index 5 without modifying the image. Unknown machine-specific
/// types retain their raw number; HIGHADJ consumes its signed second slot.
pub fn parse_relocation_table(pe: &PeImage, bytes: &[u8]) -> Result<RelocationTable, LoaderError> {
    parse(pe, bytes).map_err(LoaderError::from)
}
fn parse(pe: &PeImage, bytes: &[u8]) -> Result<RelocationTable, RelocationError> {
    let mut table = RelocationTable::default();
    let Some(dir) = pe
        .data_directories
        .get(5)
        .filter(|d| d.virtual_address != 0)
    else {
        return Ok(table);
    };
    let end = dir
        .virtual_address
        .checked_add(dir.size)
        .filter(|&end| end <= pe.optional_header.size_of_image)
        .ok_or(RelocationError::InvalidDirectory)?;
    if dir.size == 0 || dir.virtual_address % 4 != 0 {
        return Err(RelocationError::InvalidDirectory);
    }
    let mut cursor = dir.virtual_address;
    let mut slots = 0usize;
    while cursor < end {
        if end - cursor < 8 {
            return Err(RelocationError::InvalidBlock {
                rva: cursor,
                size: end - cursor,
            });
        }
        if table.blocks.len() >= MAX_RELOCATION_BLOCKS {
            return Err(RelocationError::LimitExceeded);
        }
        let page = u32::from_le_bytes(read(pe, bytes, cursor)?);
        let size = u32::from_le_bytes(read(pe, bytes, cursor + 4)?);
        if size < 8 || size % 4 != 0 || size > end - cursor {
            return Err(RelocationError::InvalidBlock { rva: cursor, size });
        }
        if page % 0x1000 != 0 {
            return Err(RelocationError::UnalignedPage { rva: page });
        }
        let block_end = cursor + size;
        cursor += 8;
        let count = ((size - 8) / 2) as usize;
        slots = slots.checked_add(count).ok_or(RelocationError::Overflow)?;
        if slots > MAX_RELOCATION_ENTRIES {
            return Err(RelocationError::LimitExceeded);
        }
        let mut entries = Vec::new();
        while cursor < block_end {
            let raw = u16::from_le_bytes(read(pe, bytes, cursor)?);
            cursor += 2;
            let offset = raw & 0xfff;
            let raw_type = (raw >> 12) as u8;
            let target = page
                .checked_add(u32::from(offset))
                .ok_or(RelocationError::Overflow)?;
            let (kind, width) = match (pe.coff_header.machine, raw_type) {
                (_, 0) => (RelocationKind::Absolute, 0),
                (MachineType::I386, 1) => (RelocationKind::High, 2),
                (MachineType::I386, 2) => (RelocationKind::Low, 2),
                (MachineType::I386, 3) => (RelocationKind::HighLow, 4),
                (MachineType::I386, 4) => {
                    if cursor == block_end {
                        return Err(RelocationError::MissingAdjustment { rva: target });
                    }
                    let adjustment = i16::from_le_bytes(read(pe, bytes, cursor)?);
                    cursor += 2;
                    (RelocationKind::HighAdj { adjustment }, 2)
                }
                (MachineType::Amd64 | MachineType::Arm64, 10) => (RelocationKind::Dir64, 8),
                _ => (RelocationKind::Unsupported { raw_type }, 1),
            };
            if width != 0
                && target
                    .checked_add(width)
                    .is_none_or(|end| end > pe.optional_header.size_of_image)
            {
                return Err(RelocationError::InvalidTarget { rva: target });
            }
            entries.push(RelocationEntry {
                offset,
                target_rva: target,
                kind,
            });
        }
        table.blocks.push(RelocationBlock {
            page_rva: page,
            entries,
        });
    }
    Ok(table)
}

/// Create a fresh, non-executable image at a chosen numeric base. Only HIGHLOW
/// (I386/PE32) and DIR64 (AMD64 or ARM64/PE32+) are applied. On error no partially
/// modified image escapes. Original PE bytes and headers remain unchanged.
pub fn map_image_at(pe: &PeImage, bytes: &[u8], base: u64) -> Result<LoadedImage, LoaderError> {
    let format_ok = matches!(
        (pe.coff_header.machine, pe.optional_header.format),
        (MachineType::I386, PeFormat::Pe32)
            | (MachineType::Amd64 | MachineType::Arm64, PeFormat::Pe32Plus)
    );
    if !format_ok {
        return Err(RelocationError::MachineFormatMismatch.into());
    }
    let last = base.checked_add(u64::from(
        pe.optional_header.size_of_image.saturating_sub(1),
    ));
    if !base.is_multiple_of(0x10000)
        || last.is_none()
        || (pe.optional_header.format == PeFormat::Pe32
            && last.is_some_and(|last| last > u64::from(u32::MAX)))
    {
        return Err(RelocationError::InvalidBase { base }.into());
    }
    let mut image = map_image(pe, bytes)?;
    if base == image.image_base {
        return Ok(image);
    }
    if pe.coff_header.characteristics & 1 != 0 {
        return Err(RelocationError::CannotRebase.into());
    }
    let table = parse_relocation_table(pe, bytes)?;
    if table.blocks.is_empty() {
        return Err(RelocationError::CannotRebase.into());
    }
    let mut patches = Vec::new();
    for entry in table.blocks.into_iter().flat_map(|block| block.entries) {
        let width = match entry.kind {
            RelocationKind::Absolute => continue,
            RelocationKind::HighLow => 4usize,
            RelocationKind::Dir64 => 8usize,
            kind => {
                return Err(RelocationError::Unsupported {
                    rva: entry.target_rva,
                    kind,
                }
                .into())
            }
        };
        let start = usize::try_from(entry.target_rva).map_err(|_| RelocationError::Overflow)?;
        let end = start.checked_add(width).ok_or(RelocationError::Overflow)?;
        if image.memory.get(start..end).is_none() {
            return Err(RelocationError::InvalidTarget {
                rva: entry.target_rva,
            }
            .into());
        }
        patches.push((start, end));
    }
    patches.sort_unstable();
    for pair in patches.windows(2) {
        if pair[0].1 > pair[1].0 {
            return Err(RelocationError::OverlappingTargets {
                rva: pair[1].0 as u32,
            }
            .into());
        }
    }
    let delta = base.wrapping_sub(image.image_base);
    for (start, end) in patches {
        let target = image
            .memory
            .get_mut(start..end)
            .ok_or(RelocationError::InvalidTarget { rva: start as u32 })?;
        if target.len() == 4 {
            let mut raw = [0; 4];
            raw.copy_from_slice(target);
            target.copy_from_slice(
                &u32::from_le_bytes(raw)
                    .wrapping_add(delta as u32)
                    .to_le_bytes(),
            );
        } else {
            let mut raw = [0; 8];
            raw.copy_from_slice(target);
            target.copy_from_slice(&u64::from_le_bytes(raw).wrapping_add(delta).to_le_bytes());
        }
    }
    image.image_base = base;
    Ok(image)
}

#[cfg(test)]
mod tests;
