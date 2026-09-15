# 交接文件：3D Physics Classroom MVP

更新日期：２０２６－０９－１５

## 位置與範圍

專案：`/Users/lvyunxiu/codex test/physics-classroom-mvp`

依使用者目錄權限偏好，在 `~/codex test` 建立獨立子資料夾。未修改旁邊既有專案，未提交或推送 Git。專案位於 `codex test` 既有 Git repository 下，仍為未追蹤的新專案資料夾。

## 完成狀態

本機最小版本可運行。使用 Three.js、OrbitControls、Firebase Web SDK 的 app／database 模組；Hosting 與 Realtime Database 模擬器已實際執行。無 Firestore、Functions 或 Authentication。

- 老師新增、選取、修改起點／分量／名稱／顏色及刪除向量。
- 學生只讀介面與即時場景同步。
- 相機與 OrbitControls target 保持在各瀏覽器記憶體，完全不寫入資料庫。
- `database.rules.json` 限制合法教室代碼、５０個固定向量槽位、完整欄位、數值範圍與色碼；其他路徑拒絕。
- 新增向量使用 transaction 領取空槽；更新只寫單支向量。
- Firebase 設定範例、部署設定、正式設定檢查、完整 README 已建立。

## 實際測試結果

`npm test` 通過，包含正式建置、３項單元測試與１１２項 Database 模擬器 HTTP 請求驗證。

Chrome 實測：

- 老師新增向量，兩個學生分頁接收同一場景。
- 改名為「合力 F」、起點 X 改為 −２、分量改為（４，５，１），學生即時更新。
- 第一位學生旋轉相機後，與老師預設相機位置不同；旋轉阻尼停止後再修改向量，相機資料逐項保持一致。
- 第二位學生稍後加入，取得既有場景。
- `OTHER1` 教室沒有收到 `PHYS01` 向量。
- 學生 DOM 無編輯 input。
- 零向量顯示正常，刪除同步至兩個學生分頁。
- 停止模擬器後，老師顯示離線，新增、儲存與刪除按鈕停用。
- Chrome 縮小視窗測試：學生頁面實際 CSS 寬９１１、老師頁面寬４００，均無水平溢出；已還原視窗大小。

尚未在實體 iPad／Safari 或校園 Wi-Fi 驗證。建置有單一 JS bundle 大於５００ kB 的提示，壓縮後約１９０ kB，並非建置失敗。未配置正式 Firebase 時，部署設定檢查會正確拒絕通過。

## 雲端狀態與下一步

使用者要求改用已開啟的 Chrome Firebase Console。已查看登入狀態，進入「建立專案」並填入 `Physics Classroom`。首次建立專案要求勾選 Firebase 條款；已向使用者詢問是否同意接受。**目前未接受條款、未建立 Firebase 專案、未建立正式資料庫、未部署。**

下一位接手者應先確認使用者是否已回覆同意，或是否已自行完成條款頁面。不要把等待時間視為同意。確認後：

１．完成 Firebase 專案建立，不加 Analytics／Gemini 或不必要服務。
２．建立 Realtime Database 與網頁應用程式，取得正式 firebaseConfig。
３．填入 `public/firebase-config.json`，設定 `.firebaserc` 正式專案對應。
４．完成 Firebase CLI 登入（可能需要使用者在瀏覽器授權）。
５．依 README 部署 Hosting 與 Database；部署前明確告知無登入版無法安全區分老師／學生。
６．以正式 HTTPS 網址測試老師、学生與多裝置同步，更新本文件雲端狀態。

Firebase 網頁設定不是管理員密鑰；不要索取 service account 私鑰。若透過瀏覽器接受條款或變更安全敏感存取，遵守該工具在當下要求的確認。

## 執行方式

```sh
cd '/Users/lvyunxiu/codex test/physics-classroom-mvp'
npm run build
npm run emulators
```

- 首頁：`http://127.0.0.1:5055/`
- 老師：`http://127.0.0.1:5055/teacher.html?room=PHYS01&emulator=1`
- 學生：`http://127.0.0.1:5055/student.html?room=PHYS01&emulator=1`

Hosting 原預設５０００已被其他程式佔用，所以使用５０５５。Database 是９０００，Hub 是４４００。全部綁定 loopback。模擬器資料預設不持久化，重新啟動後需重新新增向量。開發熱更新：另跑 `npm run dev`，開啟５１７３。

`work/jdk` 是從 Adoptium 官方端點下載的 Temurin JDK ２１；啟動腳本優先使用它。`work/firebase-emulators`、`work/npm-cache`、`work/config` 均為測試工具快取，不納入版本控制。

## 重要限制

- 學生頁只讀，但無 Authentication 就沒有可靠的老師身分控管。知道代碼者可自行開老師頁或呼叫 API。這是本版既定範圍，不可宣稱具備安全的老師專屬寫入權限。
- 固定槽位 v0～v49；不要改成任意 push ID 而仍宣稱規則能限制５０支。RTDB 規則不支援 `numChildren()`；本版已用合法槽位名稱限制並實測通過。
- 多人同時修改同一支向量，最後寫入生效；槽位刪除再新增後，另一位老師的舊編輯可能覆蓋新向量。本版以單一老師授課為主要使用情境。
- 更新按儲存後同步，尚非拖曳連續同步。
- 未做拖曳把手、QR code、動畫、儲存相機視角或全息四面輸出。
- 斷線會自動重連；傳送途中斷線可能留下 Firebase 待傳操作，不應把「同步中」當成已完成。
