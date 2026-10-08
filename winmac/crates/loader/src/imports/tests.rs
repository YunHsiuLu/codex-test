use super::*;
use winmac_pe::parse_pe;

struct Fixture {
    bytes: Vec<u8>,
    plus: bool,
}
impl Fixture {
    fn new(plus: bool) -> Self {
        let mut f = Self {
            bytes: vec![0; 0x2400],
            plus,
        };
        f.bytes[..2].copy_from_slice(b"MZ");
        f.u32(0x3c, 0x80);
        f.bytes[0x80..0x84].copy_from_slice(b"PE\0\0");
        f.u16(0x84, if plus { 0x8664 } else { 0x14c });
        f.u16(0x86, 1);
        let opt_size = if plus { 128 } else { 112 };
        f.u16(0x94, opt_size);
        f.u16(0x98, if plus { 0x20b } else { 0x10b });
        f.u32(0x98 + 32, 0x1000);
        f.u32(0x98 + 36, 0x200);
        f.u32(0x98 + 56, 0x4000);
        f.u32(0x98 + 60, 0x400);
        let count = if plus { 108 } else { 92 };
        f.u32(0x98 + count, 2);
        f.directory(0x1000, 40);
        let sec = 0x98 + usize::from(opt_size);
        f.bytes[sec..sec + 8].copy_from_slice(b".idata\0\0");
        f.u32(sec + 8, 0x2000);
        f.u32(sec + 12, 0x1000);
        f.u32(sec + 16, 0x2000);
        f.u32(sec + 20, 0x400);
        f.descriptor(0, 0x1100, 0x1080, 0x1200);
        f.put(0x1080, b"KERNEL32.dll\0");
        f.thunk(0x1100, 0x1300);
        f.put(0x1300, b"\x7b\0ExitProcess\0");
        f
    }
    fn u16(&mut self, offset: usize, value: u16) {
        self.bytes[offset..offset + 2].copy_from_slice(&value.to_le_bytes());
    }
    fn u32(&mut self, offset: usize, value: u32) {
        self.bytes[offset..offset + 4].copy_from_slice(&value.to_le_bytes());
    }
    fn directory(&mut self, rva: u32, size: u32) {
        let offset = 0x98 + if self.plus { 112 } else { 96 } + 8;
        self.u32(offset, rva);
        self.u32(offset + 4, size);
    }
    fn put(&mut self, rva: u32, data: &[u8]) {
        let offset = (rva - 0x1000 + 0x400) as usize;
        self.bytes[offset..offset + data.len()].copy_from_slice(data);
    }
    fn descriptor(&mut self, index: usize, oft: u32, name: u32, ft: u32) {
        let offset = 0x400 + index * 20;
        self.u32(offset, oft);
        self.u32(offset + 12, name);
        self.u32(offset + 16, ft);
    }
    fn thunk(&mut self, rva: u32, value: u64) {
        if self.plus {
            self.put(rva, &value.to_le_bytes());
        } else {
            self.put(rva, &(value as u32).to_le_bytes());
        }
    }
    fn pe(&self) -> PeImage {
        parse_pe(&self.bytes).unwrap()
    }
    fn parse(&self) -> Result<ImportTable, LoaderError> {
        parse_import_table(&self.pe(), &self.bytes)
    }
}

#[test]
fn absent_and_zero_directory() {
    let mut f = Fixture::new(true);
    let mut pe = f.pe();
    pe.data_directories.clear();
    assert!(parse_import_table(&pe, &f.bytes)
        .unwrap()
        .modules
        .is_empty());
    f.directory(0, u32::MAX);
    assert!(f.parse().unwrap().modules.is_empty());
}

#[test]
fn names_ordinals_widths_hints_and_read_only() {
    for plus in [false, true] {
        let mut f = Fixture::new(plus);
        let width = if plus { 8 } else { 4 };
        let flag = if plus { 1 << 63 } else { 1 << 31 };
        f.thunk(0x1100 + width, 0x1320);
        f.put(0x1320, b"\x2d\0GetLastError\0");
        f.thunk(0x1100 + 2 * width, flag | 12);
        let before = f.bytes.clone();
        let table = f.parse().unwrap();
        assert_eq!(f.bytes, before);
        assert_eq!(
            table.modules,
            vec![ImportModule {
                dll_name: "KERNEL32.dll".into(),
                original_first_thunk: 0x1100,
                first_thunk: 0x1200,
                symbols: vec![
                    ImportSymbol::ByName {
                        hint: 123,
                        name: "ExitProcess".into()
                    },
                    ImportSymbol::ByName {
                        hint: 45,
                        name: "GetLastError".into()
                    },
                    ImportSymbol::ByOrdinal { ordinal: 12 },
                ],
            }]
        );
    }
}

