# Rust 練習工作室交接日誌

## 目前基準｜２０２６－１０－２９全面重製版

以下歷史記錄保留決策過程；舊stepNN、舊補充節次、網頁筆記與先前審查文件均已由新版取代。請以本節與文末最新記錄續作，不依舊指令重建舊檔案。

- 主線：[Rust Beginner Course課綱](beginner/SYLLABUS.md)，單元０～１２，三十九份實作、四百三十項具名驗收；教材在beginner/units，登錄與案例在beginner/curriculum.json。第五單元已加入基本遞迴與5-4／5-5實作。
- 教師入口：[TEACHING_GUIDE.md](beginner/TEACHING_GUIDE.md)；教材使用GitHub Markdown，終端機編輯.rs；舊HTML介面已移除。
- 啟動：從workspace根目錄 `cd beginner`，再 `cargo run -- lesson`；`lesson 2`看單元、`lesson 2-1`看題目、`run 2-1`驗一題、`manual 2-1`手動執行。兩套課程的test皆與run同義；原生檔內測試用cargo test --example。
- ２０２６－１０－３０顯示更新：兩套課程的I/O案例在PASS時也列出實際stdin／stdout，多行逐行呈現，空內容標示（空）；│為報告框線，檔案參數、非空stderr與非零退出碼另顯示。判題規則不變。
- 第十二單元專案：beginner/projects/motion與gradebook，兩者都是workspace member；各有Cargo.toml、src/main.rs、DESIGN.md。`manual 12-1 data/motion.csv`可轉交檔案參數。
- Advanced保留十二章深化內容，同步新版先備與命令語意；銜接在advanced/PREREQUISITES.md。
- 維護：`python3 beginner/scripts/build.py`與`python3 advanced/scripts/build.py`不重置學生作答。根scripts的verify_courses、verify_readings、verify_runner、verify_documents檢查參考答案、教材與拒絕錯誤路徑；後者可加--check-generated隔離重建。
- 環境：macOS、rustc／cargo 1.99.0，學生只需Rust；Python僅供維護。未實跑Windows／Linux及最低Rust 1.85，未正式試教。未commit／push，未製作壓縮包或部署網站。

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

## ２０２６－１０－２１｜每題至少十項具名案例

### 本次完成

兩套二十四題皆已補到至少十項具名驗收。入門第五、七～十二課的外部函式測試已拆成各十至十五個獨立 #[test]；第六課十四筆 stdin。進階十二章共有一百二十七個外部具名測試，第十二章另有四筆 stdin。

不能製造假輸入來湊數：入門第一課為固定兩行輸出，使用十項輸出契約（完整文字、行數、順序、空白、控制字元、英文半形與中文字元數），部分相關；進階第四章 scope_trace 同樣是十項固定資源追蹤契約，不宣稱十筆不同輸入。相同程式、stdin 與參數的結果由驗收器共用一次執行，不是同一筆資料重跑十次。

入門第二～四課已從舊版單次輸出驗證升級：新增 beginner/src/variants.rs，只在 target 暫存副本替換 celsius、score 或 for 的範圍，公式／條件／累加內容保留學生作答。第二課十筆攝氏包含冰點、沸點、負溫、絕對零度與小數；第三課十筆成績包含 59／60／61；第四課十筆上限包含空範圍、單元素與 100。原始檔的設定完全不改。這項明示政策取代前文「不以副本改變初始值」的舊限制。

這個副本機制只支援原題基本結構，需保留 let celsius、let score 與 for ... in 1..=...；它不是完整 Rust 解析器。較自由的寫法仍可用 manual 執行，若要改題型須調整驗收。一般字串及註解的假變數不會被誤認；不支援的模板會回報缺少設定或編譯錯誤。進階課程以函式契約測試，不使用這種來源替換。

兩套 TEST_CASES.md 已逐題列案例、目的與預期 assertion，README／課綱／COURSE 與入門 generator 維護文字已同步，沒有執行會覆寫學生程式的入門 generator。runner 現在列出實際 Rust 測試數並依實際數量統計，沒有把整組十個測試顯示為 1/1，也拒絕把 0 tests 視為通過。

### 驗證證據

`python3 scripts/verify_courses.py` 全部通過，並新增強制檢查二十四題實際數量均至少十；外部 checks 每檔亦需至少十個獨立 #[test]，不讓參考答案內的舊測試掩蓋缺少外部案例。參考答案實際驗收總數（含原檔既有測試及 I/O）如下：

| 課程／題號 | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Beginner | 10 | 10 | 10 | 10 | 10 | 14 | 11 | 11 | 10 | 15 | 12 | 18 |
| Advanced | 12 | 13 | 12 | 11 | 12 | 12 | 12 | 11 | 12 | 12 | 12 | 20 |

共二百九十二項執行通過，數字包含原本測試與相關契約性質，不宣稱全都是獨立輸入。

