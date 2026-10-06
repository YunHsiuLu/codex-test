use std::fmt;
use thiserror::Error;

#[derive(Error, Debug, PartialEq, Eq)]
pub enum PeError {
    #[error("File size too small ({0} bytes) to contain DOS header")]
    FileTooSmall(usize),
    #[error("Invalid DOS signature: expected 0x4D5A (MZ), got {0:#06X}")]
    InvalidDosSignature(u16),
    #[error("Invalid e_lfanew offset: {0}")]
    InvalidElfanew(u32),
    #[error("File truncated at PE signature offset {0}")]
    TruncatedPeSignature(usize),
    #[error("Invalid PE signature: expected PE\\0\\0, got {0:?}")]
    InvalidPeSignature([u8; 4]),
    #[error("File truncated at COFF header offset {0}")]
    TruncatedCoffHeader(usize),
    #[error("Unsupported Optional Header Magic: {0:#06X}")]
    UnsupportedOptionalHeaderMagic(u16),
    #[error("Truncated Optional Header at offset {offset}, expected size {expected_size}")]
    TruncatedOptionalHeader { offset: usize, expected_size: usize },
    #[error("Data Directory table truncated: needed {needed} bytes at offset {offset}, but Optional Header limit is {limit}")]
    TruncatedDataDirectoryTable {
        offset: usize,
        needed: usize,
        limit: usize,
    },
    #[error("Truncated Section Table at offset {offset}, needed {needed} bytes")]
    TruncatedSectionTable { offset: usize, needed: usize },
    #[error("Invalid Section {section_index} raw data bounds: pointer {pointer}, size {size}")]
    InvalidSectionRawData {
        section_index: usize,
        pointer: u32,
        size: u32,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MachineType {
    I386,
    Amd64,
    Arm64,
    Unknown(u16),
}

impl From<u16> for MachineType {
    fn from(val: u16) -> Self {
        match val {
            0x014C => MachineType::I386,
            0x8664 => MachineType::Amd64,
            0xAA64 => MachineType::Arm64,
            other => MachineType::Unknown(other),
        }
    }
}

impl fmt::Display for MachineType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            MachineType::I386 => write!(f, "x86"),
            MachineType::Amd64 => write!(f, "x86-64"),
            MachineType::Arm64 => write!(f, "ARM64"),
            MachineType::Unknown(val) => write!(f, "Unknown ({:#06X})", val),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PeFormat {
    Pe32,
    Pe32Plus,
}

impl fmt::Display for PeFormat {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            PeFormat::Pe32 => write!(f, "PE32"),
            PeFormat::Pe32Plus => write!(f, "PE32+"),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CoffHeader {
    pub machine: MachineType,
    pub number_of_sections: u16,
    pub time_date_stamp: u32,
    pub pointer_to_symbol_table: u32,
    pub number_of_symbols: u32,
    pub size_of_optional_header: u16,
    pub characteristics: u16,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OptionalHeader {
    pub format: PeFormat,
    pub address_of_entry_point: u32,
    pub image_base: u64,
    pub section_alignment: u32,
    pub file_alignment: u32,
    pub size_of_image: u32,
    pub size_of_headers: u32,
    pub subsystem: u16,
    pub dll_characteristics: u16,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DataDirectory {
    pub virtual_address: u32,
    pub size: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SectionHeader {
    pub name: [u8; 8],
    pub virtual_size: u32,
    pub virtual_address: u32,
    pub size_of_raw_data: u32,
    pub pointer_to_raw_data: u32,
    pub characteristics: u32,
}

impl SectionHeader {
    pub fn name_lossy(&self) -> String {
        let len = self.name.iter().position(|&b| b == 0).unwrap_or(8);
        String::from_utf8_lossy(&self.name[..len]).into_owned()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PeImage {
    pub coff_header: CoffHeader,
    pub optional_header: OptionalHeader,
    pub data_directories: Vec<DataDirectory>,
    pub sections: Vec<SectionHeader>,
}

pub fn parse_pe(bytes: &[u8]) -> Result<PeImage, PeError> {
    if bytes.len() < 0x40 {
        return Err(PeError::FileTooSmall(bytes.len()));
    }

    let dos_magic = u16::from_le_bytes([bytes[0], bytes[1]]);
    if dos_magic != 0x5A4D {
        return Err(PeError::InvalidDosSignature(dos_magic));
    }

    let e_lfanew_bytes = [bytes[0x3C], bytes[0x3D], bytes[0x3E], bytes[0x3F]];
    let e_lfanew = u32::from_le_bytes(e_lfanew_bytes);
    let pe_offset = usize::try_from(e_lfanew).map_err(|_| PeError::InvalidElfanew(e_lfanew))?;

    if pe_offset >= bytes.len() {
        return Err(PeError::InvalidElfanew(e_lfanew));
    }

    let pe_sig_end = pe_offset
        .checked_add(4)
        .ok_or(PeError::TruncatedPeSignature(pe_offset))?;

    if pe_sig_end > bytes.len() {
        return Err(PeError::TruncatedPeSignature(pe_offset));
    }

    let pe_sig = &bytes[pe_offset..pe_sig_end];
    if pe_sig != b"PE\0\0" {
        let mut actual = [0u8; 4];
        actual.copy_from_slice(pe_sig);
        return Err(PeError::InvalidPeSignature(actual));
    }

    let coff_offset = pe_sig_end;
    let coff_end = coff_offset
        .checked_add(20)
        .ok_or(PeError::TruncatedCoffHeader(coff_offset))?;

    if coff_end > bytes.len() {
        return Err(PeError::TruncatedCoffHeader(coff_offset));
    }

    let coff_bytes = &bytes[coff_offset..coff_end];

    let raw_machine = u16::from_le_bytes([coff_bytes[0], coff_bytes[1]]);
    let number_of_sections = u16::from_le_bytes([coff_bytes[2], coff_bytes[3]]);
    let time_date_stamp =
        u32::from_le_bytes([coff_bytes[4], coff_bytes[5], coff_bytes[6], coff_bytes[7]]);
    let pointer_to_symbol_table =
        u32::from_le_bytes([coff_bytes[8], coff_bytes[9], coff_bytes[10], coff_bytes[11]]);
    let number_of_symbols = u32::from_le_bytes([
        coff_bytes[12],
        coff_bytes[13],
        coff_bytes[14],
        coff_bytes[15],
    ]);
    let size_of_optional_header = u16::from_le_bytes([coff_bytes[16], coff_bytes[17]]);
    let characteristics = u16::from_le_bytes([coff_bytes[18], coff_bytes[19]]);

    let coff_header = CoffHeader {
        machine: MachineType::from(raw_machine),
        number_of_sections,
        time_date_stamp,
        pointer_to_symbol_table,
        number_of_symbols,
        size_of_optional_header,
        characteristics,
    };

    let optional_header_size = usize::from(size_of_optional_header);
    let optional_start = coff_end;
    let optional_end = optional_start.checked_add(optional_header_size).ok_or(
        PeError::TruncatedOptionalHeader {
            offset: optional_start,
            expected_size: optional_header_size,
        },
    )?;

    if optional_end > bytes.len() {
        return Err(PeError::TruncatedOptionalHeader {
            offset: optional_start,
            expected_size: optional_header_size,
        });
    }

    let opt_bytes = &bytes[optional_start..optional_end];

    if opt_bytes.len() < 2 {
        return Err(PeError::TruncatedOptionalHeader {
            offset: optional_start,
            expected_size: optional_header_size,
        });
    }

    let magic_raw = u16::from_le_bytes([opt_bytes[0], opt_bytes[1]]);
    let format = match magic_raw {
        0x010B => PeFormat::Pe32,
        0x020B => PeFormat::Pe32Plus,
        other => return Err(PeError::UnsupportedOptionalHeaderMagic(other)),
    };

    let min_req_size = match format {
        PeFormat::Pe32 => 96,
        PeFormat::Pe32Plus => 112,
    };

    if opt_bytes.len() < min_req_size {
        return Err(PeError::TruncatedOptionalHeader {
            offset: optional_start,
            expected_size: min_req_size,
        });
    }

    let address_of_entry_point =
        u32::from_le_bytes([opt_bytes[16], opt_bytes[17], opt_bytes[18], opt_bytes[19]]);

    let (
        image_base,
        section_alignment,
        file_alignment,
        subsystem,
        dll_characteristics,
        number_of_rva_and_sizes,
        dirs_offset_in_opt,
    ) = match format {
        PeFormat::Pe32 => {
            let base = u64::from(u32::from_le_bytes([
                opt_bytes[28],
                opt_bytes[29],
                opt_bytes[30],
                opt_bytes[31],
            ]));
            let sec_align =
                u32::from_le_bytes([opt_bytes[32], opt_bytes[33], opt_bytes[34], opt_bytes[35]]);
            let file_align =
                u32::from_le_bytes([opt_bytes[36], opt_bytes[37], opt_bytes[38], opt_bytes[39]]);
            let sub = u16::from_le_bytes([opt_bytes[68], opt_bytes[69]]);
            let dll_char = u16::from_le_bytes([opt_bytes[70], opt_bytes[71]]);
            let num_rva =
                u32::from_le_bytes([opt_bytes[92], opt_bytes[93], opt_bytes[94], opt_bytes[95]]);
            (base, sec_align, file_align, sub, dll_char, num_rva, 96)
        }
        PeFormat::Pe32Plus => {
            let base = u64::from_le_bytes([
                opt_bytes[24],
                opt_bytes[25],
                opt_bytes[26],
                opt_bytes[27],
                opt_bytes[28],
                opt_bytes[29],
                opt_bytes[30],
                opt_bytes[31],
            ]);
            let sec_align =
                u32::from_le_bytes([opt_bytes[32], opt_bytes[33], opt_bytes[34], opt_bytes[35]]);
            let file_align =
                u32::from_le_bytes([opt_bytes[36], opt_bytes[37], opt_bytes[38], opt_bytes[39]]);
            let sub = u16::from_le_bytes([opt_bytes[68], opt_bytes[69]]);
            let dll_char = u16::from_le_bytes([opt_bytes[70], opt_bytes[71]]);
            let num_rva = u32::from_le_bytes([
                opt_bytes[108],
                opt_bytes[109],
                opt_bytes[110],
                opt_bytes[111],
            ]);
            (base, sec_align, file_align, sub, dll_char, num_rva, 112)
        }
    };

    let size_of_image =
        u32::from_le_bytes([opt_bytes[56], opt_bytes[57], opt_bytes[58], opt_bytes[59]]);
    let size_of_headers =
        u32::from_le_bytes([opt_bytes[60], opt_bytes[61], opt_bytes[62], opt_bytes[63]]);

    let optional_header = OptionalHeader {
        format,
        address_of_entry_point,
        image_base,
        section_alignment,
        file_alignment,
        size_of_image,
        size_of_headers,
        subsystem,
        dll_characteristics,
    };

    let dirs_count = usize::try_from(number_of_rva_and_sizes).map_err(|_| {
        PeError::TruncatedDataDirectoryTable {
            offset: optional_start.saturating_add(dirs_offset_in_opt),
            needed: usize::MAX,
            limit: optional_header_size,
        }
    })?;

    let dirs_bytes_needed =
        dirs_count
            .checked_mul(8)
            .ok_or(PeError::TruncatedDataDirectoryTable {
                offset: optional_start.saturating_add(dirs_offset_in_opt),
                needed: usize::MAX,
                limit: optional_header_size,
            })?;

    let dirs_end_in_opt = dirs_offset_in_opt.checked_add(dirs_bytes_needed).ok_or(
        PeError::TruncatedDataDirectoryTable {
            offset: optional_start.saturating_add(dirs_offset_in_opt),
            needed: dirs_bytes_needed,
            limit: optional_header_size,
        },
    )?;

    if dirs_end_in_opt > opt_bytes.len() {
        let absolute_dirs_offset = optional_start.checked_add(dirs_offset_in_opt).ok_or(
            PeError::TruncatedDataDirectoryTable {
                offset: usize::MAX,
                needed: dirs_bytes_needed,
                limit: opt_bytes.len(),
            },
        )?;

        return Err(PeError::TruncatedDataDirectoryTable {
            offset: absolute_dirs_offset,
            needed: dirs_bytes_needed,
            limit: opt_bytes.len(),
        });
    }

    let mut data_directories = Vec::with_capacity(dirs_count);
    let mut current_dir_offset = dirs_offset_in_opt;

    for _ in 0..dirs_count {
        let dir_bytes = &opt_bytes[current_dir_offset..current_dir_offset + 8];
        let va = u32::from_le_bytes([dir_bytes[0], dir_bytes[1], dir_bytes[2], dir_bytes[3]]);
        let sz = u32::from_le_bytes([dir_bytes[4], dir_bytes[5], dir_bytes[6], dir_bytes[7]]);
        data_directories.push(DataDirectory {
            virtual_address: va,
            size: sz,
        });
        current_dir_offset =
            current_dir_offset
                .checked_add(8)
                .ok_or(PeError::TruncatedDataDirectoryTable {
                    offset: optional_start.saturating_add(dirs_offset_in_opt),
                    needed: dirs_bytes_needed,
                    limit: opt_bytes.len(),
                })?;
    }

    let section_table_offset = optional_end;
    let num_sections = usize::from(number_of_sections);
    let section_table_needed =
        num_sections
            .checked_mul(40)
            .ok_or(PeError::TruncatedSectionTable {
                offset: section_table_offset,
                needed: usize::MAX,
            })?;

    let section_table_end = section_table_offset
        .checked_add(section_table_needed)
        .ok_or(PeError::TruncatedSectionTable {
            offset: section_table_offset,
            needed: section_table_needed,
        })?;

    if section_table_end > bytes.len() {
        return Err(PeError::TruncatedSectionTable {
            offset: section_table_offset,
            needed: section_table_needed,
        });
    }

    let mut sections = Vec::with_capacity(num_sections);
    let mut sec_offset = section_table_offset;

    for idx in 0..num_sections {
        let sec_bytes = &bytes[sec_offset..sec_offset + 40];

        let mut name = [0u8; 8];
        name.copy_from_slice(&sec_bytes[0..8]);

        let virtual_size =
            u32::from_le_bytes([sec_bytes[8], sec_bytes[9], sec_bytes[10], sec_bytes[11]]);
        let virtual_address =
            u32::from_le_bytes([sec_bytes[12], sec_bytes[13], sec_bytes[14], sec_bytes[15]]);
        let size_of_raw_data =
            u32::from_le_bytes([sec_bytes[16], sec_bytes[17], sec_bytes[18], sec_bytes[19]]);
        let pointer_to_raw_data =
            u32::from_le_bytes([sec_bytes[20], sec_bytes[21], sec_bytes[22], sec_bytes[23]]);
        let characteristics =
            u32::from_le_bytes([sec_bytes[36], sec_bytes[37], sec_bytes[38], sec_bytes[39]]);

        if size_of_raw_data > 0 {
            let pointer_usize = usize::try_from(pointer_to_raw_data).map_err(|_| {
                PeError::InvalidSectionRawData {
                    section_index: idx,
                    pointer: pointer_to_raw_data,
                    size: size_of_raw_data,
                }
            })?;
            let size_usize =
                usize::try_from(size_of_raw_data).map_err(|_| PeError::InvalidSectionRawData {
                    section_index: idx,
                    pointer: pointer_to_raw_data,
                    size: size_of_raw_data,
                })?;

            let raw_end =
                pointer_usize
                    .checked_add(size_usize)
                    .ok_or(PeError::InvalidSectionRawData {
                        section_index: idx,
                        pointer: pointer_to_raw_data,
                        size: size_of_raw_data,
                    })?;

            if raw_end > bytes.len() {
                return Err(PeError::InvalidSectionRawData {
                    section_index: idx,
                    pointer: pointer_to_raw_data,
                    size: size_of_raw_data,
                });
            }
        }

        sections.push(SectionHeader {
            name,
            virtual_size,
            virtual_address,
            size_of_raw_data,
            pointer_to_raw_data,
            characteristics,
        });

        sec_offset = sec_offset
            .checked_add(40)
            .ok_or(PeError::TruncatedSectionTable {
                offset: section_table_offset,
                needed: section_table_needed,
            })?;
    }

    Ok(PeImage {
        coff_header,
        optional_header,
        data_directories,
        sections,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_synthetic_pe32_plus(
        e_lfanew: u32,
        machine: u16,
        num_sections: u16,
        num_rva: u32,
    ) -> Vec<u8> {
        let opt_size = 112 + (num_rva * 8);
        let sec_size = (num_sections as u32) * 40;
        let total_size = (e_lfanew as usize) + 24 + (opt_size as usize) + (sec_size as usize);

        let mut data = vec![0u8; total_size];
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
        data[opt_idx..opt_idx + 2].copy_from_slice(&0x020Bu16.to_le_bytes()); // PE32+ Magic
        data[opt_idx + 16..opt_idx + 20].copy_from_slice(&0x1000u32.to_le_bytes()); // AddressOfEntryPoint
        data[opt_idx + 24..opt_idx + 32].copy_from_slice(&0x0000_0001_4000_0000u64.to_le_bytes()); // ImageBase
        data[opt_idx + 32..opt_idx + 36].copy_from_slice(&4096u32.to_le_bytes()); // SectionAlignment
        data[opt_idx + 36..opt_idx + 40].copy_from_slice(&512u32.to_le_bytes()); // FileAlignment
        data[opt_idx + 56..opt_idx + 60].copy_from_slice(&0x10000u32.to_le_bytes()); // SizeOfImage
        data[opt_idx + 60..opt_idx + 64].copy_from_slice(&0x400u32.to_le_bytes()); // SizeOfHeaders
        data[opt_idx + 68..opt_idx + 70].copy_from_slice(&3u16.to_le_bytes()); // Subsystem
        data[opt_idx + 108..opt_idx + 112].copy_from_slice(&num_rva.to_le_bytes()); // NumberOfRvaAndSizes

        data
    }

    fn create_synthetic_pe32(
        e_lfanew: u32,
        machine: u16,
        num_sections: u16,
        num_rva: u32,
    ) -> Vec<u8> {
        let opt_size = 96 + (num_rva * 8);
        let sec_size = (num_sections as u32) * 40;
        let total_size = (e_lfanew as usize) + 24 + (opt_size as usize) + (sec_size as usize);

        let mut data = vec![0u8; total_size];
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
        data[opt_idx..opt_idx + 2].copy_from_slice(&0x010Bu16.to_le_bytes()); // PE32 Magic
        data[opt_idx + 16..opt_idx + 20].copy_from_slice(&0x1000u32.to_le_bytes()); // AddressOfEntryPoint
        data[opt_idx + 28..opt_idx + 32].copy_from_slice(&0x0040_0000u32.to_le_bytes()); // ImageBase 32-bit
        data[opt_idx + 32..opt_idx + 36].copy_from_slice(&4096u32.to_le_bytes()); // SectionAlignment
        data[opt_idx + 36..opt_idx + 40].copy_from_slice(&512u32.to_le_bytes()); // FileAlignment
        data[opt_idx + 56..opt_idx + 60].copy_from_slice(&0x10000u32.to_le_bytes()); // SizeOfImage
        data[opt_idx + 60..opt_idx + 64].copy_from_slice(&0x400u32.to_le_bytes()); // SizeOfHeaders
        data[opt_idx + 68..opt_idx + 70].copy_from_slice(&2u16.to_le_bytes()); // Subsystem
        data[opt_idx + 92..opt_idx + 96].copy_from_slice(&num_rva.to_le_bytes()); // NumberOfRvaAndSizes

        data
    }

    #[test]
    fn test_invalid_mz() {
        let mut data = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0);
        data[0] = b'X';
        assert!(matches!(
            parse_pe(&data),
            Err(PeError::InvalidDosSignature(_))
        ));
    }

    #[test]
    fn test_truncated_dos_header() {
        let data = vec![b'M', b'Z', 0x00];
        assert_eq!(parse_pe(&data), Err(PeError::FileTooSmall(3)));
    }

    #[test]
    fn test_invalid_elfanew() {
        let mut data = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0);
        let out_of_bounds_offset = 0xFFFF_FFFFu32;
        data[0x3C..0x40].copy_from_slice(&out_of_bounds_offset.to_le_bytes());
        assert_eq!(
            parse_pe(&data),
            Err(PeError::InvalidElfanew(out_of_bounds_offset))
        );
    }

    #[test]
    fn test_truncated_pe_signature() {
        let e_lfanew = 0x40u32;
        let mut data = vec![0u8; (e_lfanew as usize) + 2];
        data[0] = b'M';
        data[1] = b'Z';
        data[0x3C..0x40].copy_from_slice(&e_lfanew.to_le_bytes());
        data[0x40..0x42].copy_from_slice(b"PE");

        assert_eq!(parse_pe(&data), Err(PeError::TruncatedPeSignature(0x40)));
    }

    #[test]
    fn test_invalid_pe_signature() {
        let mut data = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0);
        data[0x80..0x84].copy_from_slice(b"FAIL");
        assert_eq!(parse_pe(&data), Err(PeError::InvalidPeSignature(*b"FAIL")));
    }

    #[test]
    fn test_truncated_coff_header() {
        let e_lfanew = 0x40u32;
        let mut data = vec![0u8; (e_lfanew as usize) + 4 + 10];

        data[0] = b'M';
        data[1] = b'Z';
        data[0x3C..0x40].copy_from_slice(&e_lfanew.to_le_bytes());
        data[0x40..0x44].copy_from_slice(b"PE\0\0");

        assert_eq!(parse_pe(&data), Err(PeError::TruncatedCoffHeader(0x44)));
    }

    #[test]
    fn test_valid_minimal_synthetic_pe_header() {
        let data = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0);
        let pe = parse_pe(&data).expect("Parsing failed");
        assert_eq!(pe.coff_header.machine, MachineType::Amd64);
        assert_eq!(pe.coff_header.number_of_sections, 0);
        assert_eq!(pe.coff_header.size_of_optional_header, 112);
        assert_eq!(pe.coff_header.characteristics, 0x0022);
    }

    #[test]
    fn test_machine_type_x86() {
        let data = create_synthetic_pe32(0x80, 0x014C, 0, 0);
        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.coff_header.machine, MachineType::I386);
    }

    #[test]
    fn test_machine_type_x86_64() {
        let data = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0);
        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.coff_header.machine, MachineType::Amd64);
    }

    #[test]
    fn test_machine_type_arm64() {
        let data = create_synthetic_pe32_plus(0x80, 0xAA64, 0, 0);
        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.coff_header.machine, MachineType::Arm64);
    }

    #[test]
    fn test_unknown_machine_type() {
        let data = create_synthetic_pe32_plus(0x80, 0x1234, 0, 0);
        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.coff_header.machine, MachineType::Unknown(0x1234));
    }

    #[test]
    fn test_valid_pe32_optional_header() {
        let data = create_synthetic_pe32(0x80, 0x014C, 0, 0);
        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.optional_header.format, PeFormat::Pe32);
    }

