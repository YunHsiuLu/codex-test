# 交接日誌：Win11React Wine macOS 原型

更新日期：2026-09-30（Asia/Taipei）。目的：未來不同電腦的任務交接。

## 專案位置與基準

- 路徑：`/Users/lvyunxiu/codex test/win11react-wine`。
- 已實際 shallow clone 上游 `https://github.com/blueedgetechno/win11React.git`。
- 上游 commit：`afb02e797106c208314abbf837ec11bf50da9d62`。
- 保留原 LICENSE、上游說明 `README.upstream.md`。
- 最新狀態：依使用者要求，已刪除本專案 `.git` 與上游 `.github`，不再保留 clone 的提交歷史／remote／GitHub workflows。外層 `/Users/lvyunxiu/codex test/.git` 未動。外層倉庫現在將本專案視為一般未追蹤資料夾。保留 `.gitignore`、LICENSE 與原始碼，尚未 commit、push 或建立新 remote。

## 需求與完成內容

使用者要保留 Win11React UI，實作 Apple Silicon macOS MVP：原生選 EXE、React 呼叫原生、Wine 檢查、執行 EXE、顯示成功／失敗／錯誤。ZIP／RAR 自動匯入暫不實作，但需保留延伸架構。

完成：

- 修復上游 Tauri 骨架：原本 `edition = "2023"` 無效、dev script 缺失、Vite port／Tauri devPath 不一致、beforeBuild 未建置。
- Tauri 2、Rust 2021 edition、Vite 7、固定 localhost 1420、可建置 ARM64 `.app`。
- Windows Games 使用既有 ToolBar、Redux 視窗管理、桌面／開始選單／工作列入口；預設直接進桌面。
- 原生選檔框、取消保留選擇、x86／x64 PE 標頭检查，拒絕不合格式、DLL、DOS／16 位元。
- Rust 保留原生選定檔案，啟動命令不接受前端任意 EXE 路徑。啟動前再次驗證。
- Wine 自動搜尋與手動路徑、版本檢查逾時與錯誤；直接傳遞 argv，不經 shell 解譯。
- 每個 EXE 的完整路徑 SHA-256 對應獨立 prefix；cwd 為 EXE 所在資料夾。
- 背景子程序、單一執行槽、防重複點擊、800 ms 狀態輪詢、退出碼、32 KiB 有界輸出。
- 「已建立程序」、「正常結束」與「失敗」分開顯示，未把 spawn／exit 0 宣稱為遊戲相容。
- `importer.rs`／`runtime.rs`／前端 bridge 分層，預留 ZIP candidate pipeline。
- 純瀏覽器提示預覽模式，停用 EXE 選檔／啟動／Wine 檢查。
- 原生 CSP 限定本機程式碼；移除上游 analytics 腳本載入、遠端錯誤頁脚本，停用模擬 Terminal eval。
- 移除未使用 CRA、Sentry、Crowdin CLI、PWA build 等舊建置依賴；保留原 UI 套件與來源。
- 新增專案內 Rust／Wine 安裝腳本、詳細 README。

## 實際環境

- Apple Silicon／ARM64，Wine 訊息辨識 GPU 為 Apple M4。
- macOS 26.6.2。
- Node.js 22.17.0，npm 11.17.0。
- Xcode Command Line Tools 已存在；Rosetta `arch -x86_64 /usr/bin/true` 成功。
- 原先 PATH 無 cargo／rustc／wine／wine64。
- 專案內安裝 Rust 1.98.1：`work/cargo`、`work/rustup`，未修改 shell profile。
- JS Tauri API／CLI 2.12.0；Rust tauri 2.12.0；Vite 7.3.6；React 18.3.1。
- WineHQ macOS `wine-stable-11.0_1-osx64.tar.xz`，執行回報 `wine-11.0`。SHA-256 已比對發行資產 API：`b50dc50ec7f41d58b115a6b685d4d1315ba3c797bd3aa0f49213f2703cb82388`。
- Wine 位於 `work/wine-runtime/Wine Stable.app/Contents/Resources/wine/bin/wine`。
- 未安裝系統 Wine、未關閉 Gatekeeper、未安裝 GStreamer。

