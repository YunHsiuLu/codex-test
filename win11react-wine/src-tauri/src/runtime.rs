//! Wine adapter: argument-based spawning, bounded output, version timeout, isolated prefixes.
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{collections::VecDeque, env, io::Read, path::{Path, PathBuf}, process::{Child, Command, Stdio}, sync::{Arc, Mutex}, thread, time::{Duration, Instant}};

pub type OutputTail = Arc<Mutex<VecDeque<u8>>>;
const OUTPUT_LIMIT: usize = 32 * 1024;
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WineInfo { pub path: PathBuf, pub version: String }

pub fn new_tail() -> OutputTail { Arc::new(Mutex::new(VecDeque::new())) }
pub fn tail_text(tail: &OutputTail) -> String {
    let bytes: Vec<u8> = tail.lock().unwrap().iter().copied().collect();
    String::from_utf8_lossy(&bytes).into_owned()
}
fn drain(mut stream: impl Read + Send + 'static, tail: OutputTail) -> thread::JoinHandle<()> {
    thread::spawn(move || {
        let mut buffer = [0u8; 4096];
        while let Ok(n) = stream.read(&mut buffer) {
            if n == 0 { break; }
            let mut out = tail.lock().unwrap();
            out.extend(&buffer[..n]);
            while out.len() > OUTPUT_LIMIT { out.pop_front(); }
        }
    })
}
pub fn capture(child: &mut Child, tail: &OutputTail) {
    if let Some(stdout) = child.stdout.take() { drain(stdout, tail.clone()); }
    if let Some(stderr) = child.stderr.take() { drain(stderr, tail.clone()); }
}

pub fn probe(path: &Path, timeout: Duration) -> Result<WineInfo, String> {
    let path = path.canonicalize().map_err(|e| format!("Wine 路徑無法使用（{}）：{e}", path.display()))?;
    let mut child = Command::new(&path).arg("--version").stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::piped()).spawn()
        .map_err(|e| format!("無法執行 Wine（{}）：{e}。請檢查執行權限、macOS 封鎖或 Rosetta。", path.display()))?;
    let tail = new_tail(); capture(&mut child, &tail);
    let start = Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                // Reader threads only drain bounded chunks; give final pipe data a chance to arrive.
                thread::sleep(Duration::from_millis(30));
                let output = tail_text(&tail);
                if !status.success() { return Err(format!("Wine 檢查失敗（{status}）：{output}")); }
                if !output.to_lowercase().contains("wine") { return Err(format!("指定程式沒有回報 Wine 版本：{output}")); }
                return Ok(WineInfo { path, version: output.trim().into() });
            }
            Ok(None) if start.elapsed() < timeout => thread::sleep(Duration::from_millis(50)),
            Ok(None) => { let _ = child.kill(); let _ = child.wait(); return Err("Wine 版本檢查逾時（５秒）；請先在終端機確認 wine --version 可正常執行。".into()); }
            Err(e) => { let _ = child.kill(); let _ = child.wait(); return Err(format!("Wine 檢查失敗：{e}")); }
        }
    }
}

pub fn discover(override_path: Option<String>) -> Result<WineInfo, String> {
    let explicit = override_path.filter(|s| !s.trim().is_empty()).or_else(|| env::var("WIN11_WINE").ok());
    if let Some(path) = explicit { return probe(Path::new(path.trim()), Duration::from_secs(5)); }
    let mut candidates = Vec::new();
    if let Some(paths) = env::var_os("PATH") {
        for dir in env::split_paths(&paths) { candidates.extend([dir.join("wine"), dir.join("wine64")]); }
    }
    for dir in ["/opt/homebrew/bin", "/usr/local/bin", "/Applications/Wine Stable.app/Contents/Resources/wine/bin", "/Applications/Wine Devel.app/Contents/Resources/wine/bin", "/Applications/Wine Staging.app/Contents/Resources/wine/bin"] {
        candidates.extend([Path::new(dir).join("wine"), Path::new(dir).join("wine64")]);
    }
    let mut errors = Vec::new();
    let mut visited = std::collections::HashSet::new();
    for candidate in candidates {
        if !candidate.is_file() { continue; }
        let canonical = candidate.canonicalize().unwrap_or(candidate.clone());
        if !visited.insert(canonical) { continue; }
        match probe(&candidate, Duration::from_secs(5)) { Ok(info) => return Ok(info), Err(e) => errors.push(e) }
    }
    if errors.is_empty() { Err("找不到 Wine。請先安裝相容的 macOS Wine 與 Rosetta，或在下方填入 wine 執行檔的完整路徑。".into()) }
    else { Err(errors.join("\n")) }
}

