# Rust Advanced Course

以 Rust 深入學習程式設計：從規格與正確性推理，走到所有權、型別建模、演算法成本與可靠終端機程式。先修與完整路線見 [SYLLABUS.md](SYLLABUS.md)，連續閱讀見 [COURSE.md](COURSE.md)。

本課接續新版 Beginner 單元０～１２；先完成三十九份實作與兩份專案設計，再按 [銜接檢查](PREREQUISITES.md)判斷是否需要複習。這裡深化規格、成本與設計推理，不必為進階語法延後入門的基本資料處理。

尚未安裝 Rust，請先依 [Windows／macOS／Linux 安裝說明](../beginner/README.md) 完成環境設定。本課程需要 Rust １．８５ 以上，建議 stable。

## 在終端機開始

以下先進入 advanced 資料夾，再操作課程；由 workspace 根目錄執行 `cd advanced`，若目前在 beginner 則執行 `cd ../advanced`。先用編輯器修改 `examples/lab01.rs`。

```sh
cargo run
cargo run -- list
cargo run -- lesson 1
cargo run -- hint 1
cargo run -- run 1
cargo run -- test 1
cargo run -- answer 1
```

課號為 １～１２。`lesson` 顯示理論、規格與驗收，保留提示與答案供後續查看。`--` 將後面的參數交給課程程式；`-p rust-advanced-course` 是選擇進階課程套件的 Cargo 選項。

所有起始程式都有待完成的 `todo!()`，所以尚未作答時執行或測試會失敗。參考答案可獨立執行與測試，不會覆寫你的程式：

```sh
cargo test --example solution01
cargo run --example solution01
```

第十二章接受檔案或標準輸入。課程入口的 `manual` 會把目前工作目錄保留給程式，並轉交額外參數：

```sh
cargo run -- manual 12 data/motion.csv
cargo run -- manual 12 -
cargo run --example solution12 -- data/motion.csv
```

stdin 模式輸入資料後，macOS／Linux 用 Ctrl+D 結束；Windows 通常用 Ctrl+Z 後 Enter。資料格式、錯誤退出碼及完整規格見 [第十二章](lessons/12.md)。`manual` 使用繼承的 stdin、stdout、stderr，並保留子程序失敗退出碼。

兩套課程現在統一 `test` 與 `run` 為自動驗收同義命令。要只執行自己檔案內的測試，使用原生 `cargo test --example lab01` 等；沒有找到測試不能視為完成課程。

## 自動驗收與手動模式

`cargo run -- run 1` 會自動編譯並檢查第一題，不需另外準備輸入。每章有至少十項獨立具名、不依賴學生檔案內測試的外部契約檢查，期末專案另檢查多組 stdin、stdout 及退出碼。成功退出碼為０，答案未通過為１。`run` 只接受課號；互動與檔案參數請使用 `manual`。

驗收保留學生作答，使用 workspace target 內的獨立暫存目錄。執行有逾時限制，但不是安全沙盒，僅適合你信任的練習程式。測試未涵蓋的輸入、演算法複雜度與設計品質，仍需人工推理與評量。輸出比較統一 CRLF 換行並忽略最後的換行，其餘空白、數值與行序仍需符合案例。

輸入輸出案例即使PASS，也會顯示實際stdin與stdout，多行內容逐行排列，空內容明確標為「（空）」。左側│是報告框線，不屬於程式輸出。檔案參數、非空stderr與非零退出碼也會列出；純函式契約仍顯示具名Rust測試結果。

完整清單見 [TEST_CASES.md](TEST_CASES.md)。第四章無參數且輸出固定，採十項契約性質檢查，並非十種不同輸入；其他章使用不同資料、邊界或型別實作。

## 學習成果與驗證

每章不只交可執行程式，也要交契約、設計理由與測試證據，評量比例及課程邊界見大綱。教材尚未試教，建議時間是規劃值。

```sh
cargo test --doc
python3 scripts/build.py
```

第一行驗證教材程式片段；第二行於教材改動後重建合併 Markdown，不修改學生作答。不要用整個 workspace 的測試全過作為初始安裝標準，因為起始習題故意尚未完成。

## 顯示課程總覽

先進入本課程資料夾，再執行：

```sh
cargo run -- lesson
```

不帶課號時列出本課程全部章節；要閱讀指定內容，接上課號，例如 `cargo run -- lesson 1`。原本 `cargo run`、`help` 與 `list` 仍可使用。