## 驗證結果

已完成：

１．`npm run app:build` 成功，包含前端 production build 與原生 release build。
   - 最終 App 約 24.14 MiB。
   - `file` 確認主程式為 Mach-O 64-bit arm64。
   - 證據：`work/build-final.log`。

２．`npm run test:native`：５項通過。
   - 拒絕假的 EXE／資料夾。
   - 讀取 PE 架構、拒絕 DLL。
   - Wine 版本成功／失敗／逾時。
   - 中文、空白、shell 特殊字元保持單一 argv；cwd、prefix、stderr、非零退出碼。
   - 輸出尾端保持在 32 KiB。
   - 證據：`work/tests-final.log`。測試 runtime 採明確的 mock shell，不等同遊戲相容測試。

３．實際開啟打包版並操作原生 UI：
   - Win11 桌面、工作列與 Windows Games 視窗正常顯示。
   - 無系統 Wine 時顯示找不到 Wine 訊息。
   - 輸入專案內 Wine 路徑後，從 native bridge 回傳 `wine-11.0`。
   - macOS 選檔視窗正常開啟／取消，取消狀態正確。
   - 選取 Wine 發行包附帶的 x64 `notepad.exe`，回傳名稱、完整路徑、x64。
   - 由 UI 啟動 notepad.exe，確實建立 Wine／Windows 程序並回傳初始化輸出。
   - 但沒有確認 Windows 記事本視窗可操作；程序仍在執行，後來只終止本次測試 PID，以確認 UI 的 SIGTERM 失敗顯示。不可宣稱 GUI 相容已通過。
   - 最終打包版再次實測：把發行包 cmd.exe 複製到 `work/smoke/Windows CMD.exe`，用原生選檔選入並按啟動。真實 Wine 執行 Windows CMD 後，UI 顯示正常結束、退出碼 0，並含 Windows CMD 的實際輸出。這不是 mock。
   - 測試 Wine prefix 全部位於專案 `.local-data`。測試輸出含 Wine 初始化／MoltenVK 訊息，不代表遊戲渲染通過。

４．實際瀏覽 `http://127.0.0.1:1420`，看到預覽模式提示，讀取 DOM 確認「選擇 EXE」、「啟動遊戲」均 disabled。

５．`git diff --check` 通過。

## 啟動與新電腦重建

目前這台：

```sh
cd "/Users/lvyunxiu/codex test/win11react-wine"
npm run app:dev
```

新電腦先準備 Node.js、Xcode CLT、Rosetta，於專案內：

```sh
npm ci --cache ./work/npm-cache
npm run setup:rust
npm run setup:wine
npm run app:dev
```

`setup:wine` 會核對固定 SHA-256，不自動繞過 macOS 安全限制。Homebrew 官方 `wine-stable` 於驗證當天是 disabled，請勿套用舊教學當作現況。

建置：`npm run app:build`。
產物：`src-tauri/target/release/bundle/macos/Win11React Wine.app`。

開發腳本自動使用專案內 Rust、Wine，prefix 使用 `.local-data`。Finder 開啟打包版時可在 UI 填入 Wine 完整路徑，prefix 預設使用 `~/Library/Application Support/tw.win11react.wine`，也可自行用 `WIN11_DATA_DIR` 改到專案內。詳細命令與前置需求見 README。

## 待辦與驗證界線

