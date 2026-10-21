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

## ２０２６－１０－２１｜改以終端機為主要練習方式

使用者已安裝 cargo 與 rustc，希望直接在 terminal 操作。新增純標準函式庫的 src/main.rs，`cargo run` 顯示目錄與用法；`cargo run -- lesson N` 閱讀課程與預期結果，隱藏提示與答案；hint／answer 分別顯示提示及答案；run／test 呼叫 Cargo 執行本機 examples，沿用標準輸入輸出並傳遞失敗退出碼。沒有更動學生起始作答。

README.md 已改為終端機優先，說明 nano 修改、存檔、執行及第十一課故意失敗的測試；安裝章與網頁保留供未來學生使用。COURSE.md 與生成器均補上終端機入口。scripts/build.py 不再覆寫 README，並保留 Cargo 的 default-run 設定。

實際驗證：目錄、全部十三課閱讀、十二課提示與答案、第一課執行、第六課輸入 25、測試第十一課失敗退出碼、超界／負課號／未知指令／缺參數皆通過。src/main.rs 已以 rustfmt 格式化。測試時未修改 examples。Windows／Linux 的 CLI 未實機驗證。

續作方式：在專案根目錄執行 `cargo run -- lesson 1`，用熟悉的編輯器修改 examples/step01.rs，再執行 `cargo run -- run 1`。不需啟動網頁服務；僅需要本機 Rust。提醒：多數起始程式沒有自動測試，0 tests 不等於作答完成，仍依教材驗收。已更新根目錄 rust-practice.zip，排除 target。

## ２０２６－１０－２１｜以 GitHub 同步專案

依使用者指示移除根目錄 rust-practice.zip，後續不再產生壓縮包，以 GitHub 版本管理與同步原始檔。前文壓縮包記錄為歷史狀態，已由本次移除取代。未執行 commit 或 push。

換電腦時 clone 對應 repository，進入 rust-practice，執行 `cargo run -- lesson 1` 即可續作；target 已被專案 .gitignore 排除，Cargo.lock 保留。已確認壓縮包不存在，Rust 原始碼未變更，不需重跑編譯測試。

## ２０２６－１０－２１｜README 補齊 GitHub 新使用者安裝入口

README.md 現在直接提供 Windows、macOS、Linux 的下載安裝流程，包含官方連結、Windows MSVC／SDK 前置工具、macOS 命令列工具、Linux Ubuntu／Debian 套件、rustup 指令、版本驗證與 PATH／linker 排錯。已重新查核 Rust 官方安裝頁、Book 安裝章及 MSVC 指南。沒有在本機執行任何安裝指令。

快速開始移除作者個人絕對路徑，改為透過 Git／GitHub Desktop clone 後進入含 Cargo.toml 的專案目錄，區分 repository 根目錄與 rust-practice 子目錄。補充 lesson 與課號需空格，以及獨立 -- 的用途。已檢查三平台章節、Markdown 程式碼區塊配對與無個人路徑。僅修改文件，不需重跑 Rust 測試；Windows／Linux 安裝仍未實機驗證。未製作壓縮包，未執行 commit／push。

下一步：GitHub 新讀者依 README 安裝完成後，執行 `cargo run -- lesson 1` 開始練習。

## ２０２６－１０－２１｜分為 Rust Beginner Course 與 Rust Advanced Course

### 已完成與檔案位置

原教材已移至 beginner，正式名稱為 Rust Beginner Course；README、完整教材、CLI、頁面及教材生成器均更新名稱。新課程位於 advanced，名稱為 Rust Advanced Course。根目錄 Cargo.toml 改為 workspace，預設成員 beginner，因此在 rust-practice 執行 `cargo run` 仍啟動入門課程。Cargo.lock 由 Cargo 更新，target 共用並持續忽略。

根 README 為雙課程總覽，保留 Windows／macOS／Linux 安裝說明。進階包含十二章理論與實作：規格契約、浮點表示、迴圈正確性、資源生命週期、借用、lifetime、資料建模、trait／泛型、iterator、錯誤邊界、並行與運動資料分析器。每章包含推理實驗、規格、測試、設計說明、提示、參考答案與官方閱讀來源。advanced/SYLLABUS.md 提供先修、課時與評量；各章在 advanced/lessons，合併讀本為 advanced/COURSE.md，起始程式為 examples/labNN.rs，答案為 solutions/labNN.rs。五個教材程式範例由 rustdoc 驗證。

使用者明確要求子代理協作，好讓其同時繼續討論與練習入門。子代理接手 advanced 終端入口、課綱整合及驗證；主代理整理雙課程入口、入門名稱、搬移完整性與總交接。

### 本次驗證

- 主代理實際執行 beginner 的 lesson 1、run 1，以及 workspace 根目錄 list，皆成功；目前第一課已有兩行輸出。
- 比對搬移前 Git HEAD：十二份入門練習內容全部相同，未重建或覆寫作答；使用者已開始自行練習，後續不得用 generator 重置 examples。
- 根、入門、進階三份 README 的相對連結及程式碼圍欄檢查通過。
- 子代理驗證進階十二份答案成功執行，共二十個測試通過；`cargo test -p rust-advanced-course --doc` 的五個範例通過，其中四個必須不能編譯。
- 子代理驗證十二章 lesson／hint／answer 共三十六個介面、無效課號／未知指令 exit 2；起始程式 run／test 的 todo 失敗退出碼 101 正確傳遞。
- 子代理驗證期末檔案、CRLF stdin 均產生 count=2、displacement=60、seconds=30、velocity=2；空輸入、第二行格式錯誤、缺檔、多參數皆 stderr 與 exit 1。
- 所有新程式僅用 Rust 標準函式庫，未安裝工具、未建立壓縮包、未 commit／push。Windows／Linux 未實機驗證，課程尚未試教；原頁面截圖為搬移前的歷史預覽，非新標題的 UI 驗證。