`cargo test -p rust-beginner-course --bin rust-beginner-course --offline` 四個副本處理回歸測試通過，涵蓋註解、字串、mut 初始值、範圍與未支援模板。`python3 scripts/verify_runner.py` 再次實跑通過，新增刻意錯誤答案：華氏硬編碼、score > 60、累加零，均被多筆資料抓出；另保留 CRLF、EOF、錯誤輸出、退出碼、無限迴圈與語法錯誤測試。實際使用者的 run 2 顯示 10/10。

最終 Git 檢查：beginner／advanced 的 examples 與 solutions 皆無本次修改。未安裝工具、未製作壓縮包、未 commit／push。

### 續作

學生指令保持 `cargo run -- run N`（入門）及 `cargo run -p rust-advanced-course -- run N`（進階）；manual N 手動探索。維護案例後執行 verify_courses 與 verify_runner，並更新 TEST_CASES.md。Windows／Linux 仍未實機驗證；有限案例與彼此相關的契約檢查不是一般性正確性證明。

## ２０２６－１０－２８｜依資料夾選擇課程

移除 workspace 的 default-members=[beginner]，根目錄不再默認啟動入門課程。學習者先進入 beginner 或 advanced，再使用相同的 `cargo run -- lesson N`／run／manual 指令；根目錄仍允許用 -p 明確選擇課程。未增加會攔截 Cargo 的根程式或自訂包裝器，根目錄不指定 -p 時使用 Cargo 原生的多 binary 選擇錯誤。

已同步根 README、兩課程 README、CLI 提示、進階大綱及十二章範例，進階資料檔路徑改為在 advanced 內的 data/motion.csv，維護腳本改為 scripts/build.py。已用進階非破壞性 build 重建 COURSE；入門僅改教材與 generator 文字，未執行會覆寫學生作答的 generator。

驗證：根目錄直接 cargo run -- lesson 1 正確拒絕自動選課；beginner 與 advanced 中的 cargo run 及 lesson 1 皆通過；根目錄明確 -p 選擇兩套課程也通過。本次為入口選擇與說明調整，未改判題邏輯，不重跑既有全部答案測試。使用者持續修改 beginner/examples/step03.rs、step04.rs，本次未接觸這些作答。未 commit、push 或建立壓縮包。

續作：workspace 根目錄先 cd beginner；切換到進階使用 cd ../advanced。每個課程資料夾中的 examples 與 lesson 課號相互對應。Windows／Linux 新入口仍未實機驗證。

## ２０２６－１０－２８｜第四課 for 迴圈子題

### 完成與設計

新增 4-1 到 4-7：範圍輸出、偶數加總、倍數計數／continue、rev 倒數、break 找第一個達門檻的平方、巢狀迴圈乘法表、陣列／enumerate。每題有 beginner/lessons/04-N.md、examples/step04_0N.rs 與 solutions/step04_0N.rs。所有起始程式可編譯但輸出待完成，學生不需提前學函式或鍵盤輸入。既有 step04.rs 完整保留，未改動使用者已完成的 total += n。

CLI 的 lesson／hint／run／manual／test／answer 都接受 4-1 等課號。子題 test 是自動驗收別名，避免 main 沒有 unit test 而顯示零測試；原主課 test 行為不改。list／help 與 lesson 4 列出子題。學習者在 beginner 資料夾執行；根目錄仍沒有預設課程。

beginner/lessons/sublessons.json 是可擴充的子題 registry 與測資來源，七題共七十筆不同參數。新增 scripts/build_sublessons.py（非破壞性）生成 src/sublessons_data.rs 與 lessons/SUBLESSON_TEST_CASES.md，不覆寫學生檔案。src/sublessons.rs 負責讀題與執行，沿用共用 runner；variants.rs 新增多個 let 設定的副本替換，並修正含內部分號的陣列重複初始值之結尾辨識。空陣列、空範圍、不同表格維度及搜尋無解都有案例。

Cargo 登錄 answer04_01 到 answer04_07；主 generator 亦會保留這些登錄，但未執行會覆寫既有練習的 build.py。README、COURSE 及案例目錄已補上子題入口。子代理只建立新題目／答案／教材，主代理處理 CLI、測資、副本機制、維護腳本、文件與交接。

### 驗證

- scripts/verify_courses.py 已擴為原本二十四題加七子題，共三十一份參考答案，全部通過；每份實際驗收數至少十。
- 新增七十筆子題資料均驗證通過，參數組合互異且每題至少十筆，由 build_sublessons.py 強制檢查。
- beginner binary 七個 unit tests 通過：課號解析及錯誤格式、原本副本功能，以及含內部分號的陣列初始值替換。
- 七題 lesson／hint／answer／manual／run 均實際操作；lesson 不顯示參考解法，預期結果僅顯示一次。manual 起始輸出待完成、exit 0，run 正確 FAIL、exit 1；test 4-1 同樣 FAIL；未知 4-8 為 exit 2。
- 所有七份 Cargo answer04_0N 均成功執行，預設 stdout 與各題規格一致；lesson 4 及 help 可看到子題。
- 未修改學生既有 examples/step01..12 或既有 solutions；Git 中 step03／step04 的差異為使用者本來的作答，沒有回復或覆寫。沒有 commit／push 或壓縮包。