#[test]
fn single_name_both_formats() {
    for plus in [false, true] {
        let f = Fixture::new(plus);
        assert_eq!(
            f.parse().unwrap().modules[0].symbols,
            vec![ImportSymbol::ByName {
                hint: 123,
                name: "ExitProcess".into()
            }]
        );
    }
}

#[test]
fn multiple_modules() {
    let mut f = Fixture::new(true);
    f.directory(0x1000, 60);
    f.descriptor(1, 0x1180, 0x10a0, 0x1280);
    f.put(0x10a0, b"USER32.dll\0");
    f.thunk(0x1180, 0x1340);
    f.put(0x1340, b"\x2d\0MessageBoxW\0");
    let modules = f.parse().unwrap().modules;
    assert_eq!(modules.len(), 2);
    assert_eq!(modules[1].dll_name, "USER32.dll");
    assert_eq!(
        modules[1].symbols,
        vec![ImportSymbol::ByName {
            hint: 45,
            name: "MessageBoxW".into()
        }]
    );
}

#[test]
fn fallback_both_formats_and_oft_precedence() {
    for plus in [false, true] {
        let mut f = Fixture::new(plus);
        f.thunk(0x1200, u64::MAX);
        assert!(f.parse().is_ok()); // IAT is not read when OFT exists.
        f.descriptor(0, 0, 0x1080, 0x1200);
        f.thunk(0x1200, 0x1300);
        let module = f.parse().unwrap().modules.remove(0);
        assert_eq!(module.original_first_thunk, 0);
        assert_eq!(module.symbols.len(), 1);
    }
}

#[test]
fn zero_terminators_ignore_trailing_garbage() {
    let mut f = Fixture::new(true);
    f.directory(0x1000, 60);
    f.put(0x1028, &[0xff; 20]);
    f.thunk(0x1110, u64::MAX);
    assert_eq!(f.parse().unwrap().modules[0].symbols.len(), 1);
    f.put(0x1000, &[0; 20]);
    assert!(f.parse().unwrap().modules.is_empty());
}

#[test]
fn terminator_requires_all_five_fields_zero() {
    for field in 0..5 {
        let mut f = Fixture::new(true);
        f.put(0x1000, &[0; 20]);
        f.u32(0x400 + field * 4, 1);
        assert!(matches!(
            f.parse(),
            Err(LoaderError::Import(ImportError::NullDescriptorField { .. }))
        ));
    }
}

#[test]
fn descriptor_size_and_termination_errors() {
    for size in [0, 1, 19, 21, 39] {
        let mut f = Fixture::new(true);
        f.directory(0x1000, size);
        assert!(matches!(
            f.parse(),
            Err(LoaderError::Import(ImportError::DescriptorTruncated { .. }))
        ));
    }
    let mut f = Fixture::new(true);
    f.directory(0x1000, 20);
    assert_eq!(
        f.parse(),
        Err(ImportError::DescriptorTerminatorMissing.into())
    );
}

#[test]
fn directory_overflow_and_image_bounds() {
    for (rva, size) in [(u32::MAX - 10, 40), (0x1000, u32::MAX), (0x3ff0, 40)] {
        let mut f = Fixture::new(true);
        f.directory(rva, size);
        assert_eq!(
            f.parse(),
            Err(ImportError::DirectoryOutOfBounds { rva, size }.into())
        );
    }
}

#[test]
fn invalid_dll_name_thunk_and_hint_rvas() {
    for rva in [0x800, 0x3500, 0xffff_fff0] {
        let mut f = Fixture::new(true);
        f.descriptor(0, 0x1100, rva, 0x1200);
        assert!(f.parse().is_err());
        f.descriptor(0, rva, 0x1080, 0x1200);
        assert!(f.parse().is_err());
        f.descriptor(0, 0x1100, 0x1080, 0x1200);
        f.thunk(0x1100, u64::from(rva));
        assert!(f.parse().is_err());
    }
}

#[test]
fn null_required_descriptor_fields() {
    for (oft, name, ft) in [(0, 0x1080, 0), (0x1100, 0, 0x1200), (0x1100, 0x1080, 0)] {
        let mut f = Fixture::new(true);
        f.descriptor(0, oft, name, ft);
        assert!(matches!(
            f.parse(),
            Err(LoaderError::Import(ImportError::NullDescriptorField { .. }))
        ));
    }
}