- 尚無使用者的實際小遊戲；沒有驗證遊戲畫面、音效、輸入與正常遊玩。
- 記事本 GUI 的可見性／操作尚未確認；下一步先用已知可相容的 GUI EXE 或使用者遊戲測試，不能只看退出碼。
- 未測 x86 32 位元的真實程式，僅實作架構辨識。
- GStreamer、VC++、.NET、RPG Maker RTP、DirectX 轉譯層皆未自動安裝或保證。
- 不含 ZIP／RAR、遊戲庫持久化、額外啟動參數、停止按鈕、程序樹追蹤。
- Wine prefix 是相容環境，不是安全沙盒。
- App 尚無發佈簽章／公證；沒有把 Wine 放進 App，不是可對外發佈安裝包。
- 原生網路限制可能影響上游線上小工具；保留的檔案總管、Terminal、Task Manager 仍是模擬功能。
- 前端有上游 Sass 棄用與大 bundle 警告；未做整個上游產品全面翻新。

## 建議接續順序

１．先用本專案自行產生的 `test-games/Click Game.exe` 驗證圖形視窗、點擊、結束流程；不用向使用者索取測試 EXE。實際遊戲相容性再另行測試。
２．若要 ZIP，新增 `importer` 子模組：暫存解壓、路徑／symlink／容量限制、遞迴掃描、候選清單；確認候選後沿用目前啟動器。
３．之後才做持久遊戲庫、主程式候選排序、各遊戲 runtime 設定與圖示。

`work/`、`.local-data/`、`node_modules/`、`src-tauri/target/` 皆忽略，不必跨機攜帶大型快取。若需要保留已玩遊戲存檔，請自行備份 `.local-data` 中相應 prefix。原始碼、README、HANDOFF、Cargo.lock、package-lock.json 必須攜帶。

## 收尾狀態

已停止本次瀏覽器預覽伺服器，釋出 1420 port，並清理本次記事本测试留下的 Wine 子程序。保留最終打包版 App 視窗。`work/` 留存安裝工具、官方 Wine 發行包與建置／測試紀錄，未做 Git 上傳。

## 2026-09-30 追加：移除 clone Git 與自製 EXE

使用者指示：刪除 clone 的 Git 資料以便之後上傳自己的倉庫；測試 EXE 自行產生；確認現階段視窗架構。

完成：

- 移除專案 `.git` 與 `.github`。核對外層倉庫未受影響；外層 status 為 `?? win11react-wine/`。未重新 init、未 push。
- 保留忽略規則及授權來源。`git check-ignore` 確認 `test-games/`、`work/`、`node_modules/`、Rust target 會被忽略，避免把 runtime／快取加入上傳。
- 新增自行撰寫 C 原始碼：`tests/windows-fixtures/console.c`、`click-game.c`，以及 Win32 import 定義。
- `scripts/build-test-exes.mjs` 使用 Xcode Clang 交叉編譯 Windows x64 COFF，再用 Rust 內附 rust-lld 連結 PE。設定只限子程序的 DYLD_LIBRARY_PATH，修正 rust-lld 尋找 libLLVM 的路徑；未改系統環境。
- `npm run test:fixtures` 成功產生 `test-games/Success.exe`、`Failure.exe`、`Click Game.exe`。`file` 確认前兩者為 PE32+ console、第三者為 PE32+ GUI，均為 x86-64。
- `npm run test:windows` 通過三個真實 Wine 測試：成功退出 0、預期錯誤退出 7、錯誤 cwd 缺少 sidecar 退出 9。檢查各自的自製輸出標記，並非只看 exit code。
- 自動測試記錄：`work/windows-fixtures-test.log`、`work/windows-fixtures-results.json`。測試 prefix 位於 `.local-data/fixture-cli`。
- 原生打包 App 實機操作：選 `Success.exe` 並啟動，確認 UI 正常結束／exit 0／`FIXTURE_SUCCESS`；選 `Failure.exe` 並啟動，確認 UI 失敗／exit 7／`FIXTURE_EXPECTED_FAILURE`。完整走過 React → Tauri → 真實 Wine → 自製 EXE → UI。
- README 增補自製 EXE 使用步驟與架構：Windows 程式由 Wine 顯示為 macOS 上的獨立視窗，尚未嵌入 Win11React 的 WebView。

