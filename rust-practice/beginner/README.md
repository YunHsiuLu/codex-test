# Rust Beginner Course

以零程式經驗為起點的程式設計課，單元０～１２、三十七份實作。使用 GitHub Markdown 閱讀，以本機終端機作答；目標是能自行拆解、實作、測試小型應用程式。

[課綱](SYLLABUS.md)｜[完整教材](COURSE.md)｜[驗收案例](TEST_CASES.md)｜[教師指南](TEACHING_GUIDE.md)

## Windows／macOS／Linux 安裝

尚未安裝者先按 [單元０](units/00.md)的 Windows／macOS／Linux 分節操作，不需先有 Cargo 就能在 GitHub 閱讀。根目錄 [安裝說明](../README.md#下載與安裝-rust)也有完整三平台流程。

- Windows：從 [官方安裝頁](https://rust-lang.org/tools/install/)下載 rustup-init，依提示補齊 MSVC／Windows SDK，再重開 PowerShell。
- macOS：先執行 `xcode-select --install` 並完成安裝，再使用官方 rustup 腳本。
- Linux：先透過套件管理器準備編譯器、linker、curl，再使用官方 rustup 腳本；Ubuntu／Debian 可安裝 build-essential、curl。

macOS／Linux 的指令如下，會下載並執行官方安裝腳本：

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

使用 Rust 2024 edition，最低 Rust 1.85，建議 stable。執行 `rustc --version`、`cargo --version` 後，還需按單元０建立並執行 Hello world，確認 linker 正常。學生不需要 Python、Node 或第三方 Rust 套件。

## 開始、編輯與執行

clone 後進入本 beginner 資料夾，再執行：

```sh
cargo run -- lesson
cargo run -- lesson 1
cargo run -- lesson 1-1
```

`lesson` 看總覽；`lesson 1` 讀完整單元；`lesson 1-1` 看作業規格。用熟悉的編輯器修改題目指定檔案，例如 `examples/unit01_01.rs`，存檔後：

```sh
cargo run -- manual 1-1
cargo run -- run 1-1
```

函式題起始程式中的 `todo!("說明")` 是待實作標記：可以通過編譯，但執行到它會觸發 panic，這不是工具安裝失敗。請依題目回傳型別，把整個 `todo!(...)` 表達式替換成你的實作，不是只改引號內的文字。

原生執行方式：`cargo run --example unit01_01`。提示／答案使用 `cargo run -- hint 1-1`／`cargo run -- answer 1-1`。

`run 2` 一次驗收第二單元全部作業，`run 2-1` 只驗一題。`test` 與 run 同義；若要跑自己檔案內的原生 Rust 測試，用 `cargo test --example unit05_01` 等。沒有找到測試不能視為完成作業。

workspace 根目錄不預設選課；先 cd beginner，或明確使用 `-p rust-beginner-course`。`cargo run -- lesson 1` 每個部分的意義在單元０。

## 輸入與驗收界線

第二～四單元暫用已提供的 support::read_i64／read_f64，一次讀一行合法數字；它們是本課的轉接工具，不是 Rust 內建。第五單元回收函式概念，第六單元拆解標準輸入。自動驗收真正餵 stdin，不再替換原始碼的變數或迴圈。

| 類型 | 學生工作 | 自動驗收 |
| --- | --- | --- |
| 程式題 | main 與輸入輸出 | stdin、stdout、stderr、退出碼 |
| 函式題 | 指定函式／方法／型別 | 至少十項外部具名契約；main 只供示範，不要求額外新增輸出 |
| 測試設計 | 編寫測試，不修改 subject | 正確版通過、九個故障版被抓到；零測試、編譯失敗與逾時不計通過 |
| 整合專案 | 自行拆解多筆資料流程與設計報告 | 程式案例驗輸入、檔案、輸出與退出碼；設計及自訂測試依人工規準評量 |

`cargo run -- manual 2-1` 啟動後輸入25再按Enter；`cargo run -- run 2-1` 自動餵完整資料，不需手動輸入。第十一單元 manual 只跑學生對正確版的測試，run 才檢查故障版本。

每題至少十項具名驗收；第一題是十項相關輸出性質，測試設計題是正確版加九個故障版，均明確標示。其他程式題使用不同stdin／參數，函式題為獨立案例。比對與範圍見各題及TEST_CASES。

編譯上限六十秒，每組程式三秒，函式／學生測試每次十秒；逾時停止並限制顯示診斷長度。本機課程工具不是隔離任意不可信程式的安全服務。有限驗收無法代替解釋與設計評量。

## 第十二單元專案

兩份都需完成：[12-1 運動分析](exercises/12-1.md)、[12-2 成績彙整](exercises/12-2.md)，各有自己的 Cargo.toml、src/main.rs 與 DESIGN.md。學生自行增加模組，參考解法不要求逐字模仿。

在 beginner 中操作：

```sh
cargo run -- manual 12-1 data/motion.csv
cargo run -- run 12-1
cargo run --manifest-path projects/motion/Cargo.toml -- data/motion.csv
```

最後一行是原生 Cargo，檔案參數放在獨立 `--` 後。完成後應能離開課程建立同類型專案。

## 來源與安全重建

```text
units/                  單元０～１２完整教材
exercises/              作業規格；code/是學生測試
examples/               第一～十一單元作答入口
projects/               第十二單元兩個獨立專案
templates/              起始程式備份
solutions/              參考程式與多檔案專案
testing/                正確函式與故障版本
curriculum.json         登錄與獨立案例規格
checks/、src/catalog.rs  產生的驗收與CLI目錄
```

維護者執行 `python3 scripts/build.py` 重建合併教材、案例、Rust目錄與Cargo登錄，保留學生作答、模板、答案與單元。沒有含糊的整體重置選項。

若確定重做單題，先備份，再以編輯器從 templates/unit02_01.rs 複製回 examples/unit02_01.rs；測試題複製到 exercises/code 指定檔案。專案模板 templates/project_motion.rs 只重置main，不會移除你新增的模組。正常學習不需重置。

根目錄三個 verify 腳本驗證參考答案、教材範例與拒絕錯誤的路徑，不覆寫學生檔案。舊stepNN與原補充課號已全面重製；實際驗證與跨電腦續作見 [HANDOFF.md](../HANDOFF.md)。尚未正式試教，Windows／Linux待實機驗證。
