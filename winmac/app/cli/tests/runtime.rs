use std::{
    fs,
    path::PathBuf,
    process::Command,
    sync::atomic::{AtomicUsize, Ordering},
};
#[path = "../../../crates/runtime/examples/support/demo.rs"]
mod demo;
static NEXT: AtomicUsize = AtomicUsize::new(0);
struct Input(PathBuf);
impl Input {
    fn new(bytes: &[u8]) -> Self {
        let path = std::env::temp_dir().join(format!(
            "winmac-runtime-{}-{}.exe",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
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
#[test]
fn run_console_and_rebase_from_cli() {
    let input = Input::new(&demo::minimal_console_pe());
    for extras in [vec![], vec!["--base", "0x150000000"]] {
        let out = Command::new(env!("CARGO_BIN_EXE_winmac-cli"))
            .arg("run")
            .arg(&input.0)
            .args(extras)
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "{}",
            String::from_utf8_lossy(&out.stderr)
        );
        assert_eq!(out.stdout, demo::MESSAGE);
        assert!(String::from_utf8(out.stderr)
            .unwrap()
            .contains("guest exited with code 0 (11 instructions, 3 API calls)"));
    }
}
#[test]
fn inspection_includes_relocation_summary() {
    let input = Input::new(&demo::minimal_console_pe());
    let out = Command::new(env!("CARGO_BIN_EXE_winmac-cli"))
        .arg("inspect")
        .arg(&input.0)
        .output()
        .unwrap();
    assert!(out.status.success());
    assert!(String::from_utf8(out.stdout)
        .unwrap()
        .contains("Relocations: 1 blocks, 2 entries"));
}
#[test]
fn nonzero_guest_exit_and_budget_failure_are_visible() {
    let mut bytes = demo::minimal_console_pe();
    bytes[0x400..0x406].copy_from_slice(&[0xb8, 42, 0, 0, 0, 0xc3]);
    let input = Input::new(&bytes);
    let out = Command::new(env!("CARGO_BIN_EXE_winmac-cli"))
        .arg("run")
        .arg(&input.0)
        .output()
        .unwrap();
    assert_eq!(out.status.code(), Some(42));
    let out = Command::new(env!("CARGO_BIN_EXE_winmac-cli"))
        .arg("run")
        .arg(&input.0)
        .args(["--max-instructions", "1"])
        .output()
        .unwrap();
    assert!(!out.status.success());
    assert!(String::from_utf8(out.stderr)
        .unwrap()
        .contains("Instruction budget exhausted"));
}
#[test]
fn invalid_arguments_and_help() {
    for args in [
        vec![],
        vec!["run"],
        vec!["inspect"],
        vec!["--bad"],
        vec!["run", "missing", "--base", "bad"],
        vec!["run", "missing", "--unknown", "1"],
    ] {
        assert!(!Command::new(env!("CARGO_BIN_EXE_winmac-cli"))
            .args(args)
            .output()
            .unwrap()
            .status
            .success());
    }
    assert!(Command::new(env!("CARGO_BIN_EXE_winmac-cli"))
        .arg("--help")
        .output()
        .unwrap()
        .status
        .success());
}
