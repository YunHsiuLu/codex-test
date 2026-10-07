mod imports;
pub use imports::*;

use thiserror::Error;
use winmac_pe::PeImage;

pub const MAX_IMAGE_SIZE: usize = 512 * 1024 * 1024;

#[derive(Error, Debug, PartialEq, Eq)]
pub enum LoaderError {
    #[error(transparent)]
    Import(#[from] ImportError),
    #[error("Image size is zero")]
    ImageSizeZero,

    #[error("Image size {size} bytes exceeds maximum allowed limit {max} bytes")]
    ImageTooLarge { size: usize, max: usize },

    #[error("SizeOfHeaders ({size_of_headers} bytes) exceeds file length ({file_len} bytes)")]
    HeadersOutOfBounds {
        size_of_headers: u32,
        file_len: usize,
    },

    #[error("SizeOfHeaders ({size_of_headers} bytes) exceeds SizeOfImage ({size_of_image} bytes)")]
    HeadersExceedImage {
        size_of_headers: u32,
        size_of_image: u32,
    },

    #[error("Section {section_index} virtual range exceeds SizeOfImage")]
    SectionVirtualRangeOutOfBounds { section_index: usize },

    #[error(
        "Section {section_index} raw data source extends past file boundary (pointer: {pointer}, size: {size}, file_len: {file_len})"
    )]
    SectionRawDataOutOfBounds {
        section_index: usize,
        pointer: u32,
        size: u32,
        file_len: usize,
    },

    #[error("Section {section_index} virtual range overlaps PE headers")]
    SectionOverlapsHeaders { section_index: usize },

    #[error("Section {first_index} overlaps with Section {second_index}")]
    OverlappingSections {
        first_index: usize,
        second_index: usize,
    },

    #[error("RVA {rva:#010X} is not mapped in headers or any section")]
    RvaNotMapped { rva: u32 },

    #[error("RVA {rva:#010X} lies in a virtual zero-fill region with no file backing")]
    RvaHasNoFileBacking { rva: u32 },

    #[error("Invalid Entry Point RVA {rva:#010X} exceeds SizeOfImage")]
    InvalidEntryPoint { rva: u32 },

    #[error("Address arithmetic overflow occurred")]
    AddressOverflow,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LoadedImage {
    pub image_base: u64,
    pub entry_point_rva: u32,
    pub memory: Vec<u8>,
}

impl LoadedImage {
    pub fn entry_point_va(&self) -> Result<Option<u64>, LoaderError> {
        if self.entry_point_rva == 0 {
            return Ok(None);
        }

        let rva_u64 = u64::from(self.entry_point_rva);
        let va = self
            .image_base
            .checked_add(rva_u64)
            .ok_or(LoaderError::AddressOverflow)?;

        Ok(Some(va))
    }
}

pub fn rva_to_file_offset(pe: &PeImage, file_bytes: &[u8], rva: u32) -> Result<usize, LoaderError> {
    let size_of_headers = pe.optional_header.size_of_headers;

    if rva < size_of_headers {
        let offset = usize::try_from(rva).map_err(|_| LoaderError::AddressOverflow)?;
        if offset < file_bytes.len() {
            return Ok(offset);
        } else {
            return Err(LoaderError::RvaNotMapped { rva });
        }
    }

    for sec in &pe.sections {
        let virt_addr = sec.virtual_address;
        let virt_span = std::cmp::max(sec.virtual_size, sec.size_of_raw_data);

        let virt_end = virt_addr
            .checked_add(virt_span)
            .ok_or(LoaderError::AddressOverflow)?;

        if rva >= virt_addr && rva < virt_end {
            let delta = rva - virt_addr;

            if delta < sec.size_of_raw_data {
                let ptr = sec.pointer_to_raw_data;
                let file_offset_u32 = ptr.checked_add(delta).ok_or(LoaderError::AddressOverflow)?;

                let file_offset =
                    usize::try_from(file_offset_u32).map_err(|_| LoaderError::AddressOverflow)?;

                if file_offset < file_bytes.len() {
                    return Ok(file_offset);
                } else {
                    return Err(LoaderError::RvaNotMapped { rva });
                }
            } else {
                return Err(LoaderError::RvaHasNoFileBacking { rva });
            }
        }
    }

    Err(LoaderError::RvaNotMapped { rva })
}