### 啟動與續作

在 beginner 執行 `cargo run -- lesson 4-1`，編輯 examples/step04_01.rs，存檔後 `cargo run -- run 4-1`。使用 hint／manual／answer 搭配相同子題號；下一題改成 4-2。副本評測要求保留題目提供的 let 參數名稱；不會要求學生先學 read_line。4-7 的最小陣列與 enumerate 概念由該題就地介紹。

維護新子題時，在 sublessons.json 註冊、提供教材與程式，執行 build_sublessons.py，再執行根 scripts/verify_courses.py。目前驗證腳本的已知題數為十九入門（含七子題）加十二進階；若繼續增題應同步改驗證筆數。Windows／Linux 仍未實機驗證。

## ２０２６－１０－２８｜第五課先教 assert! 再要求使用

使用者指出第五課要求 assert!，前面卻未介紹。新增 beginner/lessons/05-assert.md，放在第五課任務與起始程式之前：由 bool 條件、assert! 語法與訊息、true 繼續／false 觸發 panic，搭配兩個完整 main 示範，再解釋函式前置條件、與 if／使用者錯誤處理的區別、為何先檢查才除法，以及預期 panic 的驗收意義。特別說明浮點除零可能產生無限大／NaN，不會自動替本題拒絕零秒；一般 assert! 在 release 也會檢查。

同步 COURSE.md、lessons.js、網頁 preparation 顯示、README 與 scripts/build.py。生成器新增 preparation 欄位並讀取補課文件，確保未來重建仍先教再練。本次只更新第五課教材與來源，不執行會覆寫作答的 generator；既有學生 step05.rs 已完成 assert 與公式，保留原樣。

驗證：cargo run -- lesson 5 的補課在任務之前，沒有提前顯示參考答案；成功示範編譯後印兩行，失敗示範可編譯但執行只印第一行並觸發指定訊息；-O 最佳化版本亦正確觸發 assert。cargo run -- run 5 十項驗收全過。所有既有 examples／solutions 在修改前後的 SHA-256 相同。app.js 通過 node --check、生成器通過 AST 檢查；網頁資料與顯示來源已同步，本次未重新進行瀏覽器 UI 操作驗證。

官方 assert! 文件已於本次查核：https://doc.rust-lang.org/std/macro.assert.html 。沒有新增待作答題目、修改評測要求或安裝工具，也未 commit／push。下一步：在 beginner 重新執行 cargo run -- lesson 5，先讀補課再練；後續新語法也應在任務前說明用途與執行行為。

## ２０２６－１０－２８｜第五課拆分為 5-1 主線與 5-2 補充

依使用者調整，將第五課長段 assert 補課移出主線。lesson 5 現在只顯示兩個入口；5-1 為原本函式與速度實作，模板直接提供 assert! 並要求完成回傳公式；5-2 集中講解 assert!、assert_eq!、assert_ne!、panic! 與 debug_assert!。新檔為 lessons/05-1.md、05-2.md、05-overview.md；05-assert.md 保留為指向新位置的說明。

5-1 沿用 examples/step05.rs、solutions/step05.rs 及 checks/step05.rs 十項驗收，不搬移或另建作答。run 5-1／test 5-1 共用原測試；manual／hint／answer 5-1 正常使用。舊 run 5／manual 5 保留，hint／answer 5 指向 5-1。5-2 是閱讀教材，不列為實作題、不需要十筆測資、不產生假造的驗收；對它執行 run／test／manual／answer／hint 會給閱讀指引。

sublessons registry 新增 Variants／Main／Reading 類型，明確區分七個迴圈子題、主課實作別名與補充閱讀。build_sublessons.py 生成九個閱讀入口，但仍只有原七個迴圈實作的七十筆新資料。verify_courses.py 只把 Variants 計為額外實作，避免將第五課別名重複算一次或把補充閱讀當成測試。原本三十一份獨立參考答案數不變。

同步 README、COURSE、網頁課程資料與生成來源；主 generator 的第五課以 overview 組裝，不再重新插入補課。初始模板加入 assert!，但本次未執行會覆寫學生作答的 generator；所有既有 examples／solutions 在修改前後的 SHA-256 相同。

驗證：第五課總覽、5-1 實作與5-2閱讀全部實跑；5-1 run／test 十項通過，補充章的所有非 lesson 指令不會顯示通過數；lesson 4 不誤列第五課分節，未知5-3為exit2。四個完整示範程式已編譯執行，成功／預期失敗符合說明；八個CLI／副本單元測試通過。全三十一份參考答案驗證再次通過。Markdown連結檢查修正 overview 來源與合併文件之相對路徑差異；app.js語法檢查通過，未重做瀏覽器UI測試。assert_eq／assert_ne／debug_assert官方文件已查核。

續作：beginner 內 `cargo run -- lesson 5-1` 做原本函式題，以 run 5-1 驗收；`cargo run -- lesson 5-2` 閱讀補充。未 commit／push，未打包。

## ２０２６－１０－２８｜Beginner 教學銜接只讀審查