pub fn prefix_for(data: &Path, exe: &Path) -> PathBuf {
    let hash = Sha256::digest(exe.as_os_str().as_encoded_bytes());
    data.join("prefixes").join(format!("{:x}", hash))
}
pub fn spawn_game(wine: &Path, exe: &Path, prefix: &Path, tail: &OutputTail) -> Result<Child, String> {
    std::fs::create_dir_all(prefix).map_err(|e| format!("無法建立 Wine 環境：{e}"))?;
    let mut child = Command::new(wine).arg(exe)
        .current_dir(exe.parent().ok_or("EXE 沒有所在資料夾。")?)
        .env("WINEPREFIX", prefix).env("WINEDEBUG", "-all,err+all,warn+module")
        .stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::piped())
        .spawn().map_err(|e| format!("Wine 啟動失敗：{e}"))?;
    capture(&mut child, tail);
    Ok(child)
}

#[cfg(all(test, unix))]
mod tests {
    use super::*;
    use std::os::unix::fs::PermissionsExt;
    fn script(dir: &Path, body: &str) -> PathBuf {
        let p = dir.join("wine-test"); std::fs::write(&p, format!("#!/bin/sh\n{body}\n")).unwrap();
        std::fs::set_permissions(&p, std::fs::Permissions::from_mode(0o755)).unwrap(); p
    }
    #[test]
    fn version_failure_and_timeout_are_errors() {
        let d = tempfile::tempdir().unwrap();
        let p = script(d.path(), "echo wine-test; exit 0");
        assert!(probe(&p, Duration::from_secs(1)).is_ok());
        script(d.path(), "echo missing-library >&2; exit 5");
        assert!(probe(&p, Duration::from_secs(1)).unwrap_err().contains("missing-library"));
        script(d.path(), "exec sleep 10");
        assert!(probe(&p, Duration::from_millis(100)).is_err());
    }
    #[test]
    fn arguments_cwd_prefix_and_failure_survive_spaces_and_metacharacters() {
        let d = tempfile::tempdir().unwrap();
        let exe = d.path().join("遊戲 ; $(touch INJECTED).exe"); std::fs::write(&exe, b"fixture").unwrap();
        let p = script(d.path(), "printf '%s\\n' \"$1\" \"$PWD\" \"$WINEPREFIX\"; echo test-error >&2; exit 7");
        let prefix = prefix_for(d.path(), &exe); let tail = new_tail();
        let mut child = spawn_game(&p, &exe, &prefix, &tail).unwrap();
        assert_eq!(child.wait().unwrap().code(), Some(7)); thread::sleep(Duration::from_millis(100));
        let output = tail_text(&tail);
        assert!(output.contains(exe.to_str().unwrap())); assert!(output.contains(prefix.to_str().unwrap()));
        assert!(output.contains("test-error")); assert!(!d.path().join("INJECTED").exists());
    }
    #[test]
    fn output_tail_is_bounded() {
        let tail = new_tail(); let handle = drain(std::io::Cursor::new(vec![b'a'; 100_000]), tail.clone());
        handle.join().unwrap(); assert_eq!(tail_text(&tail).len(), OUTPUT_LIMIT);
    }
}