這次只新增測試原始碼／腳本與修改文件、Git 資料；原生 App 程式碼未改，因此沿用已驗證的 release App，沒有重複建置未變動的原生碼。

GUI 追加測試：從原生 UI 選取並啟動 `Click Game.exe`，看到自製程式輸出 `GUI_WINDOW_CREATED`，表示已完成 RegisterClass／CreateWindow／ShowWindow／UpdateWindow 並進入訊息迴圈。但電腦操作工具的應用程式清單沒有辨識到 Wine 遊戲的獨立視窗，故未驗證實際可見性、Click +1 或結束按鈕。不得把這項測試寫成完整 GUI 互動通過。收尾以限定該 EXE 專屬 WINEPREFIX 的 wineserver -k 結束本次圖形測試，未停止其他 prefix。

## 2026-10-01 追加：ZIP 遊戲庫與實際內嵌畫面

使用者明確補充：遊戲畫面本身要出現在 Win11React 視窗裡；ZIP 放進 `win11react-wine` 資料夾後，在 App 能看到。這取代先前「ZIP 未實作／只開獨立視窗」的狀態，前面的紀錄保留作歷史。

### 本次完成

- `src-tauri/src/library.rs`：自動找專案根目錄（環境 `WIN11_LIBRARY_DIR`、App 所在祖先、編譯時專案位置），可用原生選擇資料夾。React 每３秒掃描根目錄第一層 ZIP／EXE；不自動執行。
- ZIP 匯入至 `.local-data/library/<sha256>/files`：先複製快照、核對複製期間是否變動、暫存解壓、確認有效 PE 候選後原子搬入。保留完整資料夾／素材，拒絕穿越路徑、Windows drive／ADS、symlink／特殊檔案、大小寫衝突／重複，限２ GiB 壓縮、４ GiB 展開、２０，０００項／６４層。Stored／Deflate；加密等不支援格式顯示錯誤。
- 已匯入且未變動的 ZIP 不重複顯示待匯入項；同 ZIP 重用，不覆寫存檔。已匯入清單重開 App 仍保留，移除原 ZIP 也保留匯入內容。不同內容以不同 hash 保留版本，沒有存檔遷移。
- library_select 只接受目前候選清單的 id／relativePath，重新驗證 canonical containment 與 PE，再沿用原本 launch_exe。
- Windows Games 內整合遊戲庫、手動 EXE、內嵌／獨立模式切換、狀態／錯誤。選取 EXE 後只捲動遊戲內容區（修正 scrollIntoView 連整個桌面也捲走）。桌面／開始選單／工作列沿用原入口；模擬檔案總管仍不是本機檔案系統。
- `native/windows-host/host.c` 同時建成 `wine-host.exe` 與 `wine-display.dll`：啟動選定 x64 子程序，載入專案自己的顯示 DLL，再恢復執行。DLL 在該程序內用 GDI BitBlt 擷取主視窗 client，原生視窗移到畫面外；只對該程序發送 Win32 mouse／key／char 訊息。
- 不能跨程序擷取：實驗證實跨程序 PrintWindow 為黑畫面、BitBlt 無畫面。同程序 BitBlt 可得到完整畫面，故採目前 DLL 元件。這不是假的 React 重畫遊戲，也不是 macOS 外部視窗直接 reparent。
- BMP 幀以暫存檔原子替換，Tauri binary response → React canvas（BGRA→RGBA），約１０ fps、上限1920×1080。滑鼠映射子控制項，基本鍵盤送主視窗。無 macOS 螢幕錄製／輔助使用授權、無全桌面擷取或全域輸入。
- 「結束遊戲」送 WM_CLOSE；約１０秒仍存活時顯示 DLL ExitProcess(123)。App 退出關閉 stdin 也觸發同流程。只關閉 Win11React 模擬視窗是隱藏，不等於結束。
- `scripts/build-wine-host.mjs` 開發／打包前自動編譯，兩個產物放進 Tauri resources。只有原始碼要加入 Git；resources EXE／DLL／LIB、根目錄 ZIP、runtime／快取／遊戲資料均忽略。
- 更新 README、native/windows-host/README，新增 `npm run test:embedded`。自製 Click Game 加入空白鍵加分與狀態輸出，依然是真正 Win32 EXE。