使用者要求先列出其他課程的斷層，待其確認是否補充。本次只讀 COURSE、第四課子題、5-1／5-2、README、答案與驗收，沒有改動教材、作答、判題或生成器。子代理協助審查第六至十二課，主代理對照前置課與子題，避免把已教但簡略的內容誤報為完全未教。

補充候選：第二課輸出佔位符與變數型別／賦值；第三課 if 表達式與分號；4-7 陣列／配對解構／方法鏈雖已提及但可深化；5-1 函式呼叫、參數與回傳流程；第六課輸入模板與 Result／match 解析；第七課 String／&String／&str 與移動借用；第八課集合／切片／Option，以及 sum::<i32>、as f64、提早 return；第九課 struct／實例／impl／&self；第十課 map_err／closure／? 與布林運算；第十一課測試框架及浮點容許誤差；第十二課 Debug／into 等簡寫與非有限總和的完整驗收契約。最優先建議第六、八、十、十一課，其次第七課。

已明確排除誤報：5-2 已介紹 assert_eq／assert_ne，不再視為未教；4-2已解釋餘數、4-3已解釋continue、4-4已解釋rev、4-6已解釋print及巢狀迴圈，這些不需再列成缺課。4-7已簡述array／iter／enumerate／配對，屬學習負載偏高而非完全沒教。另用target暫存檔實際編譯確認4-7的空陣列 as [i32;0] 示範合法，未錯列為程式錯誤，暫存已清除。

附帶發現：COURSE 第零步仍有回到 rust-practice 根目錄的舊指示，與現行須進入 beginner／advanced 的 README 不一致；這是操作文件同步問題，先向使用者列出，未擅自修改。

驗證範圍為教材靜態銜接審查，不是學生試教或學習成效實驗；未重跑無關的全套測試。下一步等待使用者挑選要補的主題，再依其選擇新增補充節次，保留現有作答。未 commit／push。

## ２０２６－１０－２８｜lesson 無課號顯示總覽

兩套 CLI 新增 `cargo run -- lesson`：不帶課號時顯示目前課程完整章節；beginner 亦列出所有子題（4-1～4-7、5-1、5-2）。抽出 overview 供 help 共用；lesson X 仍顯示指定內容。README 已同步。

實測兩套課程的空課號 lesson、lesson 1、help、list、原本無參數 cargo run 均成功；hint 缺課號、lesson 多參數與未知99仍回傳exit2。workspace根目錄仍由Cargo要求明確選擇課程，不會預設進入入門。沒有更動教材內容、學生作答或驗收規則，也未補上仍待使用者確認的銜接教材。

續作：cd beginner 或 cd advanced，執行 cargo run -- lesson 選章節，再接上課號閱讀。未 commit／push。

## ２０２６－１０－２８｜補齊 Beginner 全部銜接教材

### 課程內容

使用者已確認補上先前審查項目。新增十九節補充閱讀：2-1輸出格式、2-2變數型別與作用域、3-1if表達式／分號／布林運算、4-8陣列方法與配對、5-3函式呼叫與回傳、6-1輸入模板、6-2parse與match、7-1所有權移動複製、7-2文字型別借用與Unicode長度、8-1集合與切片、8-2Option、8-3逐步平均值與iterator對照、9-1struct與方法、10-1完整match的Result、10-2?／map_err／closure、11-1測試模板、11-2浮點誤差、12-1期末簡寫、12-2完整數值契約。加上原有5-2，現在共有二十節Reading。

每節有模型、展開或追蹤表、完整示範、預期與自我檢核答案；不是只補術語清單。主線仍用原 examples/stepNN.rs；沒有增加待繳交的實作，也不假報十筆測資。七個第四課實作子題及原三十一份獨立參考解法均保留。兩位子代理只撰寫指定補充md，主代理負責其他前段教材、閱讀路線、生成器與驗證整合。

主線任務前新增閱讀路線，CLI lesson總覽以【補充】【練習】【實作入口】區分節次，lesson N 列出相關子節。Reading的非lesson指令會回到自己的主課，不再一律導向5-1。第八課提示改成先for逐步加總再比較sum；第十課先完整match再簡寫；第十二課明寫總和及最後比值也需有限。零步操作已修正到 beginner，與目前 workspace 設計一致。

### 維護結構與安全重建

主線文字來源已從長串Python常值抽出至 beginner/lessons/main/01.md..12.md；補充仍在 lessons/NN-part.md；原始模板資料為 lessons/course_data.json；登錄為 lessons/sublessons.json。新版 scripts/build.py 預設只重建 COURSE.md、lessons.js 及登錄／案例清單，保留所有作答與答案；只有顯式 --reset-exercises 才會重置主線程式。這項新行為取代前文不能在作答中執行build.py的舊警告，README已同步。

合併教材會依各來源位置改寫相對連結，確保單獨Markdown與COURSE都能閱讀。網站資料的閱讀路線同步指向新節次，但本次未重新進行瀏覽器UI操作驗證；app.js語法已檢查。

### 實際驗證

