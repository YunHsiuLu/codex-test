//! A real AMD64 Windows GUI PE. Guest instructions choose the answer dialog.
use super::demo;
pub const QUESTION: &str =
    "Physics quiz: If speed doubles, does kinetic energy become four times larger?";
pub const CORRECT: &str = "Correct! Kinetic energy is proportional to speed squared. You win!";
pub const INCORRECT: &str =
    "Not quite. Kinetic energy = 1/2 m v^2. Double speed means four times the energy.";
pub fn quiz_pe() -> Vec<u8> {
    let mut bytes = demo::minimal_console_pe();
    bytes[0x98 + 68..0x98 + 70].copy_from_slice(&2u16.to_le_bytes());
    bytes[0x400..0x800].fill(0);
    bytes[0x840..0xa00].fill(0);
    bytes[0x840..0x84b].copy_from_slice(b"USER32.dll\0");
    for offset in [0x880, 0x8a0] {
        bytes[offset..offset + 8].copy_from_slice(&0x30c0u64.to_le_bytes());
    }
    bytes[0x8c2..0x8ce].copy_from_slice(b"MessageBoxA\0");
    // IAT contains one import plus the terminating zero.
    bytes[0x98 + 116 + 12 * 8..0x98 + 120 + 12 * 8].copy_from_slice(&16u32.to_le_bytes());
    for (offset, text) in [
        (0x600, QUESTION),
        (0x660, "WinMac Physics Quiz"),
        (0x680, CORRECT),
        (0x6e0, INCORRECT),
    ] {
        bytes[offset..offset + text.len()].copy_from_slice(text.as_bytes());
    }
    // Preserve the existing relocation fixture, outside the GUI strings.
    bytes[0x7f0..0x7f8].copy_from_slice(&(demo::BASE + 0x2000).to_le_bytes());
    bytes[0xa08..0xa0a].copy_from_slice(&0xa1f0u16.to_le_bytes());
    let mut code = vec![0x48, 0x83, 0xec, 0x28]; // shadow space + alignment
    fn relative(code: &mut Vec<u8>, opcode: &[u8], rva: u32) {
        code.extend_from_slice(opcode);
        let next = 0x1000 + code.len() as u32 + 4;
        code.extend_from_slice(&(rva as i32 - next as i32).to_le_bytes());
    }
    fn dialog(code: &mut Vec<u8>, text: u32, flags: u32) {
        code.extend_from_slice(&[0x31, 0xc9]); // owner = NULL
        relative(code, &[0x48, 0x8d, 0x15], text);
        relative(code, &[0x4c, 0x8d, 0x05], 0x2060); // caption
        code.extend_from_slice(&[0x41, 0xb9]);
        code.extend_from_slice(&flags.to_le_bytes());
        relative(code, &[0xff, 0x15], 0x30a0);
    }
    dialog(&mut code, 0x2000, 4); // MB_YESNO
    code.extend_from_slice(&[0x83, 0xf8, 6, 0x75, 0]); // cmp eax,IDYES; jne lose
    let lose_patch = code.len() - 1;
    dialog(&mut code, 0x2080, 0);
    code.extend_from_slice(&[0xeb, 0]);
    let end_patch = code.len() - 1;
    code[lose_patch] = u8::try_from(code.len() - lose_patch - 1).unwrap();
    dialog(&mut code, 0x20e0, 0);
    code[end_patch] = u8::try_from(code.len() - end_patch - 1).unwrap();
    code.extend_from_slice(&[0x48, 0x83, 0xc4, 0x28, 0x31, 0xc0, 0xc3]);
    bytes[0x400..0x400 + code.len()].copy_from_slice(&code);
    bytes
}