### 驗證證據

- `npm run test:native`：９項全部通過；新增 ZIP 越界／殘留清理、大小寫衝突、自動發現、持久匯入、重複匯入保留 sidecar／save、候選 allowlist。`work/tests-library-final.log`。
- `npm run test:embedded`：真實 Wine 通過 BMP 非黑像素、滑鼠點擊分數００１、空白鍵分數００２、畫面像素變更、成功退出０、失敗退出７、關閉退出０、console 成功／失敗退出碼。`work/test-embedded.log`、`work/embedded-test-results.json`，測試 prefix `.local-data/fixture-embedded`。
- 最後 `npm run app:build` 成功：ARM64 App 約24.57 MiB，含內嵌元件。`work/build-embedded-final.log`。
- 原生 App：開著時新增自製 `Sample Games.zip` 到專案根目錄，未重新啟動即自動出現；從 UI 匯入，列出 Click Game／Failure／Success 三個 EXE。重新開啟 App 仍保留匯入項，沒有重複待匯入 ZIP。
- 原生 App：由 ZIP 候選選 Click Game 並啟動，真實 Windows 圖形畫面出現在 Win11React 的 Windows Games 視窗內，滑鼠点击 Click +1 看到 Score:001。無需提供外部測試遊戲。

### 新電腦／重啟

依 README 安裝 Node.js、Xcode CLT、Rust、Wine／Rosetta（工具仍留在本專案 work/，未改全域設定）。

```sh
cd "/Users/lvyunxiu/codex test/win11react-wine"
npm ci --cache ./work/npm-cache
npm run setup:rust
npm run setup:wine
npm run app:dev
```

目前這台只需 `npm run app:dev`。打包 `npm run app:build`。若直接開打包版並希望資料全部留專案內，使用 README 的 WIN11_DATA_DIR／WIN11_WINE 命令。

示範包為根目錄 `Sample Games.zip`（不加入 Git）。`npm run test:fixtures` 重建三個 EXE 到 test-games；可自行以 Finder 壓縮成 ZIP。App 裡選 `Sample Games/Click Game.exe`，啟動後 Click +1／空白鍵加分，成功／失敗按鈕結束。

### 保留限制與下一步

- 目前內嵌是 x64 Win32／GDI 實驗原型。不是任意 Windows 小遊戲都能嵌入，未驗證第三方實際遊戲。x86 使用獨立視窗模式。
- 不支援／未驗證 DirectX／OpenGL、全螢幕、Raw Input、pointer lock、滾輪、IME、手把、音效重導、彈出視窗切換、子程序追蹤。只擷取第一個主視窗，開始時可能短暫出現原生視窗；有些遊戲會拒絕 offscreen 或额外 DLL。
- 停止有約１０秒回退，但若顯示執行緒本身被卡住仍可能無法退出。獨立模式保留原行為，沒有停止按鈕。
- 選擇其他遊戲資料夾尚未持久化；只有專案根目錄會自動找到。大型匯入尚無進度百分比／取消，容量限制已實作。
- 下一步應測使用者實際小遊戲，依圖形引擎決定是否需要不同顯示後端。先不要把這個 GDI 原型宣稱為通用 Parallels 替代品。
- `.git`／`.github` 仍不存在，保留授權與來源；未 init、commit、push。外層 Git 未修改。