- 新增 scripts/verify_readings.py，涵蓋目前全部二十節補充。五十七個Rust示範編譯並執行成功（其中一個如預期panic），三個compile_fail反例確實拒絕編譯，三組內嵌測試通過。子代理另對輸入示範餵入25與abc、對後段範例以bin與test雙模式確認。
- scripts/verify_courses.py：全部三十一份既有參考解法再次通過，每題至少十項驗收。
- Beginner binary八項CLI／副本單元測試通過；新增3-1與4-8已是合法節次，舊的非法課號測試改為真正不存在的3-99與4-99。
- 二十節Reading均實際用lesson讀取，並確認run不顯示假的通過數且指回正確父章；十二個主課lesson均可閱讀且不提前洩漏參考答案。所有教材Markdown圍欄與內部連結通過。
- 以預設build.py前後即時雜湊比較，所有examples與solutions完全相同，證明正常重建不覆寫作答。任務期間使用者自行完成／修改step04_07.rs，並有編輯器swap檔；沒有回復、刪除或覆寫這些使用者狀態。從任務開始到結束，只有使用者正在編輯的該作答雜湊改變，其餘既有程式未改。

### 續作

在 beginner 執行 cargo run -- lesson 查看全路線；例如先 lesson 6-1、6-2 再回主課6，先8-1／8-2／8-3再做平均值，先10-1再10-2，先11-1再11-2。閱讀不要求交作業；原run N驗收保持。修改教材後可直接執行python3 scripts/build.py安全重建，再於workspace根目錄執行scripts/verify_readings.py及scripts/verify_courses.py。

尚未正式試教或在Windows／Linux實機驗證；新增深度後時數須依學生節奏調整，已移除合併教材中把每課三十至五十分鐘視為固定時程的描述。未commit／push，未建立壓縮包，未更新跨任務記憶。

## ２０２６－１０－２９｜以一般程式設計課為目標的 Beginner 盤點

使用者希望將一般 C++／Python 程式設計課轉為 Rust，而非只學會本專案範例。新增 beginner/CURRICULUM_REVIEW.md，逐課盤點第零至十二課、全部二十八個子節登錄，區分現有能力、先備順序、操作練習與新目標所需主題。確認十二個主線加七個迴圈實作，共十九份獨立作答；二十節 Reading；5-1 為別名，不重複算實作。

主要發現：5-1／5-2／5-3 編號順序不是先備順序；第六課暫用的 &mut 尚未在第七課完成核心模型；多個必讀補充直接給出原題完整解法，缺少不同情境的遷移作業；尚缺 while／loop、多筆輸入與重試／EOF、可變借用、集合修改與字串處理實作、一般集合搜尋排序、基本 enum、正式檔案與模組教學，以及從空白專案整合資料流程的結業任務。已有 push／索引／解參照與範圍搜尋的局部示範，不誤報為完全未教。HashMap／HashSet、遞迴依課綱時數定位，不把所有大學或 Python／C++ 課綱視為同一份要求。

驗收範圍實驗：在 target 下建立暫存解法，沿用真正 checks::verify_source，未編輯學生檔案。第七課正確 count 加空 main 仍十一項通過；第九課正確 Motion::speed 加空 main 仍十項通過；第十一課正確公式、空 main、僅起始 freezing 測試仍十二項通過。這證明函式驗收未覆蓋學生 main 的輸出／新增資料與自行新增測試要求；並非指函式測試無效。暫存程式自動清除，本機紀錄 target/curriculum-audit-probe.log，完整實驗設定與結果已寫入審查文件，不依賴忽略檔交接。

參考官方 Rust 借用、Vec 與命令列 I/O 專案，以及 Harvard CS50P、MIT 二〇一一年 C++ 入門課目標、Python Tutorial。來源連結與比較限制列於審查文件。未把舊 C++ 課綱安裝資訊當現行安裝指南，亦標明 Python Tutorial 原先預設已有程式經驗。

驗證：審查文件全部本機 Markdown 連結存在，全部二十八個子節 ID 均有涵蓋，登錄數量與分類核對通過。此任務只有盤點與新增審查／交接文件，未改課程、作答、答案、判題或重建器；沒有重跑無關的全套參考答案測試。未試教，未 commit／push。

續作：先依 CURRICULUM_REVIEW.md 確認必修範圍與優先順序，再實作課程改版。優先處理先備動線、必讀／選讀、示範與作業分離，以及互動輸入、可變借用、集合與獨立任務。保持既有作答可用，不直接重編號或覆寫學生檔案。學習者仍進入 beginner，執行 cargo run -- lesson 查看現有課程；新審查文件不是已新增的可執行章節。

## ２０２６－１０－２９｜十三單元正式程式設計課程重製

### 授權與範圍

使用者明確授權刪除原檔案重製，將專案用途由個人入門練習提升為課程設計，主線固定單元０加原先討論的十二單元，可自行拆小節。本次依此替換舊Beginner教材、作答、答案、判題與網頁資產；不保留舊stepNN作答作為新版學生狀態，也沒有把刪除範圍擴及其他專案。先前CURRICULUM_REVIEW已被新課綱與教師指南吸收，該舊盤點文件退場。