### 新啟動與續作

根目錄：`/Users/lvyunxiu/codex test/rust-practice`。

入門：`cd beginner`，`cargo run -- lesson 1`，編輯 examples/step01.rs，`cargo run -- run 1`。也可直接在 workspace 根目錄執行相同 Cargo 指令。

進階：workspace 根目錄執行 `cargo run -p rust-advanced-course -- lesson 1`；修改 advanced/examples/lab01.rs 後，執行 `cargo test -p rust-advanced-course --example lab01`。答案驗收用 `cargo test -p rust-advanced-course --example solution01`。起始 todo 測試初始會失敗，屬練習預期狀態。

維護：advanced/lessons/*.md 與 SYLLABUS.md 是進階教材來源；`python3 advanced/scripts/build.py` 只重建進階 COURSE.md，不碰學生作答。beginner/scripts/build.py 仍會覆寫入門練習，練習期間不要執行。兩套原始程式與設計說明透過 GitHub 管理；網頁筆記另存於瀏覽器，不與檔案同步。

下一步：使用者從入門第二課繼續，遇到不明白的語法可就當前程式討論。進階課程後續依實際閱讀與試教回饋補充圖解、追蹤表及題目難度；本版定位為大學程式設計／Rust 設計原理的基礎路線，不宣稱涵蓋完整 async、unsafe 或形式驗證。

## ２０２６－１０－２１｜每題 run 自動驗收

### 行為與實作

兩套課程的 `cargo run -- run N` 現在自動驗收作答，不再只啟動程式。入門可直接在 workspace 根目錄使用；進階加 `-p rust-advanced-course`。新增 `manual N` 保留原本手動互動；進階 manual 仍接受額外檔案參數。test N 保留學生程式自身的測試功能，與獨立驗收分開。

共用 runner/mod.rs 以本機 rustc 編譯目前純標準函式庫作答與獨立測試，不覆寫來源。輸入由 target 暫存檔提供且有 EOF，輸出捕捉避免 pipe buffer 死鎖；逐組檢查 stdout 及退出碼。一般比對統一 CRLF／LF、忽略末端換行。每組程式 3 秒、整組函式測試 10 秒、編譯 60 秒逾時後停止。暫存目錄依 PID 與時間區隔，完成後清除；診斷顯示最多 64 KiB。使用目前 Cargo 同環境的 rustc，不支援任意外部 crate 的通用編譯。

入門：checks/stepNN.rs 保存第五、七～十二課的獨立函式測試；src/checks.rs 保存前四課輸出政策與第六課七組 stdin 案例。第二課驗證印出的攝氏／華氏關係，因此使用者已改成 100.0 的作答可繼續通過。第一、三、四課僅驗證固定輸出或允許的延伸結果，不宣稱已測所有分支／證明演算法。第三課驗收假設 score=60；第四課接受 15 或 5050。第六課接受原始固定提示行或只有數值答案，浮點以容許誤差比較。README 完整說明限制。

進階：每題 checks/labNN.rs 提供獨立契約測試；第十二課另有四組成功／CRLF／格式錯／空資料 stdin 與退出碼檢查。相關 README、SYLLABUS、十二章及合併 COURSE 已更新。入門 COURSE 與 generator 也更新 run／manual 用法，但沒有執行會覆寫學生作答的 generator。

### 驗證

主代理使用 target 內臨時 probe，將入門十二份參考答案直接傳給 verify_source，全數通過：前四課輸出、第六課七組 stdin、十七個新函式測試加四個答案既有測試。實際使用者的 `run 2` 通過；尚未完成的 `run 8` 正確顯示非空集合失敗並 exit 1。沒有修改或重建任何 beginner／advanced examples，Git 亦未顯示這些作答檔被此次任務修改。

子代理直接驗證進階十二份參考答案，全數通過；二十三個新驗收測試加二十個既有測試共四十三個測試通過，另有四組 stdin／stdout／退出碼通過。進階 starter 自動 run 失敗為 exit 1，manual 保留 todo 的 exit 101；不合法額外 run 參數為 exit 2。五個教材 doctest 仍通過。

`python3 scripts/verify_runner.py` 已實跑通過，覆蓋 CRLF、EOF 正確關閉輸入、錯誤 stdout、異常退出碼、無限迴圈逾時及編譯失敗；測試用錯誤程式在 target 隔離目錄，驗證後清除。新增 scripts/verify_courses.py 可對兩套課程全部二十四份答案重跑相同驗收，仍不修改作答。Python 僅供維護者驗證，學生使用 Cargo 不需要 Python。

### 續作與邊界

學生照原本方式編輯 .rs，改用 run 驗收、manual 探索。驗收失敗顯示輸入／預期／實際，函式題顯示測試名稱與 assertion；成功 exit 0、作答失敗 exit 1、參數錯誤 exit 2。通過僅代表通過有限測試。Windows／Linux 自動驗收尚未實機驗證。未製作壓縮包、未 commit／push。

維護驗收資料時，請先修改 checks／src/checks.rs，再跑 verify_courses 與 verify_runner；新題若引入第三方 crates，需先調整 runner 的編譯機制，不能假定 rustc 單檔驗收仍適用。

補充驗證：新增的 `python3 scripts/verify_courses.py` 已完整實跑成功，輸出 All 24 reference solutions passed；不是僅建立未執行。根目錄 `cargo run -- help` 亦已確認顯示新的 run／manual 用法。最終 Git 檢查確認兩套 examples 無此次修改。
