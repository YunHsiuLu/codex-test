# Rust Courses

這個專案包含兩套獨立學習路線，皆以終端機操作為主，教材使用繁體中文，課程名稱使用英文。

| 課程 | 適合對象 | 學習重點 | 課程入口 |
| --- | --- | --- | --- |
| Rust Beginner Course | 初學者 | 語法、型別、控制流程、基本輸入輸出與短程式練習 | [README](beginner/README.md) ／ [完整教材](beginner/COURSE.md) |
| Rust Advanced Course | 已具備入門能力者 | 規格、數值表示、正確性、所有權、抽象化、錯誤處理與並行設計 | [README](advanced/README.md) ／ [課綱](advanced/SYLLABUS.md) ／ [完整教材](advanced/COURSE.md) |

原本的入門教材已移至 beginner，既有作答仍保存在 beginner/examples。進階課程位於 advanced/examples，兩套練習檔互相獨立。不需先完成進階課程就能練習入門。

## 從終端機開始

clone 此 GitHub repository 後，進入含 workspace Cargo.toml 的 rust-practice 資料夾。若 repository 根目錄就是這份專案，直接在根目錄執行。

### Rust Beginner Course

```sh
cargo run
cargo run -- lesson 1
cargo run -- run 1
```

workspace 預設選擇入門課程；也可以進入 beginner 後使用相同指令。修改 beginner/examples/step01.rs，再用 `run 1` 自動驗收；想手動執行則用 `cargo run -- manual 1`。起始課程先直接修改變數初始值來驗收不同案例，第六課才加入鍵盤輸入。

### Rust Advanced Course

```sh
cargo run -p rust-advanced-course
cargo run -p rust-advanced-course -- lesson 1
cargo test -p rust-advanced-course --example lab01
```

修改 advanced/examples/lab01.rs 後，可用 `cargo run -p rust-advanced-course -- run 1` 自動驗收，或使用上面的原生測試指令。手動執行與輸入請用 `cargo run -p rust-advanced-course -- manual 1`。進階起始程式保留 todo!，所以初始測試失敗是預期行為；每章另附 solutions 參考答案。進階課程要求同時交付程式、測試及設計推理，不只判斷輸出是否相符。

`--` 是 Cargo 與程式參數的分隔線；`lesson` 與課號之間要有空格。`-p` 選擇 workspace 中要執行的課程套件。

## 下載與安裝 Rust

本專案採用 Rust 2024 edition，需要 Rust 1.85 以上；初學者請安裝最新 stable 工具鏈。`rustup` 負責安裝與管理 Rust，也會安裝編譯器 `rustc` 及專案工具 `cargo`。

### Windows