pub fn map_image(pe: &PeImage, file_bytes: &[u8]) -> Result<LoadedImage, LoaderError> {
    let raw_size_of_image = pe.optional_header.size_of_image;

    if raw_size_of_image == 0 {
        return Err(LoaderError::ImageSizeZero);
    }

    let size_of_image =
        usize::try_from(raw_size_of_image).map_err(|_| LoaderError::AddressOverflow)?;

    if size_of_image > MAX_IMAGE_SIZE {
        return Err(LoaderError::ImageTooLarge {
            size: size_of_image,
            max: MAX_IMAGE_SIZE,
        });
    }

    let size_of_headers = pe.optional_header.size_of_headers;
    let size_of_headers_usize =
        usize::try_from(size_of_headers).map_err(|_| LoaderError::AddressOverflow)?;

    if size_of_headers_usize > file_bytes.len() {
        return Err(LoaderError::HeadersOutOfBounds {
            size_of_headers,
            file_len: file_bytes.len(),
        });
    }

    if size_of_headers > raw_size_of_image {
        return Err(LoaderError::HeadersExceedImage {
            size_of_headers,
            size_of_image: raw_size_of_image,
        });
    }

    let entry_point_rva = pe.optional_header.address_of_entry_point;
    if entry_point_rva != 0 && entry_point_rva >= raw_size_of_image {
        return Err(LoaderError::InvalidEntryPoint {
            rva: entry_point_rva,
        });
    }

    struct SectionRange {
        section_index: usize,
        start: usize,
        end: usize,
    }

    let mut parsed_ranges: Vec<SectionRange> = Vec::with_capacity(pe.sections.len());

    for (idx, sec) in pe.sections.iter().enumerate() {
        let virt_addr =
            usize::try_from(sec.virtual_address).map_err(|_| LoaderError::AddressOverflow)?;

        let virt_span = usize::try_from(std::cmp::max(sec.virtual_size, sec.size_of_raw_data))
            .map_err(|_| LoaderError::AddressOverflow)?;

        if virt_span > 0 {
            let virt_end = virt_addr
                .checked_add(virt_span)
                .ok_or(LoaderError::SectionVirtualRangeOutOfBounds { section_index: idx })?;

            if virt_end > size_of_image {
                return Err(LoaderError::SectionVirtualRangeOutOfBounds { section_index: idx });
            }

            if virt_addr < size_of_headers_usize {
                return Err(LoaderError::SectionOverlapsHeaders { section_index: idx });
            }

            for prev_range in &parsed_ranges {
                if virt_addr < prev_range.end && prev_range.start < virt_end {
                    return Err(LoaderError::OverlappingSections {
                        first_index: prev_range.section_index,
                        second_index: idx,
                    });
                }
            }

            parsed_ranges.push(SectionRange {
                section_index: idx,
                start: virt_addr,
                end: virt_end,
            });
        }

        if sec.size_of_raw_data > 0 {
            let ptr = usize::try_from(sec.pointer_to_raw_data)
                .map_err(|_| LoaderError::AddressOverflow)?;
            let raw_size =
                usize::try_from(sec.size_of_raw_data).map_err(|_| LoaderError::AddressOverflow)?;

            let raw_end =
                ptr.checked_add(raw_size)
                    .ok_or(LoaderError::SectionRawDataOutOfBounds {
                        section_index: idx,
                        pointer: sec.pointer_to_raw_data,
                        size: sec.size_of_raw_data,
                        file_len: file_bytes.len(),
                    })?;

            if raw_end > file_bytes.len() {
                return Err(LoaderError::SectionRawDataOutOfBounds {
                    section_index: idx,
                    pointer: sec.pointer_to_raw_data,
                    size: sec.size_of_raw_data,
                    file_len: file_bytes.len(),
                });
            }
        }
    }

    let mut memory = vec![0u8; size_of_image];

    memory[..size_of_headers_usize].copy_from_slice(&file_bytes[..size_of_headers_usize]);

    for sec in &pe.sections {
        if sec.size_of_raw_data > 0 {
            let virt_addr =
                usize::try_from(sec.virtual_address).map_err(|_| LoaderError::AddressOverflow)?;
            let ptr = usize::try_from(sec.pointer_to_raw_data)
                .map_err(|_| LoaderError::AddressOverflow)?;
            let raw_size =
                usize::try_from(sec.size_of_raw_data).map_err(|_| LoaderError::AddressOverflow)?;

            let src = &file_bytes[ptr..ptr + raw_size];
            let dst = &mut memory[virt_addr..virt_addr + raw_size];

            dst.copy_from_slice(src);
        }
    }

    Ok(LoadedImage {
        image_base: pe.optional_header.image_base,
        entry_point_rva,
        memory,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_synthetic_pe32_plus(
        e_lfanew: u32,
        machine: u16,
        num_sections: u16,
        size_of_image: u32,
        size_of_headers: u32,
        entry_point: u32,
    ) -> Vec<u8> {
        let opt_size = 112;
        let sec_size = (num_sections as u32) * 40;
        let min_header_size = (e_lfanew as usize) + 24 + (opt_size as usize) + (sec_size as usize);

        let file_len = std::cmp::max(min_header_size, size_of_headers as usize);
        let mut data = vec![0u8; file_len];

        data[0] = b'M';
        data[1] = b'Z';
        data[0x3C..0x40].copy_from_slice(&e_lfanew.to_le_bytes());

        let pe_idx = e_lfanew as usize;
        data[pe_idx..pe_idx + 4].copy_from_slice(b"PE\0\0");

        let coff_idx = pe_idx + 4;
        data[coff_idx..coff_idx + 2].copy_from_slice(&machine.to_le_bytes());
        data[coff_idx + 2..coff_idx + 4].copy_from_slice(&num_sections.to_le_bytes());
        data[coff_idx + 16..coff_idx + 18].copy_from_slice(&(opt_size as u16).to_le_bytes());
        data[coff_idx + 18..coff_idx + 20].copy_from_slice(&0x0022u16.to_le_bytes());

        let opt_idx = coff_idx + 20;
        data[opt_idx..opt_idx + 2].copy_from_slice(&0x020Bu16.to_le_bytes());
        data[opt_idx + 16..opt_idx + 20].copy_from_slice(&entry_point.to_le_bytes());
        data[opt_idx + 24..opt_idx + 32].copy_from_slice(&0x0000_0001_4000_0000u64.to_le_bytes());
        data[opt_idx + 32..opt_idx + 36].copy_from_slice(&4096u32.to_le_bytes());
        data[opt_idx + 36..opt_idx + 40].copy_from_slice(&512u32.to_le_bytes());
        data[opt_idx + 56..opt_idx + 60].copy_from_slice(&size_of_image.to_le_bytes());
        data[opt_idx + 60..opt_idx + 64].copy_from_slice(&size_of_headers.to_le_bytes());
        data[opt_idx + 68..opt_idx + 70].copy_from_slice(&3u16.to_le_bytes());
        data[opt_idx + 108..opt_idx + 112].copy_from_slice(&0u32.to_le_bytes());

        data
    }
    #[allow(clippy::too_many_arguments)]
    fn add_section(
        file_bytes: &mut Vec<u8>,
        e_lfanew: u32,
        sec_idx: usize,
        name: &[u8; 8],
        virt_size: u32,
        virt_addr: u32,
        raw_size: u32,
        raw_ptr: u32,
        characteristics: u32,
    ) {
        let sec_table_offset = (e_lfanew as usize) + 24 + 112;
        let offset = sec_table_offset + sec_idx * 40;

        file_bytes[offset..offset + 8].copy_from_slice(name);
        file_bytes[offset + 8..offset + 12].copy_from_slice(&virt_size.to_le_bytes());
        file_bytes[offset + 12..offset + 16].copy_from_slice(&virt_addr.to_le_bytes());
        file_bytes[offset + 16..offset + 20].copy_from_slice(&raw_size.to_le_bytes());
        file_bytes[offset + 20..offset + 24].copy_from_slice(&raw_ptr.to_le_bytes());
        file_bytes[offset + 36..offset + 40].copy_from_slice(&characteristics.to_le_bytes());

        if raw_size > 0 {
            let required_file_len = (raw_ptr as usize) + (raw_size as usize);
            if file_bytes.len() < required_file_len {
                file_bytes.resize(required_file_len, 0);
            }
        }
    }
    #[test]
    fn test_rva_in_headers() {
        let mut bytes = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0x10000, 0x400, 0x1000);
        bytes[0x50] = 0xAA;
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        let offset = rva_to_file_offset(&pe, &bytes, 0x50).unwrap();
        assert_eq!(offset, 0x50);
        assert_eq!(bytes[offset], 0xAA);
    }

    #[test]
    fn test_rva_at_beginning_of_text() {
        let mut bytes = create_synthetic_pe32_plus(0x80, 0x8664, 1, 0x10000, 0x400, 0x1000);
        add_section(
            &mut bytes,
            0x80,
            0,
            b".text\0\0\0",
            0x1000,
            0x1000,
            0x200,
            0x400,
            0x6000_0020,
        );
        bytes[0x400] = 0xCC;
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        let offset = rva_to_file_offset(&pe, &bytes, 0x1000).unwrap();
        assert_eq!(offset, 0x400);
        assert_eq!(bytes[offset], 0xCC);
    }

    #[test]
    fn test_rva_in_middle_of_section_raw_data() {
        let mut bytes = create_synthetic_pe32_plus(0x80, 0x8664, 1, 0x10000, 0x400, 0x1000);
        add_section(
            &mut bytes,
            0x80,
            0,
            b".text\0\0\0",
            0x1000,
            0x1000,
            0x200,
            0x400,
            0x6000_0020,
        );
        bytes[0x450] = 0x90;
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        let offset = rva_to_file_offset(&pe, &bytes, 0x1050).unwrap();
        assert_eq!(offset, 0x450);
        assert_eq!(bytes[offset], 0x90);
    }

    #[test]
    fn test_rva_at_last_backed_byte() {
        let mut bytes = create_synthetic_pe32_plus(0x80, 0x8664, 1, 0x10000, 0x400, 0x1000);
        add_section(
            &mut bytes,
            0x80,
            0,
            b".text\0\0\0",
            0x1000,
            0x1000,
            0x200,
            0x400,
            0x6000_0020,
        );
        bytes[0x5FF] = 0xC3;
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        let offset = rva_to_file_offset(&pe, &bytes, 0x11FF).unwrap();
        assert_eq!(offset, 0x5FF);
        assert_eq!(bytes[offset], 0xC3);
    }

    #[test]
    fn test_rva_section_raw_backing_boundary() {
        let mut bytes = create_synthetic_pe32_plus(0x80, 0x8664, 1, 0x10000, 0x400, 0x1000);
        add_section(
            &mut bytes,
            0x80,
            0,
            b".text\0\0\0",
            0x1000,
            0x1000,
            0x200,
            0x400,
            0x6000_0020,
        );
        bytes[0x5FF] = 0xDD;
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        let offset = rva_to_file_offset(&pe, &bytes, 0x11FF).unwrap();
        assert_eq!(offset, 0x5FF);
        assert_eq!(bytes[offset], 0xDD);

        assert_eq!(
            rva_to_file_offset(&pe, &bytes, 0x1200),
            Err(LoaderError::RvaHasNoFileBacking { rva: 0x1200 })
        );
    }

    #[test]
    fn test_rva_in_virtual_zero_fill_region() {
        let mut bytes = create_synthetic_pe32_plus(0x80, 0x8664, 1, 0x10000, 0x400, 0x1000);
        add_section(
            &mut bytes,
            0x80,
            0,
            b".text\0\0\0",
            0x1000,
            0x1000,
            0x200,
            0x400,
            0x6000_0020,
        );
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        assert_eq!(
            rva_to_file_offset(&pe, &bytes, 0x1200),
            Err(LoaderError::RvaHasNoFileBacking { rva: 0x1200 })
        );
    }

    #[test]
    fn test_rva_not_mapped() {
        let bytes = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0x10000, 0x400, 0x1000);
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        assert_eq!(
            rva_to_file_offset(&pe, &bytes, 0x5000),
            Err(LoaderError::RvaNotMapped { rva: 0x5000 })
        );
    }

    #[test]
    fn test_rva_arithmetic_overflow_safety() {
        let bytes = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0x10000, 0x400, 0x1000);
        let mut pe = winmac_pe::parse_pe(&bytes).unwrap();

        pe.sections.push(winmac_pe::SectionHeader {
            name: *b"OVERFLOW",
            virtual_size: 0x100,
            virtual_address: 0xFFFF_FFF0,
            size_of_raw_data: 0x100,
            pointer_to_raw_data: 0x200,
            characteristics: 0x6000_0020,
        });

        assert_eq!(
            rva_to_file_offset(&pe, &bytes, 0xFFFF_FFF5),
            Err(LoaderError::AddressOverflow)
        );
    }

    #[test]
    fn test_map_image_correct_length() {
        let bytes = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0x8000, 0x400, 0x1000);
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        let loaded = map_image(&pe, &bytes).unwrap();
        assert_eq!(loaded.memory.len(), 0x8000);
    }

    #[test]
    fn test_map_image_headers_copied() {
        let mut bytes = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0x8000, 0x400, 0x1000);
        bytes[0x10] = 0xDE;
        bytes[0x11] = 0xAD;
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        let loaded = map_image(&pe, &bytes).unwrap();
        assert_eq!(loaded.memory[0x10], 0xDE);
        assert_eq!(loaded.memory[0x11], 0xAD);
    }

    #[test]
    fn test_map_image_section_bytes_copied() {
        let mut bytes = create_synthetic_pe32_plus(0x80, 0x8664, 1, 0x8000, 0x400, 0x1000);
        add_section(
            &mut bytes,
            0x80,
            0,
            b".text\0\0\0",
            0x1000,
            0x1000,
            0x200,
            0x400,
            0x6000_0020,
        );
        bytes[0x400] = 0x48;
        bytes[0x401] = 0x89;
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        let loaded = map_image(&pe, &bytes).unwrap();
        assert_eq!(loaded.memory[0x1000], 0x48);
        assert_eq!(loaded.memory[0x1001], 0x89);
    }

    #[test]
    fn test_map_image_two_sections() {
        let mut bytes = create_synthetic_pe32_plus(0x80, 0x8664, 2, 0x8000, 0x400, 0x1000);
        add_section(
            &mut bytes,
            0x80,
            0,
            b".text\0\0\0",
            0x1000,
            0x1000,
            0x200,
            0x400,
            0x6000_0020,
        );
        add_section(
            &mut bytes,
            0x80,
            1,
            b".data\0\0\0",
            0x1000,
            0x2000,
            0x200,
            0x600,
            0xC000_0040,
        );
        bytes[0x400] = 0x11;
        bytes[0x600] = 0x22;
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        let loaded = map_image(&pe, &bytes).unwrap();
        assert_eq!(loaded.memory[0x1000], 0x11);
        assert_eq!(loaded.memory[0x2000], 0x22);
    }

    #[test]
    fn test_map_image_virtual_size_greater_than_raw() {
        let mut bytes = create_synthetic_pe32_plus(0x80, 0x8664, 1, 0x8000, 0x400, 0x1000);
        add_section(
            &mut bytes,
            0x80,
            0,
            b".data\0\0\0",
            0x2000,
            0x1000,
            0x200,
            0x400,
            0xC000_0040,
        );
        bytes[0x400] = 0xFF;
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        let loaded = map_image(&pe, &bytes).unwrap();
        assert_eq!(loaded.memory[0x1000], 0xFF);
        assert_eq!(loaded.memory[0x1200], 0x00);
        assert_eq!(loaded.memory[0x2FFF], 0x00);
    }

    #[test]
    fn test_map_image_raw_greater_than_virtual_size() {
        let mut bytes = create_synthetic_pe32_plus(0x80, 0x8664, 1, 0x8000, 0x400, 0x1000);
        add_section(
            &mut bytes,
            0x80,
            0,
            b".text\0\0\0",
            0x100,
            0x1000,
            0x200,
            0x400,
            0x6000_0020,
        );
        bytes[0x400] = 0xAA;
        bytes[0x5FF] = 0xBB;
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        let loaded = map_image(&pe, &bytes).unwrap();
        assert_eq!(loaded.memory[0x1000], 0xAA);
        assert_eq!(loaded.memory[0x11FF], 0xBB);
    }

    #[test]
    fn test_map_image_zero_raw_data_bss() {
        let mut bytes = create_synthetic_pe32_plus(0x80, 0x8664, 1, 0x8000, 0x400, 0x1000);
        add_section(
            &mut bytes,
            0x80,
            0,
            b".bss\0\0\0\0",
            0x1000,
            0x1000,
            0,
            0,
            0xC000_0080,
        );
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        let loaded = map_image(&pe, &bytes).unwrap();
        assert_eq!(loaded.memory[0x1000], 0x00);
        assert_eq!(loaded.memory[0x1FFF], 0x00);
    }

    #[test]
    fn test_map_image_size_zero_rejected() {
        let bytes = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0, 0x400, 0);
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        assert_eq!(map_image(&pe, &bytes), Err(LoaderError::ImageSizeZero));
    }

    #[test]
    fn test_map_image_too_large_rejected() {
        let bytes =
            create_synthetic_pe32_plus(0x80, 0x8664, 0, (MAX_IMAGE_SIZE + 1) as u32, 0x400, 0);
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        assert_eq!(
            map_image(&pe, &bytes),
            Err(LoaderError::ImageTooLarge {
                size: MAX_IMAGE_SIZE + 1,
                max: MAX_IMAGE_SIZE,
            })
        );
    }

    #[test]
    fn test_map_image_headers_exceed_image_rejected() {
        let bytes = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0x200, 0x400, 0);
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        assert_eq!(
            map_image(&pe, &bytes),
            Err(LoaderError::HeadersExceedImage {
                size_of_headers: 0x400,
                size_of_image: 0x200,
            })
        );
    }

    #[test]
    fn test_map_image_headers_out_of_bounds_rejected() {
        let bytes = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0x10000, 0x400, 0);
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        let truncated_bytes = &bytes[..0x200];

        assert_eq!(
            map_image(&pe, truncated_bytes),
            Err(LoaderError::HeadersOutOfBounds {
                size_of_headers: 0x400,
                file_len: 0x200,
            })
        );
    }

    #[test]
    fn test_map_image_section_destination_exceeds_image_size() {
        let mut bytes = create_synthetic_pe32_plus(0x80, 0x8664, 1, 0x2000, 0x400, 0x1000);
        add_section(
            &mut bytes,
            0x80,
            0,
            b".text\0\0\0",
            0x2000,
            0x1000,
            0x200,
            0x400,
            0x6000_0020,
        );
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        assert_eq!(
            map_image(&pe, &bytes),
            Err(LoaderError::SectionVirtualRangeOutOfBounds { section_index: 0 })
        );
    }

    #[test]
    fn test_map_image_section_source_exceeds_file_len() {
        let mut bytes = create_synthetic_pe32_plus(0x80, 0x8664, 1, 0x8000, 0x400, 0x1000);
        add_section(
            &mut bytes,
            0x80,
            0,
            b".text\0\0\0",
            0x1000,
            0x1000,
            0x200,
            0x400,
            0x6000_0020,
        );
        let pe = winmac_pe::parse_pe(&bytes).unwrap();
        bytes.truncate(0x500);

        assert_eq!(
            map_image(&pe, &bytes),
            Err(LoaderError::SectionRawDataOutOfBounds {
                section_index: 0,
                pointer: 0x400,
                size: 0x200,
                file_len: 0x500,
            })
        );
    }

    #[test]
    fn test_map_image_overlapping_sections_rejected() {
        let mut bytes = create_synthetic_pe32_plus(0x80, 0x8664, 2, 0x8000, 0x400, 0x1000);
        add_section(
            &mut bytes,
            0x80,
            0,
            b".text\0\0\0",
            0x2000,
            0x1000,
            0x200,
            0x400,
            0x6000_0020,
        );
        add_section(
            &mut bytes,
            0x80,
            1,
            b".data\0\0\0",
            0x1000,
            0x1800,
            0x200,
            0x600,
            0xC000_0040,
        );
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        assert_eq!(
            map_image(&pe, &bytes),
            Err(LoaderError::OverlappingSections {
                first_index: 0,
                second_index: 1,
            })
        );
    }

    #[test]
    fn test_map_image_overlapping_sections_with_zero_span_first_section() {
        let mut bytes = create_synthetic_pe32_plus(0x80, 0x8664, 3, 0x8000, 0x400, 0x1000);
        add_section(
            &mut bytes,
            0x80,
            0,
            b".empty\0\0",
            0,
            0x1000,
            0,
            0,
            0x6000_0020,
        );
        add_section(
            &mut bytes,
            0x80,
            1,
            b".text\0\0\0",
            0x2000,
            0x1000,
            0x200,
            0x400,
            0x6000_0020,
        );
        add_section(
            &mut bytes,
            0x80,
            2,
            b".data\0\0\0",
            0x1000,
            0x1800,
            0x200,
            0x600,
            0xC000_0040,
        );
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        assert_eq!(
            map_image(&pe, &bytes),
            Err(LoaderError::OverlappingSections {
                first_index: 1,
                second_index: 2,
            })
        );
    }

    #[test]
    fn test_map_image_section_overlapping_headers_rejected() {
        let mut bytes = create_synthetic_pe32_plus(0x80, 0x8664, 1, 0x8000, 0x400, 0x1000);
        add_section(
            &mut bytes,
            0x80,
            0,
            b".text\0\0\0",
            0x1000,
            0x200,
            0x200,
            0x400,
            0x6000_0020,
        );
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        assert_eq!(
            map_image(&pe, &bytes),
            Err(LoaderError::SectionOverlapsHeaders { section_index: 0 })
        );
    }

    #[test]
    fn test_map_image_valid_entry_point_accepted() {
        let bytes = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0x8000, 0x400, 0x1000);
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        let loaded = map_image(&pe, &bytes).unwrap();
        assert_eq!(loaded.entry_point_rva, 0x1000);
    }

    #[test]
    fn test_map_image_entry_point_exceeds_image_size_rejected() {
        let bytes = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0x8000, 0x400, 0x9000);
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        assert_eq!(
            map_image(&pe, &bytes),
            Err(LoaderError::InvalidEntryPoint { rva: 0x9000 })
        );
    }

    #[test]
    fn test_map_image_zero_entry_point_accepted() {
        let bytes = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0x8000, 0x400, 0);
        let pe = winmac_pe::parse_pe(&bytes).unwrap();

        let loaded = map_image(&pe, &bytes).unwrap();
        assert_eq!(loaded.entry_point_rva, 0);
    }

    #[test]
    fn test_entry_point_va_calculation() {
        let loaded = LoadedImage {
            image_base: 0x0000_0001_4000_0000,
            entry_point_rva: 0x1000,
            memory: vec![],
        };

        assert_eq!(
            loaded.entry_point_va().unwrap(),
            Some(0x0000_0001_4000_1000)
        );
    }

    #[test]
    fn test_entry_point_va_zero_returns_none() {
        let loaded = LoadedImage {
            image_base: 0x0000_0001_4000_0000,
            entry_point_rva: 0,
            memory: vec![],
        };

        assert_eq!(loaded.entry_point_va().unwrap(), None);
    }

    #[test]
    fn test_entry_point_va_overflow_rejected() {
        let loaded = LoadedImage {
            image_base: u64::MAX - 10,
            entry_point_rva: 100,
            memory: vec![],
        };

        assert_eq!(loaded.entry_point_va(), Err(LoaderError::AddressOverflow));
    }
}
