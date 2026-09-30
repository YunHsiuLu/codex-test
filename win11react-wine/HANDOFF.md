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
