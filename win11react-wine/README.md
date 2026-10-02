# Win11React Wine — macOS 最小原型

基於 https://github.com/blueedgetechno/win11React ，保留桌面、工作列、開始選單與視窗操作，新增「Windows Games」啟動器。這是 Wine 的管理介面，不是 Windows VM，也不保證所有遊戲相容。

上游基準：`afb02e797106c208314abbf837ec11bf50da9d62`。上游說明保留於 `README.upstream.md`，授權保留於 `LICENSE`。原 clone 的 `.git` 與 `.github` 已依使用者要求刪除；保留 `.gitignore`、來源說明與授權。專案目前是外層 `codex test` 倉庫中的一般資料夾，尚未新增獨立 Git 倉庫或上傳。

## 目前使用方式（2026-10-01 更新）

依使用者要求，已改回「Win11React 管理遊戲庫 → Wine 在 Mac 開啟獨立遊戲視窗」。App 不再內嵌畫面，也不再載入顯示 DLL。視窗大小／全螢幕由遊戲本身控制，能否使用仍取決於遊戲與 Wine 的相容性。

１．先在 Mac 下載好遊戲 ZIP。
２．在 Windows Games 按「選擇 ZIP 匯入」，從下載項目或其他位置選擇 ZIP。
３．App 自動解壓、掃描有效 Windows x86／x64 EXE；多個 EXE 時自行選主程式。
４．按「遊玩遊戲」，切換到 Wine 開啟的獨立遊戲視窗。
５．結束時關閉遊戲本身；Win11React 顯示程序退出碼與診斷輸出。

匯入會把內容放到遊戲庫資料夾的 `.local-data/library/<ZIP SHA-256>/files/`，保留素材及子資料夾，**不搬走、不覆寫原始 ZIP**。相同 ZIP 重用匯入結果，不覆寫遊戲存檔；移除原 ZIP 不會刪掉已匯入遊戲。原本把 ZIP／EXE 放在專案第一層、每３秒自動發現的方式仍可使用。

- 原生選檔框可選 ZIP 或直接選 EXE；取消保留目前遊戲庫。
- React → Tauri 2 → Rust → `wine <exe>`，不經 shell 解譯；cwd 為 EXE 所在資料夾。
- Wine 版本檢查、自訂路徑、每 EXE 獨立 prefix、單一啟動槽、非阻塞狀態與32 KiB 輸出。
- ZIP 採快照、暫存解壓、成功後原子搬入，拒絕路徑穿越／symlink／特殊檔案／重複或大小寫衝突。限２ GiB 壓縮、４ GiB 展開、２０，０００項／６４層。支援 Stored／Deflate ZIP；加密、其他方式、RAR 未支援。
- 已匯入清單重啟後保留；目前 EXE 選擇及改選遊戲庫位置不會持久化。
- 取消／匯入失敗不自動執行。PE 標頭驗證不是安全掃描；只執行可信任的遊戲。

## 在這台 Mac 執行

```sh
cd "/Users/lvyunxiu/codex test/win11react-wine"
npm run app:dev
```

現有 Node.js、Xcode CLT、專案內 Rust／Wine 及 Rosetta 足夠，這次沒有增加依賴。開發腳本使用 `work/` 中的工具，prefix 位於 `.local-data/prefixes/`。已有 `Sample Games.zip` 可示範；選 Click Game.exe，在獨立遊戲視窗點擊加分或結束。

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

## 自製貪食蛇 ZIP

專案根目錄 `Snake.zip` 是自行撰寫的 Windows x64 貪食蛇，內含 `Snake/Snake.exe` 與操作說明。從 Windows Games 按「選擇 ZIP 匯入」，選這個 ZIP，再按「遊玩遊戲」，由 Wine 開啟獨立視窗。

- 方向鍵／WASD：開始與移動；空白鍵：開始／暫停；R：重新開始；Esc：結束。
- 吃金色食物加分、逐漸加速；撞牆或身體結束。可調整視窗大小，離開焦點會暫停，最高分只保留到遊戲關閉。
- 原始碼在 `games/snake/`。使用現有 Apple Clang 與 Rust 附帶的 rust-lld 交叉編譯，不需要 Windows 電腦、Windows SDK 或額外遊戲引擎。此做法適用這份自行宣告 Win32 API 的小程式，不代表任意 Windows 專案都能免 SDK 編譯。

在本專案目錄重新產生：

```sh
npm run game:snake
```

此指令會執行遊戲邏輯測試，產生 `dist-games/Snake/Snake.exe`，並更新根目錄 `Snake.zip`。ZIP 不含 macOS 資源叉／隱藏中繼資料；建置產物不加入 Git，原始碼與建置腳本可攜帶到新 Mac。新電腦先完成上方 Node.js、Xcode CLT、Rust 設定；實際在 Mac 遊玩另需 Wine／Rosetta。

## 自製 Windows 測試 EXE與驗證

```sh
npm run test:fixtures
npm run test:windows
npm run test:native
npm run app:build
```

`tests/windows-fixtures/` 包含本專案自行撰寫的 C 程式，使用 Apple Clang／Rust 附帶 rust-lld 建成 Windows x64 PE，不需要 Windows SDK：

- `test-games/Success.exe`：驗證旁邊 fixture-data.txt 後退出０。
- `test-games/Failure.exe`：輸出預期錯誤，退出７。
- `test-games/Click Game.exe`：獨立 Win32 圖形視窗，點擊加分、正常／失敗結束。

原生測試包含安全解壓、持久化、重複匯入保留存檔、從其他資料夾選 ZIP 匯入且原檔不變、Wine argv／cwd／輸出／退出碼等。實際驗證結果與限制見 HANDOFF.md。

## 架構與限制

- `src/containers/applications/apps/games.jsx`：遊戲庫、ZIP／EXE 選擇、獨立視窗啟動、狀態。
- `src/features/games/bridge.js`：Tauri 命令與瀏覽器模式。
- `src-tauri/src/main.rs`：原生選檔、保留已選候選、程序生命週期。
- `src-tauri/src/library.rs`：ZIP 安全解壓、持久匯入、有效 EXE 掃描。
- `src-tauri/src/importer.rs`：PE 標頭與架構辨識。
- `src-tauri/src/runtime.rs`：Wine 探測、參數式啟動、prefix 與有界輸出。

先前內嵌實驗的 `native/windows-host/`、相關建置／測試腳本保留作歷史實驗；目前 App 的前端、原生命令、dev／build 流程、bundle resources 均不使用它們。

Wine 不是安全沙盒，也不保證所有遊戲能正常顯示／遊玩。VC++、.NET、RTP、DirectX 等依賴不會自動安裝。沒有強制停止／程序樹追蹤；部分 launcher 的退出碼不代表其子程序已結束。保留的模擬檔案總管 C 槽不是 Mac 本機檔案系統，請使用 Windows Games 匯入。

本機 App 尚無發佈簽章／公證；原生網路限制可能影響上游線上小工具。上游 Sass 棄用／bundle 大小警告仍存在。原 clone 的 Git 資料已移除，尚未 init、commit、push，授權與來源仍保留。

參考：[Tauri 前置需求](https://v2.tauri.app/start/prerequisites/)、[原生命令](https://v2.tauri.app/develop/calling-rust/)、[WineHQ macOS 發行包](https://github.com/Gcenx/macOS_Wine_builds)。
