# Win11React Wine — macOS 最小原型

基於 https://github.com/blueedgetechno/win11React ，保留桌面、工作列、開始選單與視窗操作，新增「Windows Games」啟動器。這是 Wine 的管理介面，不是 Windows VM，也不保證所有遊戲相容。

上游基準：`afb02e797106c208314abbf837ec11bf50da9d62`。上游說明保留於 `README.upstream.md`，授權保留於 `LICENSE`。原 clone 的 `.git` 與 `.github` 已依使用者要求刪除；保留 `.gitignore`、來源說明與授權。專案目前是外層 `codex test` 倉庫中的一般資料夾，尚未新增獨立 Git 倉庫或上傳。

## 已實作

- 原生 macOS 選檔框選擇 `.exe`，取消時保留原選擇。
- React → Tauri 2 → Rust，辨識 x86／x64 PE 標頭，拒絕非 EXE、DLL、DOS／16 位元程式。
- 探測 Wine，支援 PATH、Homebrew 常見位置、Wine Stable／Devel／Staging App，以及手動完整路徑。
- 呼叫 `wine <exe>`，工作目錄為 EXE 所在資料夾，每個 EXE 路徑使用獨立 prefix。
- 非阻塞執行與持續狀態更新、退出碼、最近 32 KiB stdout／stderr。啟動成功只代表程序建立；不代表遊戲相容。
- 專案根目錄 ZIP／EXE 每３秒自動出現在「本機遊戲庫」。ZIP 按匯入後解壓、遞迴掃描有效 EXE，多個候選可自行選擇。
- 匯入內容以 SHA-256 分開保存；重複匯入不覆寫存檔，重新開啟 App 仍保留已匯入遊戲。RAR 尚未支援。
- 實驗性內嵌顯示：x64 Win32／GDI 遊戲的實際畫面、滑鼠與基本鍵盤輸入，顯示在 Win11React 的 Windows Games 視窗。
- 可取消「在 Win11React 視窗內顯示」，沿用獨立 Wine 視窗。單次只追蹤一個遊戲。內嵌模式提供「結束遊戲」；只關閉模擬視窗會隱藏，退出整個 App 才會送出關閉要求。

## 在這台 Mac 執行

```sh
cd "/Users/lvyunxiu/codex test/win11react-wine"
npm run app:dev
```

本次已在專案 `work/` 內安裝 Rust 與可攜 Wine。啟動腳本自動偵測這兩者，不修改 shell 設定。開發模式的 prefix 位於 `.local-data/prefixes/`。

應用程式開啟後，可直接選 EXE，也可使用遊戲庫：

１．把 ZIP 放到 `win11react-wine/` 第一層（與 package.json 同層）。
２．開啟桌面的 Windows Games，最多約３秒就會列出 ZIP，不需重啟。
３．按「匯入 ZIP」，從候選清單選擇 EXE，按「啟動遊戲」。
４．預設嘗試內嵌顯示。點一下遊戲畫面再操作；不相容時結束遊戲，取消勾選內嵌選項後再啟動。

已準備 `Sample Games.zip` 作為自行產生的示範包。選 `Sample Games/Click Game.exe`，Click +1 或空白鍵加分；Finish successfully 正常結束；Test failure 測試退出碼７。

解壓資料位於 `.local-data/library/<ZIP SHA-256>/files/`，完整保留遊戲目錄結構及素材。相同 ZIP 會重用已有匯入，刪除原始 ZIP 不會移除已匯入遊戲。修改 ZIP 則匯入另一份；不會自動合併不同版本存檔。匯入並不代表自動執行。