最終原生 UI 追加驗證：修正選取後捲動不再影響整個桌面；重啟後選同一已匯入 Click Game，滑鼠加分至００１，空白鍵加分至００２，按遊戲內 Test failure 後 UI 正確顯示退出碼７。遊戲結束後隱藏 canvas，改顯示退出結果，避免最後一幀在視窗銷毀時變黑造成誤解。

收尾驗證：最後打包版再次啟動同一遊戲，按 Win11React「結束遊戲」，UI 顯示「遊戲已正常結束。退出碼：0」，canvas 正確收起，沒有殘留黑畫面。保留已開啟的最終 App 視窗及 Sample Games.zip；測試遊戲已結束，沒有背景 dev server。這台不需要追加依賴。所有程式修改、測試與文件都在 `/Users/lvyunxiu/codex test/win11react-wine` 內。

## 2026-10-01 追加：依使用者要求改回 Wine 獨立視窗

最新需求取代上一節內嵌方向：Mac 下載 ZIP → Win11React App 匯入 ZIP → 按遊玩時由 Wine 在 Mac 開啟獨立視窗。使用者認為內嵌畫面太小。

完成：

- Windows Games 移除內嵌 canvas／模式勾選；「遊玩遊戲」只呼叫直接 Wine EXE 啟動。
- Rust `launch_exe` 移除 embedded 參數、host／DLL 注入、frame／input 命令及狀態。直接使用 `runtime::spawn_game`，保留 cwd、每 EXE prefix、診斷與退出碼。
- dev／build 不再編譯 Windows host，App bundle 不再帶 EXE／DLL 資源。實查最後 App Resources 只有 icon.icns。
- 歷史 Windows host、建置／測試腳本保留作實驗參考，與目前 App 無關；退休畫面原始碼移為 `native/windows-host/GameScreen.jsx.reference`，不再在前端來源引用。
- 新增原生 `library_pick_zip` 與醒目「選擇 ZIP 匯入」按鈕。用 macOS 選檔框選下載好的 ZIP，路徑只由 native dialog 提供，前端不傳任意路徑。
- library::import_from_path 重用既有快照、安全解壓、候選掃描及持久化流程；原 ZIP 不搬走、不改寫，不需要先複製到專案根目錄。
- 保留原來根目錄 ZIP／EXE 自動發現、已匯入遊戲／存檔。單一候選自動選取，多候選仍由使用者選主程式。
- README 改寫為目前操作方式與依賴；沒有增加依賴、沒有修改全域設定、沒有 Git 上傳。

驗證：

- `npm run test:native` 十項全部通過：新增「從遊戲庫以外資料夾匯入 ZIP，原檔不變，刪除原 ZIP 後遊戲仍可解析」。記錄 `work/test-standalone.log`。
- `npm run app:build` 成功，ARM64 App 約24.57 MiB；`work/build-standalone.log`。
- 實際原生 UI 開啟 ZIP 選檔，選 `work/import-demo/Downloaded Game.zip`（自製 Click Game，位於遊戲庫根目錄之外），成功匯入清單，保留原有 Sample Games。
- 從已匯入 Click Game 按「遊玩遊戲」，確認真正 Wine 直接執行解壓後 EXE，沒有 wine-host／顯示 DLL／React canvas。程序命令為 `.local-data/library/c49edeaab1a86c7af52dd14cf587de0dfc207c2aa2fc913f1d0ea45d3b57acdf/files/Click Game.exe`。
- 電腦操作工具的應用程式清單仍未辨識 Wine 遊戲視窗，已詢問使用者是否看見獨立 Click Game 視窗；不能只以程序啟動當作 GUI 可見／可操作已驗證。

啟動維持 `npm run app:dev`；打包 `npm run app:build`。資料位置與新電腦安裝見 README。遊戲結束請關閉其原生視窗，App 沒有強制停止／程序樹追蹤。視窗大小與全螢幕由遊戲／Wine 控制，未保證所有游戏相容。先前內嵌１０ fps／x64-only限制已不適用目前啟動器，x86／x64 仍須個別驗證 Wine 相容性。

