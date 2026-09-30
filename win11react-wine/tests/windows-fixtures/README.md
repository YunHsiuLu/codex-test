# 自製 Windows 測試程式

這些 EXE 由本專案 C 原始碼交叉編譯產生，沒有複製 Windows 或 Wine 的內建 EXE。

- `Success.exe`：檢查目前工作目錄中有 `fixture-data.txt`，輸出 `FIXTURE_SUCCESS` 並退出 0。
- `Failure.exe`：同樣檢查旁邊的資料檔，輸出 `FIXTURE_EXPECTED_FAILURE` 到 stderr 並退出 7，供驗證失敗訊息。
- `Click Game.exe`：真正的 Win32 圖形小程式，可按 `Click +1` 累加分數，按成功或失敗結束按鈕回傳 0 或 7。

在啟動器按「選擇 EXE」，選取上述檔案，再按「啟動遊戲」。`fixture-data.txt` 應留在 EXE 旁邊。

重建：從專案根目錄執行 `npm run test:fixtures`。需要 Apple Clang（Xcode CLT）及本專案 Rust 工具鏈的 rust-lld，不需要另外下載 Windows SDK 或 MinGW。

原始碼在 `tests/windows-fixtures/`。產物在 `test-games/`，已加入 .gitignore；上傳程式原始碼與建置腳本即可重建。GUI 視窗是由 Wine 顯示在 macOS 桌面上，不嵌入 Win11React 視窗。