    #[test]
    fn test_valid_pe32_plus_optional_header() {
        let data = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0);
        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.optional_header.format, PeFormat::Pe32Plus);
    }

    #[test]
    fn test_standard_pe32_optional_header_size_224() {
        let data = create_synthetic_pe32(0x80, 0x014C, 0, 16);
        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.optional_header.format, PeFormat::Pe32);
        assert_eq!(pe.coff_header.size_of_optional_header, 224);
        assert_eq!(pe.data_directories.len(), 16);
    }

    #[test]
    fn test_standard_pe32_plus_optional_header_size_240() {
        let data = create_synthetic_pe32_plus(0x80, 0x8664, 0, 16);
        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.optional_header.format, PeFormat::Pe32Plus);
        assert_eq!(pe.coff_header.size_of_optional_header, 240);
        assert_eq!(pe.data_directories.len(), 16);
    }

    #[test]
    fn test_unsupported_optional_header_magic() {
        let mut data = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0);
        let opt_idx = 0x80 + 24;
        data[opt_idx..opt_idx + 2].copy_from_slice(&0x030Bu16.to_le_bytes());
        assert_eq!(
            parse_pe(&data),
            Err(PeError::UnsupportedOptionalHeaderMagic(0x030B))
        );
    }

    #[test]
    fn test_truncated_optional_header() {
        let mut data = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0);
        data.truncate(0x80 + 24 + 50);
        assert!(matches!(
            parse_pe(&data),
            Err(PeError::TruncatedOptionalHeader { .. })
        ));
    }

    #[test]
    fn test_correct_pe32_image_base() {
        let data = create_synthetic_pe32(0x80, 0x014C, 0, 0);
        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.optional_header.image_base, 0x0040_0000);
    }

    #[test]
    fn test_correct_pe32_plus_image_base() {
        let data = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0);
        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.optional_header.image_base, 0x0000_0001_4000_0000);
    }

    #[test]
    fn test_correct_address_of_entry_point() {
        let data = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0);
        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.optional_header.address_of_entry_point, 0x1000);
    }

    #[test]
    fn test_valid_data_directory_parsing() {
        let mut data = create_synthetic_pe32_plus(0x80, 0x8664, 0, 2);
        let opt_idx = 0x80 + 24;
        let dirs_idx = opt_idx + 112;

        data[dirs_idx..dirs_idx + 4].copy_from_slice(&0x2000u32.to_le_bytes());
        data[dirs_idx + 4..dirs_idx + 8].copy_from_slice(&0x100u32.to_le_bytes());

        data[dirs_idx + 8..dirs_idx + 12].copy_from_slice(&0x3000u32.to_le_bytes());
        data[dirs_idx + 12..dirs_idx + 16].copy_from_slice(&0x200u32.to_le_bytes());

        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.data_directories.len(), 2);
        assert_eq!(
            pe.data_directories[0],
            DataDirectory {
                virtual_address: 0x2000,
                size: 0x100
            }
        );
        assert_eq!(
            pe.data_directories[1],
            DataDirectory {
                virtual_address: 0x3000,
                size: 0x200
            }
        );
    }

    #[test]
    fn test_data_directory_count_exceeds_optional_header_capacity() {
        let mut data = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0);
        let coff_idx = 0x80 + 4;
        let opt_idx = coff_idx + 20;

        data[opt_idx + 108..opt_idx + 112].copy_from_slice(&100u32.to_le_bytes());

        assert!(matches!(
            parse_pe(&data),
            Err(PeError::TruncatedDataDirectoryTable { .. })
        ));
    }

    #[test]
    fn test_zero_data_directories() {
        let data = create_synthetic_pe32_plus(0x80, 0x8664, 0, 0);
        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.data_directories.len(), 0);
    }

    #[test]
    fn test_one_valid_section_header() {
        let mut data = create_synthetic_pe32_plus(0x80, 0x8664, 1, 0);
        let sec_idx = 0x80 + 24 + 112;

        data[sec_idx..sec_idx + 8].copy_from_slice(b".text\0\0\0");
        data[sec_idx + 8..sec_idx + 12].copy_from_slice(&0x1000u32.to_le_bytes());
        data[sec_idx + 12..sec_idx + 16].copy_from_slice(&0x1000u32.to_le_bytes());
        data[sec_idx + 16..sec_idx + 20].copy_from_slice(&0x200u32.to_le_bytes());
        data[sec_idx + 20..sec_idx + 24].copy_from_slice(&0x200u32.to_le_bytes());

        let payload_end = 0x200 + 0x200;
        if data.len() < payload_end {
            data.resize(payload_end, 0);
        }

        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.sections.len(), 1);
        assert_eq!(pe.sections[0].name_lossy(), ".text");
    }

    #[test]
    fn test_section_fields_distinct_values() {
        let mut data = create_synthetic_pe32_plus(0x80, 0x8664, 1, 0);
        let sec_idx = 0x80 + 24 + 112;

        let expected_virtual_size = 0x1234_5678u32;
        let expected_virtual_address = 0x2000_0000u32;
        let expected_size_of_raw_data = 0x0000_0200u32;
        let expected_pointer_to_raw_data = 0x0000_0400u32;
        let expected_characteristics = 0x6000_0020u32;

        data[sec_idx..sec_idx + 8].copy_from_slice(b".code\0\0\0");
        data[sec_idx + 8..sec_idx + 12].copy_from_slice(&expected_virtual_size.to_le_bytes());
        data[sec_idx + 12..sec_idx + 16].copy_from_slice(&expected_virtual_address.to_le_bytes());
        data[sec_idx + 16..sec_idx + 20].copy_from_slice(&expected_size_of_raw_data.to_le_bytes());
        data[sec_idx + 20..sec_idx + 24]
            .copy_from_slice(&expected_pointer_to_raw_data.to_le_bytes());
        data[sec_idx + 36..sec_idx + 40].copy_from_slice(&expected_characteristics.to_le_bytes());

        let payload_end =
            (expected_pointer_to_raw_data as usize) + (expected_size_of_raw_data as usize);
        if data.len() < payload_end {
            data.resize(payload_end, 0);
        }

        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.sections.len(), 1);
        let sec = &pe.sections[0];
        assert_eq!(sec.name_lossy(), ".code");
        assert_eq!(sec.virtual_size, expected_virtual_size);
        assert_eq!(sec.virtual_address, expected_virtual_address);
        assert_eq!(sec.size_of_raw_data, expected_size_of_raw_data);
        assert_eq!(sec.pointer_to_raw_data, expected_pointer_to_raw_data);
        assert_eq!(sec.characteristics, expected_characteristics);
    }

    #[test]
    fn test_multiple_section_headers() {
        let mut data = create_synthetic_pe32_plus(0x80, 0x8664, 2, 0);
        let sec1_idx = 0x80 + 24 + 112;
        let sec2_idx = sec1_idx + 40;

        data[sec1_idx..sec1_idx + 8].copy_from_slice(b".text\0\0\0");
        data[sec2_idx..sec2_idx + 8].copy_from_slice(b".rdata\0\0");

        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.sections.len(), 2);
        assert_eq!(pe.sections[0].name_lossy(), ".text");
        assert_eq!(pe.sections[1].name_lossy(), ".rdata");
    }

    #[test]
    fn test_truncated_section_table() {
        let mut data = create_synthetic_pe32_plus(0x80, 0x8664, 5, 0);
        data.truncate(data.len() - 20);

        assert!(matches!(
            parse_pe(&data),
            Err(PeError::TruncatedSectionTable { .. })
        ));
    }

    #[test]
    fn test_invalid_section_raw_data_bounds() {
        let mut data = create_synthetic_pe32_plus(0x80, 0x8664, 1, 0);
        let sec_idx = 0x80 + 24 + 112;

        data[sec_idx..sec_idx + 8].copy_from_slice(b".text\0\0\0");
        data[sec_idx + 16..sec_idx + 20].copy_from_slice(&0x1000u32.to_le_bytes());
        data[sec_idx + 20..sec_idx + 24].copy_from_slice(&0x400u32.to_le_bytes());

        assert_eq!(
            parse_pe(&data),
            Err(PeError::InvalidSectionRawData {
                section_index: 0,
                pointer: 0x400,
                size: 0x1000,
            })
        );
    }

    #[test]
    fn test_section_name_with_null_terminator() {
        let sec = SectionHeader {
            name: *b".data\0\0\0",
            virtual_size: 0,
            virtual_address: 0,
            size_of_raw_data: 0,
            pointer_to_raw_data: 0,
            characteristics: 0,
        };
        assert_eq!(sec.name_lossy(), ".data");
    }

    #[test]
    fn test_section_name_exactly_8_bytes() {
        let sec = SectionHeader {
            name: *b"12345678",
            virtual_size: 0,
            virtual_address: 0,
            size_of_raw_data: 0,
            pointer_to_raw_data: 0,
            characteristics: 0,
        };
        assert_eq!(sec.name_lossy(), "12345678");
    }

    #[test]
    fn test_invalid_utf8_section_name_does_not_panic() {
        let sec = SectionHeader {
            name: [0xFF, 0xFE, 0xFD, 0x00, 0, 0, 0, 0],
            virtual_size: 0,
            virtual_address: 0,
            size_of_raw_data: 0,
            pointer_to_raw_data: 0,
            characteristics: 0,
        };
        let lossy_name = sec.name_lossy();
        assert!(!lossy_name.is_empty());
        assert!(lossy_name.contains('\u{FFFD}'));
    }
}