### 完成的課程與檔案

- units/00.md～12.md為十三個完整單元，約四千行教材，含學習成果、先備、小節、設計理由、完整示範、追蹤、反例、自我檢核及官方來源。示範採不同於作業的問題，沒有直接把原作業全解放在必讀正文。
- 三十七份作業：十六份程式輸入輸出、十七份函式契約、兩份測試設計、兩份獨立整合專案。每份至少十項具名檢查，共四百零三項。第一題固定輸出與測試設計題清楚標示性質，不宣稱四百零三種鍵盤輸入。
- 單元０正式解釋cargo run -- lesson 1各token、一般編譯與執行、專案目錄與workspace；三平台安裝均可在GitHub未安裝Rust前閱讀。
- 第二～四單元使用已提供的support::read_i64/read_f64，以真實stdin做驗收；第五單元回收函式，第六單元拆解輸入，第七單元回收可變借用。第五單元先用整數建立測試習慣，十一單元深化測試品質。
- 補入多分支、while／loop、EOF與重試、多值多行、修改借用與集合、Unicode、搜尋排序、HashMap、enum與狀態模型、正式檔案讀寫與模組。詳細trait、生命週期及並行留在Advanced。
- 第十一單元學生編寫測試，正確版須通過、九個故障版須被抓到；零測試、永遠失敗、編譯失敗與逾時不冒充有效測試。
- 兩個第十二單元獨立Cargo專案分別分析有號位移／時間與同名成績；來源為stdin或檔案，檢查stdout、stderr、退出碼、行號、非UTF8檔案、格式、領域與數值範圍。兩份各二十組資料。學生自行拆模組並完成DESIGN；人工評量另看推理、分工、自訂測試及成本。
- 新增SYLLABUS與TEACHING_GUIDE，重寫根與Beginner README，COURSE與TEST_CASES由安全builder生成。curriculum.json為登錄與獨立案例規格；templates為起始備份；solutions與學生作答分離。正常build不覆寫以上來源，也不提供預設整體重置。
- Advanced十二章原有深入理論與實作保留，更新先備與銜接檢查、重新合併COURSE；兩套課程統一test為run別名，原生Cargo檔內測試仍可使用。

### 獨立審查與修正

兩位既有子代理分工撰寫教材與驗證工具，主代理負責全部作業／案例／答案、專案、CLI、判題器、整合與交接。另行只讀審查找出enumerate舊先備假設、split/collect未拆解、Read匯入與if let首次集中、todo未解釋；皆已補最小示範與說明，不以更多進階語法補洞。文件中的作業連結統一不帶前導零。

### 實際驗證

- scripts/verify_courses.py：Beginner三十七份參考程式四百零三項全過；Advanced十二份一百五十一項全過，共四十九份、五百五十四項。包含函式、I/O、性質與故障版，不把總數當成獨立輸入數。
- scripts/verify_readings.py：九十四個Rust圍欄，八十份完整程式實際編譯執行，九十三種執行情境（含一個預期panic）；十四個compile_fail正確拒絕；三組內嵌測試共六項通過。二十五個非Rust圍欄明列SKIP，不計通過。輸入、EOF、重試、檔案、缺檔、參數與寫檔錯誤有實際情境；普通示範未逐條比對所有敘述stdout。
- scripts/verify_documents.py --check-generated：七十五份現行canonical文件、一百六十六個本機連結、二百一十七個圍欄、十三單元與三十七作業規格檢查通過；Advanced十二份外部契約結構每份至少十項。兩份COURSE排除於canonical計數，HANDOFF歷史也不當現行教材。
- 上述文件驗證在target隔離副本執行builder兩次，二十一份衍生檔具冪等性且與本版一致，一百四十六個保護來源雜湊未變；另在真checkout前後即時比較一百二十七份作答／模板／答案檔，正常build逐位元保持。
- scripts/verify_runner.py：真實判題器接受正確問候，拒絕錯誤輸出、多餘stderr、錯誤退出碼、無限迴圈、語法錯誤、NaN、零學生測試、弱測試與永遠失敗測試；Advanced舊執行器EOF、CRLF與退出碼路徑仍正確。
- Beginner binary六個單元測試通過，含空stdout必須真正為空、數值拒絕非有限與額外文字、CRLF與空白、課號；Advanced五個doctest（含四編譯失敗例）通過。
- 實際CLI：十三個單元與三十七份lesson／hint／answer入口可讀；無效課號、多餘參數、未知命令為exit2；workspace根目錄不會默認選課。manual試跑第十一課正確版弱測試會過，但完整故障版驗收會拒絕，與教學目標一致。
- 原生Cargo實跑answer6_2的重試序列，以及兩份專案的資料檔，stdout與退出碼符合契約；Beginner起始1-1如預期FAIL，兩套run／test行為一致。
- cargo check --workspace --all-targets --offline、cargo fmt --all -- --check、git diff --check通過。起始程式尚未完成的未使用變數等警告屬預期，不能據此宣稱已完成作答。

### 續作與邊界

