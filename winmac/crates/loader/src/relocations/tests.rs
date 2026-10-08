use super::*;
use winmac_pe::{CoffHeader, DataDirectory, OptionalHeader, SectionHeader};
fn fixture(plus: bool) -> (PeImage, Vec<u8>) {
    let pe = PeImage {
        coff_header: CoffHeader {
            machine: if plus {
                MachineType::Amd64
            } else {
                MachineType::I386
            },
            number_of_sections: 1,
            time_date_stamp: 0,
            pointer_to_symbol_table: 0,
            number_of_symbols: 0,
            size_of_optional_header: 0,
            characteristics: 2,
        },
        optional_header: OptionalHeader {
            format: if plus {
                PeFormat::Pe32Plus
            } else {
                PeFormat::Pe32
            },
            address_of_entry_point: 0x1000,
            image_base: 0x400000,
            section_alignment: 0x1000,
            file_alignment: 0x200,
            size_of_image: 0x3000,
            size_of_headers: 0x200,
            subsystem: 3,
            dll_characteristics: 0,
        },
        data_directories: vec![
            DataDirectory {
                virtual_address: 0,
                size: 0
            };
            6
        ],
        sections: vec![SectionHeader {
            name: *b".reloc\0\0",
            virtual_address: 0x1000,
            virtual_size: 0x1000,
            pointer_to_raw_data: 0x200,
            size_of_raw_data: 0x1000,
            characteristics: 0,
        }],
    };
    let mut pe = pe;
    pe.data_directories[5] = DataDirectory {
        virtual_address: 0x1000,
        size: 12,
    };
    let mut bytes = vec![0; 0x1200];
    bytes[0x200..0x204].copy_from_slice(&0x1000u32.to_le_bytes());
    bytes[0x204..0x208].copy_from_slice(&12u32.to_le_bytes());
    let kind = if plus { 10 } else { 3 };
    bytes[0x208..0x20a].copy_from_slice(&((kind << 12) | 0x100u16).to_le_bytes());
    bytes[0x300..0x308].copy_from_slice(&0x401234u64.to_le_bytes());
    (pe, bytes)
}
#[test]
fn absent_zero_and_padding() {
    let (mut pe, bytes) = fixture(true);
    pe.data_directories.clear();
    assert!(parse_relocation_table(&pe, &bytes)
        .unwrap()
        .blocks
        .is_empty());
    let (mut pe, bytes) = fixture(true);
    pe.data_directories[5].virtual_address = 0;
    assert!(parse_relocation_table(&pe, &bytes)
        .unwrap()
        .blocks
        .is_empty());
    let (pe, bytes) = fixture(true);
    let entries = &parse_relocation_table(&pe, &bytes).unwrap().blocks[0].entries;
    assert_eq!(entries[0].target_rva, 0x1100);
    assert_eq!(entries[1].kind, RelocationKind::Absolute);
}
#[test]
fn supported_rebase_up_down_and_noop() {
    for plus in [false, true] {
        let (pe, bytes) = fixture(plus);
        let before = bytes.clone();
        for base in [0x300000, 0x400000, 0x500000] {
            let image = map_image_at(&pe, &bytes, base).unwrap();
            let raw: [u8; 8] = image.memory[0x1100..0x1108].try_into().unwrap();
            assert_eq!(u64::from_le_bytes(raw), base + 0x1234);
            assert_eq!(image.entry_point_va().unwrap(), Some(base + 0x1000));
            assert_eq!(bytes, before);
        }
    }
}
#[test]
fn all_block_size_failures() {
    for size in [0u32, 1, 7, 9, 10, 13, u32::MAX] {
        let (pe, mut bytes) = fixture(true);
        bytes[0x204..0x208].copy_from_slice(&size.to_le_bytes());
        assert!(parse_relocation_table(&pe, &bytes).is_err());
    }
    for size in [0, 1, 7, 11, u32::MAX] {
        let (mut pe, bytes) = fixture(true);
        pe.data_directories[5].size = size;
        assert!(parse_relocation_table(&pe, &bytes).is_err());
    }
}
#[test]
fn multi_block_and_highadj_pair() {
    let (mut pe, mut bytes) = fixture(false);
    pe.data_directories[5].size = 24;
    let block = bytes[0x200..0x20c].to_vec();
    bytes[0x20c..0x218].copy_from_slice(&block);
    bytes[0x208..0x20a].copy_from_slice(&0x4100u16.to_le_bytes());
    bytes[0x20a..0x20c].copy_from_slice(&(-100i16).to_le_bytes());
    let table = parse_relocation_table(&pe, &bytes).unwrap();
    assert_eq!(table.blocks.len(), 2);
    assert_eq!(table.blocks[0].entries.len(), 1);
    assert_eq!(
        table.blocks[0].entries[0].kind,
        RelocationKind::HighAdj { adjustment: -100 }
    );
    bytes[0x208..0x20a].fill(0);
    bytes[0x20a..0x20c].copy_from_slice(&0x4100u16.to_le_bytes());
    assert!(matches!(
        parse_relocation_table(&pe, &bytes),
        Err(LoaderError::Relocation(
            RelocationError::MissingAdjustment { .. }
        ))
    ));
}
#[test]
fn architecture_and_unsupported_types() {
    let (mut pe, mut bytes) = fixture(true);
    pe.coff_header.machine = MachineType::Arm64;
    assert!(map_image_at(&pe, &bytes, 0x500000).is_ok());
    bytes[0x208..0x20a].copy_from_slice(&0x5100u16.to_le_bytes());
    assert_eq!(
        parse_relocation_table(&pe, &bytes).unwrap().blocks[0].entries[0].kind,
        RelocationKind::Unsupported { raw_type: 5 }
    );
    assert!(matches!(
        map_image_at(&pe, &bytes, 0x500000),
        Err(LoaderError::Relocation(RelocationError::Unsupported { .. }))
    ));
    pe.optional_header.format = PeFormat::Pe32;
    assert_eq!(
        map_image_at(&pe, &bytes, 0x500000),
        Err(RelocationError::MachineFormatMismatch.into())
    );
}
#[test]
fn bounds_alignment_and_overflow() {
    let (mut pe, mut bytes) = fixture(true);
    for page in [0x1001u32, 0x3000, 0xffff_f000] {
        bytes[0x200..0x204].copy_from_slice(&page.to_le_bytes());
        assert!(parse_relocation_table(&pe, &bytes).is_err());
    }
    pe.data_directories[5].virtual_address = u32::MAX - 3;
    assert!(parse_relocation_table(&pe, &bytes).is_err());
    let (pe, bytes) = fixture(true);
    for len in 0..0x20c {
        assert!(parse_relocation_table(&pe, &bytes[..len]).is_err());
    }
}
#[test]
fn overlapping_targets_and_missing_relocations() {
    let (mut pe, mut bytes) = fixture(true);
    bytes[0x20a..0x20c].copy_from_slice(&0xa104u16.to_le_bytes());
    assert!(matches!(
        map_image_at(&pe, &bytes, 0x500000),
        Err(LoaderError::Relocation(
            RelocationError::OverlappingTargets { .. }
        ))
    ));
    pe.data_directories.clear();
    assert_eq!(
        map_image_at(&pe, &bytes, 0x500000),
        Err(RelocationError::CannotRebase.into())
    );
    pe.coff_header.characteristics |= 1;
    assert_eq!(
        map_image_at(&pe, &bytes, 0x500000),
        Err(RelocationError::CannotRebase.into())
    );
}
#[test]
fn invalid_bases_and_wrapping_relocation() {
    let (pe, mut bytes) = fixture(false);
    for base in [1, 0x1_0000_0000, u64::MAX] {
        assert!(map_image_at(&pe, &bytes, base).is_err());
    }
    bytes[0x300..0x304].copy_from_slice(&u32::MAX.to_le_bytes());
    let image = map_image_at(&pe, &bytes, 0x410000).unwrap();
    assert_eq!(
        u32::from_le_bytes(image.memory[0x1100..0x1104].try_into().unwrap()),
        0xffff
    );
}
#[test]
fn declared_limits_precede_allocations() {
    let (mut pe, mut bytes) = fixture(true);
    let size = 8 + (MAX_RELOCATION_ENTRIES as u32 + 2) * 2;
    pe.optional_header.size_of_image = size + 0x1000;
    pe.data_directories[5].size = size;
    bytes[0x204..0x208].copy_from_slice(&size.to_le_bytes());
    assert_eq!(
        parse_relocation_table(&pe, &bytes),
        Err(RelocationError::LimitExceeded.into())
    );
}
