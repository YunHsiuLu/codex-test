# Rust Courses

以 Rust 學習程式設計。繁體中文教材可直接在 GitHub 閱讀，以本機終端機作答，不需要網頁服務、Node 或壓縮包。

| 路線 | 定位 | 入口 |
| --- | --- | --- |
| **Rust Beginner Course** | 正式入門主線：單元０～１２、三十九份實作，從零基礎到獨立專案 | [操作與安裝](beginner/README.md)｜[課綱](beginner/SYLLABUS.md)｜[完整教材](beginner/COURSE.md) |
| **Rust Advanced Course** | 完成主線後深化契約、不變量、資源、生命週期、抽象化與並行 | [操作說明](advanced/README.md)｜[課綱](advanced/SYLLABUS.md)｜[完整教材](advanced/COURSE.md) |

教師先讀 [課程設計與評量指南](beginner/TEACHING_GUIDE.md)。能力對照以問題拆解、資料處理、除錯與驗證為主，不把 C++／Python 語法逐字翻成 Rust。

## 下載與安裝 Rust

使用 Rust 2024 edition，最低 Rust 1.85，建議目前 stable。`rustup` 管理工具鏈，`rustc` 是編譯器，`cargo` 管理專案、編譯、執行與測試。

### Windows

１．到 [Rust 官方安裝頁](https://rust-lang.org/tools/install/)下載對應架構的 rustup-init.exe，一般 x64，Windows ARM 裝置選 ARM64。

２．執行安裝程式，依提示準備 Visual Studio「使用 C++ 的桌面開發」元件，包括對應架構 MSVC 工具、Windows SDK 與需要的英文語言套件。依 [官方 MSVC 指南](https://rust-lang.github.io/rustup/installation/windows-msvc.html)操作。VS Code 編輯器與編譯工具是不同軟體。

３．採預設 stable 完成安裝，重新開啟 PowerShell。WSL 使用者在 WSL 內按 Linux 流程安裝。

### macOS

先準備 Apple 命令列工具，依跳出的視窗完成安裝：

```sh
xcode-select --install
```

再執行官方 rustup 指令；Apple Silicon／Intel 使用同一行：

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

這行會下載並執行官方腳本，完成後重新開啟終端機。

### Linux

先準備 C 編譯器、linker 與 curl。Ubuntu／Debian：

```sh
sudo apt update
sudo apt install build-essential curl
```

其他發行版使用自身套件管理器準備對應工具，再執行官方腳本：

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

完成後重新開啟終端機。詳細操作與錯誤排除見 [單元０](beginner/units/00.md)。

### 確認工具與取得課程

```sh
rustc --version
cargo --version
```

版本成功還不代表 linker 完整，請依單元０建立並執行 Hello world。安裝說明按官方文件查核，日期２０２６－１０－２９；Windows／Linux 尚待實機驗證。

透過 Git 或 GitHub Desktop clone repository，切換到下載位置中的 rust-practice 資料夾，再執行：

```sh
cd beginner
cargo run -- lesson
cargo run -- lesson 1
cargo run -- lesson 1-1
```

## 修改、執行與驗收

在 beginner 編輯 `examples/unit01_01.rs`，存檔後：

```sh
cargo run -- manual 1-1
cargo run -- run 1-1
```

`lesson 1` 是完整單元；`lesson 1-1` 是作業規格。`run 1-1` 驗一題，`run 2` 驗第二單元全部作業。`test` 是 `run` 的同義命令；`hint` 看提示，`answer` 才看解法。

原生 Cargo 也能執行：`cargo run --example unit01_01`。獨立的 `--` 把後面的參數交給課程程式；lesson 與第二個 run 是本程式定義的命令。完整逐項解釋放在單元０。

根目錄是 workspace，沒有預設課程。先進入 beginner／advanced，或明確使用 `cargo run -p rust-beginner-course -- lesson`。第十二單元兩個專案也有獨立 Cargo.toml。

## 課程新版與維護

２０２６－１０－２９已依課程設計需求全面重製 Beginner。舊 stepNN、舊補充課號與舊網頁筆記介面已退場；本次重新建立作答、模板與答案。之後正常重建教材不會重置學生程式。

每份實作至少十項具名驗收：[Beginner 案例](beginner/TEST_CASES.md)／[Advanced 案例](advanced/TEST_CASES.md)。固定輸出與測試設計題會明說性質，不冒充不同鍵盤輸入。函式測試與輸出檢查分開，人工評量另看設計、自訂測試與推理。

學生只需 Rust；維護者額外使用 Python 3：

```sh
python3 beginner/scripts/build.py
python3 advanced/scripts/build.py
python3 scripts/verify_courses.py
python3 scripts/verify_readings.py
python3 scripts/verify_runner.py
```

兩個 build 都不覆寫作答。驗證使用參考答案或暫存副本，不把答案複製到學生檔案。來源結構與重置單題方式見 [Beginner README](beginner/README.md)，跨電腦續作見 [HANDOFF.md](HANDOFF.md)。課程尚未正式試教，實際驗證界線以交接文件為準。
