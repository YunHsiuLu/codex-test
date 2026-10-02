#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod importer;
mod runtime;
mod library;
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
    message: String, prefix: PathBuf, output: String,
}
struct Run { status: RunStatus, tail: OutputTail }
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
async fn launch_exe(app: tauri::AppHandle, state: State<'_, Launcher>, wine_path: Option<String>) -> Result<RunStatus, String> {
    let launcher = state.inner().clone();
    let data = match std::env::var_os("WIN11_DATA_DIR") {
        Some(path) => PathBuf::from(path), None => app.path().app_data_dir().map_err(|e| e.to_string())?,
    };
    tauri::async_runtime::spawn_blocking(move || {
        // Reserve the single launch slot while probing and spawning; repeated clicks cannot race.
        let mut slot = launcher.run.lock().map_err(|e| e.to_string())?;
        if slot.as_ref().is_some_and(|r| r.status.phase == "running") { return Err("目前已有 Wine 程序執行中，請先關閉遊戲。".into()); }
        let game = launcher.selected.lock().map_err(|e| e.to_string())?.clone().ok_or("請先選擇 EXE。")?;
        let game = importer::inspect_exe(&game.path)?;
        let wine = runtime::discover(wine_path)?;
        let prefix = runtime::prefix_for(&data, &game.path);
        let tail = runtime::new_tail();
        let id = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_nanos().to_string();
        let mut child = runtime::spawn_game(&wine.path, &game.path, &prefix, &tail)?;
        let status = RunStatus { id: id.clone(), phase: "running".into(), pid: child.id(), exit_code: None,
            message: "已交由 Wine 在 Mac 開啟獨立遊戲視窗；首次啟動需要初始化。".into(), prefix, output: String::new() };
        *slot = Some(Run { status: status.clone(), tail });
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
async fn library_pick_zip(app:tauri::AppHandle,state:State<'_,Launcher>)->Result<Option<String>,String> {
    let root=state.root.lock().map_err(|e|e.to_string())?.clone().ok_or("請先選擇遊戲庫資料夾。")?;
    tauri::async_runtime::spawn_blocking(move || {
        let file=app.dialog().file().set_title("匯入下載好的遊戲 ZIP").add_filter("ZIP archive", &["zip", "ZIP"]).blocking_pick_file();
        let Some(file)=file else{return Ok(None);};
        let path=file.into_path().map_err(|e|e.to_string())?;
        library::import_from_path(&root,&path).map(Some)
    }).await.map_err(|e|e.to_string())?
}
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(Launcher { root: Arc::new(Mutex::new(library::detect_root())), ..Default::default() })
        .invoke_handler(tauri::generate_handler![select_exe, check_wine, launch_exe, get_run_status, library_list, library_import, library_select, library_choose_folder, library_pick_zip])
        .run(tauri::generate_context!())
        .expect("Unable to start Win11React Wine");
}