#[test]
fn strings_at_safety_limit() {
    for dll in [false, true] {
        let mut f = Fixture::new(true);
        let rva = if dll {
            f.descriptor(0, 0x1100, 0x1800, 0x1200);
            0x1800
        } else {
            f.thunk(0x1100, 0x17fe);
            0x1800
        };
        f.put(rva, &vec![b'A'; MAX_IMPORT_STRING_BYTES]);
        assert_eq!(
            f.parse(),
            Err(ImportError::StringUnterminated { rva }.into())
        );
        f.put(rva + MAX_IMPORT_STRING_BYTES as u32 - 1, &[0]);
        assert!(f.parse().is_ok());
    }
}

#[test]
fn strings_cannot_read_file_overlay_or_zero_fill() {
    for dll in [false, true] {
        let mut f = Fixture::new(true);
        if dll {
            f.descriptor(0, 0x1100, 0x2ffe, 0x1200);
        } else {
            f.thunk(0x1100, 0x2ffc);
        }
        f.put(0x2ffe, b"AB");
        let mut pe = f.pe();
        pe.sections[0].virtual_size += 0x100;
        f.bytes.extend_from_slice(&[0; 0x100]);
        assert!(matches!(
            parse_import_table(&pe, &f.bytes),
            Err(LoaderError::Import(ImportError::InvalidRva {
                kind: "string",
                ..
            }))
        ));
    }
}

#[test]
fn empty_and_invalid_utf8_names() {
    let mut f = Fixture::new(true);
    f.put(0x1080, b"\0");
    assert_eq!(
        f.parse(),
        Err(ImportError::EmptyName { rva: 0x1080 }.into())
    );
    f.put(0x1080, b"\xff.dll\0");
    assert_eq!(f.parse().unwrap().modules[0].dll_name, "\u{fffd}.dll");
    f.put(0x1302, b"\0");
    assert_eq!(
        f.parse(),
        Err(ImportError::EmptyName { rva: 0x1302 }.into())
    );
    f.put(0x1302, b"\xff\0");
    assert!(f.parse().is_ok());
}

#[test]
fn truncated_structures_even_with_overlay() {
    for plus in [false, true] {
        let width = if plus { 8 } else { 4 };
        for remaining in 1..width {
            let mut f = Fixture::new(plus);
            f.descriptor(0, 0x3000 - remaining, 0x1080, 0x1200);
            let pe = f.pe();
            f.bytes.extend_from_slice(&[0; 20]);
            assert!(matches!(
                parse_import_table(&pe, &f.bytes),
                Err(LoaderError::Import(ImportError::InvalidRva {
                    kind: "thunk",
                    ..
                }))
            ));
        }
    }
    let mut f = Fixture::new(true);
    f.thunk(0x1100, 0x2fff);
    assert!(matches!(
        f.parse(),
        Err(LoaderError::Import(ImportError::InvalidRva {
            kind: "hint/name",
            ..
        }))
    ));
    f.directory(0x2ff0, 40);
    assert!(matches!(
        f.parse(),
        Err(LoaderError::Import(ImportError::InvalidRva {
            kind: "descriptor",
            ..
        }))
    ));
}

#[test]
fn missing_thunk_terminator_at_file_boundary() {
    for plus in [false, true] {
        let mut f = Fixture::new(plus);
        let width = if plus { 8 } else { 4 };
        f.descriptor(0, 0x3000 - width, 0x1080, 0x1200);
        f.thunk(
            0x3000 - width,
            if plus { (1 << 63) | 1 } else { (1 << 31) | 1 },
        );
        assert!(f.parse().is_err());
    }
}

#[test]
fn wide_rva_and_reserved_bits_rejected() {
    let mut f = Fixture::new(true);
    f.thunk(0x1100, 0x1_0000_1300);
    assert_eq!(
        f.parse(),
        Err(ImportError::RvaTooLarge {
            value: 0x1_0000_1300
        }
        .into())
    );
    for plus in [false, true] {
        let mut f = Fixture::new(plus);
        let value = if plus {
            (1 << 63) | 0x10001
        } else {
            (1 << 31) | 0x10001
        };
        f.thunk(0x1100, value);
        assert_eq!(
            f.parse(),
            Err(ImportError::ReservedThunkBits { value }.into())
        );
    }
    f.thunk(0x1100, 0x8000_1300);
    assert_eq!(
        f.parse(),
        Err(ImportError::ReservedThunkBits { value: 0x8000_1300 }.into())
    );
}

#[test]
fn headers_are_valid_import_backing() {
    let mut f = Fixture::new(true);
    f.directory(0x200, 40);
    let descriptor = f.bytes[0x400..0x428].to_vec();
    f.bytes[0x200..0x228].copy_from_slice(&descriptor);
    assert!(f.parse().is_ok());
}