使用者已回覆「有看到獨立遊戲視窗」，補足 Wine GUI 可見性的實機確認。此次完整流程已確認：原生選 ZIP → 解壓與清單 → 選 EXE → 直接 Wine 啟動 → 使用者看到 Mac 獨立遊戲視窗。保留新版 Win11React 與本次 Click Game 獨立視窗供使用者操作，不主動終止；不宣稱本次已由自動工具驗證該獨立視窗鍵鼠互動。

## 2026-10-01 追加：自製貪食蛇 EXE／ZIP

使用者要求自行產生簡單貪食蛇 Windows EXE、包成 ZIP，再從 Win11React 開啟。全程在本專案內開發，沒有新增全域依賴或進行 Git 上傳。

完成：

- `games/snake/snake.c`：原生 Win32／GDI 視窗，棋盤、蛇與食物、分數／本次最高分、逐漸加速、遊戲結束／勝利提示、可調整視窗大小與雙緩衝繪製。
- `games/snake/logic.h`：獨立純 C 遊戲邏輯；方向鍵／WASD、Space 開始／暫停、R 重來、Esc 關閉。失焦自動暫停，初次開啟等待按鍵。
- `scripts/build-snake.mjs` 與 `npm run game:snake`：以現有 Apple Clang 交叉編譯 x86_64 Windows PE，Rust 附帶 rust-lld 連結，使用自製 Win32 import symbol lists，沒有依賴 Windows SDK／CRT／額外 DLL。
- 產物為根目錄 `Snake.zip`，只含 `Snake/Snake.exe`、`Snake/README.txt` 與目錄項；EXE 為 7680 bytes。`dist-games/` 加入忽略，ZIP 沿用既有忽略規則。原始碼可重新建置。
- README 補上操作與跨電腦建置方式。App 本身仍使用已驗證的 Wine 獨立視窗流程，本次未改 App 前後端。

驗證：

- `npm run game:snake` 成功，`work/build-snake.log` 保存結果；本機 C 邏輯測試通過逆向限制、單 tick 轉向緩衝、成長／分數、食物空格、牆／身體碰撞、允許進入本 tick 移出的尾格、滿盤勝利。
- `file` 確認真正 PE32+ GUI x86-64 Windows EXE；`unzip -l` 確認 ZIP 不含 macOS AppleDouble／資源叉垃圾檔。
- 已用真實 Win11React 原生 ZIP 選檔框選根目錄 `Snake.zip`，畫面顯示已匯入、`Snake/Snake.exe` x64，按「遊玩遊戲」後 UI 顯示 Wine 執行中。
- 已確認直接運行 `.local-data/library/31e02633f0a07e034166b19ab2af0fd72d5d731a404b59c71137d623dd436d59/files/Snake/Snake.exe`，當時 PID 11865。沒有內嵌 host 或 canvas。
- CUA 清單仍無法辨識 Wine 遊戲視窗；已詢問使用者是否看到 Snake 且方向鍵能玩。等待回覆前，不將鍵鼠／實際畫面稱為已驗證。先前 Click Game 的視窗可見性已由使用者確認，但不替代本次 Snake 驗證。

使用者最終回覆「有看到，方向鍵能正常玩」，確認本次 Snake 獨立視窗及方向鍵遊玩正常。驗證完整涵蓋 Mac 交叉編譯 → ZIP → 原生 App 匯入 → Wine 啟動 → 使用者實際遊玩。

續作／啟動：在本專案執行 `npm run game:snake` 重建 ZIP；`npm run app:dev` 開啟啟動器，匯入根目錄 ZIP。這台無須增加依賴，新電腦依 README 設定 Node.js／Xcode CLT／Rust，遊玩另需 Wine／Rosetta。保留當前 Snake 程序與啟動器供使用者試玩。最高分未持久化、尚無音效，Windows 實機未驗證；不影響本次 Mac Wine 示範目標。
