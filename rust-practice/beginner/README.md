# Rust Beginner Course

以語法、基本計算與短程式實作建立基礎。完成後可接續 [Rust Advanced Course](../advanced/README.md)，深入規格、記憶體模型、演算法與設計取捨。兩門課總覽見 [Rust Courses](../README.md)。

從終端機練習 Rust，包含循序課程、起始程式、提示與參考答案。第一次使用請先依作業系統安裝；已能執行 `cargo --version` 與 `rustc --version` 的人，可直接前往「取得專案並開始練習」。

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

## 取得專案並開始練習

先使用 Git 或 GitHub Desktop clone 此 GitHub repository。clone 需要 Git 或 GitHub Desktop；執行本課程只需要 Rust，不需 Python、Node 或網頁服務。

在終端機切換到本專案中**含有入門課程 `Cargo.toml` 的 `beginner` 資料夾**。這份資料夾位於 `rust-practice/beginner`；若 repository 根目錄就是 rust-practice，請進入 beginner。你也可以在 workspace 根目錄執行相同指令，預設會選擇入門課程。資料夾位置依你 clone 到的位置而定。

```sh
cargo run
cargo run -- lesson 1
```

`cargo run` 顯示課程目錄與操作方法。`lesson 1` 會在終端機印出第一課的觀念、起始程式、題目與驗收標準，不會提前顯示答案。

用你熟悉的編輯器開啟 `examples/step01.rs`。若想全程用終端機編輯，可使用已安裝的 nano 或 vim，例如：

```sh
nano examples/step01.rs
```

nano 中修改後按 Ctrl+O、Enter 儲存，再按 Ctrl+X 離開。接著執行：

```sh
cargo run -- run 1
```

也可以直接使用標準 Cargo 指令：

```sh
cargo run --example step01
```

修改、存檔、再執行，就是整套課程的練習方式。程式錯誤直接閱讀終端機中的編譯器訊息。

## 每課使用流程

```sh
cargo run -- lesson 2
cargo run -- run 2
cargo run -- hint 2
cargo run -- answer 2
```

依序是閱讀題目、自動驗收自己的程式、需要時看提示、完成後比對答案。把課號換成 1 到 12。`lesson` 和課號之間要有空格；獨立的 `--` 表示後面的參數交給本專案程式處理。`cargo run -- lesson 0` 可在安裝 Rust 後重新閱讀環境準備教材；安裝前直接閱讀本 README 即可。

## 輸入與測試

第六課自動餵入十四組測試資料，不需要手動輸入：

```sh
cargo run -- run 6
```

第十一課練習測試：

```sh
cargo run -- test 11
```

第十一課的起始測試故意失敗；完成函式後再測一次。`test` 只執行學生檔案內的測試，可能顯示「0 tests」；`run` 則一定載入教材獨立的驗收資料，不以「0 tests」當成通過。

執行參考答案或測試答案：

```sh
cargo run --example answer01
cargo test --example answer11
cargo test --example answer12
```

## 自動驗收如何運作

`cargo run -- run N` 會編譯本機作答，以 PASS／FAIL 顯示結果。錯誤輸出會列出輸入、預期與實際結果；函式測試會指出失敗的測試名稱與 assertion。成功退出碼為 0，驗收失敗為 1，指令參數錯誤為 2。

- 第一課：十項輸出契約檢查，包括完整文字、行數、順序、空白與控制字元。它沒有可變輸入，因此不是十筆不同輸入；相同輸入只執行一次，檢查十項性質。
- 第二課：在驗收副本中替換 celsius 初始值，測試十種攝氏值與換算關係；原檔的初始值不改變。
- 第三課：在驗收副本中替換 score，測試十筆成績，包含 59、60、61 的及格邊界；不需要手動恢復 60。
- 第四課：在驗收副本中替換 1..=上限 的迴圈範圍，以十筆上限測試累加，包含空範圍、單一元素與 100。
- 第五課與第七～十二課：每題至少十個獨立具名函式測試，驗證正常、邊界與錯誤資料；請保留題目指定的函式名稱、參數及型別。第七課需要完成借用簽名後才能通過測試編譯。
- 第六課：十四筆輸入涵蓋 25、0、100、-40、小數與空白、abc、空行、正負號、科學記號、混入文字與 CRLF，檢查數值結果或錯誤提示。可保留原本的「輸入攝氏溫度：」提示行，也可只輸出答案。

完整案例目錄在 [TEST_CASES.md](TEST_CASES.md)，實作位於 `src/checks.rs` 與 `checks/*.rs`。第二～四課會明確告知在 target 暫存副本代入資料，公式、條件與累加內容仍使用原作答；不會改寫學生檔案。這個受控題型機制要求保留 `let celsius`、`let score` 與 `for ... in 1..=...` 的原題結構，不是任意 Rust 語法解析器。其他寫法可用 manual 探索，若要改變題型需連同驗收器調整。通過有限資料不是一般性正確性的證明，仍需能解釋程式。

驗收器使用本機 rustc，將純標準函式庫練習及測試編譯到 workspace 的 target 暫存子目錄，不修改作答。每組輸入限制 3 秒，函式測試整組限制 10 秒，編譯限制 60 秒；逾時會停止。一般輸出統一 CRLF／LF，忽略末端換行，其他文字與空白依規格比對；第二、六課以數值容許誤差比較。此功能不是支援任意依賴套件的通用評測平台。

### 手動操作與除錯

想自己輸入資料或觀察程式原始輸出時，使用：

```sh
cargo run -- manual 6
```

也可使用原生 Cargo：`cargo run --example step06`。這兩種方式不自動評分。

## 教材與續作

完整文字在 COURSE.md，網頁 index.html 保留作為閱讀輔助。網頁筆記與終端機作答不會自動同步；終端機練習直接修改本機 examples 中的檔案，透過 GitHub 提交與同步原始檔即可搬移作答，不需製作壓縮包。換電腦時 clone 對應 repository，進入 rust-practice/beginner 後執行 `cargo run`。

本專案使用 Rust 2024 edition，最低需要 Rust 1.85，無第三方 Rust 套件。不需 Python、Node 或網頁服務就能練習。Windows／Linux 請先切換到自己放置此專案的位置，其餘 Cargo 指令相同；nano 是選用編輯器。

維護來源為 scripts/build.py；`python3 scripts/build.py` 會重建 COURSE.md、lessons.js、安裝說明、Cargo.toml 與所有起始／答案程式，會覆寫作答，執行前務必先備份。README.md 與 src/main.rs 獨立維護。交接記錄在 ../HANDOFF.md。