#[test]
fn adjacent_sections_with_discontiguous_raw_data() {
    let mut f = Fixture::new(true);
    f.descriptor(0, 0x1100, 0x1080, 0x1200);
    f.thunk(0x1100, 0x2ffc);
    f.put(0x2ffc, b"\x01\0AB");
    let mut pe = f.pe();
    pe.sections.push(winmac_pe::SectionHeader {
        name: *b".extra\0\0",
        virtual_address: 0x3000,
        virtual_size: 0x100,
        pointer_to_raw_data: 0x2500,
        size_of_raw_data: 0x100,
        characteristics: 0,
    });
    f.bytes.resize(0x2600, 0);
    f.bytes[0x2500..0x2502].copy_from_slice(b"C\0");
    assert_eq!(
        parse_import_table(&pe, &f.bytes).unwrap().modules[0].symbols,
        vec![ImportSymbol::ByName {
            hint: 1,
            name: "ABC".into()
        }]
    );
}

#[test]
fn budget_and_symbol_limits() {
    let f = Fixture::new(true);
    let pe = f.pe();
    let mut reader = Reader {
        pe: &pe,
        bytes: &f.bytes,
        remaining: 1,
    };
    assert_eq!(
        reader.read::<2>(0x1300, "hint"),
        Err(ImportError::LimitExceeded { kind: "read bytes" })
    );
    reader.remaining = MAX_IMPORT_READ_BYTES;
    let mut count = MAX_IMPORT_SYMBOLS;
    assert_eq!(
        reader.symbols(0x1100, &mut count),
        Err(ImportError::LimitExceeded {
            kind: "total symbols"
        })
    );
}

#[test]
fn truncations_and_deterministic_mutations_never_panic() {
    for plus in [false, true] {
        let f = Fixture::new(plus);
        let pe = f.pe();
        for len in 0..=f.bytes.len() {
            let _ = parse_import_table(&pe, &f.bytes[..len]);
        }
        let mut seed = 0x1234_5678u32;
        for _ in 0..1000 {
            let mut bytes = f.bytes.clone();
            for _ in 0..8 {
                seed = seed.wrapping_mul(1664525).wrapping_add(1013904223);
                let offset = 0x400 + seed as usize % 0x1000;
                bytes[offset] = (seed >> 24) as u8;
            }
            let _ = parse_import_table(&pe, &bytes);
        }
    }
}

fn many_modules(count: usize, long_names: bool) -> Fixture {
    let mut f = Fixture::new(true);
    f.bytes.resize(0x20400, 0);
    let sec = 0x98 + 128;
    f.u32(sec + 8, 0x20000);
    f.u32(sec + 16, 0x20000);
    f.u32(0x98 + 56, 0x21000);
    f.bytes[0x400..].fill(0);
    f.directory(0x1000, ((count + 1) * 20) as u32);
    for i in 0..count {
        f.descriptor(i, 0x18000, 0x16000, 0x19000);
    }
    if long_names {
        f.put(0x16000, &vec![b'A'; MAX_IMPORT_STRING_BYTES - 1]);
    } else {
        f.put(0x16000, b"A\0");
    }
    f
}

#[test]
fn module_limit_accepts_boundary_and_rejects_excess() {
    assert_eq!(
        many_modules(MAX_IMPORT_MODULES, false)
            .parse()
            .unwrap()
            .modules
            .len(),
        MAX_IMPORT_MODULES
    );
    assert_eq!(
        many_modules(MAX_IMPORT_MODULES + 1, false).parse(),
        Err(ImportError::LimitExceeded { kind: "modules" }.into())
    );
}

#[test]
fn repeated_names_cannot_amplify_past_global_budget() {
    assert_eq!(
        many_modules(MAX_IMPORT_MODULES, true).parse(),
        Err(ImportError::LimitExceeded { kind: "read bytes" }.into())
    );
}

#[test]
fn invalid_public_pe_metadata_never_panics() {
    let f = Fixture::new(true);
    for value in [0, 1, 0x1000, u32::MAX - 1, u32::MAX] {
        for field in 0..6 {
            let mut pe = f.pe();
            match field {
                0 => pe.optional_header.size_of_image = value,
                1 => pe.optional_header.size_of_headers = value,
                2 => pe.sections[0].virtual_address = value,
                3 => pe.sections[0].virtual_size = value,
                4 => pe.sections[0].size_of_raw_data = value,
                _ => pe.sections[0].pointer_to_raw_data = value,
            }
            let _ = parse_import_table(&pe, &f.bytes);
        }
    }
}
