//! Project-folder inbox and content-addressed ZIP imports. Never executes during discovery.
use crate::importer;
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{collections::HashSet, fs, io::{Read, Write}, path::{Component, Path, PathBuf}};
const MAX_ARCHIVE: u64 = 2 * 1024 * 1024 * 1024;
const MAX_EXPANDED: u64 = 4 * 1024 * 1024 * 1024;
#[derive(Serialize)]
#[serde(rename_all="camelCase")]
pub struct Entry { pub id: String, pub name: String, pub kind: String, pub candidates: Vec<Candidate> }
#[derive(Serialize)]
#[serde(rename_all="camelCase")]
pub struct Candidate { pub name: String, pub relative_path: String, pub architecture: String }
#[derive(Serialize)]
pub struct Catalog { pub root: Option<PathBuf>, pub entries: Vec<Entry> }
pub fn detect_root() -> Option<PathBuf> {
    if let Some(p)=std::env::var_os("WIN11_LIBRARY_DIR") { return fs::canonicalize(p).ok(); }
    if let Ok(exe)=std::env::current_exe() { for p in exe.ancestors() { if p.join("package.json").is_file() && p.join("src-tauri").is_dir() { return Some(p.to_owned()); } } }
    let p=Path::new(env!("CARGO_MANIFEST_DIR")).parent()?;
    if p.join("package.json").is_file() { fs::canonicalize(p).ok() } else { None }
}
fn single_name(name:&str)->Result<(),String> {
    if name.is_empty() || name.contains(['/', '\\', ':']) || name=="." || name==".." { return Err("檔名無效。".into()); } Ok(())
}
fn fingerprint(meta:&fs::Metadata)->String {
    format!("{}:{}",meta.len(),meta.modified().ok().and_then(|t|t.duration_since(std::time::UNIX_EPOCH).ok()).map(|t|t.as_nanos()).unwrap_or_default())
}
fn imported(root:&Path)->PathBuf { root.join(".local-data/library") }
fn candidates(dir:&Path)->Result<Vec<Candidate>,String> {
    fn visit(root:&Path,p:&Path,out:&mut Vec<Candidate>,depth:usize)->Result<(),String> {
        if depth>64 { return Err("資料夾層數過多。".into()); }
        for item in fs::read_dir(p).map_err(|e|e.to_string())? {
            let item=item.map_err(|e|e.to_string())?;let ty=item.file_type().map_err(|e|e.to_string())?;let path=item.path();
            if ty.is_dir(){ visit(root,&path,out,depth+1)?; }
            else if ty.is_file() && path.extension().is_some_and(|e|e.eq_ignore_ascii_case("exe")) {
                if let Ok(game)=importer::inspect_exe(&path) { out.push(Candidate{name:game.name,relative_path:path.strip_prefix(root).unwrap().to_string_lossy().into(),architecture:game.architecture}); }
            }
        } Ok(())
    }
    let mut out=vec![];visit(dir,dir,&mut out,0)?;out.sort_by(|a,b|a.relative_path.cmp(&b.relative_path));Ok(out)
}
pub fn list(root:Option<&Path>)->Result<Catalog,String> {
    let Some(root)=root else{return Ok(Catalog{root:None,entries:vec![]});};
    let mut entries=vec![];let mut already_imported=HashSet::new();
    for file in fs::read_dir(root).map_err(|e|format!("無法讀取遊戲資料夾：{e}"))? {
        let file=file.map_err(|e|e.to_string())?; if !file.file_type().map_err(|e|e.to_string())?.is_file(){continue;}
        let p=file.path();let name=file.file_name().to_string_lossy().into_owned();
        if p.extension().is_some_and(|e|e.eq_ignore_ascii_case("zip")) { entries.push(Entry{id:format!("zip:{name}"),name,kind:"zip".into(),candidates:vec![]}); }
        else if p.extension().is_some_and(|e|e.eq_ignore_ascii_case("exe")) {
            if let Ok(g)=importer::inspect_exe(&p) { entries.push(Entry{id:format!("exe:{name}"),name:name.clone(),kind:"exe".into(),candidates:vec![Candidate{name:g.name,relative_path:name,architecture:g.architecture}]}); }
        }
    }
    if imported(root).is_dir(){for dir in fs::read_dir(imported(root)).map_err(|e|e.to_string())? {
        let dir=dir.map_err(|e|e.to_string())?;let id=dir.file_name().to_string_lossy().into_owned();
        if id.len()!=64 || !id.bytes().all(|c|c.is_ascii_hexdigit()) || !dir.file_type().map_err(|e|e.to_string())?.is_dir(){continue;}
        if let Ok(name)=fs::read_to_string(dir.path().join("source.txt")) {if let (Ok(saved),Ok(meta))=(fs::read_to_string(dir.path().join("fingerprint.txt")),fs::metadata(root.join(&name))){if saved==fingerprint(&meta){already_imported.insert(name.clone());}}entries.push(Entry{id:format!("game:{id}"),name,kind:"game".into(),candidates:candidates(&dir.path().join("files"))?});}
    }}
    entries.retain(|e|e.kind!="zip" || !already_imported.contains(&e.name));
    entries.sort_by(|a,b|a.name.cmp(&b.name).then(a.kind.cmp(&b.kind)));Ok(Catalog{root:Some(root.to_owned()),entries})
}
fn safe_relative(name:&str)->Result<PathBuf,String> {
    // Windows separators, drive names, ADS, NUL, and case-folded duplicate paths are rejected.
    if name.contains(['\\',':','\0']) {return Err(format!("ZIP 含不安全路徑：{name}"));}
    let p=Path::new(name);
    if !p.components().all(|c|matches!(c,Component::Normal(_))) || p.as_os_str().is_empty() || name.split('/').any(|s|s==".."||s==".") {return Err(format!("ZIP 含不安全路徑：{name}"));}
    if p.components().count()>64 {return Err("ZIP 目錄過深。".into());}Ok(p.to_owned())
}
fn extract(file:fs::File,dest:&Path)->Result<(),String> {
    let mut zip=zip::ZipArchive::new(file).map_err(|e|format!("ZIP 無法讀取：{e}"))?;
    if zip.len()>20_000 {return Err("ZIP 檔案數超過 20,000。".into());}
    let mut remaining=MAX_EXPANDED;let mut seen=HashSet::new();
    for i in 0..zip.len() {
        let mut entry=zip.by_index(i).map_err(|e|format!("ZIP 項目無法讀取（不支援加密 ZIP）：{e}"))?;
        let relative=safe_relative(entry.name())?;
        let key=relative.to_string_lossy().to_lowercase();if !seen.insert(key) {return Err("ZIP 含重複或大小寫衝突的路徑。".into());}
        let mode=entry.unix_mode().unwrap_or(0)&0o170000;
        if mode!=0 && mode!=0o100000 && mode!=0o040000 {return Err("ZIP 含連結或特殊檔案，已停止匯入。".into());}
        let path=dest.join(relative);
        if entry.is_dir(){fs::create_dir_all(&path).map_err(|e|e.to_string())?;continue;}
        if entry.size()>remaining {return Err("ZIP 解壓大小超過 4 GiB。".into());}
        fs::create_dir_all(path.parent().unwrap()).map_err(|e|e.to_string())?;
        let mut out=fs::OpenOptions::new().write(true).create_new(true).open(path).map_err(|e|e.to_string())?;
        let mut buffer=[0;65536]; loop {let n=entry.read(&mut buffer).map_err(|e|format!("ZIP 解壓失敗：{e}"))?;if n==0{break;}
            if n as u64>remaining{return Err("ZIP 實際解壓大小超過 4 GiB。".into());}remaining-=n as u64;out.write_all(&buffer[..n]).map_err(|e|e.to_string())?;
        }
    } Ok(())
}
pub fn import(root:&Path,name:&str)->Result<String,String> {
    single_name(name)?;let path=root.join(name);
    if !path.extension().is_some_and(|e|e.eq_ignore_ascii_case("zip")){return Err("請選擇 ZIP。".into());}
    let meta=fs::symlink_metadata(&path).map_err(|e|e.to_string())?;
    if !meta.is_file()||meta.len()>MAX_ARCHIVE{return Err("ZIP 必須是一般檔案且不超過 2 GiB。".into());}
    let parent=imported(root);fs::create_dir_all(&parent).map_err(|e|e.to_string())?;
    let temp=tempfile::tempdir_in(&parent).map_err(|e|e.to_string())?;
    // Copy once, then hash/extract the snapshot. A changing source never mixes archive versions.
    let archive=temp.path().join("archive.zip");let mut source=fs::File::open(&path).map_err(|e|e.to_string())?.take(MAX_ARCHIVE+1);
    let n=std::io::copy(&mut source,&mut fs::File::create(&archive).map_err(|e|e.to_string())?).map_err(|e|e.to_string())?;
    let after=fs::metadata(&path).map_err(|e|e.to_string())?;
    if n>MAX_ARCHIVE || meta.len()!=n || after.len()!=n || meta.modified().ok()!=after.modified().ok(){return Err("ZIP 仍在複製或已變更，請稍後重新匯入。".into());}
    let mut hash=Sha256::new();let mut file=fs::File::open(&archive).map_err(|e|e.to_string())?;let mut buf=[0;65536];loop{let n=file.read(&mut buf).map_err(|e|e.to_string())?;if n==0{break;}hash.update(&buf[..n]);}
    let id=format!("{:x}",hash.finalize());let final_dir=parent.join(&id);
    if final_dir.join("source.txt").is_file(){fs::write(final_dir.join("fingerprint.txt"),fingerprint(&meta)).map_err(|e|e.to_string())?;return Ok(format!("game:{id}"));}
    let files=temp.path().join("files");fs::create_dir(&files).map_err(|e|e.to_string())?;
    extract(fs::File::open(&archive).map_err(|e|e.to_string())?,&files)?;
    if candidates(&files)?.is_empty(){return Err("ZIP 中找不到有效的 Windows x86／x64 EXE。".into());}
    fs::remove_file(&archive).map_err(|e|e.to_string())?;fs::write(temp.path().join("source.txt"),name).map_err(|e|e.to_string())?;
    fs::write(temp.path().join("fingerprint.txt"),fingerprint(&meta)).map_err(|e|e.to_string())?;
    fs::rename(temp.path(),final_dir).map_err(|e|e.to_string())?;Ok(format!("game:{id}"))
}
pub fn resolve(root:&Path,id:&str,relative:&str)->Result<importer::GameCandidate,String> {
    let catalog=list(Some(root))?;let entry=catalog.entries.iter().find(|e|e.id==id).ok_or("遊戲已不存在，請重新整理。")?;
    if !entry.candidates.iter().any(|c|c.relative_path==relative){return Err("EXE 不在遊戲候選清單內。".into());}
    let base=if let Some(hash)=id.strip_prefix("game:"){imported(root).join(hash).join("files")}else{root.to_owned()};
    let path=base.join(relative).canonicalize().map_err(|e|e.to_string())?;
    if !path.starts_with(base.canonicalize().map_err(|e|e.to_string())?){return Err("EXE 已移出遊戲資料夾。".into());}importer::inspect_exe(&path)
}
#[cfg(test)] mod tests {
    use super::*;
    fn archive(path:&Path,entries:&[(&str,&[u8])]) {let mut z=zip::ZipWriter::new(fs::File::create(path).unwrap());for(n,b)in entries{z.start_file(*n,zip::write::SimpleFileOptions::default().compression_method(zip::CompressionMethod::Stored)).unwrap();z.write_all(b).unwrap();}z.finish().unwrap();}
    #[test] fn rejects_traversal_and_no_partial_import(){let d=tempfile::tempdir().unwrap();archive(&d.path().join("bad.zip"),&[("../escaped.exe",b"bad")]);assert!(import(d.path(),"bad.zip").is_err());assert!(!d.path().join("escaped.exe").exists());assert_eq!(fs::read_dir(imported(d.path())).unwrap().count(),0);for p in ["C:/a","a\\b","/a","a/../b","a/./b"]{assert!(safe_relative(p).is_err());}}
    #[test] fn rejects_case_collisions(){let d=tempfile::tempdir().unwrap();let p=d.path().join("bad.zip");archive(&p,&[("A.exe",b"x"),("a.exe",b"y")]);assert!(extract(fs::File::open(p).unwrap(),d.path()).unwrap_err().contains("大小寫"));}
    #[test] fn inbox_discovers_without_execution(){let d=tempfile::tempdir().unwrap();assert!(list(Some(d.path())).unwrap().entries.is_empty());fs::write(d.path().join("New Game.ZIP"),b"copying").unwrap();assert_eq!(list(Some(d.path())).unwrap().entries[0].kind,"zip");assert!(import(d.path(),"New Game.ZIP").is_err());assert!(resolve(d.path(),"zip:New Game.ZIP","../x").is_err());}
    #[test] fn import_is_persistent_idempotent_and_preserves_sidecars(){
        let d=tempfile::tempdir().unwrap();let mut pe=vec![0;88];pe[..2].copy_from_slice(b"MZ");pe[60]=64;pe[64..68].copy_from_slice(b"PE\0\0");pe[68..70].copy_from_slice(&0x8664u16.to_le_bytes());pe[86]=2;
        archive(&d.path().join("Game.zip"),&[("folder/Game.exe",&pe),("folder/data.txt",b"assets")]);
        let id=import(d.path(),"Game.zip").unwrap();assert_eq!(import(d.path(),"Game.zip").unwrap(),id);
        let catalog=list(Some(d.path())).unwrap();assert_eq!(catalog.entries.len(),1);assert_eq!(catalog.entries[0].candidates.len(),1);
        let game=resolve(d.path(),&id,"folder/Game.exe").unwrap();assert_eq!(fs::read(game.path.parent().unwrap().join("data.txt")).unwrap(),b"assets");
        fs::write(game.path.parent().unwrap().join("save.txt"),b"keep").unwrap();import(d.path(),"Game.zip").unwrap();assert!(game.path.parent().unwrap().join("save.txt").is_file());
        fs::remove_file(d.path().join("Game.zip")).unwrap();assert_eq!(list(Some(d.path())).unwrap().entries.len(),1);
        assert!(resolve(d.path(),&id,"../../unlisted.exe").is_err());
    }

}