從beginner/SYLLABUS.md與TEACHING_GUIDE.md檢視課程設計；在beginner執行cargo run -- lesson選單元，先讀完整概念再做lesson N-M。修改教材或案例後跑build與四支verify；更改判題或程式才重跑相關全套。學生作答直接編輯題目指定.rs；不再使用舊stepNN或網頁localStorage筆記。

目前環境macOS、rustc 1.99.0、cargo 1.99.0；Rust 2024最低工具鏈是教材要求，沒有另裝1.85實跑。Windows／Linux尚未實機驗證，外網URL與頁內anchor未由本機連結腳本驗證，沒有正式試教或學習成效校準。有限測試不能評完演算法推理與設計品質。沒有安裝工具、建立壓縮包、commit、push或部署外部網站；未修改跨任務記憶。

## ２０２６－１０－３０｜通過測資也顯示實際程式輸出

使用者指出2-2驗收只看到PASS與案例名稱，無法觀察輸出樣式。共用runner新增成功案例的輸入輸出報告，Beginner的runner/course.rs與Advanced沿用的runner/mod.rs皆接入。每筆PASS顯示實際stdin與stdout；內容按行排列，保留頭尾空白，│只屬報告框線；空字串與空白行分別顯示，避免把沒有輸出與印一個換行混淆。CRLF轉成一般顯示換行，tab、單獨CR與終端控制字元以跳脫文字顯示，不讓控制碼破壞報告。檔案題顯示args，非空stderr及非零退出碼也列出。既有失敗診斷與判題規則維持。

兩套README補上說明，Beginner提供3661秒的實際顯示例。更新verify_runner，對公開判題流程新增2-2、4-5與12-1參考答案檢查，並斷言PASS報告包含真實單行、多行、空stdout、檔案參數及預期錯誤stderr／退出碼，另確認Advanced共用路徑的CRLF／EOF顯示。

驗證：Beginner binary九項單元測試通過（新增三項報告契約）；使用目前學生的2-2作答實跑cargo run -- run 2-2，十筆全部PASS且顯示每組stdout，例如3661→1 1 1、100000→27 46 40。scripts/verify_runner.py全部回歸通過，包含既有錯誤拒絕與逾時；scripts/verify_documents.py現行文件與案例檢查通過；git diff --check通過。本次只改顯示、README與對應回歸，不重跑未變更的全部參考解法或教材程式。

本次未編輯學生作答。任務開始時已有unit01_01.rs、unit02_01.rs、unit02_02.rs的學生修改，以及未追蹤的examples/unit01_01執行檔，均保留，沒有清除或重置。未commit／push。續作：在beginner重新執行cargo run -- run 2-2即可看到新報告，其他I/O題自動套用；函式契約仍回報Rust具名測試，不假造未執行main的stdout。Windows／Linux尚未實機驗證本次終端顯示。

## ２０２６－１０－３０｜釐清單檔rustc與課程函式庫連結

使用者在beginner/examples執行rustc unit04_04.rs，遇到E0433找不到rust_beginner_course。原因為第二～四單元依賴本課src/lib.rs提供的support輸入工具，直接rustc不會自動建置及連結它；編譯器提示extern crate不代表加一行就能完成連結，也不需要下載第三方同名套件。

README與units/00新增具體排除方式、獨立標準函式庫程式的rustc --edition=2024示例，以及Cargo在examples向上找到Cargo.toml的行為。手動執行cargo run --example unit04_04、只編譯cargo build --example unit04_04、自動對答案cargo run -- run 4-4，日常無需手動--extern。安全build同步COURSE。

實際在使用者同樣的beginner/examples位置，以目前作答分別執行原生Cargo與課程manual 4-4，輸入1皆成功輸出1，作答SHA-256前後相同。這項驗證只確認建置、連結與這一筆手動輸入，不宣稱4-4演算法已符合全部案例。verify_documents及git diff --check通過；沒有修改任何學生程式、安裝套件或commit／push。

## ２０２６－１０－３０｜重寫5-2作業的回傳與輸出規格

使用者指出5-2敘述讓學習者不知道要輸出什麼。本次將題名改為「把數值限制在範圍內」，重寫exercises/5-2.md：以音量限制說明clamp用途，逐項定義value／low／high／回傳型別，明列低於／範圍內／高於時的回傳，端點、負範圍與low==high皆合法，low>high必須assert panic；不要求讀鍵盤、在函式裡println或特定panic文字。

題目新增八個呼叫與預期行為，並附可自行替換main的三次呼叫示例及實際stdout 0／5／10三行。說清楚main留空時manual無輸出屬正常、run直接驗函式回傳與預期panic，main觀察示範不是額外評分要求。沒有提供clamp完整實作。同步curriculum題名、單元５作業導引，安全build更新COURSE／CLI目錄／案例標題。

驗證：使用目前學生clamp作答建立target暫存呼叫器，實際印出0、5、10；run 5-2十項通過。CLI lesson 5-2已顯示新敘述與範例；verify_documents及git diff --check通過。build前後即時比對作答、模板、答案、學生測試與專案檔案雜湊，均未變更；本次未修改學生已完成的函式或main。驗收規則及十項資料不變，未commit／push。

