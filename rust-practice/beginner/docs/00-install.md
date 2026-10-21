# 第零步：準備你的 Rust 工作室

預計時間：３０～６０ 分鐘。需要下載權限與網路；學校電腦若限制安裝，可先用 [Rust Playground](https://play.rust-lang.org/) 完成不需互動輸入的課程。

## 先認識工具

Rust 是程式語言；rustc 負責編譯；Cargo 管理專案、執行與測試；rustup 管理工具鏈。課程使用 stable、Rust 2024 edition（需 Rust 1.85 以上），不需要額外 Rust 套件。

## Windows

１．開啟 [Rust 官方安裝頁](https://rust-lang.org/tools/install/)，依電腦架構下載 rustup-init.exe，通常是 x64，ARM 裝置請選 ARM64。
２．執行安裝程式，依提示準備 Visual Studio C++ Build Tools。若手動安裝，在 Visual Studio Installer 選「使用 C++ 的桌面開發」，包含對應架構的 MSVC 工具與 Windows SDK；依官方 [MSVC 指南](https://rust-lang.github.io/rustup/installation/windows-msvc.html) 操作。
３．接受預設 stable 工具鏈。完成後關閉並重開 PowerShell。WSL 使用者請在 WSL 內依 Linux 步驟安裝，不要混用 Windows 與 Linux 工具鏈。

## macOS

１．開啟「終端機」，準備 Apple 命令列工具；跳出視窗後完成安裝。

```sh
xcode-select --install
```

２．使用官方 rustup 安裝指令，依畫面接受 stable 預設值。這個指令會下載並執行官方安裝腳本；可先開啟網址閱讀腳本。

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

３．重開終端機。Apple Silicon 與 Intel 均使用上面的指令，由安裝程式判斷架構。

## Linux

１．依發行版準備 C 編譯器與 linker。Ubuntu／Debian 的例子：

```sh
sudo apt update
sudo apt install build-essential curl
```

Fedora 可使用 `sudo dnf install gcc curl`；Arch 可使用 `sudo pacman -S base-devel curl`。套件管理器需要管理權限，其他發行版依自身文件操作。
２．執行與 macOS 相同的 rustup 指令，接受 stable 預設值，再重開終端機。

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## 三個平台共同驗收

每一行分開執行，不要輸入 Markdown 的反引號。看到版本字樣後，建立小專案驗證 linker 也能運作。

```sh
rustc --version
cargo --version
cargo new hello_rust
cd hello_rust
cargo run
```

最後應顯示 `Hello, world!`。終端機是輸入上述指令的地方，`.rs` 檔才是輸入 Rust 程式碼的地方。

## 開始這份練習專案

回到下載的 rust-practice 資料夾（不是 hello_rust），以編輯器開啟整個資料夾。可以使用熟悉的純文字編輯器；若使用 VS Code，可加裝 rust-analyzer。在含 Cargo.toml 的位置執行：

```sh
cargo run --example step01
```

修改 examples/step01.rs，存檔後再次執行。參考答案放在 solutions，先做完再看。

## 卡住時怎麼辦

找不到 cargo：重開終端機，檢查 PATH 是否包含使用者目錄中的 `.cargo/bin`（Windows 為 `.cargo\bin`）。macOS／Linux 亦可執行 `source "$HOME/.cargo/env"`。
linker／link.exe 錯誤：回到對應作業系統的編譯工具安裝步驟，單看 cargo 版本還不代表 linker 可用。
找不到 Cargo.toml：目前所在資料夾不正確，請切換到本專案根目錄。
更新工具鏈：`rustup update stable`。離線官方文件：`rustup doc`。

安裝資訊查核日期：２０２６－１０－２１。依據 [The Rust Book 安裝章](https://doc.rust-lang.org/book/ch01-01-installation.html) 與 [Rust 官方入門](https://rust-lang.org/learn/get-started/)。本次沒有在 Windows／Linux 實機執行安裝。