１．開啟 [Rust 官方下載頁](https://rust-lang.org/tools/install/)，下載符合電腦架構的 `rustup-init.exe`。一般電腦選 x64，Windows ARM 裝置選 ARM64。

２．執行安裝程式。若提示缺少編譯工具，依畫面指示安裝 Visual Studio 所需元件；手動選擇時，勾選「使用 C++ 的桌面開發」（Desktop development with C++），確認包含對應架構的 MSVC 工具、Windows SDK 與英文語言套件。詳細步驟見 [Rust 官方 Windows MSVC 指南](https://rust-lang.github.io/rustup/installation/windows-msvc.html)。VS Code 編輯器與這些編譯工具是不同的軟體。

３．回到 Rust 安裝流程，選擇預設 stable 設定並完成安裝。

４．關閉並重新開啟 PowerShell，再進行下方的「確認安裝成功」。若使用 WSL，請在 WSL 的 Linux 終端機依 Linux 步驟安裝。

### macOS

１．開啟「終端機」，先安裝 Apple 命令列開發工具，並依跳出的視窗完成安裝。若已安裝，系統會提示，不需要重裝。

```sh
xcode-select --install
```

２．執行官方 rustup 安裝指令，依畫面選擇預設 stable 設定。Apple Silicon 與 Intel Mac 使用相同指令。

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

這行會下載並執行 Rust 官方安裝腳本。

３．完成後重新開啟終端機，再進行下方的「確認安裝成功」。

### Linux

１．先安裝 C 編譯工具、linker 與 curl。以下以 Ubuntu／Debian 為例：

```sh
sudo apt update
sudo apt install build-essential curl
```

其他發行版請依自身套件管理器安裝 GCC 或 Clang 與相關開發工具。

２．執行官方 rustup 安裝指令，選擇預設 stable 設定。這行會下載並執行 Rust 官方安裝腳本。

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

３．完成後重新開啟終端機，再進行下方的「確認安裝成功」。

### 確認安裝成功

三個平台都在終端機逐行執行：

```sh
rustc --version
cargo --version
```

兩行都應顯示版本資訊。接著在本專案含有 `Cargo.toml` 的資料夾執行 `cargo run`，確認實際編譯與啟動成功。

若找不到指令，先重開終端機；macOS／Linux 的 bash 或 zsh 也可執行 `source "$HOME/.cargo/env"`。Windows 請確認 PATH 包含 `%USERPROFILE%\.cargo\bin`。若有 linker／`link.exe` 錯誤，請回頭檢查對應平台的開發工具是否裝好。需要更新既有工具鏈時，執行 `rustup update stable`。

安裝說明依 [The Rust Book 安裝章](https://doc.rust-lang.org/book/ch01-01-installation.html) 與 [Rust 官方安裝頁](https://rust-lang.org/tools/install/) 查核，日期為２０２６－１０－２１；Windows／Linux 尚未實機驗證。

## 專案結構與維護

```text
rust-practice/
├── Cargo.toml       # workspace，預設啟動入門課程
├── beginner/        # Rust Beginner Course
├── advanced/        # Rust Advanced Course
└── HANDOFF.md       # 交接、驗證與續作紀錄
```

原本網頁閱讀版保留在 beginner/index.html，顯示 Rust Beginner Course。GitHub 上可直接閱讀兩套 Markdown 教材。終端機作答直接儲存在 .rs 檔，透過 GitHub 提交與同步；瀏覽器筆記另存於瀏覽器，不會自動寫入 .rs。

beginner/scripts/build.py 會覆寫入門起始程式，請勿在作答途中執行。advanced/scripts/build.py 只合併課綱與章節為 COURSE.md，不修改實作檔。兩套教材都尚未經正式試教。不要製作壓縮包，使用 GitHub 管理原始檔；target 已忽略，Cargo.lock 保留。

## 自動驗收

兩門課的 `run N` 都會使用獨立測試資料，驗證輸出或函式行為；互動題會自動餵入資料。`manual N` 保留手動操作。教材測試放在各課程的 checks，stdout 案例放在 src/checks.rs，共用執行器位於 runner/mod.rs。結果顯示 PASS／FAIL 及失敗差異；通過僅代表目前測試案例通過，不代表所有可能輸入都已被證明正確。詳細輸出格式、逾時與前幾課的驗證範圍見各課程 README。

維護者可用 `python3 scripts/verify_courses.py` 驗證全部二十四份參考答案，以 `python3 scripts/verify_runner.py` 測試驗收器的錯誤與逾時路徑。兩者都不修改學生作答；Python 不是學生執行課程的必要依賴。

每題至少十項具名驗收，詳見 [入門案例目錄](beginner/TEST_CASES.md) 與 [進階案例目錄](advanced/TEST_CASES.md)。有參數的題目使用不同資料；沒有參數的固定輸出／資源追蹤題使用十項契約性質，並明確標示相關性，避免把相同輸入重複執行當作十種資料。第二～四課以受控暫存副本代入十筆設定，原始作答不修改。維護驗證腳本會逐題檢查實際驗收總數至少為十。
