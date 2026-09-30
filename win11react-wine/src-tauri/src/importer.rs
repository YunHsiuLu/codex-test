//! Import boundary: ZIP extraction and candidate scanning can feed this validator later.
use serde::Serialize;
use std::{fs::File, io::{Read, Seek, SeekFrom}, path::{Path, PathBuf}};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GameCandidate {
    pub name: String,
    pub path: PathBuf,
    pub architecture: String,
}

pub fn inspect_exe(path: &Path) -> Result<GameCandidate, String> {
    let path = path.canonicalize().map_err(|e| format!("找不到 EXE：{e}"))?;
    if !path.is_file() || !path.extension().is_some_and(|x| x.eq_ignore_ascii_case("exe")) {
        return Err("請選擇一般的 Windows .exe 檔案。".into());
    }
    let mut file = File::open(&path).map_err(|e| format!("無法讀取 EXE：{e}"))?;
    let mut dos = [0u8; 64];
    file.read_exact(&mut dos).map_err(|_| "EXE 太短，沒有有效的 Windows 標頭。")?;
    if &dos[..2] != b"MZ" { return Err("這不是有效的 Windows EXE（缺少 MZ 標頭）。".into()); }
    let offset = u32::from_le_bytes(dos[60..64].try_into().unwrap()) as u64;
    file.seek(SeekFrom::Start(offset)).map_err(|e| e.to_string())?;
    let mut pe = [0u8; 24];
    file.read_exact(&mut pe).map_err(|_| "找不到 PE 標頭；此原型不支援 DOS／16 位元 EXE。")?;
    if &pe[..4] != b"PE\0\0" { return Err("不是 Windows PE 執行檔；此原型不支援 DOS／16 位元 EXE。".into()); }
    let flags = u16::from_le_bytes([pe[22], pe[23]]);
    if flags & 0x2000 != 0 || flags & 0x0002 == 0 { return Err("此 PE 檔案不是可執行程式，或實際上是 DLL。".into()); }
    let architecture = match u16::from_le_bytes([pe[4], pe[5]]) {
        0x14c => "x86（32 位元）",
        0x8664 => "x64（64 位元）",
        _ => return Err("此原型只接受 Windows x86／x64 EXE。".into()),
    };
    Ok(GameCandidate { name: path.file_name().unwrap().to_string_lossy().into(), path, architecture: architecture.into() })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rejects_fake_exe_and_directories() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("fake.exe");
        std::fs::write(&path, b"not an executable").unwrap();
        assert!(inspect_exe(&path).is_err());
        assert!(inspect_exe(dir.path()).is_err());
    }
    #[test]
    fn reads_pe_and_rejects_dll() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("遊戲 with spaces.EXE");
        let mut bytes = vec![0u8; 88];
        bytes[..2].copy_from_slice(b"MZ"); bytes[60] = 64;
        bytes[64..68].copy_from_slice(b"PE\0\0");
        bytes[68..70].copy_from_slice(&0x8664u16.to_le_bytes()); bytes[86] = 2;
        std::fs::write(&path, &bytes).unwrap();
        assert_eq!(inspect_exe(&path).unwrap().architecture, "x64（64 位元）");
        bytes[87] = 0x20;
        std::fs::write(&path, bytes).unwrap();
        assert!(inspect_exe(&path).is_err());
    }
}
