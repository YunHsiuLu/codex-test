# Win11React Wine — macOS 最小原型

基於 https://github.com/blueedgetechno/win11React ，保留桌面、工作列、開始選單與視窗操作，新增「Windows Games」啟動器。這是 Wine 的管理介面，不是 Windows VM，也不保證所有遊戲相容。

上游基準：`afb02e797106c208314abbf837ec11bf50da9d62`。上游說明保留於 `README.upstream.md`，授權保留於 `LICENSE`。原 clone 的 `.git` 與 `.github` 已依使用者要求刪除；保留 `.gitignore`、來源說明與授權。專案目前是外層 `codex test` 倉庫中的一般資料夾，尚未新增獨立 Git 倉庫或上傳。

## 已實作

- 原生 macOS 選檔框選擇 `.exe`，取消時保留原選擇。
- React → Tauri 2 → Rust，辨識 x86／x64 PE 標頭，拒絕非 EXE、DLL、DOS／16 位元程式。
- 探測 Wine，支援 PATH、Homebrew 常見位置、Wine Stable／Devel／Staging App，以及手動完整路徑。
- 呼叫 `wine <exe>`，工作目錄為 EXE 所在資料夾，每個 EXE 路徑使用獨立 prefix。
- 非阻塞執行與持續狀態更新、退出碼、最近 32 KiB stdout／stderr。啟動成功只代表程序建立；不代表遊戲相容。
- 單次只允許一個受追蹤 Wine 程序。關閉啟動器不會強制終止已開啟的遊戲。
- ZIP／RAR 尚未實作；匯入驗證、原生 runtime 與 UI bridge 已分層。

## 在這台 Mac 執行

```sh
cd "/Users/lvyunxiu/codex test/win11react-wine"
npm run app:dev
```

本次已在專案 `work/` 內安裝 Rust 與可攜 Wine。啟動腳本自動偵測這兩者，不修改 shell 設定。開發模式的 prefix 位於 `.local-data/prefixes/`。

應用程式開啟後：選擇 EXE → 啟動遊戲。請先解壓縮整個遊戲資料夾，保留 EXE 旁邊的素材、DLL 與設定檔。Windows 遊戲顯示為獨立 macOS 視窗，不會嵌入模擬桌面內。

## 新電腦的依賴與步驟

需要 Apple Silicon Mac、Node.js 22.12 以上的 22.x 或相容較新版本、Xcode Command Line Tools、Rust，以及可在該 Mac 執行的 Wine。App 最低 macOS 設定為 12.0；實際相容範圍還取決於使用的 Wine。

１．自行安裝 Node.js，並在需要時執行：

```sh
xcode-select --install
```

２．在專案目錄安裝前端套件及專案內 Rust：

```sh
npm ci --cache ./work/npm-cache
npm run setup:rust
```

也可以使用系統既有的 Rust；若 `work/cargo/bin/cargo` 存在，腳本優先使用專案內版本。Rust 工具鏈固定為 1.98.1。`Cargo.lock`、`package-lock.json` 應一起攜帶。

３．Apple Silicon 上的這份 Wine 需要 Rosetta。可先檢查：

```sh
/usr/bin/arch -x86_64 /usr/bin/true
```

若失敗，請依 macOS 提示安裝 Rosetta，或自行執行 `softwareupdate --install-rosetta` 並閱讀授權條款。本次未修改或安裝系統 Rosetta。

４．安裝專案內 Wine（約 185 MB 下載，解壓後更大）：

```sh
npm run setup:wine
```

腳本下載 WineHQ macOS 發行專案的 `wine-stable-11.0_1-osx64.tar.xz`，核對 SHA-256 後解壓到 `work/wine-runtime/`，不安裝到 `/Applications`，也不關閉 Gatekeeper。雜湊：`b50dc50ec7f41d58b115a6b685d4d1315ba3c797bd3aa0f49213f2703cb82388`。

截至 2026-09-30，Homebrew `wine-stable` 顯示 disabled，故不把 `brew install --cask wine-stable` 當成可保證成功的步驟。若 macOS 阻擋執行，先檢查官方發行說明與系統提供的允許方式；不要全域停用安全保護。部分遊戲影音功能另需 GStreamer runtime，本次未安裝、未驗證。DXVK／D3DMetal／VC++ runtime／RPG Maker RTP 等也未自動配置。

５．啟動：

```sh
npm run app:dev
```

也可在 UI 填入其他 Wine 的完整執行檔路徑。手動路徑優先於 `WIN11_WINE`，再來才是自動搜尋。錯誤的手動路徑會直接報錯，不會默默改用其他版本。

## 建置可直接開啟的 App

```sh
npm run app:build
open "src-tauri/target/release/bundle/macos/Win11React Wine.app"
```