續作：beginner內重新cargo run -- lesson 5-2即可閱讀完整規格；想目視輸出時自行使用題目的可選main，作業仍以cargo run -- run 5-2驗收函式。

## ２０２６－１０－３０｜題面公開範例限制為兩組

使用者要求各題呼叫範例與預期回傳只給兩組，以保留自行推演的難度。本次統一Beginner三十七份題面：三十六題各兩組，1-1只有固定輸出而無可變輸入，保留一組，不編造第二種要求。程式題清楚列stdin／stdout，函式題列呼叫與預期回傳或狀態，專案題另標stderr與退出碼。保留完整規格與資料範圍，不靠隱藏需求增加難度。

5-2原八組呼叫刪減為兩組，main觀察示範也只重用相同兩組，預期stdout為10／15兩行，避免題面之外再提供第三組。其他題目原來沒有例子的地方改為兩組具體範例，不再要求先去完整TEST_CASES挑資料。第十一課的公開範例只顯示兩個正確函式結果，其他測試仍由學生自行設計。

TEACHING_GUIDE與README記錄題面最多兩組、講義概念示範按需要、驗收每題仍至少十項的區分。verify_documents加入公開範例標題數量檢查，避免未來維護又增加過多已揭露案例。Advanced目前實作規格沒有超過兩組的呼叫／預期範例表，沒有為此刪除其必要理論、資料契約或推理活動。

驗證：三十七份題面公開範例數符合規則；verify_documents --check-generated通過，仍為十三單元、三十七題、四百零三項具名驗收，隔離重建具冪等性且保護來源未變；git diff --check通過。單元正文與實作邏輯未變，不重跑全部解法／教材執行。題面修改前後對學生作答、模板、答案、測試作答與專案檔案做雜湊比較，均相同。curriculum驗收資料與判題規則未減少，run仍顯示執行結果。未commit／push。

續作：重新cargo run -- lesson 5-2或其他N-M即可看兩組題面例子；教師新增題目沿用同一範例上限，其他邊界讓學習者推演。完整測資目錄仍供維護查核與驗收後比對。

## ２０２６－１０－３０｜第五單元加入正式遞迴教材與實作

使用者確認補充遞迴，將先前課綱的選擇性擴充改為Beginner正式必讀。單元５新增5.10～5.14：遞迴與基底情況、獨立參數及呼叫堆疊、逐層返回、終止進展、遞迴與迴圈的工作／額外空間比較，以及階乘和歐幾里得演算法的數學模型。完整示範使用分層點數累加，沒有提供兩份作業全解；明確討論堆疊有限、不依賴尾呼叫最佳化，以及遞迴不一定更快。

新增5-4 factorial(n:u32)->u64與5-5 gcd(a:u64,b:u64)->u64，各有作答、起始模板、答案、題面與獨立驗收。階乘合法範圍0～20，超出必須先assert panic，十三項資料；gcd接受全部u64、零、兩者皆零（API約定0），十四項資料。獨立預期由Python math.factorial／math.gcd產生後明列於curriculum.json，非使用學生函式自算答案。兩題各只列兩組公開範例，main可留空，回傳與stdout分清楚。

題目要求採用遞迴；自動驗收只證明目前函式結果及契約，是否遞迴及能否說明終止／返回另由程式閱讀與呼叫追蹤評量，不以搜尋字樣假造設計驗證。保留舊5-1～5-3與所有已完成作答。同步課綱、教師指南、兩套README的課程數、Advanced先備與銜接、CLI登錄、兩套COURSE與案例清單。現在Beginner三十九題、四百三十項；原本三十七題的案例未減少或改動。

驗證：verify_courses全部通過，Beginner三十九份／四百三十項，Advanced十二份／一百五十一項。verify_readings九十六個Rust圍欄中八十二份完整程式、九十五種執行情境、十四個預期編譯失敗與三組六項測試通過；二十八個非Rust圍欄明列SKIP。新示範的遞迴與迴圈版本皆assert相同結果。verify_documents --check-generated通過：兩題各兩組公開範例、二十三份衍生檔重建具冪等性，一百五十二個保護來源未改。

實際CLI lesson 5及5-4／5-5可讀，新起始TODO題驗收如預期exit1；原生answer5_4輸出120、answer5_5輸出6。cargo check --workspace --all-targets --offline通過；新檔及生成Rust檔的rustfmt --check、git diff --check通過。全workspace fmt檢查指出使用者既有unit03_03與unit04_04格式差異，未擅自格式化這些作答。另對全部作答／模板／答案／測試作答／專案做正常builder前後雜湊比對，皆相同。

續作：在beginner先cargo run -- lesson 5讀新增5.10～5.14，再lesson 5-4／5-5讀題；編輯examples/unit05_04.rs／unit05_05.rs，run同課號驗收。全套課程數已同步為三十九，後續再增題時繼續更新活躍課綱與驗證，歷史日誌保留原計數。未commit／push、未安裝工具、未改跨任務記憶；尚未試教或做Windows／Linux實機驗證。
