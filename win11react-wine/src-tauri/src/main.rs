#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod importer;
mod runtime;
mod library;
use std::io::Write;
use std::process::{ChildStdin,Command,Stdio};
use importer::GameCandidate;
use runtime::{OutputTail, WineInfo};
use serde::Serialize;
use std::{path::PathBuf, sync::{Arc, Mutex}, time::{SystemTime, UNIX_EPOCH}};
use tauri::{Manager, State};
use tauri_plugin_dialog::DialogExt;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct RunStatus {
    id: String, phase: String, pid: u32, exit_code: Option<i32>,
    message: String, prefix: PathBuf, output: String, embedded: bool,
}
struct Run { status: RunStatus, tail: OutputTail, input: Option<ChildStdin>, frame: PathBuf }
#[derive(Default, Clone)]
struct Launcher { selected: Arc<Mutex<Option<GameCandidate>>>, run: Arc<Mutex<Option<Run>>>, root: Arc<Mutex<Option<PathBuf>>> }

#[tauri::command]
async fn select_exe(app: tauri::AppHandle, state: State<'_, Launcher>) -> Result<Option<GameCandidate>, String> {
    let selected = state.selected.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let file = app.dialog().file().set_title("選擇 Windows 遊戲 EXE").add_filter("Windows executable", &["exe", "EXE"]).blocking_pick_file();
        let Some(file) = file else { return Ok(None); };
        let path = file.into_path().map_err(|e| e.to_string())?;
        let game = importer::inspect_exe(&path)?;
        *selected.lock().map_err(|e| e.to_string())? = Some(game.clone());
        Ok(Some(game))
    }).await.map_err(|e| e.to_string())?
}
#[tauri::command]
async fn check_wine(wine_path: Option<String>) -> Result<WineInfo, String> {
    tauri::async_runtime::spawn_blocking(move || runtime::discover(wine_path)).await.map_err(|e| e.to_string())?
}
#[tauri::command]
async fn get_run_status(state: State<'_, Launcher>) -> Result<Option<RunStatus>, String> {
    let shared = state.run.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let run = shared.lock().map_err(|e| e.to_string())?;
        Ok(run.as_ref().map(|r| { let mut s = r.status.clone(); s.output = runtime::tail_text(&r.tail); s }))
    }).await.map_err(|e| e.to_string())?
}
#[tauri::command]
async fn launch_exe(app: tauri::AppHandle, state: State<'_, Launcher>, wine_path: Option<String>, embedded: Option<bool>) -> Result<RunStatus, String> {
    let launcher = state.inner().clone();
    let data = match std::env::var_os("WIN11_DATA_DIR") {
        Some(path) => PathBuf::from(path), None => app.path().app_data_dir().map_err(|e| e.to_string())?,
    };
    let embedded = embedded.unwrap_or(true);
    let host = app.path().resource_dir().map_err(|e|e.to_string())?.join("resources/wine-host.exe");
    let host = if host.is_file() { host } else { PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("resources/wine-host.exe") };
    tauri::async_runtime::spawn_blocking(move || {
        // Reserve the single launch slot while probing and spawning; repeated clicks cannot race.
        let mut slot = launcher.run.lock().map_err(|e| e.to_string())?;
        if slot.as_ref().is_some_and(|r| r.status.phase == "running") { return Err("目前已有 Wine 程序執行中，請先關閉遊戲。".into()); }
        let game = launcher.selected.lock().map_err(|e| e.to_string())?.clone().ok_or("請先選擇 EXE。")?;
        let game = importer::inspect_exe(&game.path)?;
        if embedded && !game.architecture.starts_with("x64") {return Err("目前內嵌顯示支援 x64，x86 請取消內嵌選項後啟動。".into());}
        let wine = runtime::discover(wine_path)?;
        let prefix = runtime::prefix_for(&data, &game.path);
        let tail = runtime::new_tail();
        let id = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_nanos().to_string();
        let frame = data.join("frames").join(&id).join("frame.bmp");
        let mut child = if embedded {
            if !host.is_file() {return Err("內嵌顯示元件不存在，請重新建置 App。".into());}
            std::fs::create_dir_all(frame.parent().unwrap()).map_err(|e|e.to_string())?;
            std::fs::create_dir_all(&prefix).map_err(|e|e.to_string())?;
            let win = |p:&std::path::Path| format!("Z:{}",p.to_string_lossy().replace('/',"\\"));
            let mut child=Command::new(&wine.path).arg(&host).arg(win(&game.path)).arg(win(&frame)).arg(win(&host.with_file_name("wine-display.dll")))
                .current_dir(game.path.parent().unwrap()).env("WINEPREFIX",&prefix)
                .env("WINEDEBUG","-all,err+all,warn+module").env("MVK_CONFIG_LOG_LEVEL","0")
                .stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped()).spawn().map_err(|e|e.to_string())?;
            runtime::capture(&mut child,&tail);child
        } else {runtime::spawn_game(&wine.path,&game.path,&prefix,&tail)?};
        let input=child.stdin.take();
        let status = RunStatus { id: id.clone(), phase: "running".into(), pid: child.id(), exit_code: None,
            message: "已啟動，正在等待遊戲畫面；首次啟動需要初始化。".into(), prefix, output: String::new(), embedded };
        *slot = Some(Run { status: status.clone(), tail, input, frame });
        drop(slot);
        let run = launcher.run.clone();
        std::thread::spawn(move || {
            let result = child.wait();
            if let Ok(mut slot) = run.lock() {
                if let Some(current) = slot.as_mut().filter(|r| r.status.id == id) {
                    match result {
                        Ok(exit) => {
                            current.status.exit_code = exit.code();
                            current.status.phase = if exit.success() { "exited" } else { "failed" }.into();
                            current.status.message = if exit.success() { "Wine 程序已正常結束；退出碼不代表遊戲相容性已通過驗證。".into() }
                                else { format!("Wine 程序執行失敗（{exit}）。請查看下方輸出。") };
                        }
                        Err(error) => { current.status.phase = "failed".into(); current.status.message = format!("無法取得 Wine 結果：{error}"); }
                    }
                }
            }
        });
        Ok(status)
    }).await.map_err(|e| e.to_string())?
}
#[tauri::command]
async fn library_list(state:State<'_,Launcher>)->Result<library::Catalog,String> {
    let root=state.root.lock().map_err(|e|e.to_string())?.clone();
    tauri::async_runtime::spawn_blocking(move ||library::list(root.as_deref())).await.map_err(|e|e.to_string())?
}
#[tauri::command]
async fn library_import(state:State<'_,Launcher>, name:String)->Result<String,String> {
    let root=state.root.lock().map_err(|e|e.to_string())?.clone().ok_or("請先選擇遊戲資料夾。")?;
    tauri::async_runtime::spawn_blocking(move ||library::import(&root,&name)).await.map_err(|e|e.to_string())?
}
#[tauri::command]
async fn library_select(state:State<'_,Launcher>, id:String, relative_path:String)->Result<GameCandidate,String> {
    let root=state.root.lock().map_err(|e|e.to_string())?.clone().ok_or("請先選擇遊戲資料夾。")?;
    let selected=state.selected.clone();
    tauri::async_runtime::spawn_blocking(move || {let game=library::resolve(&root,&id,&relative_path)?;*selected.lock().map_err(|e|e.to_string())?=Some(game.clone());Ok(game)}).await.map_err(|e|e.to_string())?
}
#[tauri::command]
async fn library_choose_folder(app:tauri::AppHandle,state:State<'_,Launcher>)->Result<(),String> {
    let root=state.root.clone();
    tauri::async_runtime::spawn_blocking(move || {
        if let Some(folder)=app.dialog().file().set_title("選擇 win11react-wine 或遊戲資料夾").blocking_pick_folder(){
            let p=folder.into_path().map_err(|e|e.to_string())?.canonicalize().map_err(|e|e.to_string())?;
            *root.lock().map_err(|e|e.to_string())?=Some(p);
        } Ok(())
    }).await.map_err(|e|e.to_string())?
}
#[tauri::command]
async fn game_frame(state:State<'_,Launcher>,id:String)->Result<tauri::ipc::Response,String> {
    let frame=state.run.lock().map_err(|e|e.to_string())?.as_ref().filter(|r|r.status.id==id).map(|r|r.frame.clone()).ok_or("執行已變更。")?;
    tauri::async_runtime::spawn_blocking(move || {
        match std::fs::read(frame) {Ok(bytes) if bytes.len()<=1920*1080*4+54=>Ok(tauri::ipc::Response::new(bytes)),Ok(_)=>Err("畫面尺寸超過上限。".into()),Err(e) if e.kind()==std::io::ErrorKind::NotFound=>Ok(tauri::ipc::Response::new(Vec::<u8>::new())),Err(e)=>Err(e.to_string())}
    }).await.map_err(|e|e.to_string())?
}
#[tauri::command]
fn game_input(state:State<'_,Launcher>,id:String,kind:String,a:i32,b:i32,c:i32)->Result<(),String> {
    if !["d","u","m","k","c","q"].contains(&kind.as_str())|| !(0..=65535).contains(&a)|| !(0..=65535).contains(&b)|| !(0..=2).contains(&c) {return Err("輸入格式無效。".into());}
    let mut slot=state.run.lock().map_err(|e|e.to_string())?;
    let run=slot.as_mut().filter(|r|r.status.id==id&&r.status.phase=="running").ok_or("遊戲已結束。")?;
    let input=run.input.as_mut().ok_or("此遊戲使用獨立視窗。")?;
    writeln!(input,"{kind} {a} {b} {c}").map_err(|e|e.to_string())
}
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(Launcher { root: Arc::new(Mutex::new(library::detect_root())), ..Default::default() })
        .invoke_handler(tauri::generate_handler![select_exe, check_wine, launch_exe, get_run_status, library_list, library_import, library_select, library_choose_folder, game_frame, game_input])
        .run(tauri::generate_context!())
        .expect("Unable to start Win11React Wine");
}