產物：`src-tauri/target/release/bundle/macos/Win11React Wine.app`。ARM64 主程式；Wine 由 Rosetta 執行。這是本機開發產物，沒有 Apple Developer 發佈簽章／公證，未包入 Wine，也不是可對外分發的安裝程式。

從 Finder 開啟不一定繼承終端機的 PATH。首次可在 UI 的 Wine 路徑填入：

```text
/專案完整路徑/work/wine-runtime/Wine Stable.app/Contents/Resources/wine/bin/wine
```

打包版預設資料位置：`~/Library/Application Support/tw.win11react.wine/prefixes/`。可用 `WIN11_DATA_DIR` 覆寫；本次測試皆指定專案內 `.local-data`。

若希望直接執行打包版本但資料仍留在專案內：

```sh
WIN11_DATA_DIR="$PWD/.local-data" \
WIN11_WINE="$PWD/work/wine-runtime/Wine Stable.app/Contents/Resources/wine/bin/wine" \
"src-tauri/target/release/bundle/macos/Win11React Wine.app/Contents/MacOS/win11react-wine"
```

`npm run dev` 只開網頁預覽，沒有原生橋接；選檔與啟動按鈕會停用並說明原因。

## 自製 Windows 測試 EXE

不需要提供測試遊戲；本專案可用原始碼自行產生三個 Windows x64 EXE：

```sh
npm run test:fixtures
npm run test:windows
```

原始碼位於 `tests/windows-fixtures/`，產物位於 `test-games/`：

- `Success.exe`：找到旁邊的 `fixture-data.txt`，輸出成功訊息並退出 0。
- `Failure.exe`：輸出預期錯誤並退出 7，用來確認 UI 的失敗提示。
- `Click Game.exe`：Win32 點擊加分小程式，提供成功與失敗結束按鈕。

已從原生 App 驗證前兩個程式的成功／失敗與輸出。圖形程式已執行並回報視窗建立，但視窗可見性及點擊互動尚未驗證。前兩個程式可從啟動器原生選檔直接執行；測試腳本另驗證錯誤工作目錄會退出 9。它們是真正交叉編譯的 PE 執行檔，沒有複製 Wine／Windows 的內建 EXE。使用既有 Apple Clang 與 Rust 工具鏈所附 rust-lld，不必安裝其他 Windows SDK。EXE 為可重建產物，`test-games/` 已加入 .gitignore；原始碼、建置腳本仍可上傳。

目前的執行關係為「Win11React UI → Tauri 原生層 → Wine → Windows 程式的獨立視窗」。遊戲畫面不是 Win11React 內部的 React 視窗，尚未嵌入 WebView。若後續要整合在模擬桌面內，需要額外設計畫面顯示與鍵盤滑鼠輸入處理。

## 驗證與架構

```sh
npm run build
npm run test:native
npm run app:build
```

詳見 `HANDOFF.md` 的實際結果與未完成項目。

- `src/containers/applications/apps/games.jsx`：整合既有視窗管理的遊戲 UI。
- `src/features/games/bridge.js`：四個原生命令及瀏覽器模式處理。
- `src-tauri/src/main.rs`：原生選檔、已選檔案狀態、啟動／程序狀態。
- `src-tauri/src/importer.rs`：EXE 候選模型與 PE 標頭驗證。
- `src-tauri/src/runtime.rs`：Wine 探測、版本檢查逾時、prefix、程序與輸出。

下一步可在 importer 新增 ZIP 解壓與候選扫描，沿用 `GameCandidate`、選定候選及 runtime。解壓需要獨立匯入目錄、路徑穿越／符號連結／大小限制與多 EXE 選擇，不能單靠檔名猜主程式。

## 使用限制

- Wine 不提供安全沙盒；只執行可信任的程式。
- PE 驗證只檢查標頭，不會檢查程式安全性，也不代表相容性。
- 非零退出碼顯示失敗，零退出碼只表示被追蹤的 Wine 程序正常結束。有些 launcher 會衍生其他程序，不能據此判斷遊戲視窗是否仍存在。
- 不提供強制停止、遊戲庫、重啟後恢復遊戲選擇、遊戲參數或依賴自動安裝。
- 保留的檔案總管、Terminal 是上游模擬功能；只有 Windows Games 能選擇／啟動本機 EXE。
- 原生版限制外部程式碼與網路連線；上游部分線上小工具可能無法使用。上游追蹤腳本不再載入，模擬 Terminal 的任意 JavaScript eval 已停用。
- 建置仍有上游 Sass 舊語法與 bundle 大小警告，不影響本次建置。

參考：[Tauri 前置需求](https://v2.tauri.app/start/prerequisites/)、[原生命令](https://v2.tauri.app/develop/calling-rust/)、[WineHQ macOS 發行包](https://github.com/Gcenx/macOS_Wine_builds)、[Homebrew 現況](https://formulae.brew.sh/cask/wine-stable)。
