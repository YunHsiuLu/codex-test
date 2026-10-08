//! Reproducible AMD64 PE32+ console fixture. No compiler or Windows SDK needed.
pub const MESSAGE: &[u8] = b"Hello from WinMac on macOS!\r\n";
pub const BASE: u64 = 0x1_4000_0000;
pub fn minimal_console_pe() -> Vec<u8> {
    let mut bytes = vec![0u8; 0xc00];
    fn u16_at(b: &mut [u8], o: usize, v: u16) {
        b[o..o + 2].copy_from_slice(&v.to_le_bytes());
    }
    fn u32_at(b: &mut [u8], o: usize, v: u32) {
        b[o..o + 4].copy_from_slice(&v.to_le_bytes());
    }
    fn u64_at(b: &mut [u8], o: usize, v: u64) {
        b[o..o + 8].copy_from_slice(&v.to_le_bytes());
    }
    bytes[..2].copy_from_slice(b"MZ");
    u32_at(&mut bytes, 0x3c, 0x80);
    bytes[0x80..0x84].copy_from_slice(b"PE\0\0");
    u16_at(&mut bytes, 0x84, 0x8664);
    u16_at(&mut bytes, 0x86, 4);
    u16_at(&mut bytes, 0x94, 0xf0);
    u16_at(&mut bytes, 0x96, 0x22);
    let opt = 0x98;
    u16_at(&mut bytes, opt, 0x20b);
    u32_at(&mut bytes, opt + 4, 0x200);
    u32_at(&mut bytes, opt + 8, 0x600);
    u32_at(&mut bytes, opt + 16, 0x1000);
    u32_at(&mut bytes, opt + 20, 0x1000);
    u64_at(&mut bytes, opt + 24, BASE);
    u32_at(&mut bytes, opt + 32, 0x1000);
    u32_at(&mut bytes, opt + 36, 0x200);
    u16_at(&mut bytes, opt + 40, 6);
    u16_at(&mut bytes, opt + 48, 6);
    u32_at(&mut bytes, opt + 56, 0x5000);
    u32_at(&mut bytes, opt + 60, 0x400);
    u16_at(&mut bytes, opt + 68, 3);
    u16_at(&mut bytes, opt + 70, 0x140);
    u64_at(&mut bytes, opt + 72, 0x100000);
    u64_at(&mut bytes, opt + 80, 0x1000);
    u64_at(&mut bytes, opt + 88, 0x100000);
    u64_at(&mut bytes, opt + 96, 0x1000);
    u32_at(&mut bytes, opt + 108, 16);
    for (index, rva, size) in [(1, 0x3000, 40), (5, 0x4000, 12), (12, 0x30a0, 32)] {
        u32_at(&mut bytes, opt + 112 + index * 8, rva);
        u32_at(&mut bytes, opt + 116 + index * 8, size);
    }
    let sections: [(&[u8; 8], u32, u32, u32); 4] = [
        (b".text\0\0\0", 0x1000, 0x400, 0x60000020),
        (b".rdata\0\0", 0x2000, 0x600, 0x40000040),
        (b".idata\0\0", 0x3000, 0x800, 0xc0000040),
        (b".reloc\0\0", 0x4000, 0xa00, 0x42000040),
    ];
    for (i, (name, rva, raw, flags)) in sections.into_iter().enumerate() {
        let o = opt + 0xf0 + i * 40;
        bytes[o..o + 8].copy_from_slice(name);
        u32_at(&mut bytes, o + 8, 0x200);
        u32_at(&mut bytes, o + 12, rva);
        u32_at(&mut bytes, o + 16, 0x200);
        u32_at(&mut bytes, o + 20, raw);
        u32_at(&mut bytes, o + 36, flags);
    }
    let mut code = Vec::new();
    fn relative(code: &mut Vec<u8>, opcode: &[u8], target: u32) {
        code.extend_from_slice(opcode);
        let next = 0x1000 + code.len() as u32 + 4;
        code.extend_from_slice(&(target as i32 - next as i32).to_le_bytes());
    }
    code.extend_from_slice(&[0x48, 0x83, 0xec, 0x38]); // sub rsp, 56: shadow space + locals, aligned
    code.extend_from_slice(&[0xb9, 0xf5, 0xff, 0xff, 0xff]); // mov ecx, STD_OUTPUT_HANDLE
    relative(&mut code, &[0xff, 0x15], 0x30a0); // call [GetStdHandle]
    code.extend_from_slice(&[0x48, 0x89, 0xc1]); // mov rcx, rax
    relative(&mut code, &[0x48, 0x8d, 0x15], 0x2000); // lea rdx, [message]
    code.extend_from_slice(&[0x41, 0xb8]);
    code.extend_from_slice(&(MESSAGE.len() as u32).to_le_bytes());
    code.extend_from_slice(&[0x4c, 0x8d, 0x4c, 0x24, 0x30]); // lea r9, [rsp+48]
    code.extend_from_slice(&[0x48, 0xc7, 0x44, 0x24, 0x20, 0, 0, 0, 0]); // lpOverlapped = NULL
    relative(&mut code, &[0xff, 0x15], 0x30a8); // call [WriteFile]
    code.extend_from_slice(&[0x31, 0xc9]); // xor ecx, ecx
    relative(&mut code, &[0xff, 0x15], 0x30b0); // call [ExitProcess]
    code.extend_from_slice(&[0x0f, 0x0b]); // ud2: ExitProcess must not return
    bytes[0x400..0x400 + code.len()].copy_from_slice(&code);
    bytes[0x600..0x600 + MESSAGE.len()].copy_from_slice(MESSAGE);
    u64_at(&mut bytes, 0x700, BASE + 0x2000); // data pointer exercised by rebase tests
    u32_at(&mut bytes, 0x800, 0x3080);
    u32_at(&mut bytes, 0x80c, 0x3040);
    u32_at(&mut bytes, 0x810, 0x30a0);
    bytes[0x840..0x84d].copy_from_slice(b"KERNEL32.dll\0");
    for (i, (rva, name)) in [
        (0x30c0, b"GetStdHandle\0".as_slice()),
        (0x30e0, b"WriteFile\0"),
        (0x3100, b"ExitProcess\0"),
    ]
    .into_iter()
    .enumerate()
    {
        u64_at(&mut bytes, 0x880 + i * 8, rva);
        u64_at(&mut bytes, 0x8a0 + i * 8, rva);
        let offset = (rva - 0x3000 + 0x800) as usize + 2;
        bytes[offset..offset + name.len()].copy_from_slice(name);
    }
    u32_at(&mut bytes, 0xa00, 0x2000);
    u32_at(&mut bytes, 0xa04, 12);
    u16_at(&mut bytes, 0xa08, 0xa100);
    bytes
}
