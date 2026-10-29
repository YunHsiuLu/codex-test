# Rust Beginner Course

十三單元的 Rust 程式設計課程。單元教材與作業分開；提示與解法不混入本合併教材。

[課綱](SYLLABUS.md)｜[操作說明](README.md)｜[全部作業與案例](TEST_CASES.md)


---

# 單元 0：環境準備與程式執行模型

## 學習成果

完成本單元後，你應能：

- 安裝對應作業系統的 Rust 工具與必要連結工具。
- 分辨 terminal 指令與 Rust 原始碼。
- 說明 rustup、rustc 與 Cargo 的角色。
- 找到目前目錄並進入正確專案資料夾。
- 建立一個獨立小專案，編譯並執行成功。
- 說明 Cargo.toml、src/main.rs 與 examples 的用途。
- 逐個讀懂 `cargo run -- lesson 1` 的參數。

## 先備與路線

不要求任何程式語言基礎。
需要一台電腦、網路，以及能編輯純文字的編輯器。
先讀工具與執行模型，再依 Windows、macOS 或 Linux 選擇安裝段落。
已安裝的人也要完成實際編譯驗收；只看到版本號還不足以確認連結工具正常。
本單元是準備與檢核，不是十筆資料的評分作業。

## 0.1：先認識三個工具

| 工具 | 工作 | 本課常用方式 |
|---|---|---|
| rustup | 管理 Rust 工具鏈與附加元件 | 安裝 stable、更新、安裝 rustfmt |
| rustc | 把 Rust 原始碼編譯成可執行檔或函式庫 | 多數時間由 Cargo 呼叫 |
| cargo | 管理專案、相依套件、建置與測試 | cargo check／run／test |

工具鏈包含編譯器、標準函式庫與相關工具。
安裝 rustup 後，通常一起取得可使用的 Cargo 與 rustc。
本課採 Rust 2024 edition，需要支援此 edition 的工具鏈，建議使用 stable。
不要把「edition」和每次更新的編譯器版本號當成同一件事。

Cargo 不是另一種程式語言。
你在 terminal 輸入 Cargo 指令，由它安排編譯與執行 Rust 程式。

## 0.2：terminal、編輯器與目前目錄

terminal 是你輸入作業系統指令的介面。
Windows 可用 PowerShell；macOS、Linux 可使用各自的終端機程式。
編輯器則用來修改 `.rs` 原始碼，不能把一般文書處理器的格式內容當原始碼。

```sh
cargo --version
```

上面是 terminal 指令，不能貼進 fn main。
下面才是 Rust 原始碼，應存入 `.rs` 檔案：

```rust
fn main() {
    println!("Ready to learn");
}
```

文件若以 `$`、`>` 顯示提示符，通常不用把那個提示符一起輸入。
本教材指令區塊不加提示符，直接複製其中的指令即可。

| 目的 | PowerShell | macOS／Linux shell |
|---|---|---|
| 查看目前目錄 | Get-Location | pwd |
| 列出資料夾內容 | Get-ChildItem | ls |
| 建立資料夾 | mkdir rust-learning | mkdir rust-learning |
| 進入資料夾 | cd rust-learning | cd rust-learning |
| 回上一層 | cd .. | cd .. |

目前工作目錄常簡稱 cwd。
相同指令在不同目錄下，可能操作不同專案或找不到檔案。
`cd` 不是開啟檔案，而是改變接下來指令所在的資料夾。

## 0.3：Windows 安裝

