# Rust 練習工作室交接日誌

## ２０２６－１０－２１｜初版

### 已完成

專案位置：`/Users/lvyunxiu/codex test/rust-practice`。本機課程頁面、完整 COURSE.md、第零步安裝說明、十二份 Rust 起始程式及十二份獨立答案。由輸出、變數、條件、迴圈、函式、輸入，逐步進入所有權、Vec／Option、結構、Result、測試與運動紀錄分析。每課含概念、任務、提示、預期結果及驗收。

網頁提供目錄搜尋、程式編輯與下載、Playground 開啟按鈕、筆記、進度、JSON 匯出／匯入；資料限目前瀏覽器的 localStorage，不含帳號或雲端同步。網頁不含 Rust 編譯器，Playground 需連網；第六課標準輸入請於本機操作。未發布到外部網站。

### 驗證證據

環境為 macOS，rustc 1.99.0、cargo 1.99.0。

- `node --check app.js`：通過。
- `cargo check --examples --offline`：全部二十四份程式可編譯；起始程式的未使用變數警告屬待完成練習。
- `cargo run --example answer01` 到 `answer12`：全部執行成功，輸出符合教材；answer06 以 25、abc、-40 驗證輸入路徑。
- `cargo test --example answer11 --example answer12 --offline`：四個測試通過，涵蓋換算、加權平均速度、空資料、無效時間、非有限值及往返運動。
- `cargo test --example step11 --offline`：依課程設計失敗，確認學生能先看到紅燈再修正。
- 透過本機 HTTP 預覽實際檢查安裝章、第一課、搜尋、程式編輯、筆記及進度重新整理保存；已清除測試作答。窄螢幕版面已目視確認，預覽圖在 docs/preview.png。
- 安裝依據 Rust 官方安裝章與官方入門，查核日期為２０２６－１０－２１。

### 未驗證邊界

Windows／Linux 未實機安裝；課程尚未試教。自動瀏覽器禁止 file:// 協定，無法實際驗證雙擊 HTML 的瀏覽器行為；網頁使用相對路徑腳本、沒有 fetch 或 CDN，仍應由使用者於慣用瀏覽器確認直接開啟與儲存功能。HTTP 預覽通過。JSON 匯入／匯出、下載及 Playground 開啟後的執行流程尚未完成端到端檢查；本機編譯與頁面儲存功能已驗證。不同瀏覽器對本機檔案的 localStorage 行為可能不同，可改用以下 HTTP 方式。線上練習區不會自動更新本機 .rs。

### 換電腦啟動

１．複製整個 rust-practice，排除 target 即可；需要搬移學習紀錄時，先在原瀏覽器匯出 JSON，再在新瀏覽器匯入。
２．依 docs/00-install.md 安裝 Rust stable；專案採 edition 2024，至少需要 Rust 1.85。
３．直接以瀏覽器開啟 index.html。若本機檔案儲存受限制，在專案資料夾執行 `python3 -m http.server 8765 --bind 127.0.0.1`，瀏覽 http://127.0.0.1:8765；Windows 若只有 py 指令，可用 `py -m http.server 8765 --bind 127.0.0.1`。停止時按 Ctrl+C。
４．編輯 examples/step01.rs，執行 `cargo run --example step01`。Rust 練習不需要 Python 或 Node，只有教材維護／選用伺服器才需要。

### 維護與下一步

課程源檔為 scripts/build.py。`python3 scripts/build.py` 會覆寫 COURSE.md、lessons.js、docs/00-install.md、examples、solutions 與 Cargo.toml，必須先備份學生修改；網頁介面為 index.html、app.js、style.css。Cargo.lock 已保留，沒有第三方 Rust 依賴。

下一步：實際上第一課並依學習者回饋調整篇幅；再檢查備份往返與 Playground 流程。高中課程化可補逐節教案、錯誤訊息練習、學習單與評分規準。期末讀檔／CSV 為延伸題，本版沒有實作。