若 App 搬離專案且找不到根目錄，用「選擇資料夾」指定放 ZIP 的位置。此資料夾選擇目前只在本次 App 執行中有效。

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
npm run test:embedded
```

原始碼位於 `tests/windows-fixtures/`，產物位於 `test-games/`：

- `Success.exe`：找到旁邊的 `fixture-data.txt`，輸出成功訊息並退出 0。
- `Failure.exe`：輸出預期錯誤並退出 7，用來確認 UI 的失敗提示。
- `Click Game.exe`：Win32 點擊加分小程式，提供成功與失敗結束按鈕。

已在真實 Wine 測試 console 的成功／失敗與 cwd，也在原生 App 內看到 Click Game 實際畫面並以滑鼠加分。`test:embedded` 另外驗證像素畫面、滑鼠、空白鍵、成功／失敗結束、關閉與 console 退出碼。測試資料與紀錄留在 `.local-data/`、`work/`，不加入 Git。

EXE 使用 Apple Clang 與 Rust 附帶 rust-lld 從本專案 C 原始碼交叉編譯，沒有複製 Windows 內建程式，也不必安裝 Windows SDK。`test-games/` 是可重建產物。

目前內嵌架構：React canvas ↔ Tauri ↔ 自製 Windows host／display DLL ↔ 選定遊戲的 GDI 畫面與 Win32 訊息。顯示 DLL 只載入本次啟動的 x64 遊戲程序，原生視窗移到畫面外，再將 client 像素傳回 App；不是將外部 macOS 視窗直接掛入 WebView。元件不需 macOS 螢幕錄製／輔助使用權限。

## 驗證與架構

```sh
npm run build
npm run test:native
npm run app:build
```

詳見 `HANDOFF.md` 的實際結果與未完成項目。

- `src/containers/applications/apps/games.jsx`：整合既有視窗管理的遊戲 UI。
- `src/features/games/bridge.js`、`GameScreen.jsx`：原生命令、BMP 畫面與輸入、瀏覽器模式。
- `src-tauri/src/main.rs`：原生選檔、已選檔案狀態、啟動／程序狀態。
- `src-tauri/src/importer.rs`：EXE 候選模型與 PE 標頭驗證。
- `src-tauri/src/runtime.rs`：Wine 探測、版本檢查逾時、prefix、程序與輸出。

- `src-tauri/src/library.rs`：資料夾發現、ZIP 暫存解壓、候選與持久匯入。
- `native/windows-host/`：內嵌顯示的 Windows 原始碼及限制说明。
- `scripts/build-wine-host.mjs`：開發／打包前自動產生 EXE／DLL 並放入 App resources。

ZIP 限制：壓縮檔不超過２ GiB、展開不超過４ GiB、最多２０，０００個項目及６４層；拒絕路徑穿越、symlink／特殊檔案、重複／大小寫衝突路徑。支援一般 Stored／Deflate ZIP；加密、其他壓縮方式或未完成複製會報錯，不保留部分解壓結果。

## 使用限制

- Wine 不提供安全沙盒；只執行可信任的程式。
- PE 驗證只檢查標頭，不會檢查程式安全性，也不代表相容性。
- 非零退出碼顯示失敗，零退出碼只表示被追蹤的 Wine 程序正常結束。有些 launcher 會衍生其他程序，不能據此判斷遊戲視窗是否仍存在。
- 內嵌目前限定 x64 Win32／GDI，約１０ fps、最高 1920×1080，僅第一個主視窗。DirectX／OpenGL、全螢幕、彈出對話框、另一個子程序、Raw Input、滑鼠鎖定／滾輪、IME／手把未支援或驗證；不能當成所有 Windows 小遊戲都相容。
- 內嵌有「結束遊戲」：先送 WM_CLOSE，約１０秒仍未退出則以１２３結束選定程序；遊戲若本身阻塞顯示元件，仍可能無法退出。獨立模式沒有停止按鈕。
- 不提供遊戲參數、依賴自動安裝、重啟後恢復 EXE 選擇；已匯入遊戲清單會保留。
- 遊戲庫目前在 Windows Games 內；原檔案總管的 C 槽並不對應本機專案目錄。
- 保留的檔案總管、Terminal 是上游模擬功能；只有 Windows Games 能選擇／啟動本機 EXE。
- 原生版限制外部程式碼與網路連線；上游部分線上小工具可能無法使用。上游追蹤腳本不再載入，模擬 Terminal 的任意 JavaScript eval 已停用。
- 建置仍有上游 Sass 舊語法與 bundle 大小警告，不影響本次建置。

參考：[Tauri 前置需求](https://v2.tauri.app/start/prerequisites/)、[原生命令](https://v2.tauri.app/develop/calling-rust/)、[WineHQ macOS 發行包](https://github.com/Gcenx/macOS_Wine_builds)、[Homebrew 現況](https://formulae.brew.sh/cask/wine-stable)。