１．開啟 [Rust 官方安裝頁](https://rust-lang.org/tools/install/)。
２．依電腦選擇 x64 或 ARM64 的 rustup-init.exe；一般 x64 電腦不要誤選 ARM64。
３．執行下載的安裝程式，依引導安裝 stable 工具鏈。
４．若提示需要 Visual Studio C++ Build Tools，依引導完成安裝。
５．確認 C++ 建置工具與適合目前 Windows 的 SDK 已安裝。
６．完成後關閉原本的 PowerShell，再開新的視窗。

Rust 的預設 Windows MSVC 工具鏈需要對應的原生建置工具。
Visual Studio Code 是編輯器，不等於已安裝 Visual Studio C++ Build Tools。
如果版本指令能跑、建置卻出現 linker 錯誤，應檢查這部分。
細節以 [rustup 的 MSVC 前置需求](https://rust-lang.github.io/rustup/installation/windows-msvc.html) 為準。

在新的 PowerShell 執行：

```powershell
rustup --version
rustc --version
cargo --version
```

若系統說找不到指令，先確認安裝完成並重開 terminal。
不要急著從不明網站下載同名執行檔，也不要同時混裝多套工具鏈來猜原因。
WSL 是 Linux 環境；若決定在 WSL 工作，請在 WSL 裡依 Linux 步驟安裝。
Windows 與 WSL 的路徑與工具不是可任意混用的同一個環境。

## 0.4：macOS 安裝

先安裝或確認 Command Line Tools，提供 C 編譯與連結相關工具：

```sh
xcode-select --install
```

若已安裝，系統可能提示已有工具，不必為了訊息再重裝完整 Xcode。
接著使用 Rust 官方安裝命令：

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

這行會從官方位置下載並執行安裝腳本，依引導選擇一般 stable 安裝。
安裝網路腳本前應確認來源；這裡使用的是官方安裝頁提供的命令。
安裝後開新的 terminal，或依安裝程式的提示載入環境。
對常見的 sh／bash／zsh 環境，也可使用：

```sh
. "$HOME/.cargo/env"
```

這行的開頭是點號，後面有一個空白。
如果你的 shell 不是上述類型，請依安裝器顯示的對應方式處理。
接著確認版本：

```sh
rustup --version
rustc --version
cargo --version
```

Apple Silicon 與 Intel 的工具鏈選擇通常由安裝器判斷。
先依預設原生環境安裝，不需要為本課自行加入交叉編譯目標。

## 0.5：Linux 安裝

先確認系統有 curl 與 C 編譯／連結工具。
不同發行版使用不同套件管理員；不要把 apt 指令直接套到所有 Linux。
例如 Debian／Ubuntu 可使用：

```sh
sudo apt update
sudo apt install build-essential curl
```

若是其他發行版，依該發行版官方文件安裝對應的 C 工具鏈與 curl。
這些是系統套件，不是 Rust 語法；sudo 可能要求管理者密碼。
接著執行 Rust 官方安裝命令：

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

完成後重開 terminal，或依安裝器提示載入環境。
常見 sh／bash／zsh 可使用：

```sh
. "$HOME/.cargo/env"
rustc --version
cargo --version
rustup --version
```

如果建置時找不到 cc 或 linker，版本號正常仍不代表環境已完整。
先補齊發行版的原生建置工具，再繼續驗收。
本課不要求容器、特定桌面環境或 root 身分執行 Cargo。

## 0.6：實際建立並執行獨立專案

先選一個你自己的練習位置，例如使用者資料夾下的 rust-learning。
不要在本課的 rust-practice workspace 裡另外建立 hello_rust，避免巢狀 workspace 混淆。
下面命令以「目前已在自己選定的位置」為前提；每台電腦的完整路徑不同。
如果 rust-learning 已存在，直接 cd 進去，不必重複 mkdir。

```sh
mkdir rust-learning
cd rust-learning
cargo new hello_rust
cd hello_rust
cargo run
```

cargo new 建立專案目錄、Cargo.toml 與初始原始碼。
若 hello_rust 已存在，請使用另一個尚未存在的名稱，不要覆寫原資料。
cargo run 應完成編譯，然後顯示初始程式的 Hello, world!。
這才同時檢查了工具路徑、編譯器、連結工具與執行能力。

可以把新專案的 src/main.rs 改為上面的 Ready to learn 示例，再次 cargo run。
輸出改變，表示你修改的是這次真正編譯的原始碼。
若輸出沒變，先檢查是否存檔、cwd 是否正確，而不是認為 Rust 忽略你的修改。

## 0.7：從原始碼到執行

```text
source .rs -> rustc compilation -> executable -> running process
```

編輯文字不會自動修改已存在的執行檔。
編譯器先檢查語法與型別，再產生程式；Cargo 協助安排整個流程。
程式執行時才接收輸入、計算與輸出。
因此「編譯成功」和「答案正確」是不同驗收。

| 指令 | 作用 | 是否執行一般程式 |
|---|---|---|
| cargo check | 快速檢查程式是否可通過編譯檢查 | 否 |
| cargo build | 建置可執行檔 | 否 |
| cargo run | 需要時建置，再執行 | 是 |
| cargo test | 建置並執行測試 | 執行測試框架 |
| cargo new name | 建立新的專案 | 否 |

check 不一定會走完最終連結，因此不能取代第一次 cargo run 的安裝驗收。
test 成功也要看真正跑了多少測試；零項測試不能當成十筆資料都正確。
本課尚未完成的作業可能刻意無法通過測試，不代表 Rust 安裝失敗。

## 0.8：回到本課專案

課程檔案可能放在 GitHub 下載或 clone 後的資料夾。
找到包含根 Cargo.toml、beginner、advanced 的 rust-practice 目錄。
根目錄是協調多個套件的 workspace，不提供唯一的預設課程入口。
本課固定先進入 beginner：

```sh
cd beginner
cargo run -- lesson 1
```

如果你仍在自己新建的 hello_rust，不能直接照抄 cd beginner。
先用 cd 進入你下載的 rust-practice，再 cd beginner。
完整路徑依你的電腦調整；含空白的路徑通常應放在雙引號中。

| 位置 | 用途 |
|---|---|
| 根 Cargo.toml | workspace 的套件協調設定 |
| beginner/Cargo.toml | 入門課程套件設定 |
| beginner/src/main.rs | 課程指令入口，不是每次作業都改這裡 |
| beginner/src/lib.rs | 本課提供的共用工具 |
| beginner/examples | 各題學生作答 |
| beginner/units | 完整單元閱讀教材 |
| beginner/exercises | 作業契約與操作說明 |
| target | 建置與驗收產物，一般不作為教材原始碼提交 |

Cargo.toml 是設定檔，不是 Rust 原始碼。
作業要改哪個 `.rs`，以該題頁面指示為準。
不要把課程入口刪掉，改成某題的 main，否則閱讀工具也會一起消失。

## 0.9：逐個讀懂 cargo run -- lesson 1

| token | 由誰處理 | 意義 |
|---|---|---|
| cargo | 作業系統啟動的工具 | 呼叫 Cargo |
| run | Cargo | 建置並執行目前課程套件入口 |
| -- | Cargo 的分隔符 | 後面交給被執行的程式 |
| lesson | 本課入口程式 | 選擇閱讀教材 |
| 1 | 本課入口程式 | 第一單元 |

lesson 不是 Rust 或 Cargo 內建命令，是這個課程程式定義的介面。
`lesson 1` 是兩個參數；`lesson1` 是另一個完整字串，不等價。

```sh
cargo run -- lesson 1
cargo run --example unit01_01
```

第一行執行課程入口，傳入 lesson 和１。
第二行的 --example 是 Cargo 選項，選擇 examples 裡的具名程式。
獨立的 `--` 是分隔符；`--example` 則是一個完整選項名稱。
需要給 example 額外參數時，可以在它後面再放獨立的 --。
作業的日常流程優先用教材提供的 manual／run，避免繞過驗收規格。

## 0.10：常見問題與自我檢核

１．版本號正常，但 Hello 專案不能建置，代表什麼？
答案：命令可找到，但原生連結工具、套件設定等仍可能有問題，應讀第一個建置錯誤。

２．把 cargo run 貼進 main.rs 為何不行？
答案：那是 terminal 指令，不是 Rust 語法。

３．在 hello_rust 執行 lesson 1，為何不會閱讀課程？
答案：那個專案沒有實作課程入口；cwd 決定目前選擇的套件。

４．cargo check 成功，是否代表輸出符合題目？
答案：不代表，正確性仍需執行、測試與規格推理。

５．安裝完成後要不要不斷更新才能做每題？
答案：不用；使用符合課程要求的 stable 即可，正常維護時才執行 rustup update stable。

## 官方來源與安裝驗證邊界

- [Rust 官方安裝頁](https://rust-lang.org/tools/install/)：rustup 與平台下載。
- [The Rust Book 安裝章](https://doc.rust-lang.org/book/ch01-01-installation.html)：原生工具與安裝檢查。
- [Cargo run](https://doc.rust-lang.org/cargo/commands/cargo-run.html)：選項與參數分隔。
- [Cargo 專案入門](https://doc.rust-lang.org/book/ch01-03-hello-cargo.html)：建立與建置。

以上以官方 rustup 安裝路線為主；學校受管理電腦可能另有軟體安裝政策。
跨平台文字指引不等於已在每台 Windows、macOS、Linux 電腦實機驗證。
請各自在獨立 hello_rust 完成 cargo run，才進入第一單元。


---

# 單元 1：輸出、程式結構與第一次除錯

## 學習成果

完成本單元後，你應能：

- 找出一支簡單程式的入口與執行順序。
- 使用 print! 與 println! 控制輸出是否換行。
- 以正確引號、括號與分號寫出基本敘述。
- 分辨註解、程式縮排與輸出內容。
- 使用格式工具保持可讀性。
- 區分編譯錯誤、執行期失敗與邏輯錯誤。
- 由診斷的檔案、行號與訊息找出第一個需要處理的問題。

## 先備與閱讀路線

先完成單元０，能在正確目錄執行 Cargo。
不要求先懂變數、數值型別或鍵盤輸入。
本單元只做輸出，讓你能完整掌握每一個符號的工作。

閱讀小節例如１．１，不是另一題作業。
本單元只有一題實作１－１；不要把每個示範都當作要繳交的新題。
示範使用活動看板，作業則有自己的精確兩行內容。

## 1.1：程式從哪裡開始

```rust
fn main() {
    println!("Science fair");
    println!("Doors open at 9");
}
```

把結構先讀成「定義入口，入口內依序做兩件事」。

| 片段 | 目前需要理解的意思 |
|---|---|
| fn | 宣告函式 |
| main | 這個可執行程式的入口名稱 |
| () | 這個 main 沒有列出參數 |
| { | 開始函式本體 |
| println!(...) | 輸出內容並加換行 |
| ; | 結束這個敘述 |
| } | 結束函式本體 |

函式是把工作命名與分組的方式；第五單元才自己設計有參數的函式。
現在先保留 main 框架，修改裡面的工作。
大小寫很重要，Main 不是這裡要求的 main。
括號有配對，大括號的開頭與結尾不能隨意省略。

這支程式依原始碼順序先印活動名，再印開門時間。
電腦不會自動判斷哪一句比較重要而重排它們。

## 1.2：文字與程式符號的邊界

雙引號包住的是字串常值，也就是要當作文字的內容。
程式的引號、括號、分號應用 ASCII 半形符號。
中文字可以放在字串裡；不要把中文全形引號當成 Rust 引號。

```rust
fn main() {
    println!("活動：科學展");
    println!("Room 204");
}
```

字串裡的中文冒號是輸出的一部分。
字串外的 `;` 則是程式結構，不會被印出。
所以「原始碼看起來有一個分號」不代表輸出也應有分號。

程式碼的一行與輸出的一行也不是必然對應。
同一行原始碼可以有多個敘述；一個字串也可以包含換行。
為了可讀性，教材先採每個敘述一行。

## 1.3：print 與 println 的差異

```rust
fn main() {
    print!("Seat ");
    print!("A");
    println!("12");
    println!("Bring a notebook");
}
```

| 執行後 | 目前輸出內容 | 游標是否換到下一行 |
|---|---|---|
| 第一個 print | Seat 加一個空白 | 否 |
| 第二個 print | Seat A | 否 |
| 第一個 println | Seat A12 | 是 |
| 第二個 println | 下一列的 Bring a notebook | 是 |

print! 不自動加換行；println! 會在這次輸出尾端加換行。
空白不是自動補上的：Seat 後面的空白來自字串 `"Seat "`。
如果少寫那個空白，就會變成 SeatA12。

兩個名稱後面的驚嘆號表示它們是巨集呼叫。
此時先會用，不要求你寫巨集；第五單元會分辨一般函式。
驚嘆號不是這裡的「不要列印」。

## 1.4：一個字串也可以包含換行

```rust
fn main() {
    print!("north\nsouth\n");
    println!("\"Keep exploring\"");
}
```

`\n` 表示換行；`\"` 在字串中表示一個雙引號。
它們是跳脫序列，不是要輸出的反斜線加英文字母。
這個示例輸出 north、south、帶雙引號的 Keep exploring，共三列。
第一個 print 雖然不自動換行，字串本身仍可要求換行。

不要為了湊行數，同時在字串尾端寫 \n，又無意中使用 println 多加一列。
是否允許最後空行，要依作業規格判斷。
判斷輸出時，請把空白與換行也當成資料。

## 1.5：註解、縮排與格式工具

```rust
fn main() {
    // This is a note for the reader.
    println!("Check the timetable");
    /* This comment is not printed. */
    println!("Then find your room");
}
```

`//` 後面直到該行結尾是註解。
`/* ... */` 是區塊註解，這裡只示範短句。
註解幫人理解程式，不會被當成輸出內容。
註解應解釋原因或提醒，不需要每一行都翻譯成中文。

縮排讓大括號內的層次更容易看見。
Rust 不用縮排寬度決定區塊邊界，但排得亂會讓人容易漏讀。
本課使用常見的四個空白縮排。

若系統找不到 rustfmt，先執行 `rustup component add rustfmt` 安裝對應工具。
Cargo 的格式檢查可在 beginner 目錄執行：

```sh
cargo fmt -- --check
```

它檢查格式，不會證明程式符合題目。
若要直接整理指定作答檔，可執行：

```sh
rustfmt examples/unit01_01.rs
```

這會改寫該檔排版，執行前先存檔。
格式化不會替你決定應該印哪句話；錯誤邏輯排整齊仍是錯誤。
不要為了格式檢查，把別人的整個專案一次重排當成自己的作業。

## 1.6：三種不同的錯誤

| 類型 | 發生階段 | 例子 | 如何觀察 |
|---|---|---|---|
| 語法或型別等編譯錯誤 | 建立程式時 | 少括號、使用不存在名稱 | cargo check 的診斷 |
| 執行期失敗 | 程式已開始執行 | panic | stderr、退出碼、執行位置 |
| 邏輯錯誤 | 程式能執行，但行為不符規格 | 行序相反、拼字錯 | 手算與驗收差異 |

### 反例一：無法編譯的引號或名稱問題

以下預期無法編譯，println 少了一個 n，變成不存在的 printl 巨集。

```compile_fail
fn main() {
    printl!("Read the schedule");
}
```

修正方式是比對名稱，改成 println!。
不要因為看到 lots of text 的錯誤訊息，就整份答案重寫。

以下也預期無法編譯，括號沒有配好：

```compile_fail
fn main() {
    println!("Read the schedule";
}
```

修正時先找 println 的左括號，確認右括號在分號之前。
括號與引號缺一個，可能讓後續好幾行都出現診斷；先修最前面的根本問題。

### 反例二：預期 panic

以下是故意觸發執行期失敗的示例，不是第一題的解法。

```rust
fn main() {
    println!("before");
    panic!("demonstration stop");
}
```

它可以編譯，執行時先印 before，再以 panic 中止目前工作。
診斷一般出現在 stderr，退出碼不是成功的０。
完整的 panic 與 assert 會在第五單元討論；這裡只用來辨認錯誤階段。

### 反例三：能跑但不符合規格

假設看板規格要求活動名稱在前、地點在後，下面就是邏輯錯誤。

```rust
fn main() {
    println!("Room 204");
    println!("Science fair");
}
```

編譯器不讀活動看板的需求文件，不會替你指出順序反了。
你需要把實際輸出逐行對照規格。
這也是為什麼「cargo run 沒有紅字」不能等同作業完成。

## 1.7：讀懂第一次編譯器診斷

診斷通常包含錯誤說明、檔案路徑、行號與欄號。
格式與建議會隨編譯器版本調整，不必背整段文字。

```text
error: cannot find macro `printl` in this scope
  --> examples/unit01_01.rs:2:5
```

先讀這三件事：

１．正在編譯哪個檔案？是不是你剛存檔的作答？
２．行號指向哪一行？欄號大致指向哪個符號？
３．錯誤是在說名字不存在、括號缺少，還是型別不合？

接著只修一個能解釋的問題，再次 cargo check 或 run。
不要同時亂改五行，最後雖然不報錯，卻不知道是哪個變更有效。
編譯器的建議是線索，仍要確認它符合你原本的目的。

warning 是警告，不一定讓編譯失敗；也不能因此永遠忽略。
例如目前還沒用到的變數，之後第二單元會學如何判斷是否真的多餘。
第一單元先把入口、輸出與結構建立清楚。

## 1.8：從手算到驗收

在執行之前，先寫下你預期 stdout 的每一行。
不要把 Cargo 自己的 Compiling／Finished 訊息當成學生程式輸出。
Cargo 的工具訊息與程式輸出有不同來源。

| 檢查 | 問題 |
|---|---|
| 內容 | 每個字與標點是否符合規格 |
| 順序 | 是否先印第一句，再印第二句 |
| 空白 | 是否多了縮排空白、缺了必要空格 |
| 換行 | 是否恰好分成要求的列 |
| 額外文字 | 是否擅自增加提示或完成訊息 |

這些性質可能互相關聯。
如果題目沒有可變輸入，十個具名檢查是輸出性質，不是十筆不同輸入。
不能拿同一份固定文字重跑十次，就宣稱驗證了十種情境。

## 1.9：實作與操作

本單元只有 [１－１：兩行自我介紹](exercises/1-1.md)。
請依作業頁指定的兩行文字與標點作答，不要直接複製本單元活動看板。
編輯 `examples/unit01_01.rs`，不要刪除 src/main.rs 的課程入口。

從 beginner 目錄執行：

```sh
cargo run -- lesson 1
cargo run -- lesson 1-1
cargo run -- manual 1-1
cargo run -- run 1-1
cargo run -- answer 1-1
```

manual 用於看見目前程式行為；run 比對作業契約。
若失敗，先讀第一個差異，再決定是內容、格式或執行本身有問題。
answer 是完成嘗試後的比較材料，不是可以跳過規格閱讀的入口。

## 1.10：自我檢核與答案

１．分號會跟著字串一起印出來嗎？
答案：字串外的分號是程式結構，不會輸出；字串裡的分號才是文字內容。

２．print! 是否永遠不會產生換行？
答案：它不自動附加換行，但字串裡仍可包含 \n。

３．同一行原始碼一定只輸出一行嗎？
答案：不是，敘述與輸出換行沒有一對一規則。

４．程式拼錯活動名但能執行，是編譯錯誤嗎？
答案：不是，是相對於需求的邏輯錯誤。

５．錯誤訊息很多時，第一步該做什麼？
答案：確認檔案，讀最前面有意義的錯誤，逐個修正再重新檢查。

６．rustfmt 能否把錯誤句子修成正確答案？
答案：不能，它處理排版，不知道作業內容契約。

## 官方來源與範圍

- [Hello, World](https://doc.rust-lang.org/book/ch01-02-hello-world.html)：基本程式結構與輸出。
- [print!](https://doc.rust-lang.org/std/macro.print.html)：不自動附加換行。
- [println!](https://doc.rust-lang.org/std/macro.println.html)：附加換行的輸出。
- [註解](https://doc.rust-lang.org/book/ch03-04-comments.html)：原始碼說明。
- [rustfmt](https://github.com/rust-lang/rustfmt)：官方格式工具。

本單元只建立順序執行與輸出模型；還沒有處理輸入、變數與數值計算。
完整錯誤處理、單元測試設計與巨集實作留到相應單元。


---

# 單元 2：變數、型別與數值運算

## 學習成果

完成本單元後，你應能：

- 以變數命名資料，並追蹤數值如何隨敘述改變。
- 區分不可變綁定、可變綁定、shadowing 與作用域。
- 根據數量、索引、連續量與真假選擇基本型別。
- 使用四則運算、餘數及括號，手算程式的執行結果。
- 分辨整數除法、浮點除法與型別轉換的先後。
- 說明有限數值範圍與浮點誤差。
- 使用課程提供的輸入轉接函式，把不同資料送進同一段計算。
- 區分計算得到的數值與顯示格式。

## 先備與閱讀路線

先完成單元０與１：能開啟作答檔、執行程式並閱讀診斷。
這一單元不要求自己實作標準輸入解析。
先建立型別與運算模型，再把它用到小型數值問題。

閱讀小節如２．１；２－１等連字號編號是可評分實作。
示範採用商品數量、公分轉公尺與分組問題，不直接給作業公式的完整程式。

## 2.1：變數是把值與名字連起來

```rust
fn main() {
    let unit_price = 18;
    let quantity = 4;
    let total = unit_price * quantity;
    println!("total={total}");
}
```

`let` 建立一個綁定，把名字連到當下的值。
名字不是可以任意猜測內容的文字；total 的值來自右側表達式。
用能描述角色的名字，比 a、b、c 更容易驗證公式。

| 敘述完成後 | unit_price | quantity | total |
|---|---|---|---|
| 第一行 let | １８ | 尚不存在 | 尚不存在 |
| 第二行 let | １８ | ４ | 尚不存在 |
| 第三行 let | １８ | ４ | ７２ |

程式先計算右邊，再把結果綁到左邊名字。
它不會因為你之後改 quantity，就自動重新計算已存在的 total。
Rust 變數不是試算表中持續追蹤來源的公式儲存格。

## 2.2：let、mut 與賦值

```rust
fn main() {
    let mut stock = 20;
    stock = stock - 3;
    stock += 5;
    println!("stock={stock}");
}
```

mut 允許這個綁定的值之後被修改。
`stock = stock - 3` 先讀舊值２０、算出１７，再把新值存回 stock。
`stock += 5` 是把舊值加５後存回，結果２２。
這是狀態更新，不是數學上宣稱 stock 與 stock－３永遠相等。

`=` 是賦值，`==` 是比較兩個值是否相等。
比較結果是 bool：true 或 false。

```rust
fn main() {
    let boxes = 6;
    println!("{}", boxes == 6);
    println!("{}", boxes == 7);
}
```

輸出 true、false，沒有修改 boxes。
第三單元會使用布林條件控制分支；此處先分辨運算的結果型別。

以下反例預期無法編譯：

```compile_fail
fn main() {
    let stock = 20;
    stock = 17;
    println!("{stock}");
}
```

如果確實要追蹤存量變化，應把宣告改為 let mut。
但不是所有變數都應預設 mut；不需改的值保留不可變，能減少推理負擔。

## 2.3：shadowing 與作用域

shadowing 是使用新的 let，以相同名字建立新的綁定。
它不是對舊綁定賦值，因此可用不同型別，但也可能讓人讀錯。

```rust
fn main() {
    let count = 4;
    let count = count + 1;
    {
        let count = count * 2;
        println!("inner={count}");
    }
    println!("outer={count}");
}
```

| 位置 | 使用哪個 count | 值 |
|---|---|---|
| 第一個 let | 第一個綁定 | ４ |
| 第二個 let | 新的外層綁定 | ５ |
| 內層大括號 | 內層綁定 | １０ |
| 離開內層後 | 仍是外層綁定 | ５ |

作用域是名字可以被使用的區域。
內層定義的名字不會自動跑到外層；同名內層也不會改掉原綁定。

```rust
fn main() {
    let label = "ready";
    let label = label.len();
    println!("length={label}");
}
```

這個示範讓 &str 的 label 被新的 usize 綁定遮蔽。
不是說同一個變數的型別隨時自由變化；這裡真的有第二個 let。
初學時若改型別會讓意思不清楚，使用 text、length 等不同名字更直觀。

## 2.4：基本型別地圖

| 型別 | 表達什麼 | 目前常見用途 |
|---|---|---|
| i64 | ６４位元有號整數 | 本課多數整數輸入與計算 |
| i32 | ３２位元有號整數 | 常見預設整數與舊示例 |
| usize | 隨目標平台大小的無號整數 | 長度、數量與索引 |
| f64 | ６４位元浮點數 | 小數測量值與比值 |
| bool | true 或 false | 比較與條件 |
| char | 一個 Unicode scalar value | 單個文字單位 |
| String | 擁有 UTF-8 文字的容器 | 需要自己保存或增長的文字 |
| &str | 借看一段 UTF-8 文字 | 字串常值、只讀文字參數 |

i64 的 i 表示有號整數，不是能容納無限位數的數學整數。
usize 適合索引，但不是所有非負業務資料都必須用 usize。
f64 不是精確實數，也不保證所有小數能精確儲存。
String 與 &str 現在先辨認，第七單元才正式講所有權與借用。

```rust
fn main() {
    let tickets: i64 = 120;
    let rooms: i32 = 8;
    let row: usize = 0;
    let length: f64 = 1.25;
    let open: bool = true;
    let symbol: char = '物';
    let title: &str = "Exhibition";
    let note: String = String::from("Bring water");
    println!("{tickets} {rooms} {row} {length} {open}");
    println!("{symbol} {title} {note}");
}
```

冒號後的型別註記，把需求明寫出來。
很多情況 Rust 可以從值及使用位置推論型別，不代表程式沒有型別。
一般未受限制的整數常推論為 i32，浮點數常為 f64。
需要特定範圍時不要只靠猜；用註記說清楚。

```compile_fail
fn main() {
    let tickets: i64 = "120";
    println!("{tickets}");
}
```

這是型別錯誤：文字不是整數。
不是把引號拿掉就能處理任意輸入；鍵盤文字要解析，單元６會學。

## 2.5：運算優先序與括號

乘法、除法、餘數的優先序高於加減。
同層的這些一般二元運算由左往右分組。
括號可以明確指定先算哪一段，也能讓公式更容易讀。

```rust
fn main() {
    let a = 2 + 3 * 4;
    let b = (2 + 3) * 4;
    let c = 18 / 3 * 2;
    println!("a={a}, b={b}, c={c}");
}
```

a 為１４，b 為２０，c 為１２。
不要把 `18 / 3 * 2` 自動讀成 `18 / (3 * 2)`。
把物理或數學公式翻成程式時，先標出分子、分母與括號。

| 手算檢查 | 例子 |
|---|---|
| 先乘後加 | ２＋３×４＝１４ |
| 先括號 | （２＋３）×４＝２０ |
| 同層左往右 | （１８÷３）×２＝１２ |

在公式中寫清楚括號通常比省幾個字元更值得。
但括號只能控制計算順序，不能把錯誤型別變成正確型別。

## 2.6：整數除法與餘數

```rust
fn main() {
    let items: i64 = 29;
    let per_box: i64 = 6;
    let full_boxes = items / per_box;
    let leftover = items % per_box;
    println!("boxes={full_boxes}, leftover={leftover}");
    println!("negative quotient={}, remainder={}", -7 / 3, -7 % 3);
}
```

正整數例子中，２９＝４×６＋５，所以完整箱數４、剩餘５。
`%` 是餘數，不是百分比計算。
整數除法捨去小數部分，朝零截斷；因此－７／３為－２。
對這個例子，－７％３為－１。
不要把負數餘數的行為直接套成「一定介於０到除數－１」。

作業若限定非負總數，分組與拆解可先依非負範圍推理。
分階段拆單位時，要知道每一步算的是整體，還是上一階段的剩餘量。
例如裝箱後的剩餘物品，才應繼續分成較小包，而非又使用原始總量。
這是秒數拆分作業要你自己完成的同一種推理。

整數除以０不是合法運算；執行時發生會失敗。
若在編譯時已確定不可能的常數運算，編譯器也可能先拒絕。
先根據輸入契約確認除數，不要只等程式出錯才想起限制。

## 2.7：型別轉換與浮點除法

```rust
fn main() {
    let distance_cm: i64 = 175;
    let whole_meters = distance_cm / 100;
    let meters = distance_cm as f64 / 100.0;
    let converted_late = (distance_cm / 100) as f64;
    println!("whole={whole_meters}");
    println!("meters={meters}");
    println!("late={converted_late}");
}
```

| 表達式 | 先做什麼 | 結果 |
|---|---|---|
| distance_cm / 100 | 整數除法 | １ |
| distance_cm as f64 / 100.0 | 先轉型再浮點除法 | １．７５ |
| (distance_cm / 100) as f64 | 先截斷才轉型 | １．０ |

as 是明確型別轉換，不是顯示格式指令。
事後轉型不能找回先前整數除法丟掉的小數。
不同數值型別一般不能直接混算，需要表達清楚轉換位置。

```compile_fail
fn main() {
    let centimeters: i64 = 175;
    let meters = centimeters / 100.0;
    println!("{meters}");
}
```

這個反例混合 i64 與浮點除數。
修正要依需求先決定整數結果或小數結果，不是隨意把所有數字都加 .0。
非常大的整數轉成 f64 也可能失去精確性，型別轉換不是任何情況都安全。

## 2.8：有限範圍、溢位與可觀察的檢查

i64 與 i32 的可表示範圍有限，差別不只是名字長短。
下面反例預期無法編譯，因為字面值超過 i32 範圍。

```compile_fail
fn main() {
    let too_large: i32 = 3_000_000_000;
    println!("{too_large}");
}
```

底線可協助人閱讀大數字，不會改變數值。
已知資料可能超出 i32，就應先選擇合適型別，不能等最後再轉型補救。
計算的中間結果也可能先溢位，即使最後想要的值較小。

一般整數運算的溢位行為受建置設定影響。
常見 debug 檢查會 panic，但不能把「release 永遠怎麼做」當成跨設定契約。
需要明確檢查時，可用 checked_add：

```rust
fn main() {
    let maximum = i64::MAX;
    println!("fits={:?}", 20_i64.checked_add(3));
    println!("too large={:?}", maximum.checked_add(1));
}
```

這裡輸出 Some(23) 與 None。
目前先讀作「有可表示的結果」與「無可表示的結果」。
Option 的完整模式處理留到集合單元；此處以偵錯輸出觀察範圍。
checked_add 讓溢位成為明確結果，不依賴某次建置是否開啟檢查。

本課每題提供數值範圍，是要讓你能推理運算是否裝得下。
選 i64 不代表永遠不溢位；只比 i32 有更大範圍。

## 2.9：數值與顯示格式不同

```rust
fn main() {
    let ratio: f64 = 2.0 / 3.0;
    println!("default={ratio}");
    println!("two decimals={ratio:.2}");
    println!("after formatting={ratio}");
    println!("binary example={}", 0.1_f64 + 0.2);
}
```

`{ratio:.2}` 要求這次顯示小數點後兩位，不會把 ratio 改成只剩兩位精度。
最後再用預設格式輸出，仍可看到原本儲存的值。
浮點數使用有限的二進位表示，某些十進位小數不能精確儲存。
所以０．１＋０．２可能顯示為非常接近０．３、但不完全相同的值。

顯示小數兩位、把數值四捨五入、用容許誤差比較，是三種不同需求。
沒有要求格式時，不要因為漂亮就加額外單位或固定文字。
數值題是否允許不同等價顯示，由作業規格決定。
第十一單元會正式討論絕對誤差、相對誤差與測試。

## 2.10：先借用輸入工具，正式解析留到單元６

第二到第四單元使用本課已完成的輸入工具。
它們不是 Rust 內建，也不是 C++ 的 cin；只是課程共用函式。
每次呼叫讀一行合法單一數值。
先保留 use 和呼叫，專注你負責的運算。

```rust
use rust_beginner_course::support::read_i64;

fn main() {
    let boxes = read_i64();
    let items_per_box = read_i64();
    let total_items = boxes * items_per_box;
    println!("{total_items}");
}
```

輸入應是兩行，例如第一行４、第二行６；結果２４。
不要把 `4 6` 寫在同一行，因為一次呼叫期待整行是一個整數。
不需要另外印「請輸入」，除非題目規格要求。

```rust
use rust_beginner_course::support::read_f64;

fn main() {
    let centimeters = read_f64();
    let meters = centimeters / 100.0;
    println!("{meters}");
}
```

輸入１７５．５，輸出１．７５５。
read_i64 回傳 i64，read_f64 回傳有限 f64。
非法輸入或缺少一行，教學工具會回報並以非零退出碼結束；本單元作業保證合法輸入。
這不是要求你現在就寫重試；單元６會拆解文字、parse 與錯誤政策。

use 讓程式找到課程函式，`rust_beginner_course` 是這個函式庫的名稱。
在本課作業中用 Cargo 建置，才能自動接上這個共用函式庫。
把含這行 use 的檔案單獨交給 rustc，若沒提供函式庫，就會找不到它。
單元０的獨立 hello_rust 也沒有自動附帶本課工具。

## 2.11：常見錯誤與作業前檢核

| 錯誤 | 先看哪個模型 |
|---|---|
| 9 / 5 當成１．８ | 運算元型別決定整數或浮點除法 |
| 整數算完才轉 f64 | 轉型時機不能追回被截斷的小數 |
| 所有變數都 mut | 是否真的有狀態更新 |
| 比較寫成賦值 | = 和 == 的結果與用途不同 |
| 把三筆輸入放同一行 | 每次教學讀取函式讀一行 |
| 格式化後以為變數變了 | 顯示與儲存數值分開 |
| 超出資料範圍也要求通過 | 先確認函式與作業的契約 |

## 2.12：實作與操作

- [２－１：攝氏換華氏](exercises/2-1.md)：一行有限數值輸入，只輸出換算數值。
- [２－２：秒數拆成時分秒](exercises/2-2.md)：一行非負整數，輸出三個以空白分隔的整數。
- [２－３：加權成績](exercises/2-3.md)：依序讀三行小數，依指定權重計算。

２－１的攝氏範圍為－３００到１０００；這是運算題的輸入契約，不是聲稱所有值都能描述實際物理狀態。
２－２的小時允許超過２３，不應自行改成一天內的時鐘。
２－３的三筆成績各０到１００，順序與權重以作業頁為準。
不要拿全部相同分數作唯一測試，因為錯誤公式也可能碰巧相同。

從 beginner 目錄執行：

```sh
cargo run -- lesson 2
cargo run -- lesson 2-1
cargo run -- manual 2-1
cargo run -- run 2-1
cargo run -- answer 2-1
```

先手算每一個中間值，確認型別，再執行。
不要求你把示範商品公式改幾個名字當作答案；要從自己的作業規格建立公式。

## 2.13：自我檢核與答案

１．let total＝price×quantity 之後改 quantity，total 會自動更新嗎？
答案：不會，綁定的是當時算出的值；要更新必須再計算。

２．shadowing 和 mut 賦值是否一樣？
答案：不一樣，前者建立新的綁定，後者修改既有可變綁定。

３．１７５／１００再轉浮點數，為何不是１．７５？
答案：整數除法先得到１，小數已丟失；要在除法前轉型。

４．% 是否表示除以１００？
答案：不是，它計算餘數。

５．i64 是否能表示任意長整數？
答案：不能，它仍只有固定範圍。

６．兩位小數顯示是否改變原變數？
答案：不會，格式只影響這次輸出。

７．一題有三行輸入，可以只呼叫一次 read_f64 嗎？
答案：不能，一次只讀一行單一值；要依題目順序呼叫三次。

８．全部測試值都相等，能否有效檢查加權公式？
答案：不一定，多種錯誤權重也會得到相同結果，應挑能區分公式的不同值。

## 官方來源與範圍

- [變數與可變性](https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html)：let、mut 與 shadowing。
- [資料型別](https://doc.rust-lang.org/book/ch03-02-data-types.html)：數值與基本型別。
- [運算子](https://doc.rust-lang.org/reference/expressions/operator-expr.html)：運算與整數溢位規則。
- [i64::checked_add](https://doc.rust-lang.org/std/primitive.i64.html#method.checked_add)：明確檢查範圍。
- [格式語法](https://doc.rust-lang.org/std/fmt/)：數值顯示。

本單元沒有完整教授文字所有權、Option 分支、一般數值分析或任意精度運算。
support 工具是暫時教學介面；標準輸入解析將在第六單元正式完成。


---

# 單元３：條件判斷與布林推理

## 學習成果與先備

本單元要把文字規則轉成可以推理與驗證的分支。
完成後，你應能說明一個輸入為何走進某個分支，並用切換點前後的資料檢查邊界。
先備是變數、型別、數值運算與基本輸出，不需要先學自己定義函式。

在 beginner 執行 `cargo run -- lesson 3` 閱讀完整單元。
本課用運費與營業時間示範，不直接完成成績級距、閏年或三角形作業。

## 3.1 條件必須產生 bool

bool 只有 true 與 false 兩個值。
它可以來自比較，也可以是已經保存好的狀態，例如 `let is_member = true;`。
Rust 的 if 不把非零整數自動當成 true，這使「數值本身」與「對數值提出的問題」保持區別。

| 比較 | 問的問題 | 範例 |
| --- | --- | --- |
| `==` | 是否相等 | quantity == 0 |
| `!=` | 是否不同 | quantity != 0 |
| `<`／`>` | 是否嚴格小於／大於 | price > 100 |
| `<=`／`>=` | 是否包含邊界 | price >= 100 |

`let price = 100;` 是建立綁定，`price = 200;` 是對允許修改的變數賦值。
`price == 200` 才是在問價格是否為２００。
不要因為數學課用等號描述相等，就把程式中的賦值與比較混在一起。

以下是刻意的編譯錯誤，不能把數量直接當成條件：

```compile_fail
fn main() {
    let quantity = 3;
    if quantity {
        println!("there are items");
    }
}
```

正確的問題可能是 quantity > 0，而不是要求編譯器猜測數字代表什麼狀態。

## 3.2 if 是選擇行為的控制流程

下面的 && 表示左右兩個條件都必須成立；先依這個意思讀例子，3.6 節再整理完整真值表。

```rust
fn main() {
    let hour = 12;
    if hour >= 9 && hour < 17 {
        println!("shop is open");
    } else {
        println!("shop is closed");
    }
    println!("check finished");
}
```

程式先計算條件，只執行成立分支或 else 分支其中之一。
走完被選中的區塊後，會繼續執行分支後面的 check finished。
大括號不是裝飾，它決定哪些敘述屬於同一個分支。

文字規則「九點開始、十七點結束」仍可能有歧義。
本例明定營業區間是 9 <= hour < 17，包含九點、不包含十七點。
寫程式前先決定端點，不能等測試失敗才猜應該加不加等號。

| hour | >= 9 | < 17 | 最後分支 |
| --- | --- | --- | --- |
| 8 | false | true | closed |
| 9 | true | true | open |
| 16 | true | true | open |
| 17 | true | false | closed |

## 3.3 if 表達式也可以產生一個值

```rust
fn main() {
    let subtotal = 450;
    let shipping = if subtotal >= 500 {
        0
    } else {
        60
    };
    let total = subtotal + shipping;
    println!("shipping={shipping}, total={total}");
}
```

這次不是在每個分支內印字，而是先選出一個數值，綁定到 shipping。
兩個分支的最後一行都沒有分號，讓該表達式產生整數。
整個 let 敘述最後仍有分號；分支內與 let 結尾的分號有不同位置與作用。

可以先這樣區分：敘述安排要做的事，表達式可以產生值。
Rust 的許多語法同時能參與更大的表達式，if 是第一個重要例子。
本例結果是 shipping=60、total=510。

若把分支內的 0 改成字串 "free"，另一支仍是整數 60，兩邊無法提供同一種 shipping 型別。
若在分支最後寫 `0;`，該區塊就不再以那個整數作為結果。
這些不是排版小錯，而是改變了程式的值與型別。

## 3.4 多級規則與 else if 的順序

```rust
fn main() {
    let package_kg = 4;
    let fee = if package_kg <= 1 {
        50
    } else if package_kg <= 5 {
        100
    } else {
        180
    };
    println!("fee={fee}");
}
```

else if 只會在前面的條件不成立時才被檢查。
當程式到達第二個條件，已知 package_kg > 1，所以第二段實際代表 1 < package_kg <= 5。
這項前面分支已建立的資訊，可以讓後面的條件更簡單。

| package_kg | 第一支 <= 1 | 第二支 <= 5 | fee |
| --- | --- | --- | --- |
| 1 | true | 不再檢查 | 50 |
| 2 | false | true | 100 |
| 5 | false | true | 100 |
| 6 | false | false | 180 |

如果把 <= 5 放在最前面，重量１就會先被它接走，無法再進入原本較便宜的分支。
條件看起來都「有寫到」，不代表它們在這個順序下仍能被正確選到。

## 3.5 多個 if 與一條 else if 鏈不同

若兩個獨立 if 的條件都成立，兩個區塊都可能執行。
一條 if／else if／else 鏈只選一支，適合互斥分類。

例如「需要冷藏」與「包裹易碎」可以同時成立，通常是兩個獨立屬性。
「輕、中、重」若是單一重量級距，通常應是互斥分類。
先從規格確認能否重疊，再決定控制流程，不要僅憑自己習慣使用某種語法。

## 3.6 &&、|| 與 ! 把條件組合起來

&& 表示兩邊都成立，|| 表示至少一邊成立，! 表示布林否定。
「至少一邊成立」包含兩邊都成立，不是只能剛好一邊。

| a | b | a && b | a || b | !a |
| --- | --- | --- | --- | --- |
| false | false | false | false | true |
| false | true | false | true | true |
| true | false | false | true | false |
| true | true | true | true | false |

條件複雜時用括號寫出你的分組意圖，例如 `(is_member || has_coupon) && has_items`。
不要只依靠記憶中的優先順序，讓未來讀者難以看出哪幾個條件是一組。
`!ready` 的驚嘆號是否定；`println!` 名稱結尾的驚嘆號則表示巨集，兩者位置與用途不同。

## 3.7 短路：結果確定後不再計算另一側

```rust
fn main() {
    let value = 30_i64;
    let divisor = 0_i64;
    let divides_exactly = divisor != 0 && value % divisor == 0;
    println!("divides_exactly={divides_exactly}");
}
```

&& 左側為 false 時，整個結果已確定是 false，因此右側不執行。
本例不會計算除以零的餘數，而是印 false。
若顛倒兩側，保護條件還沒被檢查就可能先發生無效運算。

|| 左側為 true 時也會短路，因為整體已確定成立。
短路不只是節省計算，它會影響哪些操作實際發生，寫程式時必須考慮順序。

## 3.8 巢狀判斷與由外而內的問題分解

```rust
fn main() {
    let shop_open = true;
    let has_stock = false;
    if shop_open {
        if has_stock {
            println!("order accepted");
        } else {
            println!("out of stock");
        }
    } else {
        println!("come back later");
    }
}
```

外層先決定現在能不能營業，只有 open 才進一步詢問庫存。
將它改寫成複合條件時，仍要保留不同失敗原因的輸出。
不能把兩種原因隨意合併，卻宣稱行為完全相同。

## 3.9 從規格建立邊界測試表

先列合法輸入範圍，再圈出每個分支的切換點。
對每個切換點選前一個、正好、後一個輸入，手算預期分支。
如果規格包含例外條件，先確認例外是否優先，以及與一般條件能否同時成立。

第二～四單元的作業提供 support::read_i64 或 support::read_f64，每次呼叫讀取一行合法單值。
它們是課程工具，不是 Rust 內建函式。
先保留題目提供的 use 與讀取呼叫；單元５解釋函式呼叫，單元６拆解輸入機制。
不要為了這些條件題，先自行抄入尚未理解的 Option 或 Result 輸入模板。

## 常見錯誤與自我檢核

- 用 = 取代 ==：把設定值與比較混淆。
- 起始條件太寬：後面的窄範圍永遠到不了。
- if 表達式的分支最後多了分號：沒有交出預期的值。
- 只有一般值，沒有切換點測試：容易漏掉 <= 與 < 的差異。
- 條件重疊時選錯 if 結構：可能多次執行或錯失分類。

問題一：if 鏈會執行所有成立分支嗎？
答案：不會，只執行第一個成立分支；獨立 if 才可能各自執行。

問題二：為什麼運費規則要先畫區間？
答案：先把端點、重疊與例外確認清楚，才能判斷程式分支是否完整。

問題三：為什麼保護條件要放在 && 左側？
答案：左側先決定是否需要計算右側，順序影響安全與行為。

## 作業與官方來源

- [３－１：成績級距](exercises/3-1.md)。
- [３－２：閏年判斷](exercises/3-2.md)。
- [３－３：三角形分類](exercises/3-3.md)。

以 `cargo run -- lesson 3-1` 讀題，`cargo run -- run 3-1` 驗收。
提示與參考答案分開顯示，請先手算邊界表。

官方閱讀：[控制流程](https://doc.rust-lang.org/book/ch03-05-control-flow.html)、[布林與比較運算](https://doc.rust-lang.org/reference/expressions/operator-expr.html)。


---

# 單元４：迴圈、狀態追蹤與終止

## 學習成果與先備

本單元要學會描述重複工作，而不是只背 for 的括號與關鍵字。
完成後，你應能追蹤每輪狀態，選擇 for、while 或 loop，並解釋程式為什麼會停止。
先備是變數修改、數值運算、布林條件與 if。

在 beginner 執行 `cargo run -- lesson 4` 閱讀。
以下以倒數、存款達標、星號圖與資料更新示範，作業另要求你解決新的問題。

## 4.1 把重複敘述變成重複規則

印出三次提醒可以複製三行程式，但提醒次數改成一百時，複製就很難檢查與維護。
迴圈把「本輪做什麼」與「哪些值要走訪」分開描述。
修改次數時，不必重新複製所有步驟。

for 適合依序走訪已知範圍或集合。
while 適合每輪前根據目前狀態判斷是否繼續。
loop 表示持續重複，通常由本體內的 break 決定離開時機。

## 4.2 範圍、端點與空範圍

| 範圍 | 本例會取得的值 |
| --- | --- |
| `0..4` | 0、1、2、3 |
| `1..=4` | 1、2、3、4 |
| `4..4` | 沒有值 |
| `1..=0` | 對此整數遞增範圍而言，沒有值 |

`..` 不包含右端，`..=` 包含右端。
先寫出實際序列，就容易分清「最後值」與「總次數」不是同一件事。
從０開始到不含４的範圍，取得四個值；從１到含４，也取得四個值，但每輪的數字不同。

```rust
fn main() {
    for page in 0..4 {
        println!("zero-based page: {page}");
    }
    for second in (1..=3).rev() {
        println!("countdown: {second}");
    }
    println!("go");
}
```

第一個迴圈依序顯示０～３，第二個依序顯示３、２、１。
rev() 反向取得範圍內的值，不是把整數改成負數，也不會自動包含０。
每個迴圈都各有自己的本輪變數名稱。

## 4.3 累加器與計數器不是同一件事

累加器保存某些數值的合計，計數器保存符合條件的筆數。
兩者常同時出現，但更新方式不同：合計加上資料值，筆數只增加１。

```rust
fn main() {
    let mut total = 0;
    let mut count = 0;
    for delivery in 1..=4 {
        let distance = delivery * 2;
        total += distance;
        count += 1;
    }
    println!("total distance={total}, deliveries={count}");
}
```

| delivery | 本輪 distance | total 更新後 | count 更新後 |
| --- | --- | --- | --- |
| 1 | 2 | 2 | 1 |
| 2 | 4 | 6 | 2 |
| 3 | 6 | 12 | 3 |
| 4 | 8 | 20 | 4 |

`total += distance` 等價於 `total = total + distance`。
累加器要在迴圈外建立，才會保留上一輪的結果。
如果在每輪內重新宣告 total=0，每次只會保存本輪的局部結果。

## 4.4 作用域：迴圈內的名字不會變成全域

```compile_fail
fn main() {
    for round in 1..=3 {
        let message = round * 10;
        println!("{message}");
    }
    println!("{round} {message}");
}
```

round 與 message 的有效範圍都在迴圈本體內，外面不能直接使用。
若需要在迴圈結束後保存統計結果，就把那個狀態明確宣告在外面。
這能讓讀者看出哪些資料跨越多輪，哪些只屬於一輪。

## 4.5 while：先問是否需要下一輪

```rust
fn main() {
    let target = 130;
    let mut savings = 40;
    let mut weeks = 0;
    while savings < target {
        savings += 30;
        weeks += 1;
    }
    println!("weeks={weeks}, savings={savings}");
}
```

| 檢查時點 | savings | < 130？ | 本輪後 savings／weeks |
| --- | --- | --- | --- |
| 第一次 | 40 | true | 70／1 |
| 第二次 | 70 | true | 100／2 |
| 第三次 | 100 | true | 130／3 |
| 第四次 | 130 | false | 不再執行 |

while 可能一次也不執行，例如起始存款已達標。
本例會停止，因為每輪 savings 增加３０，而條件要求它仍小於固定目標。
若忘了更新 savings，條件可能永遠為真；只有列出初始值不等於已說明終止性。
本示範限定小型整數，不把可能溢位的無界累加當作一般保證。

## 4.6 loop 與 break：離開時機寫在本體內

```rust
fn main() {
    let mut remaining = 3;
    loop {
        if remaining == 0 {
            break;
        }
        println!("remaining={remaining}");
        remaining -= 1;
    }
    println!("finished");
}
```

loop 本身不提供條件；如果沒有可以到達的 break，就會持續執行。
本例先檢查再扣除，避免 remaining 已為０仍繼續減。
break 離開目前這個迴圈，後面的 finished 仍會執行。
它不是直接結束整支程式。

## 4.7 continue：略過本輪，不是停止全部

```rust
fn main() {
    let mut total = 0;
    for request in 1..=6 {
        if request == 2 || request == 5 {
            continue;
        }
        total += request;
    }
    println!("accepted total={total}");
}
```

本例略過２與５，其他值仍會被處理，結果是１４。
在 while 中使用 continue 時，要特別確認狀態更新是否被一起跳過。
如果 continue 永遠發生在增加索引之前，程式可能卡在同一個值。

## 4.8 巢狀迴圈與輸出位置

```rust
fn main() {
    for row in 1..=4 {
        for _column in 0..row {
            print!("*");
        }
        println!();
    }
}
```

輸出是四行星號，每行數量依序是１、２、３、４。
外層每走一輪，內層會從它的起始值重新完整走訪。
print! 不換行，println!() 在一列完成後才換行。
`_column` 仍是合法變數名稱；底線前綴表示這個值在本例不需要被使用。

| row | 內層的值 | 印出星號次數 | 何時換行 |
| --- | --- | --- | --- |
| 1 | 0 | 1 | 內層結束後 |
| 2 | 0、1 | 2 | 內層結束後 |
| 3 | 0、1、2 | 3 | 內層結束後 |

如果把 println! 放進內層，每顆星號都會換行，圖形就改變了。
二維問題要分清楚「一列結束」與「一個元素結束」。

## 4.9 off-by-one 與特殊起始狀態

少一次或多一次的錯誤常出現在端點、起始計數與停止條件。
檢查０筆、１筆、一般多筆，通常比只測很大的值更容易找出錯誤。
反覆修改整數時，還要確認特殊值是否需要先處理，例如零本身也可能代表一個有效項目。

為每個迴圈寫三句說明：開始保存什麼，完成一輪後保存什麼，什麼變化保證會到達停止條件。
這是狀態推理的起點，不要求先背形式化證明術語。
輸出正確與確實理解迴圈方法是不同的評量面向。

第二～四單元作業提供 support::read_i64／read_f64，每次一行合法單值。
它們是暫借的課程輸入工具，不是 Rust 內建；保留 use 與呼叫方式，之後在單元５、６回收說明。
本單元不要求先自行處理多筆輸入、Option 或解析失敗。

## 常見錯誤與自我檢核

- 迴圈內重設累加器：上一輪資訊被丟掉。
- 計數器加上資料值：把筆數與總和混淆。
- while 本體沒有改變條件依賴的狀態：可能不會停止。
- 在 continue 前漏更新：同一個狀態可能永遠被略過。
- 把換行放錯層：內容正確但版面與規格不同。

問題一：while 起始條件為 false 會執行幾輪？
答案：零輪。

問題二：break 與 continue 哪個會離開目前迴圈？
答案：break；continue 只結束本輪，準備下一輪。

問題三：要保存迴圈最後的統計，狀態應宣告在哪裡？
答案：需要跨輪保存的狀態在迴圈外，單輪暫存可以留在迴圈內。

## 作業與官方來源

- [４－１：整數區間累加](exercises/4-1.md)。
- [４－２：倍數條件與計數](exercises/4-2.md)。
- [４－３：十進位位數](exercises/4-3.md)。
- [４－４：尋找達標的二次冪](exercises/4-4.md)。
- [４－５：乘法表](exercises/4-5.md)。

先用 `cargo run -- lesson 4-1` 讀題，手算輸入後再用 `cargo run -- run 4-1` 驗收。

官方閱讀：[迴圈與控制流程](https://doc.rust-lang.org/book/ch03-05-control-flow.html)、[範圍](https://doc.rust-lang.org/std/ops/struct.Range.html)。


---

# 單元５：函式分解、契約與早期測試

## 學習成果與先備

本單元要把一段程式拆成有明確輸入、輸出與責任的函式。
完成後，你應能追蹤呼叫流程，區分回傳與印字，並以簡單斷言檢查正常結果及必要前置條件。
先備是變數、數值運算、條件與迴圈。

在 beginner 執行 `cargo run -- lesson 5` 閱讀。
本課示範時間換算與時間組合，不直接提供偶數判斷、clamp 或矩形塗裝作業的完整答案。

從本單元開始，起始程式中的 `todo!("說明")` 是尚未實作的標記：它可以編譯，但執行到該處會觸發 panic。請用自己的實作替換整個 todo! 表達式，而不是只修改括號中的文字。起始驗收失敗代表工作尚未完成，不是工具安裝壞掉。

## 5.1 函式是可重複使用的計算介面

把相同公式複製到多個地方，修改時很容易只改一份。
函式把計算規則集中在一處，其他位置透過名稱與參數使用它。
一個好的函式名稱，也讓讀者先理解意圖，再決定是否深入讀公式。

```rust
fn minutes_to_seconds(minutes: i64) -> i64 {
    minutes * 60
}

fn main() {
    let first = minutes_to_seconds(2);
    let second = minutes_to_seconds(5);
    println!("first={first}, second={second}");
}
```

fn 開始函式定義；minutes 是參數名稱，i64 是它接收的型別。
箭頭右邊的 i64 指定回傳型別。
呼叫時的２與５是引數，分別被交給這次呼叫中的 minutes。

| 呼叫 | 本次 minutes | 計算 | 回到呼叫處的值 |
| --- | --- | --- | --- |
| minutes_to_seconds(2) | 2 | 2 × 60 | 120 |
| minutes_to_seconds(5) | 5 | 5 × 60 | 300 |

每次呼叫的區域資料分開存在，第二次呼叫不會偷偷沿用第一次的 minutes。
函式本體在呼叫時才執行，定義寫在 main 前後都不表示它會先自行跑一次。

## 5.2 回傳值與輸出文字不同

上面的函式交回數值，main 才決定要印、再計算或保存。
這種分工讓函式也能被測試、檔案工具或其他介面使用，不必知道數字最初來自鍵盤還是固定資料。

下列程式是刻意的編譯錯誤：

```compile_fail
fn minutes_to_seconds(minutes: i64) -> i64 {
    println!("{}", minutes * 60);
}
fn main() {}
```

println! 把文字寫到輸出，不會把那個整數作為 i64 回傳。
函式宣告要交回 i64，實際卻沒有提供它，因此不能通過型別檢查。
看見終端機顯示１２０，不等於呼叫者已拿到整數１２０。

## 5.3 最後表達式與提早 return

Rust 可使用函式本體最後一個不加分號的表達式作為回傳值。
`minutes * 60` 與 `return minutes * 60;` 可以表達相同回傳，但後者也可在函式中間提早離開。

```rust
fn shipping_minutes(stops: i64) -> i64 {
    if stops == 0 {
        return 0;
    }
    let travel = stops * 8;
    let loading = 5;
    travel + loading
}

fn main() {
    println!("no stops: {}", shipping_minutes(0));
    println!("three stops: {}", shipping_minutes(3));
}
```

本示範假設 stops 是小型非負整數。
當 stops＝０，return 直接結束函式，不會再加入裝載時間。
當 stops＝３，先計算２４分鐘行程，再回傳２９。

若在最後的 `travel + loading` 後加分號，就把它變成被執行後捨棄結果的敘述。
這不是所有分號都不能用，而是要分清楚哪一個位置負責交出值。

## 5.4 區域作用域與呼叫者的名字

呼叫者可以使用與函式參數不同的變數名稱。
例如 main 的 duration 傳入 minutes_to_seconds 後，函式內仍以 minutes 稱呼本次接收到的值。
對 i64 參數的計算不會自動修改呼叫者的原變數。

函式內宣告的 travel、loading 等名字，只在相應作用域有效。
不要為了跨函式共享某個值就隨意建立全域變數；先問它能否作為參數或回傳值明確傳遞。
這讓資料來源更清楚，也讓同一個函式容易用不同資料測試。

## 5.5 以小函式組合較大的工作

```rust
fn minutes_to_seconds(minutes: i64) -> i64 {
    minutes * 60
}

fn timer_value(hours: i64, extra_minutes: i64) -> i64 {
    let whole_minutes = hours * 60 + extra_minutes;
    minutes_to_seconds(whole_minutes)
}

fn main() {
    println!("one hour five minutes={}", timer_value(1, 5));
    println!("three minutes={}", timer_value(0, 3));
}
```

呼叫關係是 main → timer_value → minutes_to_seconds，再依序回到呼叫處。
timer_value 不重新複製「分鐘乘６０」的公式，而是重用已有介面。
如果測試指出換算錯誤，可以分別檢查組合與底層換算，縮小問題範圍。

拆函式不是把每一行都換成一個名字。
當一段工作有清楚意義、值得重用或需要獨立測試時，拆出來才更有幫助。
函式過度依賴外部隱藏狀態，也會削弱這些好處。

## 5.6 前置條件、後置條件與 assert!

前置條件描述呼叫時應成立的要求，後置條件描述成功回傳後應成立的關係。
例如以下示範只接受非負分鐘與０～５９的秒欄位，回傳合成的總秒數。

在使用前先認識兩個檢查工具：assert!(條件, "訊息") 要求布林條件為 true，否則觸發 panic；assert_eq!(實際值, 預期值) 要求兩個值相等，否則觸發 panic 並顯示差異。
驚嘆號表示巨集，和 println! 相同；完整說明接在示範後面。

```rust
fn clock_seconds(minutes: i64, seconds: i64) -> i64 {
    assert!(minutes >= 0, "minutes must be nonnegative");
    assert!(seconds >= 0 && seconds < 60, "seconds must be in 0..60");
    minutes * 60 + seconds
}

fn main() {
    assert_eq!(clock_seconds(2, 15), 135);
    assert_eq!(clock_seconds(0, 0), 0);
    println!("clock fields checked");
}
```

assert! 接收 bool，成立就繼續，不成立會觸發 panic。
第二個參數是失敗訊息，可幫助指出哪個要求被破壞。
assert_eq! 比較兩個值是否相等，不等時會顯示兩邊資訊。
名稱尾端的驚嘆號表示巨集，與條件前的布林否定 ! 不同。

這裡的數值範圍還假設合成結果可由 i64 表示，不能因為加了兩個 assert 就宣稱任意大數都不會溢位。
若規格還包含更大範圍，必須另外設計表示法或檢查方式。
契約的意義是把要求說清楚，不是宣稱幾行檢查能解決所有情況。

## 5.7 panic 與可預期的使用者錯誤

assert 失敗會使目前執行緒 panic；未被捕捉的主執行緒 panic 會讓這次程式失敗。
它不同於編譯錯誤，因為程式可以編譯，但執行到違反要求的路徑才發生。
一般 assert! 在 debug 與 release 都會檢查，不能假設最佳化後會消失。

使用者打錯資料是可預期事件，通常應給外層選擇如何處理，而不是一律 panic。
單元１０會以 Result 表達這類正常的失敗路徑。
本課先用 assertion 練習內部契約與測試，不要求自己捕捉 panic，也不需要先學閉包或 catch_unwind。

## 5.8 最小測試框架：讓工具自動呼叫檢查

```rust
fn minutes_to_seconds(minutes: i64) -> i64 { minutes * 60 }
fn clock_seconds(minutes: i64, seconds: i64) -> i64 {
    assert!(minutes >= 0);
    assert!(seconds >= 0 && seconds < 60);
    minutes * 60 + seconds
}
fn main() {}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn two_minutes() { assert_eq!(minutes_to_seconds(2), 120); }
    #[test]
    fn no_time() { assert_eq!(minutes_to_seconds(0), 0); }
    #[test]
    #[should_panic]
    fn invalid_seconds_are_rejected() { clock_seconds(1, 60); }
}
```

#[test] 請測試工具執行下一個函式。
#[cfg(test)] 讓模組只在測試設定下編譯；mod tests 組織測試，use super::* 引入上層函式名稱。
這是先提供的固定框架，不代表你已完整學過模組系統；單元１１、１２會深化。

#[should_panic] 表示這個案例預期觸發 panic，若函式安靜接受錯誤資料，測試反而失敗。
正常案例不要加這個標記，否則可能把原本不應發生的失敗當成成功。
此例不使用 catch_unwind，不需要把新概念一次塞進來。

## 5.9 先看到紅燈，再確認修正成綠燈

在上面的換算函式中，暫時把乘６０改成乘１０，再執行測試。
two_minutes 仍要求１２０，但錯誤版本得到２０，因此該測試應 FAILED，這是紅燈。
恢復正確公式後再跑，正常案例與預期 panic 案例都應通過，得到綠燈。

預期值要根據規格與手算決定，不能只改成目前錯誤輸出的２０來追求通過。
後續可以加入不同資料，確認測試不只對某一個巧合輸入有效。
單元１１會讓你專門設計測試，並用多個故障版本檢查辨識能力。

## 常見錯誤與自我檢核

- 只印結果卻宣告要回傳數值：輸出與回傳責任不同。
- 最後表達式多了分號：函式沒有交出預期型別。
- 所有函式都重新抄同一公式：失去集中修改與獨立驗證的優點。
- 參數型別正確就假設數值有效：還要對照契約。
- 用 should_panic 掩蓋普通案例失敗：測試的預期方向寫錯。

問題一：參數名稱必須與呼叫者變數同名嗎？
答案：不必；引數的值依參數位置與型別交給函式。

問題二：回傳值能否先做別的計算而不印出？
答案：可以；輸出是呼叫者決定的一種用途，不是數值回傳本身。

問題三：為什麼契約與測試都需要？
答案：契約說明允許與要求，測試對選定資料提供可重現證據，兩者不能彼此取代。

## 作業與官方來源

- [５－１：偶數判斷函式](exercises/5-1.md)。
- [５－２：有契約的範圍限制](exercises/5-2.md)。
- [５－３：面積與費用的函式重用](exercises/5-3.md)。

以 `cargo run -- lesson 5-1` 讀題，`cargo run -- run 5-1` 驗收。
作業中的函式有固定名稱與型別，請遵守介面，計算細節自己設計。
原生 cargo test 與課程驗收的確切用法依作業頁指定來源操作。

官方閱讀：[函式](https://doc.rust-lang.org/book/ch03-03-how-functions-work.html)、[測試](https://doc.rust-lang.org/book/ch11-01-writing-tests.html)、[assert!](https://doc.rust-lang.org/std/macro.assert.html)。


---

# 單元 6：文字輸入、解析與輸入流程

## 學習成果

完成本單元後，你應能：

- 區分標準輸入、文字緩衝區與解析後的數值。
- 逐段解釋 read_line 的固定框架。
- 分開處理讀取錯誤、解析錯誤、空行與 EOF。
- 使用 match 從 Result 中取得成功值。
- 設計可重試、可取消且會終止的輸入迴圈。
- 處理一行多個資料，以及多行直到 EOF 的資料流。
- 依規格決定哪些行要忽略、哪些行要回報錯誤。

## 先備與閱讀路線

先完成變數、數值型別、條件、for／while／loop、函式與基本測試。
前面使用的 `support::read_i64`／`support::read_f64` 是已提供的教學轉接函式。
它們把「讀一行文字並嘗試轉換」包起來，讓你先專注計算。
它們不是 Rust 內建語法，也不會取代你對錯誤情況的決策。
現在我們把這個黑盒子拆開；以下示例直接使用標準函式庫。

本單元的小節是閱讀，例如６．１；帶連字號的６－１才是作業編號。
先讀６．１～６．４，再做姓名輸入；接著讀重試與資料流。

## 6.1：先建立資料模型

鍵盤輸入的２５，在程式讀取時先是文字。
數字文字與數值不能混為一談：文字可以有空白、換行或拼錯。

```text
stdin -> String -> trimmed &str -> parse -> Result<number, error>
```

stdin 是標準輸入；終端機中通常連接鍵盤，也可以連接檔案或管線。
String 是用來保存文字的容器。
trim 建立去掉兩端空白的文字檢視。
parse 才嘗試建立指定的數值。
最後的 Result 要由程式判斷成功或失敗。

這個設計讓資料來源與計算分離。
同一支程式可以由人手輸入，也能被自動測試餵入文字。
因此評分作業的輸出規格若沒有要求提示文字，就不要自行多印提示。

## 6.2：讀懂標準輸入框架

```rust
use std::io;

fn main() {
    let mut line = String::new();
    let bytes = io::stdin()
        .read_line(&mut line)
        .expect("cannot read stdin");
    println!("bytes={bytes}");
    println!("raw={line:?}");
    println!("trimmed={}", line.trim());
}
```

| 片段 | 作用 |
|---|---|
| `std` | 標準函式庫的名字 |
| `::` | 在模組或型別的路徑中找名字 |
| `use std::io;` | 把 io 這個名字引入目前範圍 |
| `String::new()` | 建立空的 String |
| `io::stdin()` | 取得標準輸入的控制代碼 |
| `.read_line(...)` | 讀取一行，附加到傳入的 String |
| `&mut line` | 暫時提供修改 line 的能力 |
| `.expect(...)` | 取得成功值；若是錯誤則 panic |

`String::new()` 不需要先有物件，因為它負責建立物件。
`line.trim()` 則是對已存在的 line 呼叫方法。
多行排版中的點號串接，仍是同一個表達式。

目前先把 `&mut line` 視為固定讀取框架。
它不是神祕的輸入符號：mut 允許變數改變，&mut 提供可修改的借用。
第七單元會正式回收借用模型。

若以管線送入 `cat\n`，成功值 bytes 是４。
這個數量是讀入的位元組，不是字元數，也不是解析出的整數。
中文的位元組數與字元數可能不同，第七單元會拆解。

`{:?}` 是偵錯格式；它能把換行以跳脫形式顯示。
一般 `{}` 則直接呈現文字，文字裡的換行會真的換行。

## 6.3：空行、EOF 與讀取失敗

read_line 回傳 `Result<usize, io::Error>`。
先把尖括號讀成「成功值型別，錯誤值型別」，不必現在自己定義泛型。

| 情況 | read_line 的結果 | line 可能內容 |
|---|---|---|
| 讀入文字後按 Enter | Ok(大於０的位元組數) | 含行尾的文字 |
| 只按 Enter | Ok(大於０的位元組數) | 換行字元 |
| 沒有任何剩餘資料 | Ok(0) | 若先清空，仍是空字串 |
| 作業系統讀取失敗 | Err(原因) | 不應假設讀取完整成功 |

EOF 是 end of file，代表資料來源結束。
EOF 不是打出三個字母，也不是一定要輸入一個空行。
檔案最後一行沒有換行，仍會先讀到那一行；下一次讀取才得到 Ok(0)。
在互動終端機中，macOS／Linux 通常可在空白行按 Ctrl+D 傳送 EOF。
Windows 終端機通常以 Ctrl+Z 後 Enter；具體行為也受終端機設定影響。
驗證 EOF 最容易重現的方法，是用有限文字檔或測試程式送入資料後關閉輸入。

expect 適合早期觀察與小型示例，但它會把讀取失敗變成 panic。
正式決定錯誤政策時，可以用 match，寫清楚何時停止。

```rust
use std::io;

fn main() {
    let mut line = String::new();
    match io::stdin().read_line(&mut line) {
        Ok(0) => println!("end"),
        Ok(bytes) => println!("received {bytes} bytes"),
        Err(error) => eprintln!("read error: {error}"),
    }
}
```

eprintln! 把訊息送到標準錯誤輸出 stderr。
println! 送到標準輸出 stdout，通常用於程式的正常結果。
這個示例只展示分支，沒有定義生產系統的退出碼政策。

## 6.4：解析失敗不是讀取失敗

即使鍵盤打 abc，read_line 也能成功讀到三個字母。
接著 parse::<i64>() 才會發現這段文字不是整數。
字串 `"4.5"` 對 f64 可以成功，對 i64 則失敗。
指定型別是需求的一部分，不應看起來像數字就隨便選型別。

```rust
fn main() {
    for text in [" 42 ", "abc", "4.5", ""] {
        let cleaned = text.trim();
        let parsed = cleaned.parse::<i64>();
        match parsed {
            Ok(value) => println!("double={}", value * 2),
            Err(_) => println!("not an integer"),
        }
    }
}
```

| 原文字 | trim 後 | parse 結果 | 動作 |
|---|---|---|---|
| 空白、４２、空白 | 42 | Ok(42) | 印８４ |
| abc | abc | Err(錯誤值) | 印不是整數 |
| 4.5 | 4.5 | Err(錯誤值) | 不做整數計算 |
| 空文字 | 空文字 | Err(錯誤值) | 不假裝是０ |

`::<i64>` 指定轉換目標型別，常稱為 turbofish 寫法。
`Ok(value)` 是模式，把成功值取出並命名為 value。
`Err(_)` 的底線表示忽略錯誤內容，仍然處理失敗情況。
`=>` 左邊是模式，右邊是對應工作。
分支裡有多個敘述時，使用大括號。
match 必須完整處理這裡可能出現的成功與失敗。

trim 只去掉兩端空白，不修改原始 String，也不刪除中間所有空白。
`"1 2"` trim 後仍是兩個數字文字，不能直接當一個 i64 解析。
f64 解析成功也不等於資料合理；NaN、無限大與領域限制另需規格。

## 6.5：重試需要狀態與停止條件

重試流程不只是把 read_line 放進 loop。
你要先決定以下情況各做什麼：

- 成功且符合範圍：使用數值並離開。
- 能解析但不符合範圍：顯示訊息並重試。
- 無法解析：顯示訊息並重試。
- 使用者取消：停止。
- EOF：停止，避免永遠讀到零個位元組。
- 真正 I/O 錯誤：回報後停止，避免無限印錯誤。

下面示範的是選擇０到９的選單編號；不是作業的正整數規格。
取消字是 cancel，訊息也與作業不同。

```rust
use std::io;

fn main() {
    let mut line = String::new();
    loop {
        line.clear();
        match io::stdin().read_line(&mut line) {
            Ok(0) => {
                println!("menu closed");
                break;
            }
            Ok(_) => {}
            Err(error) => {
                eprintln!("read error: {error}");
                break;
            }
        }
        let text = line.trim();
        if text == "cancel" {
            println!("menu cancelled");
            break;
        }
        match text.parse::<u32>() {
            Ok(choice) => {
                if choice <= 9 {
                    println!("selected={choice}");
                    break;
                }
                println!("out of range");
            }
            Err(_) => println!("invalid choice"),
        }
    }
}
```

clear 保留同一個 String 容器，清除目前內容。
若沒清除，read_line 會附加：先讀 `2\n`，再讀 `3\n`，內容可能變成 `2\n3\n`。
那就不是「最新一行的數字」。
另一種正確設計，是每輪重新建立 String；重點是不要誤把附加當成覆蓋。

| 本次輸入 | 判斷 | 是否下一輪 |
|---|---|---|
| abc | 解析失敗 | 是 |
| 12 | 可解析但超出範圍 | 是 |
| 3 | 合法選單編號 | 否 |
| cancel | 取消命令 | 否 |
| EOF | 資料結束 | 否 |

若改用 while，仍需一個明確控制繼續與否的條件。
loop 配 break 常能直接表達「直到成功或取消」，不必硬湊次數。
`continue` 是跳到下一輪，`break` 是離開迴圈，`return` 是離開函式。

## 6.6：一行多個值

把一行拆成多個 token，常用 split_whitespace。
它依空白分段，連續空格或 tab 不會產生一堆空 token。
下面示範計算每個整數的平方；不是作業的整行加總。

```rust
fn main() {
    let line = " 2\t-3  4 ";
    for token in line.split_whitespace() {
        match token.parse::<i64>() {
            Ok(value) => println!("square={}", value * value),
            Err(_) => println!("bad token: {token}"),
        }
    }
}
```

對這個固定小數值示例，輸出平方４、９、１６。
若輸入可能很大，乘法是否溢位也須定義；不能把示例擴大成任意整數安全。
一行加總作業要以整題契約決定非法 token 的政策。
例如「整行失敗」與「略過壞值繼續加」是不同程式，不可自己猜。
空白行經 split_whitespace 沒有 token；這不會自動替你決定應輸出０或忽略。

## 6.7：多行直到 EOF

一行多值和多行資料是兩層不同迴圈。
下例只統計非空行數與文字 scalar 數，不計算整數總和。

```rust
use std::io;

fn main() {
    let mut line = String::new();
    let mut rows = 0;
    loop {
        line.clear();
        match io::stdin().read_line(&mut line) {
            Ok(0) => break,
            Ok(_) => {
                let text = line.trim();
                if text.is_empty() {
                    continue;
                }
                rows += 1;
                println!("row={rows}, scalars={}", text.chars().count());
            }
            Err(error) => {
                eprintln!("read error: {error}");
                break;
            }
        }
    }
    println!("nonempty_rows={rows}");
}
```

| 行 | trim 後 | rows 變化 |
|---|---|---|
| hello | hello | ０→１ |
| 空白行 | 空文字 | 不變 |
| 物理 | 物理 | １→２ |
| EOF | 不再產生資料行 | 離開並輸出摘要 |

不要用「讀到空字串就停止」混淆空白行和 EOF。
本例是跳過空白行；有些協定則把空白行當結束標記，必須先寫規格。

## 6.8：常見錯誤與修正思路

| 錯誤 | 為什麼錯 | 先檢查什麼 |
|---|---|---|
| 每輪不 clear | 新資料接在舊文字後面 | 本輪解析的是哪一段文字 |
| EOF 後 continue | 下一輪仍 EOF，可能無限循環 | Ok(0) 是否離開 |
| 全部用 expect | 可預期的輸入錯誤變 panic | 哪一種失敗應讓人重試 |
| 只判斷 parse 成功 | 數字仍可能超出需求範圍 | 合法數值的條件 |
| 多印互動提示 | 自動驗收的 stdout 不符規格 | 提示是否是明確要求 |
| 以浮點解析整數題 | 允許原本不該接受的小數 | 題目要求哪個型別 |

## 6.9：實作作業與操作

- [６－１：姓名與問候](exercises/6-1.md)：讀文字，不急著轉數字。
- [６－２：可重試的正整數輸入](exercises/6-2.md)：非法值印 retry，quit／EOF 印 bye，合法值印 ok: N。
- [６－３：一行多整數總和](exercises/6-3.md)：讀清楚 token 與錯誤政策。
- [６－４：多行整數至 EOF](exercises/6-4.md)：空行略過、非法行印 invalid，最後輸出 count／sum。

完整輸出格式、數值範圍與起始路徑以各作業頁為準。
下面從 beginner 資料夾執行：

```sh
cargo run -- lesson 6
cargo run -- lesson 6-1
cargo run -- manual 6-1
cargo run -- run 6-1
cargo run -- answer 6-1
```

lesson 6 閱讀整個單元；lesson 6-1 是作業規格。
manual 用於手動觀察；run 由驗收資料檢查，不會因程式有執行就判為正確。
answer 留到你已嘗試並能說明流程後再比較。

## 6.10：自我檢核與答案

１．輸入 abc，read_line 是否失敗？
答案：通常不失敗，它成功讀取文字；整數 parse 才失敗。

２．按 Enter 的空行和 EOF 都是 Ok(0) 嗎？
答案：不是。空行通常讀到換行的位元組；沒有剩餘資料才是零位元組。

３．為何判斷 quit 要在解析整數之前？
答案：它是文字命令，不是整數；先分類能避免把取消當成一般非法數字。

４．合法數字與合法輸入是否相同？
答案：不一定。例如負數可解析為 i64，卻不符合正數題的條件。

５．多行程式何時輸出總結？
答案：離開讀取迴圈後；不要在每行後都誤印最終總結。

６．若每次都讀取零位元組但繼續 loop，會怎樣？
答案：不再等待有效新資料的重試可能形成忙迴圈，因此 EOF 必須有終止政策。

## 官方來源與範圍

- [Stdin::read_line](https://doc.rust-lang.org/std/io/struct.Stdin.html#method.read_line)：附加行文字與回傳位元組數。
- [BufRead::read_line](https://doc.rust-lang.org/std/io/trait.BufRead.html#method.read_line)：行尾、EOF 與讀取行為。
- [String::clear](https://doc.rust-lang.org/std/string/struct.String.html#method.clear)：清除內容。
- [str::parse](https://doc.rust-lang.org/std/primitive.str.html#method.parse)：文字解析。
- [match 控制流程](https://doc.rust-lang.org/book/ch06-02-match.html)：以模式處理不同情況。

本單元建立同步文字輸入模型，不涵蓋非同步 I/O、終端機逐鍵事件、完整 CSV 協定或任意長度資料的資源限制。
EOF 和錯誤行為會透過測試資料驗證，但真正作業系統 I/O 故障未必能在一般鍵盤操作中重現。


---

# 單元 7：所有權、借用與文字資料

## 學習成果

完成本單元後，你應能：

- 分開描述變數名字、值與資源的擁有責任。
- 預測 String 在指派或函式呼叫中的 move。
- 比較 Copy、clone 與借用的用途及成本。
- 使用只讀借用與可變借用設計小函式。
- 解釋 & 與 * 的讀法，並追蹤被修改的真正資料。
- 根據借用的最後使用位置判斷衝突。
- 選擇 String 或 &str 作為文字介面。
- 區分 UTF-8 位元組、char 與人眼字元。
- 用安全的字串 API 切詞、組合文字。

## 先備與小節路線

先完成函式、基本測試及第六單元的 String／read_line／trim。
你已經用過 &mut input；現在要說明它為什麼能讓方法修改外面的資料。
本單元先讀７．１～７．４，再做數值借用作業。
文字型別與 Unicode 在７．５～７．７，接著做 scalar 數量與空白整理。

閱讀小節使用７．１；７－１等連字號編號是可評分作業。
本單元不要求生命週期標註，也不把編譯錯誤當成需要繞過的障礙。
重點是讓介面直接說明「誰擁有、誰只讀、誰可以改」。

## 7.1：所有權是一份責任

String 能擁有一段文字資料及其資源管理責任。
一個名字可以讓你使用這個值，但名字本身不是文字內容。
對需要管理資源的值，Rust 追蹤目前由誰擁有它。
當擁有的值離開有效作用域，資源會依規則被釋放。
這個自動清理常稱為 drop；不需要每次自己寫釋放文字的程式。

```text
owner -> String value -> text storage
borrower -> temporary access to that value
```

這是理解責任的簡化模型，不是每個編譯器位址的精確配置圖。
你不必先背完整 heap／stack 細節，才能判斷 move 與借用。

## 7.2：move 不等於複製文字

```rust
fn main() {
    let title = String::from("Science club");
    let poster = title;
    println!("{poster}");
}
```

`let poster = title;` 把 String 的所有權轉給 poster。
之後 poster 可以使用那個值，title 不能再用來讀取已移動的值。
這不是自動建立兩份文字，因為兩份獨立資源需要不同的責任。

以下是預期無法編譯的反例：

```compile_fail
fn main() {
    let title = String::from("Science club");
    let poster = title;
    println!("{title} / {poster}");
}
```

| 時刻 | title | poster |
|---|---|---|
| 建立 title 後 | 擁有文字 | 尚不存在 |
| 指派後 | 已移動，不能使用原值 | 擁有文字 |
| poster 使用完離開作用域 | 不會再釋放同一份值 | 負責正常清理 |

函式參數也遵守相同原則。
若 `fn display(text: String)` 接收的是 String，呼叫會交出所有權。
不要只看呼叫的括號，要看參數型別是否要求擁有值。

```rust
fn display(text: String) {
    println!("message={text}");
}

fn main() {
    let message = String::from("Meet at noon");
    display(message);
    // message has moved into display.
}
```

display 結束時，其參數 text 離開作用域，會清理它擁有的 String。
函式不必回傳一份無用文字才能讓程式結束；這是正常的所有權設計。
若主程式還要使用文字，應重新思考是否真的需要交出所有權。

## 7.3：Copy、clone 與選擇

```rust
fn main() {
    let a: i64 = 12;
    let mut b = a;
    b += 3;
    println!("a={a}, b={b}");

    let original = String::from("blue");
    let mut duplicate = original.clone();
    duplicate.push_str(" sky");
    println!("original={original}");
    println!("duplicate={duplicate}");
}
```

i64 實作 Copy，指派後 a 和 b 都能繼續使用。
更改 b 不會改變 a。
String 沒有這種 Copy 行為；clone 明確建立另一個可獨立修改的 String。
clone 可能配置及複製內容，不能當成消除任何編譯錯誤的預設補丁。

| 需求 | 可考慮的方式 | 意義 |
|---|---|---|
| 交給下一段程式負責 | move | 轉移擁有責任 |
| 確實需要另一份文字 | clone | 另存可獨立修改的內容 |
| 只要暫時閱讀 | 只讀借用 | 保留原所有者 |
| 需要修改原資料 | 可變借用 | 暫時提供修改權限 |

不是所有型別都能 Copy，也不是所有型別都能 clone。
之後的 trait 單元會正式解釋能力如何由型別提供。
目前先針對 i64 與 String 推理，不把特例推廣到全部型別。

## 7.4：只讀借用、可變借用與解參照

```rust
fn print_balance(balance: &i64) {
    println!("balance={}", *balance);
}

fn double_balance(balance: &mut i64) {
    *balance *= 2;
}

fn main() {
    let mut points = 14;
    print_balance(&points);
    double_balance(&mut points);
    print_balance(&points);
}
```

`&points` 建立只讀借用，讓函式能讀但不能透過這個參照改資料。
`&mut points` 建立可變借用，讓函式可以修改原本的 points。
`*balance` 讀作解參照：找到參照指向的資料。
在 `*balance *= 2` 中，被更改的是 main 的 points，不是另外一份副本。
這裡星號是一元解參照，不是兩個運算元之間的乘號。

| 時刻 | main 的 points | 函式使用的角色 |
|---|---|---|
| 建立後 | １４ | 所有者持有數值 |
| print_balance | １４ | 暫時只讀 |
| double_balance | １４→２８ | 暫時修改原值 |
| 第二次輸出 | ２８ | 修改已反映在原資料 |

呼叫可變借用時，原變數通常必須宣告 mut。
但 mut 不是「讓所有人同時修改」，它仍受借用規則限制。
對同一份資料的重疊使用區間，可以有多個只讀借用，或一個可變借用。
不能讓可變借用與仍要使用的其他借用互相衝突。

### 最後使用比大括號更精確

```rust
fn main() {
    let mut text = String::from("go");
    let view = &text;
    println!("{view}");
    text.push_str(" now");
    println!("{text}");
}
```

這段可以編譯。view 最後使用在第一次 println，之後不再讀它。
因此後面的可變操作不會與仍需使用的 view 重疊。
不能說「只要在同一個 scope 就一律不能再修改」。

以下反例預期無法編譯：

```compile_fail
fn main() {
    let mut text = String::from("go");
    let view = &text;
    text.push_str(" now");
    println!("{view}");
}
```

這裡 view 在修改後還要使用，借用區間和修改重疊。
修正應根據需求：先用完 view、縮小借用使用範圍，或改變資料處理順序。
不要直接添加 clone 來隱藏自己沒理解的依賴。

同時建立兩個會重疊使用的可變借用也不行：

```compile_fail
fn main() {
    let mut score = 10;
    let first = &mut score;
    let second = &mut score;
    *first += 1;
    *second += 2;
}
```

回到第六單元，read_line 需要在輸入容器中附加文字，所以要求 &mut String。
trim 則只讀取文字並回傳檢視，所以不需要把 String 的所有權交出去。
先取得 trim 結果、使用完後再 clear，可以符合這種順序。
若 clear 後還想使用舊的文字檢視，就會衝突。

## 7.5：String、&String、&str 與 char

| 型別 | 角色 | 例子 |
|---|---|---|
| String | 擁有可成長的 UTF-8 文字 | String::from("blue") |
| &String | 借用某個 String 物件 | &name |
| &str | 借看一段 UTF-8 文字 | "blue"、name.as_str() |
| char | 一個 Unicode scalar value | 'A'、'物' |

雙引號建立字串常值，單引號表示 char；兩者不是任意可換。
`'ab'` 不能當作一個 char，因為它包含兩個 scalar。
char 也不保證等於一個人眼看見的完整字形。

```rust
fn show(text: &str) {
    println!("text={text}");
}

fn main() {
    let owned = String::from("Physics");
    let borrowed: &String = &owned;
    let literal: &str = "Chemistry";
    show(borrowed);
    show(owned.as_str());
    show(literal);
    println!("owner={owned}");
}
```

函式只讀文字時，&str 常比 &String 更通用。
字串常值不需要先建立 String 才能傳入。
在預期 &str 的參數位置，Rust 可以把 &String 轉成其內容的文字借用。
這稱為借用的自動轉換；不是任何型別都能隨便轉成任何參照。
呼叫 `show(&owned)` 沒有交出 owned 的所有權。

## 7.6：UTF-8、位元組與 scalar

```rust
fn main() {
    for text in ["cat", "物理", "e\u{301}"] {
        println!("{text:?}: bytes={}, scalars={}",
            text.len(), text.chars().count());
    }
    let symbol: char = '物';
    println!("symbol={symbol}");
}
```

| 文字 | len 位元組數 | chars().count() | 需要注意 |
|---|---|---|---|
| cat | ３ | ３ | ASCII 剛好一個字母一個位元組 |
| 物理 | ６ | ２ | 位元組和 scalar 不是同一單位 |
| e 加組合重音 | ３ | ２ | 通常顯示為一個帶重音字形 |

`\u{301}` 是 Unicode 組合重音的跳脫寫法。
usize 常用於長度、計數與索引，大小依目標平台而定。
它是無號整數型別，不是「字元數專用型別」。
String 的 len 回答位元組數；chars().count() 回答 scalar 數。
人眼字元的 grapheme segmentation 是更進一步的文字處理問題。
本單元作業只要求 scalar 數量，不假裝已解決所有語言的顯示寬度。

### 為何不能直接用 text[0]

如果索引表示位元組，可能落在 UTF-8 多位元組字元中間。
如果索引表示第幾個 scalar，就不一定能用固定成本直接找到。
Rust 沒有讓 String 使用整數索引來模糊這兩種意思。

以下反例預期無法編譯：

```compile_fail
fn main() {
    let text = String::from("物理");
    println!("{}", text[0]);
}
```

需要逐字處理時，用 chars 走訪；需要逐位元組處理時，明確使用 bytes。
即使以位元組範圍切字串，也必須落在合法 UTF-8 邊界，不能任意猜位置。
本課優先用安全且表意清楚的字串方法，暫不手寫範圍索引。

## 7.7：切詞與組合，不把字元與單字混淆

```rust
fn main() {
    let sentence = "  red\tgreen  blue ";
    let mut output = String::new();
    for word in sentence.split_whitespace() {
        if !output.is_empty() {
            output.push_str(" / ");
        }
        output.push_str(word);
    }
    println!("{output}");
    println!("original={sentence:?}");
}
```

輸出 `red / green / blue`，原始文字仍保留。
split_whitespace 依 Unicode 空白分段，不會自動移除標點或轉小寫。
它也不是所有自然語言的斷詞器；沒有空白的中文句子不會自動切成詞彙。
push_str 附加一段 &str；push 則可附加一個 char。

| 迴圈次序 | word | output 更新後 |
|---|---|---|
| 第一個 | red | red |
| 第二個 | green | red / green |
| 第三個 | blue | red / green / blue |

只有不是第一個詞時才放分隔符，便不會有行首或行尾分隔符。
作業要求的是單一空格，這裡用斜線分隔只是示範通用組合策略。
所有空白的輸入沒有 token，組合後應依作業規格處理空結果。

## 7.8：常見錯誤與設計選擇

| 問題 | 應先問自己 |
|---|---|
| moved value 後再使用 | 函式真的需要擁有 String 嗎 |
| 遇到錯誤就 clone | 是否只需要短暫讀取 |
| 可變借用重疊 | 每個參照最後一次使用在哪裡 |
| 想用 &str 修改文字長度 | 是否需要擁有或可變的 String |
| 中文長度測錯 | 規格要的是 bytes、scalars 還是人眼字元 |
| 空白整理丟掉標點 | split_whitespace 的政策是否被自行擴大 |

對可變數值作業，先更新原值，再套用上下界。
`value.clamp(min, max)` 是把值限制在閉區間的標準方法；min 必須不大於 max。
也能用 if／else 明確處理三種區段。
不要混淆「輸入本來合法」與「更新後仍然合法」這兩件事。

## 7.9：實作與操作

- [７－１：scalar_count](exercises/7-1.md)：接收 &str，回傳 Unicode scalar 數量。
- [７－２：add_bonus](exercises/7-2.md)：透過 &mut i64 更新分數，最後限制在０到１００。
- [７－３：normalize_spaces](exercises/7-3.md)：依空白切詞，以單一空格接回新的 String。

７－２的原分數為０到１００，bonus 為－１００到１００。
依這個契約思考，不必自行設計任意整數溢位政策。
７－３不要求改大小寫、移除標點或修改來源文字。
完整介面、輸出與起始檔案依作業頁為準。

從 beginner 資料夾執行：

```sh
cargo run -- lesson 7
cargo run -- lesson 7-1
cargo run -- manual 7-1
cargo run -- run 7-1
cargo run -- answer 7-1
```

## 7.10：自我檢核與答案

１．String 的 move 會自動複製全部文字嗎？
答案：不等於 clone；它主要表達所有權的轉移。

２．i64 指派後原值還能用，能否推論全部型別都可以？
答案：不能，i64 支援 Copy，String 不支援這種複製行為。

３．為什麼 &mut 參數能改 main 的值？
答案：它指向原資料；解參照賦值是在修改原資料，不是改獨立副本。

４．只讀參照和修改出現在同一個大括號，是否一定錯？
答案：不一定；要看參照最後使用與修改是否重疊。

５．要數「物理」有幾個 scalar，可以用 len 嗎？
答案：不能，這裡 len 為６，chars 計數才為２。

６．split_whitespace 會把 hello, 的逗號移除嗎？
答案：不會，它依空白切開，標點仍屬於 token 內容。

７．add_bonus 為何不只回傳一個新數字？
答案：題目介面刻意練習修改呼叫者資料；回傳新值是另一種設計，不能未說明就換介面。

## 官方來源與範圍

- [所有權與 move](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html)：值與資源管理。
- [參照與借用](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html)：借用規則及最後使用。
- [字串切片](https://doc.rust-lang.org/book/ch04-03-slices.html)：以 &str 借看文字。
- [String](https://doc.rust-lang.org/std/string/struct.String.html)：UTF-8 文字容器。
- [str::chars](https://doc.rust-lang.org/std/primitive.str.html#method.chars)：Unicode scalar 走訪。

本單元沒有完整講授 trait、Drop 自訂行為、生命週期標註、共享所有權或跨執行緒借用。
Unicode 正規化、grapheme segmentation 與顯示欄寬也不是 scalar_count 的契約。


---

# 單元 8：集合、搜尋、排序與資料缺席

## 學習成果

完成本單元後，你應能：

- 選擇陣列、Vec、切片或 tuple 表達資料。
- 使用 Option 描述可能不存在的結果。
- 以 get 進行安全索引，並解釋 Some 與 None。
- 使用 push、pop、remove 與可變走訪修改 Vec。
- 手動追蹤搜尋、最值及基本排序步驟。
- 區分讀取來源、修改來源與回傳獨立結果。
- 以 HashMap 儲存鍵與值的對應，用 entry 更新計數。
- 描述輸入大小與操作次數的關係。

## 先備與小節路線

先完成迴圈、函式、match、所有權與借用。
前面陣列示例已能逐項讀取；現在要建立選擇資料結構的理由。
先讀８．１～８．４，處理可增減的序列與缺席值。
再讀搜尋、最值與排序；最後以 HashMap 表達查表計數。

閱讀小節是８．１；８－１等連字號編號才是作業。
本單元先使用一般迴圈，不要求 closure、map 或 filter。
先能追蹤資料怎麼變，再學壓縮成較短的程式。

## 8.1：容器與借用介面

| 寫法 | 角色 | 適合的問題 |
|---|---|---|
| `[i64; 3]` | 固定長度的同型別陣列 | 已知恰好三個座標或固定筆數 |
| `Vec<i64>` | 可增減長度的同型別序列 | 輸入筆數不固定 |
| `&[i64]` | 借看一段連續序列的切片 | 函式只需要讀取資料 |
| `(i64, usize)` | 固定欄位、可不同型別的 tuple | 一個數值與一個數量的配對 |

陣列長度是型別的一部分；Vec 的元素數量可在執行時改變。
mut 允許修改值，不會把陣列變成能 push 的 Vec。
切片描述一段可借看的序列，不要求函式取得容器所有權。
Vec 的 V 是大寫；建立巨集 vec! 是小寫，兩者用途不同。

```rust
fn report(values: &[i64]) {
    println!("length={}, empty={}", values.len(), values.is_empty());
}

fn main() {
    let fixed = [3, 6, 9];
    let flexible = vec![4, 8];
    report(&fixed);
    report(&flexible);
    report(&[]);
    println!("fixed={fixed:?}");
}
```

三次報告分別是長度３、２、０。
參數要求 &[i64]，所以陣列與 Vec 都能借給 report。
空序列也是有效資料；是否能計算平均或最值，由函式契約另外決定。
len 回傳 usize，通常用於元素數量及索引。

`Vec<i64>` 的尖括號是在指定元素型別，不是比較運算。
`Option<usize>` 則是「可能有一個 usize」；不同型別名稱有不同意義。
不要只看到尖括號就認為它們是同一種容器。

## 8.2：tuple 把固定角色放在一起

```rust
fn main() {
    let reading: (i64, &str) = (24, "C");
    let (value, unit) = reading;
    println!("{value} {unit}");

    let summary = (3_usize, 18_i64);
    println!("count={}, total={}", summary.0, summary.1);
}
```

tuple 可包含不同型別，欄位數固定。
`let (value, unit) = reading` 是解構，把對應位置分別命名。
`.0`、`.1` 依位置取得欄位，和陣列的 `[index]` 不同。
數值後綴如 `3_usize` 是明確指定型別；也能用變數型別註記。

| 資料 | 較合適的表達 |
|---|---|
| 一串同類分數 | 陣列或 Vec |
| 一個測量值與單位 | tuple，可先固定兩個角色 |
| 很多需要名字的相關欄位 | 後面用 struct 讓意義更清楚 |

### 同時走訪位置與內容

有時我們需要的不只是元素，還要知道它在第幾個位置。
`iter()` 依序借看元素；`enumerate()` 再替每個元素附上從０開始的索引。
每輪得到的是 `(index, value)` 這個 tuple，迴圈模式同時把兩個角色命名。
下面只列出置物櫃數量，不是作業的目標搜尋函式。

```rust
fn main() {
    let supplies = [12, 8, 15];
    for (index, value) in supplies.iter().enumerate() {
        println!("cabinet {}: {} items", index + 1, value);
    }
}
```

| index | value 指向的值 | 顯示的櫃號 |
|---|---|---|
| ０ | １２ | １ |
| １ | ８ | ２ |
| ２ | １５ | ３ |

index 是 usize；value 是元素的只讀借用，不會搬走整個陣列。
顯示給人看的櫃號用 index＋１，但若函式契約要求０起算索引，就不能加１。
空序列沒有任何一輪，並不會產生一個假的第０項。
這也說明 tuple 的位置與意義必須一起讀懂，不能把索引誤當成元素數值。

## 8.3：Option 與安全索引

有三筆資料，不代表索引３存在：合法索引是０、１、２。
`values[index]` 若超出範圍會 panic。
當索引本來就可能找不到時，get 可以讓缺席變成正常結果。

```rust
fn main() {
    let values = vec![11, 22, 33];
    for index in [0, 2, 3] {
        match values.get(index) {
            Some(value) => println!("index={index}, value={value}"),
            None => println!("index={index}, absent"),
        }
    }
}
```

get 的結果在此是 Option<&i64>：可能借看一個元素，也可能不存在。
Some 裡面放資料，None 沒有藏著一個預設數值。

| index | 結果 | 意義 |
|---|---|---|
| ０ | Some(借用１１) | 第一項存在 |
| ２ | Some(借用３３) | 最後一項存在 |
| ３ | None | 超出範圍，沒有項目 |

空集合的平均值沒有定義，但有資料且全為０的平均值是０。
因此 None 和 Some(0.0) 必須能區分。
搜尋結果也一樣：Some(0) 是找到第一個位置，None 是沒有找到。
把「沒有」假裝成索引０，會讓呼叫者無法分辨。

match 必須處理 Some 和 None，不能只假設永遠有值。
unwrap 可在 None 時 panic；若缺席本來就是預期情況，先選 match。
Option 本身不一定表示程式錯誤，它只是表達有值與無值。

## 8.4：Vec 的增減與修改

```rust
fn main() {
    let mut queue = vec![10, 20];
    queue.push(30);
    println!("after push={queue:?}");
    match queue.pop() {
        Some(last) => println!("popped={last}"),
        None => println!("nothing to pop"),
    }
    let first = queue.remove(0);
    println!("removed={first}, remaining={queue:?}");
}
```

push 在尾端加入，pop 移除並回傳尾端項目。
空 Vec 的 pop 回傳 None，不會憑空回傳０。
remove(index) 移除指定位置並回傳該值，但索引必須存在。
remove 後，後面的元素向前移；這是索引改變與操作成本的來源。

| 步驟 | Vec 內容 | 回傳 |
|---|---|---|
| 建立 | １０、２０ | — |
| push(30) | １０、２０、３０ | — |
| pop | １０、２０ | Some(30) |
| remove(0) | ２０ | 10 |

### 透過可變借用走訪

```rust
fn main() {
    let mut lengths = vec![2, 4, 6];
    for value in &mut lengths {
        *value *= 3;
    }
    println!("{lengths:?}");
}
```

value 每輪是某個元素的可變借用，`*value` 才是那個元素。
這個寫法改的是 Vec 裡面的資料，輸出為 `[6, 12, 18]`。
如果只把數值複製到另一個區域變數再修改，來源不會跟著變。

可變走訪期間不能隨意 push 同一個 Vec。
push 可能改變底層配置，讓原本的元素借用失效；借用規則會阻止衝突。
這裡不要用 clone 規避問題，而應分開「走訪修改元素」與「增減結構」。

### 刪除後的索引要重新思考

下面示範移除所有負數，不是作業指定值的移除函式。

```rust
fn main() {
    let mut values = vec![3, -1, -2, 5, -4];
    let mut index = 0;
    while index < values.len() {
        if values[index] < 0 {
            values.remove(index);
        } else {
            index += 1;
        }
    }
    println!("{values:?}");
}
```

刪除時不增加 index，因為原本下一項已移到這個位置。
若每次都加１，連續兩個負數就可能漏掉第二個。

| index | 當下項目 | 動作 | 下一個 index |
|---|---|---|---|
| ０ | ３ | 保留 | １ |
| １ | －１ | 刪除，－２移到此處 | １ |
| １ | －２ | 刪除，５移到此處 | １ |
| １ | ５ | 保留 | ２ |

連續 remove 可能反覆搬移資料，最差操作量會隨筆數平方成長。
之後可以學保留元素的線性做法；本單元先理解正確性與索引變化。

## 8.5：搜尋與最值的循序推理

搜尋先決定你要找什麼：第一筆、全部、數量，或是否存在。
這些回傳型別與停止條件不同，不應只憑輸出看起來接近就混用。
線性搜尋每次檢查一項，最壞情況需要看完 n 項。
找到第一筆就能停止的問題，可以用 break 或 return。
但找最大值通常不能看到第一個較大項就結束。

下面示範最小值，不是作業的 first_index。

```rust
fn smallest(values: &[i64]) -> Option<i64> {
    let mut best = None;
    for value in values {
        match best {
            None => best = Some(*value),
            Some(current) => {
                if *value < current {
                    best = Some(*value);
                }
            }
        }
    }
    best
}

fn main() {
    println!("{:?}", smallest(&[8, 3, 6, -1]));
    println!("{:?}", smallest(&[]));
}
```

| 已處理前綴 | best | 為何仍正確 |
|---|---|---|
| 空 | None | 還沒看過元素 |
| ８ | Some(8) | 唯一一筆 |
| ８、３ | Some(3) | 新項目較小 |
| ８、３、６ | Some(3) | ６不會改變最小值 |
| ８、３、６、－１ | Some(-1) | 新項目更小 |

迴圈不變量是：處理完目前前綴後，best 是該前綴的最小值，空前綴則為 None。
這種說明比只列幾個測試更能解釋演算法為什麼有效。
一般 n 筆資料需要 n 次迴圈，額外只保存少數變數。

平均值的計算則要分開處理總和與筆數。
例如總和１２１、筆數２，先轉成 f64 再除，才能得到６０．５。
若先做整數除法再轉型，小數已經失去，不會自動恢復。
作業限定每筆絕對值不超過一百萬、最多一百筆，據此評估 i64 加總範圍。
不要把這個局部保證擴大成任意資料量都不會溢位。

## 8.6：排序的基本步驟與操作次數

排序不是只背 sort 名字；先理解比較與交換如何改變序列。
簡單的選擇排序，每輪把剩餘部分最小值找出來，放到目前位置。
下面使用固定小陣列，並記錄比較次數。

```rust
fn main() {
    let mut values = [7, 2, 5, 1];
    let mut comparisons = 0;
    for start in 0..values.len() {
        let mut smallest = start;
        for scan in start + 1..values.len() {
            comparisons += 1;
            if values[scan] < values[smallest] {
                smallest = scan;
            }
        }
        values.swap(start, smallest);
    }
    println!("sorted={values:?}, comparisons={comparisons}");
}
```

| 輪次 | 已確定的位置 | 本輪後資料 | 本輪比較 |
|---|---|---|---|
| start＝０ | 第一項 | １、２、５、７ | ３ |
| start＝１ | 前兩項 | １、２、５、７ | ２ |
| start＝２ | 前三項 | １、２、５、７ | １ |
| start＝３ | 全部 | １、２、５、７ | ０ |

四筆資料比較６次。
一般筆數 n 的這個寫法比較次數是 n(n－1)／2，成長趨近平方。
資料多十倍，不能期待只花十倍比較工作。
這裡先認識 O(n) 與 O(n²) 的成長意義，不把常數、硬體與配置成本全部忽略。

標準函式庫提供更合適的一般排序實作；實務上通常使用既有方法。
手寫小演算法是為了訓練追蹤、契約與成本分析，不是要求大家重寫標準庫。

```rust
fn main() {
    let mut arrivals = vec![9, 2, 9, 4, 2];
    arrivals.sort();
    println!("sorted={arrivals:?}");
    arrivals.dedup();
    println!("distinct={arrivals:?}");
}
```

dedup 只合併相鄰的重複項；未排序就呼叫，不保證全域去重。
對整數，先 sort 再 dedup 能讓相同值相鄰。
若題目要求不修改來源，可以先以 `values.to_vec()` 建立擁有的副本。
這個副本會使用額外儲存空間；不要把「來源不變」說成免費完成。

排序順序、是否保留原順序、是否去重，是不同需求。
不能把「升冪且唯一」擅自改成「依首次出現順序唯一」。

## 8.7：HashMap 與鍵值對應

Vec 適合「第幾項」；HashMap 適合「這個鍵對應什麼值」。
例如選項名稱對票數、商品代碼對庫存、單字對出現次數。
`HashMap<String, usize>` 表示鍵是擁有的文字，值是計數。
同一個鍵只保存一份對應值；它不是每次出現都增加一個重複欄位。

```rust
use std::collections::HashMap;

fn main() {
    let mut stock: HashMap<String, usize> = HashMap::new();
    stock.insert(String::from("pencil"), 12);
    stock.insert(String::from("eraser"), 5);
    match stock.get("pencil") {
        Some(quantity) => println!("pencil={quantity}"),
        None => println!("missing item"),
    }
    println!("kinds={}", stock.len());
}
```

HashMap::new 建立空映射；insert 建立或取代鍵的值。
get 回傳可能存在的借用，所以仍用 Option 和 match。
get 沒有找到不代表庫存０，可能是根本沒有這個商品。

### entry：取得現有計數，或先放入起始值

```rust
use std::collections::HashMap;

fn main() {
    let ballots = ["yes", "no", "yes", "abstain", "yes"];
    let mut totals: HashMap<String, usize> = HashMap::new();
    for choice in ballots {
        let counter = totals.entry(String::from(choice)).or_insert(0);
        *counter += 1;
    }
    for key in ["yes", "no", "abstain"] {
        match totals.get(key) {
            Some(count) => println!("{key}={count}"),
            None => println!("{key}=absent"),
        }
    }
}
```

這裡示範固定選票，不是作業的文字切詞函式。
entry 先查這個鍵；or_insert(0) 只有在缺席時放入０。
回傳的是那個計數位置的可變借用，因此 `*counter += 1` 修改映射中的值。
這個用法不需要先學 closure；不要急著換成 or_insert_with。

| 選票 | 當下是否已有鍵 | 更新後 |
|---|---|---|
| yes | 否，先放０ | yes＝１ |
| no | 否，先放０ | no＝１ |
| yes | 是，取得原值１ | yes＝２ |
| abstain | 否，先放０ | abstain＝１ |
| yes | 是，取得原值２ | yes＝３ |

String 鍵讓映射自己擁有單字，不必依賴輸入字串之後仍存在。
這是所有權選擇，不只是語法要求。
HashMap 不保證走訪順序；若要穩定顯示，應另外決定排序或固定鍵的輸出次序。
不能把某次偵錯輸出的鍵順序當成永遠固定的契約。

依平均情況看，HashMap 查找與更新通常可有效完成。
但文字鍵還有雜湊與比較的工作，不能宣稱任意長字串查找完全沒有成本。
對小量資料，用線性搜尋也可能足夠；資料結構選擇應對照需求。

## 8.8：常見錯誤與反例

| 錯誤 | 問題 | 修正思路 |
|---|---|---|
| 用０代表找不到 | 和合法第一項混淆 | Option<usize> |
| 空平均值回傳０ | 和真實零平均混淆 | None 與 Some(0.0) |
| remove 後立刻增加索引 | 漏掉移到此處的下一項 | 重新檢查同一位置 |
| 邊借用走訪邊 push | 容器結構變動與元素借用衝突 | 分開階段處理 |
| dedup 前不排序 | 只去掉相鄰重複 | 依需求先排序 |
| 宣稱排序沒改來源 | 實際直接 sort 原 Vec | 使用副本並說明成本 |
| 依賴 HashMap 印出順序 | 順序不是保證 | 分開資料與顯示政策 |
| 單字計數自動去標點 | 偷改 token 定義 | 完全照切詞契約 |

## 8.9：實作作業與操作

- [８－１：first_index](exercises/8-1.md)：回傳第一個符合目標的索引，沒有則 None。
- [８－２：remove_value](exercises/8-2.md)：移除全部指定值，回傳移除數量。
- [８－３：average](exercises/8-3.md)：空序列回傳 None，其餘回傳浮點平均。
- [８－４：sorted_unique](exercises/8-4.md)：回傳升冪且唯一的 Vec，來源不變。
- [８－５：word_counts](exercises/8-5.md)：依空白切詞，建立 HashMap<String, usize>。

平均值每筆限制在正負一百萬，最多一百筆。
word_counts 區分大小寫，保留標點，不做額外語言正規化。
remove_value 的回傳是移除筆數，不是剩餘長度，也不是被移除值的總和。
實際介面與輸出格式以作業頁為準。

從 beginner 資料夾執行：

```sh
cargo run -- lesson 8
cargo run -- lesson 8-1
cargo run -- manual 8-1
cargo run -- run 8-1
cargo run -- answer 8-1
```

先手算，再執行；遇到失敗要指出對應的契約，不只修改到測試剛好通過。

## 8.10：自我檢核與答案

１．Some(0) 和 None 都表示沒有找到嗎？
答案：不是，Some(0) 是索引０存在；None 才是缺席。

２．為何 remove 連續刪除時容易漏資料？
答案：刪除後剩餘元素向前移；若索引也前進，會跳過新移到此處的元素。

３．用可變參照走訪時，為何要寫 *value？
答案：value 是參照，*value 才是它指向的元素；對它賦值才能更改來源。

４．空資料能當有效集合，但平均值卻是 None，是否矛盾？
答案：不矛盾，資料結構有效與某個計算是否有定義是不同問題。

５．去重前先排序，會不會改變首次出現的次序？
答案：會，排序後遵守數值次序；若需求要原次序，就不能採同一策略。

６．entry 的 or_insert(0) 每次都把既有計數歸零嗎？
答案：不會，只有缺少鍵時才插入；已有鍵就借用既有值。

７．word_counts 應把 Rust、rust、Rust, 視為同一個鍵嗎？
答案：依本題規格不是，同時保留大小寫與標點的差異。

８．通過有限測試，是否證明搜尋在所有輸入都正確？
答案：沒有；仍應解釋前綴不變量、停止條件與尚未涵蓋的邊界。

## 官方來源與範圍

- [Vec 與元素操作](https://doc.rust-lang.org/std/vec/struct.Vec.html)：push、pop、remove 與容器行為。
- [slice](https://doc.rust-lang.org/std/primitive.slice.html)：get、sort、to_vec。
- [Option](https://doc.rust-lang.org/std/option/enum.Option.html)：有值與無值。
- [tuple 型別](https://doc.rust-lang.org/book/ch03-02-data-types.html#the-tuple-type)：固定欄位配對。
- [HashMap](https://doc.rust-lang.org/std/collections/struct.HashMap.html)：鍵值映射、entry 與走訪政策。

本單元不完整涵蓋雜湊函數、平衡樹、排序正確性形式證明或所有標準集合。
map／filter 與 closure 留到後續；先以一般迴圈說清楚資料變化。


---

# 單元９：用結構、列舉與方法建立資料模型

## 學習成果與先備

完成本單元後，你應能把一組相關資料定義成自己的型別，區分建立物件與操作物件，並以方法維持合法狀態。
你也應能用列舉表達互斥情況，寫出涵蓋所有分支的 match，而不是把所有狀態塞進數字或字串。

先備內容是函式、所有權、借用、可變借用、Vec、Option 與基本 match。
若仍分不清 `&T` 與 `&mut T`，請先回到單元７；本單元會把它們放入物件方法，不改變借用的基本規則。

在 beginner 資料夾執行 `cargo run -- lesson 9` 閱讀本單元。
以下示範使用恆溫器、顯示模式與設備狀態，並非本單元作業的完整答案。

## 9.1 為什麼只用幾個變數會開始混亂

假設一個程式有三台設備，每台都有名稱、目標溫度與運轉狀態。
若使用 `name1`、`temperature1`、`running1` 等分散變數，函式很容易把第二台的名稱與第三台的狀態放在一起。
這種錯誤不一定違反型別：兩個設備的溫度同樣是整數，編譯器無從知道它們屬於不同實體。

資料模型要回答兩件事：哪些值應該一起存在，以及哪些組合才有領域意義。
struct 把相關欄位組成一個值，讓函式參數與回傳值能攜帶這個組合。
它不會自動保證數值合理；合法範圍仍需要建構與操作規則。

## 9.2 定義型別、建立實例與存取欄位

```rust
#[derive(Debug)]
struct Thermostat {
    label: String,
    target_c: i32,
}

fn main() {
    let living_room = Thermostat {
        label: String::from("living room"),
        target_c: 24,
    };
    let classroom = Thermostat {
        label: String::from("classroom"),
        target_c: 26,
    };
    println!("{}: {} C", living_room.label, living_room.target_c);
    println!("{classroom:?}");
}
```

`struct Thermostat` 定義的是型別，不是其中任何一台實際設備。
`Thermostat { ... }` 建立一個實例；不同實例有各自的欄位值。
`living_room.target_c` 使用點號取得這個實例的欄位，而不是取得所有 Thermostat 共用的溫度。

第一行印出 `living room: 24 C`。
第二行使用 Debug 顯示 `Thermostat { label: "classroom", target_c: 26 }` 一類的結構內容。
`#[derive(Debug)]` 請編譯器產生這個型別的 Debug 實作，`{:?}` 或 `{classroom:?}` 才能使用它。
Debug 幫助檢查資料，不會驗證資料正確，也不是對外輸出的固定交換格式。

String 欄位仍遵守所有權規則。
把一個完整 Thermostat 移動到另一個變數，也會轉移它所擁有資料的責任；struct 不會使 String 自動變成 Copy。

## 9.3 方法把操作與型別放在一起

impl 區塊為型別定義相關的行為。
方法與一般函式同樣有參數、回傳型別與函式本體，差別在於方法可以接收目前這個實例。

| 寫法 | 代表的存取能力 | 常見用途 |
| --- | --- | --- |
| `&self` | 借看目前實例 | 查詢、計算、顯示 |
| `&mut self` | 獨占地借用並可修改實例 | 更新欄位、改變狀態 |
| `self` | 取得目前實例的所有權 | 消耗物件或轉換型別 |
| 沒有 self 參數 | 與型別相關的函式 | 建構、工具操作 |

`self` 不是預先存在的全域變數。
在呼叫 `device.target()` 時，接收者 device 會提供給該方法的 self 參數。
需要 `&mut self` 的方法，呼叫者也必須能提供可變借用。

## 9.4 建構、查詢與更新的完整示範

```rust
#[derive(Debug)]
struct Thermostat {
    target_c: i32,
}

impl Thermostat {
    fn new(target_c: i32) -> Self {
        assert!((10..=30).contains(&target_c), "initial target out of range");
        Self { target_c }
    }

    fn target(&self) -> i32 {
        self.target_c
    }

    fn set_target(&mut self, target_c: i32) -> bool {
        if !(10..=30).contains(&target_c) {
            return false;
        }
        self.target_c = target_c;
        true
    }
}

fn main() {
    let mut device = Thermostat::new(24);
    assert_eq!(device.target(), 24);
    assert!(!device.set_target(40));
    assert_eq!(device.target(), 24);
    assert!(device.set_target(20));
    assert_eq!(device.target(), 20);
    println!("{device:?}");
}
```

`Self` 在這個 impl 內指 Thermostat，避免重複寫型別名稱。
`Thermostat::new(24)` 沒有接收既有實例，是關聯函式；`new` 是常見命名慣例，不是 Rust 自動呼叫的特殊關鍵字。
`device.target()` 借看 device，`device.set_target(20)` 則借用它來更新狀態。
`contains` 在這裡詢問數值是否落在包含端點的範圍內。

| 時點 | 要求的操作 | 回傳值 | 實例中的 target_c |
| --- | --- | --- | --- |
| 建立後 | new(24) | 新實例 | 24 |
| 第一次更新 | set_target(40) | false | 24 |
| 第二次更新 | set_target(20) | true | 20 |

失敗時不改變資料是本例的方法契約。
若先改欄位，再發現非法而回傳 false，呼叫者會收到失敗訊息，物件卻已被破壞。
因此先檢查再修改，讓每條離開方法的路徑都保留不變量。

## 9.5 欄位可見性與不變量的責任

沒有 pub 的欄位不能由不具存取權限的外部模組直接操作。
這有助於把修改集中在方法，但同一個模組仍可能直接建立或修改資料。
封裝是依模組邊界建立的，不是看到 struct 就自動成立。

作業某些欄位刻意要求 pub，方便驗收器觀察結果。
這表示方法只能保證「經由這些方法操作」時遵守契約，不能宣稱外部永遠無法直接改壞欄位。
請在設計說明區分方法保證與整個公開型別的保證。

## 9.6 enum 用來表達「其中一種」

struct 的欄位通常一起存在；enum 則描述一個值目前是哪一種可能情況。
每個變體還能攜帶與該情況相關的資料。
與用 0、1、2 當作狀態代號相比，變體名稱能直接說明意義，也能限制可表示的組合。

```rust
#[derive(Debug)]
enum DisplayMode {
    Off,
    Text(String),
    Gauge { percent: u8 },
}

fn describe(mode: &DisplayMode) -> String {
    match mode {
        DisplayMode::Off => String::from("display off"),
        DisplayMode::Text(message) => format!("message: {message}"),
        DisplayMode::Gauge { percent } => format!("gauge: {percent}%"),
    }
}

fn main() {
    let modes = [
        DisplayMode::Off,
        DisplayMode::Text(String::from("ready")),
        DisplayMode::Gauge { percent: 75 },
    ];
    for mode in &modes {
        println!("{}", describe(mode));
    }
}
```

三次輸出依序是 `display off`、`message: ready`、`gauge: 75%`。
Text 與 Gauge 攜帶不同形狀的資料，match 的模式會把資料取到相應的分支名稱中。
本例借用 mode，因此 describe 不需要取得整個模式值的所有權。
format! 與 println! 都使用格式字串，但 format! 產生 String，而不是直接印到終端機。

## 9.7 match 的完整性與狀態設計

如果 enum 有三個變體，match 必須涵蓋三種，或以適當的萬用分支涵蓋剩餘情況。
新增變體後，編譯器可以指出哪些 match 尚未更新，這是自訂型別提供的維護協助。
萬用 `_` 很方便，但若每個變體都需要不同處理，過度使用它會掩蓋尚未決定的行為。

用 enum 表示設備的 Stopped／Running，可避免兩個 bool 同時為真卻意義矛盾。
不過 enum 也不會自動保證 Gauge 的百分比在 0～100；欄位限制仍需建構規則或驗證。
資料表示與操作契約必須一起設計。

下列片段故意漏掉一種情況，預期無法編譯，而不是執行時才突然失敗：

```compile_fail
enum Direction { Left, Right }
fn label(direction: Direction) -> &'static str {
    match direction {
        Direction::Left => "left",
    }
}
fn main() {}
```

修正時應先決定 Right 的意義，再補分支；編譯器只指出缺口，不會替你決定業務規則。

## 9.8 常見錯誤與自我檢核

- 在 &self 方法內直接修改欄位：借用能力不足；若操作本來就要修改，應考慮 &mut self。
- 把 `Type::method()` 與 `value.method()` 當成相同寫法：先問操作是否需要既有實例。
- 方法回傳 false 但已改動欄位：違反失敗不修改的不變量。
- match 漏掉變體：補上對應行為，不能只為了讓編譯通過而隨意加 `_`。

問題一：為什麼查詢方法通常用 &self？
答案：只需要借看資料，保留呼叫者的所有權，也不要求可變借用。

問題二：new 必須叫 new 嗎？
答案：不是，但一致的命名能讓使用者辨識建立實例的操作。

問題三：回傳 bool 的更新操作，至少要交代什麼？
答案：true／false 各代表什麼，以及失敗時資料是否維持原狀。

## 作業與驗收

- [９－１：帳戶狀態與可變方法](exercises/9-1.md)：完成指定 Account 介面，檢查操作成功與失敗後的狀態。
- [９－２：以列舉描述運算](exercises/9-2.md)：完整處理 Action 的各個變體。
- [９－３：學生資料與平均值](exercises/9-3.md)：結合 String、Vec、Option 與方法。

先執行 `cargo run -- lesson 9-1` 閱讀精確契約，再修改作業指定的檔案。
`cargo run -- run 9-1` 會驗收；`manual` 與 `answer` 的用途見課程總覽。
課堂示範是理解工具，作業仍需自行根據契約設計。

## 官方來源

- [定義結構](https://doc.rust-lang.org/book/ch05-01-defining-structs.html)。
- [方法與關聯函式](https://doc.rust-lang.org/book/ch05-03-method-syntax.html)。
- [列舉與模式比對](https://doc.rust-lang.org/book/ch06-00-enums.html)。
- [Debug](https://doc.rust-lang.org/std/fmt/trait.Debug.html)。


---

# 單元１０：錯誤是介面的一部分

## 學習成果與先備

本單元完成後，你應能區分沒有值、操作失敗與程式內部假設遭破壞三種情況。
你應能先用完整 match 寫出錯誤路徑，再在理解流程後使用 ? 簡寫。

先備是 Option、自訂 enum、match、函式與字串解析。
本單元不要求先掌握閉包的完整模型；map_err 的短寫法放在選讀，不是完成作業的必要門檻。
在 beginner 執行 `cargo run -- lesson 10` 閱讀。

## 10.1 選 Option、Result，還是 panic

Option<T> 表達可能沒有值，例如空清單沒有第一筆。
Result<T, E> 表達成功時有 T，失敗時有 E，例如資料格式錯誤、檔案不存在。
panic 表示這條執行路徑無法依正常回傳繼續；未被捕捉的主執行緒 panic 通常使這次程式失敗。

| 問題 | 適合的表示 | 必須告訴呼叫者的事 |
| --- | --- | --- |
| 清單沒有第一筆 | Option | 有值或沒有值 |
| 指令文字不合法 | Result | 成功內容或失敗原因 |
| 程式內部必要假設被破壞 | assertion／panic，視設計而定 | 哪個假設不成立 |

不要把空字串、零或負一同時拿來表示合法答案與失敗。
也不要認為 Result 會自動處理錯誤；它只是把決策所需的資料交出來。
呼叫者仍要決定重試、顯示訊息、跳過資料或結束程式。

## 10.2 Result 的兩種路徑

Result<bool, String> 可讀成：「成功時交出 bool，失敗時交出 String」。
Ok 和 Err 是不同變體，不是 println 的文字標籤。
只有走進相應 match 分支，才能取得裡面的內容。

```rust
fn switch_value(text: &str) -> Result<bool, String> {
    match text.trim() {
        "on" => Ok(true),
        "off" => Ok(false),
        _ => Err(String::from("expected on or off")),
    }
}

fn main() {
    for input in [" on ", "off", "maybe"] {
        match switch_value(input) {
            Ok(enabled) => println!("enabled={enabled}"),
            Err(message) => println!("invalid command: {message}"),
        }
    }
}
```

依序顯示 enabled=true、enabled=false，以及 invalid command 的錯誤訊息。
合法的 false 是關閉開關，不是失敗；失敗由 Err 表達。
這個區別讓 bool 與錯誤狀態不會混在一起。

## 10.3 先看清標準解析錯誤的型別

字串的 parse::<i32>() 回傳 Result<i32, ParseIntError>。
若自己的函式宣告 Result<i32, String>，就需要決定如何把解析錯誤轉為 String。
兩個值都在 Err 裡，不代表它們的內容型別相同。

錯誤有時只需要可顯示的原因，有時需要讓程式區分種類。
若呼叫者要對不同失敗採取不同措施，自訂 enum 通常比分析文字內容更清楚。

## 10.4 以自訂錯誤保留領域分類

下面解析的是顯示模式，不是作業的分數或數值對。

```rust
#[derive(Debug, PartialEq)]
enum ModeError {
    Missing,
    Unknown(String),
}

#[derive(Debug, PartialEq)]
enum Mode {
    Quiet,
    Verbose,
}

fn parse_mode(text: &str) -> Result<Mode, ModeError> {
    let text = text.trim();
    if text.is_empty() {
        return Err(ModeError::Missing);
    }
    match text {
        "quiet" => Ok(Mode::Quiet),
        "verbose" => Ok(Mode::Verbose),
        other => Err(ModeError::Unknown(String::from(other))),
    }
}

fn main() {
    assert_eq!(parse_mode(" quiet "), Ok(Mode::Quiet));
    assert_eq!(parse_mode(""), Err(ModeError::Missing));
    match parse_mode("loud") {
        Err(ModeError::Unknown(word)) => println!("unknown mode: {word}"),
        other => println!("unexpected result: {other:?}"),
    }
}
```

PartialEq 讓這些 enum 可使用相等比較，方便 assert_eq! 檢查。
這是衍生的比較能力，不是錯誤處理自動推理。
Unknown 保存原本的文字，呼叫者不必從完整錯誤句子倒推哪個字出了問題。

| 輸入 | trim 後 | 分支 | 回傳 |
| --- | --- | --- | --- |
| ` quiet ` | quiet | 已知模式 | Ok(Quiet) |
| 空字串 | 空字串 | 前置檢查 | Err(Missing) |
| loud | loud | 未知模式 | Err(Unknown("loud")) |

驗證順序也是契約的一部分。
若先檢查空文字，就能穩定把空資料分類為 Missing，而不是當成一般 Unknown。

## 10.5 用 match 清楚寫出提早回傳

```rust
fn parse_step(text: &str) -> Result<i32, String> {
    match text.trim().parse::<i32>() {
        Ok(value) => Ok(value),
        Err(_) => Err(String::from("step is not an integer")),
    }
}

fn offset_with_match(base: i32, text: &str) -> Result<i32, String> {
    let step = match parse_step(text) {
        Ok(value) => value,
        Err(message) => return Err(message),
    };
    match base.checked_add(step) {
        Some(value) => Ok(value),
        None => Err(String::from("offset overflow")),
    }
}

fn offset_with_question(base: i32, text: &str) -> Result<i32, String> {
    let step = parse_step(text)?;
    match base.checked_add(step) {
        Some(value) => Ok(value),
        None => Err(String::from("offset overflow")),
    }
}

fn main() {
    for input in ["2", "bad", "2147483647"] {
        assert_eq!(offset_with_match(10, input), offset_with_question(10, input));
    }
    println!("both paths agree");
}
```

? 在成功時取得內容，失敗時提早把錯誤交給呼叫者。
上面兩個函式的控制流程相同；問號不是忽略錯誤，也不會把錯誤印出來。
它需要位於可接受這種錯誤傳遞的回傳環境中，最常見是相容的 Result 函式。

checked_add 是檢查溢位的加法，回傳 Option。
本例以它示範「解析成功」與「後續運算可接受」是不同階段；不能只驗證文字就假設運算安全。

## 10.6 有限數、領域限制與驗證順序

浮點解析成功後仍可能得到 NaN、無限大或領域不允許的值。
is_finite 排除 NaN 與正負無限大；再用比較判斷允許範圍。
NaN 不適合以 `value == NaN` 判斷，也不能只靠正負比較保證它會被拒絕。

| 層次 | 例子 | 問的問題 |
| --- | --- | --- |
| 文字結構 | 是否有恰好需要的欄位 | 格式對嗎？ |
| 型別解析 | 文字能否轉為數字 | 表示對嗎？ |
| 領域驗證 | 數值有限且符合範圍 | 意義對嗎？ |

若一個輸入同時違反多項限制，錯誤分類取決於明定的檢查順序。
寫測試之前先確認契約，不要讓不同呼叫路徑隨意給出不同類型。

## 10.7 先切欄位，再處理每個欄位

split_whitespace 依空白切詞；如果資料格式指定等號或逗號，就需要明確的分隔符。
`text.split('=')` 使用 char 作為分隔符，依序產生每個欄位。
它保留空欄，因為空內容也可能是格式資訊，不能像跳過連續空白那樣自動消失。
以下用設定文字 `label=value` 示範，不是作業的兩個數值解析函式。

```rust
fn main() {
    let text = "color = blue";
    let mut fields: Vec<&str> = Vec::new();
    for field in text.split('=') {
        fields.push(field.trim());
    }
    println!("fields={fields:?}");
    if fields.len() != 2 {
        println!("expected exactly two fields");
    } else if fields[0].is_empty() || fields[1].is_empty() {
        println!("label and value must both exist");
    } else {
        println!("label={}, value={}", fields[0], fields[1]);
    }
}
```

先收集欄位，確認長度為２後才使用索引０與１。
這個設定示例另外規定名稱與內容不能空白；那是示例的契約，不是 split 自動施加的規則。
Vec 裡放的是借用文字，原本 text 仍然是文字來源；push 沒有把每欄重新配置成 String。

| 原文字 | split 的原始欄位 | 意義 |
|---|---|---|
| color=blue | color、blue | 恰兩欄 |
| =blue | 空文字、blue | 第一欄存在但內容空 |
| color= | color、空文字 | 第二欄內容空 |
| color==blue | color、空文字、blue | 三欄，不能假裝只有兩欄 |
| color | color | 一欄，沒有分隔符 |
| 空文字 | 一個空文字欄位 | 不是零欄 |

### collect 把逐項結果收進容器

如果只是要把 split 的原始結果存進 Vec，可以把 for 與 push 改為 collect。
左邊 `Vec<&str>` 告訴編譯器：要把產生的文字借用收成 Vec。
collect 不會自動 trim、解析、移除空欄或檢查欄位數。

```rust
fn main() {
    for text in ["color=blue", "=blue", "color=", "color==blue", "color", ""] {
        let mut expanded: Vec<&str> = Vec::new();
        for field in text.split('=') {
            expanded.push(field);
        }
        let collected: Vec<&str> = text.split('=').collect();
        assert_eq!(expanded, collected);
        println!("{text:?} -> {collected:?}");
    }
}
```

這是同一個資料流的兩種表達方式，不是另一種不同的切割規則。
若需要每欄 trim，可以在確認欄位數後逐欄處理，先不用閉包串接。
作業的逗號格式沿用同一個概念，但數值型別、欄位合法性與錯誤政策仍要自己對照契約。

## 10.8 選讀：map_err 與一個簡單閉包

`parse::<i32>().map_err(|_| String::from("not an integer"))` 把解析錯誤改寫成 String，成功內容保持不變。
`|參數| 表達式` 是閉包的簡單形式；`_` 表示不綁定傳入內容。
這裡可理解為把 Err 分支的小函式交給 map_err。

先用 match 把作業寫對即可，不要求以最短寫法完成。
之後再比較 map_err 能否提高可讀性；若一串串接讓你無法追蹤錯誤，長寫法更合適。

## 10.9 常見錯誤與自我檢核

- 用 unwrap 接收使用者可能打錯的資料：會把預期失敗變成 panic。
- Err 的內容型別不符：先看函式簽名的 E，不要只看變體名稱。
- 把字串錯誤當成穩定分類代碼：需要分種類時考慮 enum。
- 只檢查解析成功：還需要有限性與領域範圍。

問題一：合法值 false 與 Err 有何不同？
答案：false 可以是成功的領域結果，Err 表示這次操作未成功取得結果。

問題二：? 省略了哪一段？
答案：成功取值、失敗提早回傳的 match；沒有省略錯誤責任。

問題三：為什麼自訂錯誤變體比固定中文句子更方便程式處理？
答案：可以用 match 明確區分類型，不需解析錯誤文字。

## 作業與驗收

- [１０－１：有限正數解析](exercises/10-1.md)：實作 parse_positive，明確處理解析與領域失敗。
- [１０－２：分數解析與錯誤分類](exercises/10-2.md)：依契約回傳指定 ParseError。
- [１０－３：兩欄數值解析](exercises/10-3.md)：先驗證欄位數，再解析與檢查數值。

用 `cargo run -- lesson 10-1` 閱讀作業，`cargo run -- run 10-1` 驗收。
測試案例只驗證已列出的資料；你還需要說明每種錯誤如何進入對應分支。

## 官方來源

- [Result 與可恢復錯誤](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html)。
- [Result API](https://doc.rust-lang.org/std/result/enum.Result.html)。
- [f64 特殊數值](https://doc.rust-lang.org/std/primitive.f64.html)。


---

# 單元１１：設計能發現錯誤的測試

## 學習成果與先備

本單元的目標不是只會執行 cargo test，而是能由規格選出有意義的輸入、預期結果與失敗訊息。
你應能分辨編譯失敗、測試失敗與沒有找到測試，並用故障版本檢查自己的測試是否真的有辨識力。

先備是函式、條件邊界、assert 系列、模組的最小概念與 Result。
單元１２會正式整理跨檔案模組；此處先說清楚測試框架裡每個名稱的位置。
在 beginner 執行 `cargo run -- lesson 11` 閱讀。

## 11.1 程式能執行，為什麼還要測試

main 通常只示範某一組輸入；同一個程式可能在普通值上成功，遇到端點卻走錯分支。
測試把「輸入、預期、比較方式」保存為可重複執行的程式，不必每次憑記憶手動確認。

一個基本案例分成三步：準備資料，呼叫待測功能，比較實際與預期。
預期答案應由規格、手算或另一個可信方法決定，不應只是把同一個錯誤公式再抄一次。

## 11.2 一個完整的測試檔案

下面的示範是整數倍增，不是本單元的售票或溫度作業。

```rust
fn twice(value: i32) -> i32 {
    value * 2
}

fn main() {
    println!("{}", twice(3));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn positive_value() {
        let input = 3;
        let expected = 6;
        assert_eq!(twice(input), expected);
    }

    #[test]
    fn zero_value() {
        assert_eq!(twice(0), 0);
    }
}
```

| 結構 | 用途 |
| --- | --- |
| `#[cfg(test)]` | 只在測試設定中編譯這個區塊 |
| `mod tests` | 把相關測試放入一個命名區塊 |
| `use super::*` | 從上一層引入可使用的名稱 |
| `#[test]` | 把下一個函式列為測試案例 |
| assertion | 決定實際結果是否符合預期 |

普通執行時 main 印６；測試工具會另外執行 positive_value 與 zero_value。
不必在 main 手動呼叫這些測試函式，也不是看到函式名含 test 就會自動被找到。

## 11.3 執行入口與結果的差別

| 操作 | 真正在做的事 |
| --- | --- |
| `cargo run` 或課程的 manual | 執行程式的正常入口 |
| `cargo test` | 執行 Rust 測試工具找到的測試 |
| 課程的 run 作業號 | 按該作業的驗收契約檢查 |

本單元的作業是「設計測試」，課程驗收會把你的測試套在正確版本與故障版本上。
這與單純執行 main 或只測一份正確公式不同。
精確檔案位置、指令與判分方式以作業頁為準。

編譯錯誤表示測試尚未開始，例如名稱拼錯或參數型別錯。
FAILED 表示程式已被測試工具執行，但某項檢查不成立。
0 tests 只表示沒有找到測試，不是你已經證明程式正確。

## 11.4 從規格找普通、邊界與錯誤案例

假設某個示範規格說：容器至少放一件物品，最多放八件。
普通值是中間的三件或五件，邊界是一本身與八，範圍外則是零與九。
這些案例提供的資訊不同，不能用十個中間值取代兩端檢查。

若規格有區間切換，至少思考切換前、正好切換、切換後。
若規格允許空集合、負數、重複資料或順序改變，分別判斷其意義，再選測資。
沒有被規格允許的情況，不應憑空指定一個答案要求實作符合。

| 測試目的 | 該問的問題 |
| --- | --- |
| 一般功能 | 常見資料是否正確？ |
| 邊界 | 比較使用的是 < 還是 <=？ |
| 空資料 | 沒有內容時應回傳什麼？ |
| 錯誤資料 | 是否以指定方式拒絕？ |
| 狀態改變 | 成功或失敗後資料是否仍符合契約？ |

## 11.5 紅、綠、再整理的工作節奏

先加入一個根據規格應成立的測試，確認它有被執行。
若目前實作尚未完成，測試應失敗；這是紅燈。
修正實作使測試通過，得到綠燈，再在不改行為的前提下整理程式。

不要為了綠燈而把預期值改成目前錯誤輸出的值。
若懷疑測試本身寫錯，回到規格與手算，分開檢查兩邊。
測試程式也可能有 bug，不是被放在 tests 模組就自動正確。

## 11.6 用故障版本檢驗測試的辨識力

```rust
fn correct_twice(value: i32) -> i32 { value * 2 }
fn faulty_twice(value: i32) -> i32 { value + 2 }

fn main() {
    // 只測這一筆，兩個版本看起來都正確。
    assert_eq!(correct_twice(2), 4);
    assert_eq!(faulty_twice(2), 4);

    // 加上另一種資料，才看出兩版本不同。
    assert_eq!(correct_twice(3), 6);
    assert_ne!(faulty_twice(3), 6);
    println!("the second case distinguishes the implementations");
}
```

若把倍增函式的實作換成 `value + 2`，只有輸入２的測試無法發現錯誤。
增加輸入３後，原本要求結果６的測試就會失敗。
這不是追求大量案例，而是選擇能區分錯誤假設的案例。

本單元的自動驗收會做類似工作：正確版本應通過，你的測試還要抓出提供的九個故障版本。
如果測試在正確版本也失敗，表示它可能違反規格；如果所有錯誤版本也通過，表示它缺乏辨識力。
知道這些故障版本被抓到，仍不代表未知的所有錯誤都已被排除。

## 11.7 閱讀作業的測試框架

作業會提供 subject 模組，讓你的測試透過指定介面呼叫待測函式。
例如測試檔中的 `use super::subject::ticket;` 表示到上一層的 subject 取用 ticket。
你不應在自己的測試檔另造一個同名 ticket，否則測到的可能是自己寫的替身，而非驗收器提供的版本。

```rust
mod subject {
    pub fn twice(value: i32) -> i32 { value * 2 }
}

fn main() {}

#[cfg(test)]
mod tests {
    use super::subject::twice;

    #[test]
    fn selected_value() {
        assert_eq!(twice(-3), -6);
    }
}
```

這是可獨立執行的框架示範，顯示 pub 與 use 的最小關係。
真正作業的 subject 由工具提供，請遵守作業頁指定的檔案內容與匯入方式。

## 11.8 浮點比較要寫出容許的意義

整數結果常可直接使用 assert_eq!。
一般浮點運算應考慮捨入誤差，不要假設兩條數學等價的路徑一定有相同位元。
`(actual - expected).abs()` 是絕對誤差；1e-9 是１０的負九次方，不是變數 e。

```rust
fn close(actual: f64, expected: f64, absolute: f64, relative: f64) -> bool {
    if !actual.is_finite() || !expected.is_finite() { return false; }
    let error = (actual - expected).abs();
    let scale = actual.abs().max(expected.abs());
    error <= absolute + relative * scale
}

fn main() {
    assert!(close(0.1_f64 + 0.2_f64, 0.3, 1e-12, 1e-9));
    assert!(close(1_000_000.0, 1_000_000.1, 1e-9, 1e-6));
    assert!(!close(1.0, 2.0, 1e-12, 1e-9));
}
```

絕對容許適合提供靠近零的底線，相對容許則隨數值尺度調整。
這個示範針對有限數及合理的非負容許量，不是處理所有極端浮點值的通用比較器。
容許量要依單位、尺度與題目要求選擇，不能把範例常數直接當成所有問題的標準。

## 11.9 常見錯誤與自我檢核

- 只測一個剛好讓錯誤公式也成功的值：增加能區分行為的資料。
- 把每個輸入都判定成功：先驗證預期，再比較實際結果。
- 使用極大的浮點容許量：可能讓錯誤公式也通過。
- 只有 main，沒有 #[test]：測試工具可能顯示零項。
- 測試重新定義待測函式：沒有檢查工具真正提供的版本。

問題一：十個普通值一定比三個邊界案例有效嗎？
答案：不一定；要看能否區分規格要求與可能錯誤。

問題二：正確版本失敗、故障版本也失敗，可以算成功嗎？
答案：不行；測試必須先接受符合規格的版本。

問題三：為什麼要在 assertion 顯示輸入與誤差？
答案：失敗時能直接重現情況，減少猜測是哪一筆資料出問題。

## 作業與驗收

- [１１－１：為票價規則設計測試](exercises/11-1.md)：使用已提供的正確函式設計正常與邊界案例。
- [１１－２：為溫度換算設計測試](exercises/11-2.md)：選擇有意義的浮點案例及容許範圍。

你的工作是測試設計，不是重寫題目已提供的正確公式。
以 `cargo run -- lesson 11-1` 確認測試檔位置，再用 `cargo run -- run 11-1` 執行完整驗收。
結果會反映正確版本與故障版本的檢查，另需人工評估測試理由及未涵蓋範圍。

## 官方來源

- [Rust 測試工具與測試函式](https://doc.rust-lang.org/book/ch11-01-writing-tests.html)。
- [cargo test](https://doc.rust-lang.org/cargo/commands/cargo-test.html)。
- [f64](https://doc.rust-lang.org/std/primitive.f64.html)。


---

# 單元１２：把程式設計整合成可使用的命令列工具

## 學習成果與先備

本單元要求把資料模型、錯誤處理與測試組合成完整應用程式。
你應能從需求決定模組責任，讀取標準輸入或檔案，輸出有規格的結果，並用退出碼告訴其他程式成功或失敗。

先備包含單元１至１１的主要內容，特別是 String／切片、Result、自訂型別與測試。
以下示範分析文字行數與字元數，不直接提供運動分析或成績簿作業的完整答案。
在 beginner 執行 `cargo run -- lesson 12` 閱讀。

## 12.1 先把需求拆成輸入、處理與輸出

「做一個資料分析工具」還不是可以驗收的規格。
先寫清楚輸入來自哪裡、每筆資料格式、允許哪些值、成功結果怎麼排列、錯誤如何被觀察。

| 邊界 | 應該回答的問題 |
| --- | --- |
| 取得文字 | 標準輸入、檔案，還是兩者擇一？ |
| 解析資料 | 欄位數、空白、型別與行號如何處理？ |
| 領域計算 | 哪些狀態合法？要保存什麼中間結果？ |
| 顯示結果 | 欄位名稱、順序、空白與小數位數為何？ |
| 失敗 | 錯誤寫哪裡？退出碼是否非零？ |

不要等到所有程式寫完才決定輸出格式。
若驗收需要固定表頭，多印一句友善提示也可能破壞其他程式讀取結果的方式。
課程作業頁就是你與使用者、驗收工具之間的契約。

## 12.2 Cargo 專案的最小地圖

```text
text-tool/
├── Cargo.toml
└── src/
    ├── main.rs
    ├── input.rs
    └── analysis.rs
```

Cargo.toml 描述套件名稱、版本、edition 與依賴等資訊。
src/main.rs 是這個二進位程式的入口；檔案名稱 main.rs 不是「把所有功能都塞進同一檔」的要求。
其他檔案可以依責任組織，再透過 mod、pub 與 use 連接。

本課程的兩個整合專案有各自的 Cargo.toml，來源位於 projects/motion/src/main.rs 與 projects/gradebook/src/main.rs。
操作時確認目前所在位置與使用的 manifest；不要因為多個資料夾都有 Cargo.toml，就假設 Cargo 會猜中你的目的。

## 12.3 讀取整份文字：先認識 I/O 失敗

`std::fs::read_to_string(path)` 嘗試讀取檔案並得到 UTF-8 String。
它可能因檔案不存在、權限或內容不是有效 UTF-8 等原因失敗，所以回傳 Result。
這和「檔案讀到了，但第二行的數字錯了」是不同層的錯誤。

```rust
use std::fs;

fn main() {
    let path = "example-input.txt";
    match fs::read_to_string(path) {
        Ok(text) => println!("characters: {}", text.chars().count()),
        Err(error) => eprintln!("cannot read {path}: {error}"),
    }
}
```

若檔案存在，顯示其中 Unicode scalar value 的個數；不是 UTF-8 位元組數，也不保證等於人眼字元數。
若不存在，錯誤顯示在標準錯誤輸出。
這個第一個示範尚未設計非零退出碼；下一節才把它補成完整 CLI 行為。

## 12.4 args、-- 與輸入來源選擇

std::env::args() 產生程序收到的字串參數，第一個通常是程式本身的名稱。
`skip(1)` 跳過它，留下使用者提供的參數。
Cargo 的獨立 `--` 表示後面的參數交給程式，而不是繼續當 Cargo 的選項。

例如 `cargo run -- sample.txt` 的 sample.txt 會交給你的應用程式。
若透過課程入口操作，`cargo run -- manual 12-1 sample.txt` 則先由課程程式解讀 manual 與作業號，再將檔案參數轉交給專案。
兩層介面不要混淆；先看清楚現在執行的是哪個程式。

## 12.5 完整示範：文字紀錄計數工具

```rust
use std::{env, fs, io::{self, Read}};

fn read_input(path: Option<&str>) -> Result<String, String> {
    match path {
        Some(path) => match fs::read_to_string(path) {
            Ok(text) => Ok(text),
            Err(error) => Err(format!("cannot read file: {error}")),
        },
        None => {
            let mut text = String::new();
            match io::stdin().read_to_string(&mut text) {
                Ok(_) => Ok(text),
                Err(error) => Err(format!("cannot read stdin: {error}")),
            }
        }
    }
}

fn run() -> Result<(), String> {
    let args: Vec<String> = env::args().skip(1).collect();
    if args.len() > 1 {
        return Err(String::from("usage: text-tool [path]"));
    }
    let path = match args.first() {
        Some(path) => Some(path.as_str()),
        None => None,
    };
    let text = read_input(path)?;
    let mut records = 0;
    for line in text.lines() {
        if !line.trim().is_empty() { records += 1; }
    }
    println!("records: {records}");
    println!("characters: {}", text.chars().count());
    Ok(())
}

fn main() {
    match run() {
        Ok(()) => {}
        Err(message) => {
            eprintln!("{message}");
            std::process::exit(1);
        }
    }
}
```

`use std::{env, fs, io::{self, Read}};` 是把多個名字集中匯入的寫法。
其中 io::{self, Read} 同時匯入 io 模組本身與 Read。
Read 是提供讀取方法的 trait；把它匯入，才能在這裡使用它提供的 read_to_string 方法。
現在先理解「讓這個既有方法可用」，自訂 trait 與實作細節留到後續課程。

`args().skip(1).collect()` 先產生參數、跳過程式名稱，再收集成左側指定的 Vec<String>。
collect 的用途沿用第十單元：把逐項產生的資料保存到容器，不會自動驗證參數數量。

最外層 main 使用完整 match：成功的 Ok(()) 不再做事，Err 分支才顯示訊息並設定退出碼。
`()` 是沒有攜帶其他結果的單位值；這裡成功只需要表示工作完成，不需回傳報表資料。

這裡 first() 回傳 Option<&String>，match 在存在時借看它的 str，得到 Option<&str>。
`as_str()` 不會複製整份內容；它讓後續函式只借用文字，而不取得參數的所有權。
輸入錯誤的轉換也刻意使用完整 match，不要求先學會 map_err 或閉包。

read_to_string 會持續讀到 EOF，不是讀一行就結束。
在終端機手動輸入時，必須送出 EOF；若由檔案或管線提供，資料來源結束就會到達 EOF。
單次 read_to_string 保存整份輸入，記憶體使用與資料量相關；這不是固定記憶體的串流分析器。

| 情況 | read_input | run | main |
| --- | --- | --- | --- |
| 無檔案參數，stdin 有資料 | 讀到 EOF 得到 String | 計算並印結果 | 正常結束 |
| 檔案存在 | 讀取檔案 | 計算並印結果 | 正常結束 |
| 檔案不存在 | Err | ? 提早傳出 Err | stderr、exit 1 |
| 參數超過一個 | 不會讀輸入 | Err | stderr、exit 1 |

## 12.6 stdout、stderr 與退出碼各有責任

println! 通常寫入標準輸出 stdout，用於程式的正式結果。
eprintln! 寫入標準錯誤 stderr，供使用者與工具觀察失敗原因。
退出碼０表示這次操作成功，非零表示失敗；錯誤句子本身不能取代退出碼。

把錯誤印在 stdout、卻回傳成功退出碼，可能讓下一個工具把錯誤句子當成正常資料。
只有進入 main 的最外層決定結束程序，核心函式回傳 Result，較容易被測試或其他介面重用。
`process::exit` 不應隨意放進每個解析函式；它會直接結束程序，也不會像正常離開作用域那樣執行所有清理。

## 12.7 模組、pub 與 use 的可執行示範

```rust
mod analysis {
    #[derive(Debug, PartialEq)]
    pub struct Counts {
        pub nonempty_lines: usize,
        pub bytes: usize,
    }

    pub fn inspect(text: &str) -> Counts {
        let mut nonempty_lines = 0;
        for line in text.lines() {
            if !line.trim().is_empty() { nonempty_lines += 1; }
        }
        Counts { nonempty_lines, bytes: text.len() }
    }
}

use analysis::inspect;

fn main() {
    let counts = inspect("one\n\ntwo\n");
    assert_eq!(counts.nonempty_lines, 2);
    assert_eq!(counts.bytes, 9);
    println!("{counts:?}");
}
```

mod analysis 建立一個命名與可見性邊界，pub 讓外層能使用指定的項目，use 將名稱引入目前範圍。
use 不會複製函式，也不是把別人的原始碼貼進來。
結構型別公開不代表每個欄位也自動公開，本例分別標記了欄位。

要拆成跨檔案模組，可把 analysis 大括號內的內容移至 src/analysis.rs，並在 main.rs 改成 `mod analysis;`。
原本的 `use analysis::inspect;` 與 main 內容可保留。
Rust 依 mod 宣告與檔案配置尋找模組，不是把資料夾裡每個 rs 檔自動全部編譯進來。

## 12.8 從模組責任推導測試邊界

建議把取得文字、解析一筆、整體計算、輸出格式分成可辨識的責任。
這不強制每個責任都各有一個檔案，而是避免同一個函式同時負責所有事。

| 功能 | 適合的測試方式 |
| --- | --- |
| 解析一筆 | 直接傳字串，檢查 Result |
| 核心計算 | 建立小型資料，手算後比較 |
| 格式化 | 比較表頭、欄位順序與小數位 |
| I/O 邊界 | stdin／檔案、缺檔、參數數量、退出碼 |

若一個函式只能透過真的讀檔與鍵盤輸入測試，重新檢查是否把純計算與外部環境綁得太緊。
反過來，單元測試全過也不保證檔案路徑與參數轉交正確，仍需要整合驗收。

## 12.9 兩個整合專案的重點

運動分析器需要處理每筆有號位移與正時間，計算總位移除以總時間。
平均速度不是各段速度的直接平均，也不等於只靠有號位移就能得知的平均速率。
每筆有限不代表總和或比值有限，因此要依作業契約檢查累加與最後相除。
正式 stdout 為 `records: N` 與 `velocity: ...`，速度固定三位小數；錯誤走 stderr 與非零退出碼。

成績簿需要依姓名分組，同名的多筆成績取平均，再依指定字串順序排列。
姓名要依契約 trim 並驗證，成績須有限且在０～１００內。
輸出包含 `name,average` 表頭與每人兩位小數；輸出順序必須穩定，不能依 HashMap 的走訪順序猜測。
字串字典序不代表本機語系的姓名筆畫排序；是否區分大小寫與空白規則以作業明定契約為準。

兩個專案都接受 stdin 或一個檔案參數，資料行是簡化的逗號分隔格式，不是完整帶引號 CSV 解析器。
空白行、空資料及錯誤細節的精確政策，請先閱讀對應作業頁，再列出自己的驗收表。
本節說明如何拆解，不提供兩個作業完整解答。

## 12.10 將結果寫成檔案

stdout 可以由 shell 重新導向保存，例如在對應專案操作 `cargo run -- input.txt > report.txt`。
重新導向由 shell 處理，程式仍是在輸出到 stdout；這不等於它自行呼叫檔案 API。
若應用程式本身需要指定檔案內容，可使用 std::fs::write。

```rust
use std::fs;

fn save_report(path: &str, report: &str) -> Result<(), String> {
    match fs::write(path, report) {
        Ok(()) => Ok(()),
        Err(error) => Err(format!("cannot write report: {error}")),
    }
}

fn main() {
    let demo_path = "summary-demo.tmp.txt";
    match save_report(demo_path, "records: 2\n") {
        Ok(()) => println!("saved {demo_path}"),
        Err(message) => {
            eprintln!("{message}");
            std::process::exit(1);
        }
    }
}
```

這個示範使用目前工作目錄中的暫存示範檔名，應在另外建立的測試資料夾執行，完成後可刪除該檔。
write 會建立檔案或覆寫既有內容，不是接續寫在舊內容之後；若要保留原資料，須先設計不同政策。
路徑不可用、目錄權限不足或空間不足等情況可能失敗，所以成功訊息只能在 Ok 分支印出。
本課整合專案要求正式結果在 stdout，沒有要求一定額外寫檔；這段示範是讓你理解正式檔案 API 與重新導向的差別。

## 12.11 有序對照表與明確排序的選擇

HashMap 的走訪順序不保證符合名稱字典序，不能因為某次執行剛好有序就依賴它。
BTreeMap 依鍵的比較順序走訪，適合希望容器本身維持鍵順序的情況。
另一種同樣可行的設計是先使用 HashMap 計算，再把結果收集出來排序。

```rust
use std::collections::{BTreeMap, HashMap};

fn main() {
    let mut tree = BTreeMap::new();
    tree.insert("pine", 3);
    tree.insert("apple", 1);
    let tree_rows: Vec<(&str, i32)> = tree.into_iter().collect();
    assert_eq!(tree_rows, vec![("apple", 1), ("pine", 3)]);

    let mut hash = HashMap::new();
    hash.insert("pine", 3);
    hash.insert("apple", 1);
    let mut sorted_rows: Vec<(&str, i32)> = hash.into_iter().collect();
    sorted_rows.sort();
    assert_eq!(sorted_rows, tree_rows);
    println!("both designs produce the required key order");
}
```

本例的鍵各不相同，tuple 的排序先比較鍵，因此排序後得到相同順序。
into_iter 在這裡消耗容器，取得其中的鍵值；若還需要原容器，應另選借用走訪的形式。
成績簿作業只要求正確分組與排序，不強迫使用 BTreeMap。
同名多筆資料如何累加與計算平均，是另一個責任，不能只重複 insert 最後一筆就當成已完成分組。

## 12.12 開發工具與文件查找

在對應專案內可使用下列工具，或以 --manifest-path 明確選擇專案。

```sh
cargo check
cargo fmt --check
cargo clippy
cargo test
cargo doc --open
```

cargo check 先做編譯檢查，不等於已執行所有路徑。
fmt 檢查排版；clippy 提供常見問題與寫法建議，但兩者都不會證明演算法或領域公式正確。
本機文件可用 rustup doc 開啟；查標準函式時先讀參數、回傳值、錯誤與例子，再判斷是否符合自己的契約。

若工具未安裝，依 rustup 的 component 提示處理，不要把缺少格式化元件誤認為學生公式錯誤。
修正建議前先理解它的原因，不為了讓提示消失就改變必要行為。

## 12.13 常見錯誤與自我檢核

- 在 stdout 印額外提示：可能破壞結果格式。
- 讀檔成功就假設資料有效：仍需解析與領域驗證。
- 依 HashMap 走訪順序輸出：順序不保證符合字典序要求。
- 使用者打錯資料就 unwrap：把預期錯誤變成 panic。
- 全部塞入 main：失敗時難判斷是取得資料、解析還是公式出錯。
- 把有限測資通過當成設計品質保證：測試無法替你寫出責任分配的理由。

問題一：stderr 已顯示錯誤，為什麼還需要非零退出碼？
答案：讓其他程式不必解析人類文字，就能判斷這次操作失敗。

問題二：何時適合拆出模組？
答案：當責任、可見性與測試邊界值得獨立理解時，不是單純依行數平均切開。

問題三：為什麼固定輸出順序重要？
答案：相同輸入應能重現同樣結果，便於比較、管線處理及自動驗收。

## 作業與人工評量

- [１２－１：運動資料分析器](exercises/12-1.md)：來源 projects/motion/src/main.rs。
- [１２－２：同名成績分析器](exercises/12-2.md)：來源 projects/gradebook/src/main.rs。

先用 `cargo run -- lesson 12-1` 閱讀契約，再自行拆分模組與實作。
`cargo run -- manual 12-1` 用於觀察正常操作；`cargo run -- run 12-1` 執行作業驗收。
每個專案另交 DESIGN.md，說明需求、資料流、模組責任、錯誤政策、測試選擇與已知限制。

程式驗收檢查可觀察的輸入輸出與失敗行為；人工評量檢查理由是否清楚、資料模型是否合理、介面是否易於測試與維護。
規格正確性、模組設計、測試證據與限制說明應分別討論，不以程式行數或語法華麗程度代替。
通過有限驗收不等於整個程式已被證明正確，也不自動代表設計品質良好。

## 官方來源

- [檔案讀取與命令列專案](https://doc.rust-lang.org/book/ch12-00-an-io-project.html)。
- [模組與可見性](https://doc.rust-lang.org/book/ch07-00-managing-growing-projects-with-packages-crates-and-modules.html)。
- [std::fs::read_to_string](https://doc.rust-lang.org/std/fs/fn.read_to_string.html)。
- [std::env::args](https://doc.rust-lang.org/std/env/fn.args.html)。
- [Cargo 指令](https://doc.rust-lang.org/cargo/commands/index.html)。
- [fs::write](https://doc.rust-lang.org/std/fs/fn.write.html)。
- [BTreeMap](https://doc.rust-lang.org/std/collections/struct.BTreeMap.html)。
