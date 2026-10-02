import { invoke, isTauri } from "@tauri-apps/api/core";
export const nativeAvailable = () => isTauri();
function call(command, args) {
  if (!nativeAvailable()) return Promise.reject(new Error("目前是網頁預覽。請執行 npm run app:dev 開啟 macOS 原生版，才能選取及啟動 EXE。"));
  return invoke(command, args);
}
// Import UI depends only on candidates, leaving room for importArchive/scanCandidates.
export const selectExe = () => call("select_exe");
export const checkWine = winePath => call("check_wine", { winePath: winePath.trim() || null });
export const launchExe = winePath => call("launch_exe", { winePath: winePath.trim() || null });
export const getRunStatus = () => call("get_run_status");
export const errorText = error => typeof error === "string" ? error : error?.message || String(error);
export const libraryList = () => call("library_list");
export const importZip = name => call("library_import", { name });
export const selectLibraryExe = (id, relativePath) => call("library_select", { id, relativePath });
export const chooseLibraryFolder = () => call("library_choose_folder");
export const pickZip = () => call("library_pick_zip");
