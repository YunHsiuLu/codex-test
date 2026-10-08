use std::{
    fs,
    path::PathBuf,
    process::Command,
    sync::atomic::{AtomicUsize, Ordering},
};

static NEXT_FILE: AtomicUsize = AtomicUsize::new(0);
struct Input(PathBuf);
impl Input {
    fn new(bytes: &[u8]) -> Self {
        let path = std::env::temp_dir().join(format!(
            "winmac-imports-{}-{}.exe",
            std::process::id(),
            NEXT_FILE.fetch_add(1, Ordering::Relaxed)
        ));
        fs::write(&path, bytes).unwrap();
        Self(path)
    }
}
impl Drop for Input {
    fn drop(&mut self) {
        let _ = fs::remove_file(&self.0);
    }
}
fn put32(bytes: &mut [u8], offset: usize, value: u32) {
    bytes[offset..offset + 4].copy_from_slice(&value.to_le_bytes());
}
fn fixture() -> Vec<u8> {
    // A real PE32+ file with imports backed by headers, no platform DLLs needed.
    let mut bytes = vec![0; 0x400];
    bytes[..2].copy_from_slice(b"MZ");
    put32(&mut bytes, 0x3c, 0x80);
    bytes[0x80..0x84].copy_from_slice(b"PE\0\0");
    bytes[0x84..0x86].copy_from_slice(&0x8664u16.to_le_bytes());
    bytes[0x94..0x96].copy_from_slice(&128u16.to_le_bytes());
    bytes[0x98..0x9a].copy_from_slice(&0x20bu16.to_le_bytes());
    put32(&mut bytes, 0x98 + 32, 0x1000);
    put32(&mut bytes, 0x98 + 36, 0x200);
    put32(&mut bytes, 0x98 + 56, 0x1000);
    put32(&mut bytes, 0x98 + 60, 0x400);
    put32(&mut bytes, 0x98 + 108, 2);
    put32(&mut bytes, 0x98 + 120, 0x200);
    put32(&mut bytes, 0x98 + 124, 40);
    put32(&mut bytes, 0x200, 0x280);
    put32(&mut bytes, 0x20c, 0x240);
    put32(&mut bytes, 0x210, 0x2c0);
    bytes[0x240..0x24d].copy_from_slice(b"KERNEL32.dll\0");
    put32(&mut bytes, 0x280, 0x300);
    bytes[0x288..0x290].copy_from_slice(&((1u64 << 63) | 12).to_le_bytes());
    bytes[0x300..0x30e].copy_from_slice(b"\x7b\0ExitProcess\0");
    bytes
}
fn run(bytes: &[u8]) -> std::process::Output {
    let input = Input::new(bytes);
    Command::new(env!("CARGO_BIN_EXE_winmac-cli"))
        .arg(&input.0)
        .output()
        .unwrap()
}
#[test]
fn prints_imports_and_preserves_pe_output() {
    let output = run(&fixture());
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let stdout = String::from_utf8(output.stdout).unwrap();
    for expected in [
        "WinMac PE Inspector",
        "Architecture: x86-64",
        "Format: PE32+",
        "Sections (0):",
        "Imports:\n  KERNEL32.dll\n    ExitProcess (hint 123)\n    ordinal #12",
    ] {
        assert!(stdout.contains(expected), "missing {expected}: {stdout}");
    }
}
#[test]
fn prints_no_imports() {
    let mut bytes = fixture();
    put32(&mut bytes, 0x98 + 120, 0);
    let output = run(&bytes);
    assert!(output.status.success());
    assert!(String::from_utf8(output.stdout)
        .unwrap()
        .contains("Imports: none"));
}
#[test]
fn malformed_imports_fail_with_diagnostic() {
    let mut bytes = fixture();
    put32(&mut bytes, 0x98 + 124, 20);
    let output = run(&bytes);
    assert!(!output.status.success());
    assert!(String::from_utf8(output.stderr)
        .unwrap()
        .contains("descriptor terminator is missing"));
}
#[test]
fn escapes_control_characters_in_names() {
    let mut bytes = fixture();
    bytes[0x240] = 0x1b;
    bytes[0x302] = b'\n';
    let output = run(&bytes);
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(stdout.contains("\\u{1b}ERNEL32.dll"));
    assert!(stdout.contains("\\nxitProcess"));
    assert!(!stdout.contains('\x1b'));
}
