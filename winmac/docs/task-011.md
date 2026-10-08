# Task 011：最小 GUI EXE 與物理問答

2026-10-08：新增 USER32 MessageBoxA 橋接、GUI subsystem 支援，以及可重現的 physics-quiz.exe。

## 使用方式

在打包目錄雙擊 `Play-Quiz.command`，即可執行物理問答。macOS 會透過終端機啟動 WinMac，顯示原生「Yes／No」視窗，再顯示回答結果。保留整個目錄內的檔案，可移動整個目錄使用。無須在使用時安裝 Rust。

問題是「速度加倍，動能是否變成四倍？」。答案判斷與結果文字均來自 Windows EXE 內的指令和資料；原生 UI 只顯示 EXE 要求的視窗並回傳按鈕結果。

在打包目錄也可執行：

```sh
./winmac-cli run physics-quiz.exe
./winmac-cli run physics-quiz.exe --base 0x150000000
./winmac-cli run hello.exe
./winmac-cli inspect physics-quiz.exe
```

macOS 不會原生執行 `.exe`，因此請使用啟動檔或 WinMac 指令。

## 從原始碼重建

在 WinMac workspace 執行，需 Rust 1.99 以上：

```sh
sh scripts/package-macos.sh /absolute/path/to/WinMac-package
```

腳本使用 repository 以外的建置目錄。可透過 `CARGO_TARGET_DIR` 指定位置。執行包是目前 macOS 主機架構的本機產物，沒有公證或跨平台安裝程式。

## 實作與驗證

- `run_pe_with_ui` 接受同步 UI host。使用者按鈕結果回到 guest RAX，EXE 繼續執行 CMP／分支。
- CLI 用系統 osascript 顯示 macOS 對話框，guest 文字經 argv 傳入固定腳本，不作為 AppleScript 程式碼執行。
- GUI 與 console subsystem 均可載入。原有 `run_pe` 保持無 GUI 行為，遇到 UI 呼叫時明確回報錯誤。
- 新增測試涵蓋兩個答案分支、重定位、無 GUI host、host 失敗、非法按鈕回傳值、字串長度／編碼／指標與不支援參數。
- 全 workspace 124 項測試通過，fmt 與 Clippy 通過。實際 macOS GUI 執行回傳 exit code 0。

## 明確限制

只支援無 owner 的 `MessageBoxA`，旗標為 `MB_OK` 或 `MB_YESNO`，字串暫限 ASCII，每個字串最多 4096 bytes，包含 NUL。尚未實作一般 Windows code page、Unicode MessageBoxW、圖示、其他按鈕、視窗 owner 或 Win32 message loop。Host UI 失敗會終止 runtime，不模擬完整 GetLastError 語意。每次視窗最多等待一小時，等待時間不計入 CPU 指令預算。

這是一個透過 Windows API 顯示視窗的微型問答範例，尚未支援一般 Windows 遊戲、DirectX、OpenGL、音效、遊戲手把、一般滑鼠鍵盤事件、CRT 或多執行緒。GUI 外觀採用 macOS 對話框，不仿 Windows 視覺樣式。EXE 由 Rust generator 產生，尚未在真正 Windows 上驗證，也不代表外部編譯器產生的遊戲已相容。

後續應先建立外部編譯器產出的測試 EXE，再補足 CPU 指令與 Win32 視窗／事件迴圈，做可互動的 2D 範例，之後才評估遊戲所需的圖形及音效後端。

規格依據：[Microsoft MessageBox](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-messagebox)。
