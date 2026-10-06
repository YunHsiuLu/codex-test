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
pub struct PeImage {
    pub coff_header: CoffHeader,
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
    let pe_offset = e_lfanew as usize;

    if pe_offset.checked_add(4).is_none_or(|end| end > bytes.len()) {
        return Err(PeError::InvalidElfanew(e_lfanew));
    }

    let pe_sig = &bytes[pe_offset..pe_offset + 4];
    if pe_sig != b"PE\0\0" {
        let mut actual = [0u8; 4];
        actual.copy_from_slice(pe_sig);
        return Err(PeError::InvalidPeSignature(actual));
    }

    let coff_offset = pe_offset + 4;
    let coff_end = coff_offset + 20;

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

    Ok(PeImage { coff_header })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_synthetic_pe(e_lfanew: u32, machine: u16) -> Vec<u8> {
        let mut data = vec![0u8; (e_lfanew as usize) + 24];
        data[0] = b'M';
        data[1] = b'Z';

        let lfanew_bytes = e_lfanew.to_le_bytes();
        data[0x3C..0x40].copy_from_slice(&lfanew_bytes);

        let pe_idx = e_lfanew as usize;
        data[pe_idx..pe_idx + 4].copy_from_slice(b"PE\0\0");

        let coff_idx = pe_idx + 4;
        let machine_bytes = machine.to_le_bytes();
        data[coff_idx..coff_idx + 2].copy_from_slice(&machine_bytes);
        data[coff_idx + 2..coff_idx + 4].copy_from_slice(&6u16.to_le_bytes());
        data[coff_idx + 16..coff_idx + 18].copy_from_slice(&240u16.to_le_bytes());
        data[coff_idx + 18..coff_idx + 20].copy_from_slice(&0x0022u16.to_le_bytes());

        data
    }

    #[test]
    fn test_invalid_mz() {
        let mut data = create_synthetic_pe(0x80, 0x8664);
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
        let mut data = create_synthetic_pe(0x80, 0x8664);
        let out_of_bounds_offset = 0xFFFF_FFFFu32;
        data[0x3C..0x40].copy_from_slice(&out_of_bounds_offset.to_le_bytes());
        assert_eq!(
            parse_pe(&data),
            Err(PeError::InvalidElfanew(out_of_bounds_offset))
        );
    }

    #[test]
    fn test_invalid_pe_signature() {
        let mut data = create_synthetic_pe(0x80, 0x8664);
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
        let data = create_synthetic_pe(0x80, 0x8664);
        let pe = parse_pe(&data).expect("Parsing failed");
        assert_eq!(pe.coff_header.machine, MachineType::Amd64);
        assert_eq!(pe.coff_header.number_of_sections, 6);
        assert_eq!(pe.coff_header.size_of_optional_header, 240);
        assert_eq!(pe.coff_header.characteristics, 0x0022);
    }

    #[test]
    fn test_machine_type_x86() {
        let data = create_synthetic_pe(0x80, 0x014C);
        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.coff_header.machine, MachineType::I386);
    }

    #[test]
    fn test_machine_type_x86_64() {
        let data = create_synthetic_pe(0x80, 0x8664);
        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.coff_header.machine, MachineType::Amd64);
    }

    #[test]
    fn test_machine_type_arm64() {
        let data = create_synthetic_pe(0x80, 0xAA64);
        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.coff_header.machine, MachineType::Arm64);
    }

    #[test]
    fn test_unknown_machine_type() {
        let data = create_synthetic_pe(0x80, 0x1234);
        let pe = parse_pe(&data).unwrap();
        assert_eq!(pe.coff_header.machine, MachineType::Unknown(0x1234));
    }
}
