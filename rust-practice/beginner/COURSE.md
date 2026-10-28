# Rust Beginner Course

先進入 beginner 資料夾，以 `cargo run -- lesson` 查看總覽；指定章節，例如 `cargo run -- lesson 6`，閱讀主線題目。新增的補充節次在總覽標示「補充」，可直接閱讀，不會建立另一份作答或假報驗收。

每課先看閱讀路線，再預測、修改、執行與解釋。主線 `run N` 自動驗收，`manual N` 手動操作；第四課另有七個實作子題，每題十筆資料。固定輸出／固定追蹤題採具名契約檢查，範圍見 TEST_CASES.md。測試通過不是一般性正確性證明。

本版主線、七個迴圈實作與補充閱讀已拆開。課程時數依閱讀與實作節奏調整，新增補充後不再以原先每課三十至五十分鐘視為固定時程；尚未正式試教。

---

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

進入下載專案中的 beginner 資料夾（不是 hello_rust，也不是 workspace 根目錄），以編輯器開啟整個資料夾。可以使用熟悉的純文字編輯器；若使用 VS Code，可加裝 rust-analyzer。確認目前位於 beginner、其中有課程自己的 Cargo.toml，再執行：

```sh
cargo run --example step01
```

修改 examples/step01.rs，存檔後再次執行。參考答案放在 solutions，先做完再看。

## 卡住時怎麼辦

找不到 cargo：重開終端機，檢查 PATH 是否包含使用者目錄中的 `.cargo/bin`（Windows 為 `.cargo\bin`）。macOS／Linux 亦可執行 `source "$HOME/.cargo/env"`。
linker／link.exe 錯誤：回到對應作業系統的編譯工具安裝步驟，單看 cargo 版本還不代表 linker 可用。
找不到 Cargo.toml：目前所在資料夾不正確，請切換到 beginner 資料夾；進階課程則進入 advanced。
更新工具鏈：`rustup update stable`。離線官方文件：`rustup doc`。

安裝資訊查核日期：２０２６－１０－２１。依據 [The Rust Book 安裝章](https://doc.rust-lang.org/book/ch01-01-installation.html) 與 [Rust 官方入門](https://rust-lang.org/learn/get-started/)。本次沒有在 Windows／Linux 實機執行安裝。

---

# 第 1 步：讓程式說話

## 核心觀念

fn main() 是程式入口；println! 是巨集，會在文字後換行。字串放在雙引號內，敘述通常用分號結束。

## 起始程式

```rust
fn main() {
    println!("Hello, Rust!");
}
```

## 動手練習

讓程式依序輸出「Hello, Rust!」及「我正在學 Rust」。先預測目前程式會印出幾行。

自動驗收：`cargo run -- run 1`。手動執行：`cargo run -- manual 1`。

## 提示

新增一個 println!；中文也可以放進字串。

## 預期結果

```text
Hello, Rust!
我正在學 Rust
```

驗收：兩行文字與標點完全相同。

## 參考答案

```rust
fn main() {
    println!("Hello, Rust!");
    println!("我正在學 Rust");
}
```

自我解釋：你改了哪裡？為什麼這樣寫？哪個邊界案例最容易漏掉？

---

# 第 2 步：變數與溫度換算

## 閱讀路線

[2-1：輸出佔位符與顯示格式](lessons/02-1.md)。終端機：`cargo run -- lesson 2-1`。

[2-2：變數、型別、賦值與作用域](lessons/02-2.md)。終端機：`cargo run -- lesson 2-2`。

主線實作仍編輯原本的 examples/step02.rs；補充閱讀不增加需要繳交的程式。

## 核心觀念

let 宣告變數，預設不可重新賦值；mut 允許更改。f64 是浮點數，i32 是有號整數。整數 9 / 5 得到 1，浮點運算要寫 9.0 / 5.0。

## 起始程式

```rust
fn main() {
    let celsius: f64 = 25.0;
    let fahrenheit = 0.0; // 修改公式
    println!("{celsius} C = {fahrenheit} F");
}
```

## 動手練習

將攝氏換為華氏：F = C × 9／5 ＋ 32。測試 0、25、100 度。

自動驗收：`cargo run -- run 2`。手動執行：`cargo run -- manual 2`。

## 提示

使用 celsius * 9.0 / 5.0 + 32.0。

## 預期結果

```text
25 C = 77 F
```

驗收：0 → 32；25 → 77；100 → 212。

## 參考答案

```rust
fn main() {
    let celsius: f64 = 25.0;
    let fahrenheit = celsius * 9.0 / 5.0 + 32.0;
    println!("{celsius} C = {fahrenheit} F");
}
```

自我解釋：你改了哪裡？為什麼這樣寫？哪個邊界案例最容易漏掉？

---

# 2-1：把值放進輸出文字

本節是補充閱讀，不另交作業。第一課只印固定字串，第二課開始把計算結果放進文字；這裡把不同寫法逐一對照。

## 字串內容與佔位符

雙引號內是格式字串，普通文字照印，花括號指定要代入值的位置。以下三行印出相同內容：

```rust
fn main() {
    let temperature = 25;
    println!("溫度：{} C", temperature);
    println!("溫度：{temperature} C");
    println!("溫度：{value} C", value = temperature);
}
```

第一行由後面的參數依序填入 {}；第二行直接依變數名稱讀取值；第三行替參數指定輸出用的名稱。這些格式不會改變 temperature，也不會替你把攝氏換成華氏。

## 多個值與換行

```rust
fn main() {
    let distance = 100;
    let seconds = 20;
    println!("位移 {} m，時間 {} s", distance, seconds);
    print!("第一段");
    print!(" 接著印");
    println!(" 最後換行");
}
```

{} 與參數的次序對應；print! 不會自動換行，println! 會。終端機顯示在同一行不表示程式把資料合併成一個變數。

## 顯示格式不是數值計算

```rust
fn main() {
    let speed = 10.0 / 3.0;
    println!("原本的顯示：{speed}");
    println!("小數兩位：{speed:.2}");
    println!("花括號本身：{{speed}}");
}
```

:.2 在這裡要求顯示兩位小數，不會把 speed 本身改成兩位精度。{{ 和 }} 表示要印出花括號本身。一般值常用 {}；第八課的 {:?} 是另一種除錯顯示，不能以為任何型別都能用完全相同格式輸出。

## 自我檢核與回到實作

若把兩個位置參數對調，數值不變但顯示位置會交換。若把 {temperature} 改成一般文字 temperature，它就不會代入變數。若只改顯示小數位，後續計算使用的值不變。

回到第二課：cargo run -- lesson 2；編輯 examples/step02.rs，驗收 cargo run -- run 2。驗收有自己的輸出規格，練習兩位小數可用 manual 觀察，別隨意改掉題目要求的單位與文字。

原始資料：[格式化語法](https://doc.rust-lang.org/std/fmt/)。

---

# 2-2：變數、型別、賦值與作用域

本節補上第二課的變數操作，讓後面的累加器、函式與輸入不只剩下照抄。這是閱讀與示範，不新增作答檔。

## 名稱、值與型別是三件事

```rust
fn main() {
    let score: i32 = 60;
    let inferred_score = 60;
    let celsius: f64 = 25.0;
    println!("{score} {inferred_score} {celsius}");
}
```

score 是名稱，60 是目前的值，i32 是可保存有號整數的型別。冒號後標示型別；沒有寫型別時，編譯器會根據值及使用方式推斷。推斷不是執行時任意換型別；同一個綁定的型別仍有約束。此例無其他限制的整數預設為 i32。

## 重新賦值與重新宣告

```rust
fn main() {
    let mut total = 0;
    total = total + 3;
    total += 2;
    let total = total * 10;
    println!("{total}");
}
```

依序得到 0、3、5，最後印 50。mut 允許既有綁定被重新賦值；+= 是用目前的值再更新。最後一行 let 不是重新賦值，而是建立同名的新綁定，遮蔽舊名稱，也稱 shadowing。新綁定沒有 mut，因此後面不能再直接賦值。

```compile_fail
fn main() {
    let score = 60;
    score = 70;
    println!("{score}");
}
```

這不是數學錯誤，而是嘗試修改沒有 mut 的綁定。改成 let mut score，或用新的 let score 遮蔽，是兩種不同意圖。

## 大括號界定可見範圍

```rust
fn main() {
    let score = 60;
    {
        let score = 80;
        println!("內層：{score}");
    }
    println!("外層：{score}");
}
```

依序印 80、60。內層的新名稱離開區塊後就不再可見；這不會把外層 score 修改成 80。第四課若把累加器宣告在迴圈內，就會每次建立新的累加器，無法保留前一輪的總和。

## 自我檢核與回到實作

沒有 mut 就一定不能再用同名名稱嗎？可以用新的 let，但那是遮蔽，不是修改原綁定。整數 9 / 5 為何不是 1.8？因為兩個整數運算的結果仍按整數除法處理；需要小數計算時明確使用浮點值。

回到 cargo run -- lesson 2，接著在第四課追蹤 total 在區塊外建立、迴圈內更新的過程。

原始資料：[變數與可變性](https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html)。

---

# 第 3 步：條件判斷與邊界

## 閱讀路線

[3-1：if 表達式、分號與布林運算](lessons/03-1.md)。終端機：`cargo run -- lesson 3-1`。

主線實作仍編輯原本的 examples/step03.rs；補充閱讀不增加需要繳交的程式。

## 核心觀念

if 的條件必須是 bool。>= 包含邊界；== 用於比較，= 是賦值。if 也能回傳值，各分支必須產生相容型別。

## 起始程式

```rust
fn main() {
    let score = 60;
    let result = "待判斷";
    println!("{result}");
}
```

## 動手練習

成績大於等於 60 印出「及格」，否則印出「再試一次」。測試 59、60、100。

自動驗收：`cargo run -- run 3`。手動執行：`cargo run -- manual 3`。

## 提示

let result = if score >= 60 { ... } else { ... };

## 預期結果

```text
及格
```

驗收：59：再試一次；60 與 100：及格。

## 參考答案

```rust
fn main() {
    let score = 60;
    let result = if score >= 60 { "及格" } else { "再試一次" };
    println!("{result}");
}
```

自我解釋：你改了哪裡？為什麼這樣寫？哪個邊界案例最容易漏掉？

---

# 3-1：布林條件、if 表達式與分號

第三課已要求 if 產生結果，這裡把「選擇執行什麼」與「計算得到什麼值」連起來。後續 Result 與函式都會用到同一個概念。

## if 可以產生值

```rust
fn main() {
    let score = 60;
    let result = if score >= 60 { "及格" } else { "再試一次" };
    println!("{result}");
}
```

先算 score >= 60，得到 true；只執行被選到的分支，該分支的值是字串，最後綁定給 result。result 不是先放一個字串再被另一個 if 偷改，而是整個 if 直接產生要存的值。

## 分號會改變區塊的值

```rust
fn main() {
    let base = 4;
    let doubled = { let temporary = base * 2; temporary };
    println!("{doubled}");
}
```

區塊最後的 temporary 不加分號，成為區塊的值。若最後也加分號，區塊便不會以那個整數作為結果；通常得到單位型別 ()。不是「每一行一定加分號」，而是分清楚要執行一個敘述，還是要保留表達式的值。

```compile_fail
fn main() {
    let passed = true;
    let result = if passed { 1 } else { "失敗" };
    println!("{result}");
}
```

編譯器要為整個 if 決定一個型別，這裡一邊整數、一邊字串，沒有符合本寫法的共同型別。

## 多個條件如何組合

```rust
fn main() {
    let score = 75;
    let absent = false;
    let allowed = score >= 60 && !absent;
    let needs_help = score < 60 || absent;
    println!("{allowed} {needs_help}");
}
```

&& 是兩邊都要成立，|| 是至少一邊成立，! 把布林值反過來。此例 allowed 為 true、needs_help 為 false。它們有短路行為：&& 左邊為 false 就不算右邊；|| 左邊為 true 就不算右邊。

先手算 true && false、false || true、!false，答案依序為 false、true、true。條件必須是 bool，不是把任意整數直接當真假使用。

回到 cargo run -- lesson 3。手動測試 59、60、61 時，列出「比較結果 → 選到的分支 → result」三欄；這個追蹤比背範例更能檢查你是否理解。

原始資料：[控制流程](https://doc.rust-lang.org/book/ch03-05-control-flow.html)。

---

# 第 4 步：迴圈與累加

## 閱讀路線

[4-8：陣列、方法串接與配對解構；4-1～4-7為可選加強實作](lessons/04-8.md)。終端機：`cargo run -- lesson 4-8`。

主線實作仍編輯原本的 examples/step04.rs；補充閱讀不增加需要繳交的程式。

第四課加強練習：`cargo run -- lesson 4-1` 到 `4-7`。各子題的 run／test 自動驗收，manual 手動觀察，hint 與 answer 分別看提示及參考解法。起始檔為 examples/step04_01.rs 到 step04_07.rs，原本 step04.rs 不變。完整題目在 [子題目錄](README.md#第四課for-迴圈加強練習)。

## 核心觀念

for n in 1..=5 會走過 1 到 5，1..5 則不包含 5。累加器需要 mut。先用紙筆追蹤每次迴圈的 total。

## 起始程式

```rust
fn main() {
    let mut total = 0;
    for n in 1..=5 {
        total += 0; // 使用 n
    }
    println!("{total}");
}
```

## 動手練習

計算 1 到 5 的整數總和，再改成 1 到 100。

自動驗收：`cargo run -- run 4`。手動執行：`cargo run -- manual 4`。

## 提示

total += n 等同 total = total + n。

## 預期結果

```text
15
```

驗收：1 到 5：15；1 到 100：5050。

## 參考答案

```rust
fn main() {
    let mut total = 0;
    for n in 1..=5 { total += n; }
    println!("{total}");
}
```

自我解釋：你改了哪裡？為什麼這樣寫？哪個邊界案例最容易漏掉？

---

# 4-1：範圍與逐項輸出

## 為什麼常見

顯示頁碼、逐一處理編號或重複固定次數時，迴圈比複製多行輸出更容易維護。

## 觀念

`0..limit` 包含左端的０，不包含右端的 limit。每次迴圈讓 n 依序取得一個值；limit 為０時沒有任何值，因此迴圈本體完全不執行。

## 手動追蹤

| 第幾次 | n | 本次輸出 |
|---|---|---|
| １ | ０ | ０ |
| ２ | １ | １ |
| ５ | ４ | ４ |

先遮住參考解法，手算預設參數的輸出；接著修改參數，再預測一次結果。

## 實作規格

以 `for` 走訪 `0..limit`，每行只印一個整數。limit 為非負整數；limit＝０時完全沒有輸出。禁止額外標題或提示文字。

起始程式：`examples/step04_01.rs`。直接在 main 中練習，不需要先建立函式。保留原本的 `let` 參數名稱，驗收會在暫存副本替換參數，不會修改你的作答。

## 終端機操作

以下先進入 beginner 資料夾執行；若目前在 workspace 根目錄，先執行 `cd beginner`。`lesson` 閱讀題目，`hint` 查看提示，`run` 自動驗收，`manual` 手動觀察輸出，`test` 同樣執行子題自動驗收（等同 run，不是只有零項測試的 main 檢查），`answer` 顯示參考程式：

```sh
cargo run -- lesson 4-1
cargo run -- hint 4-1
cargo run -- run 4-1
cargo run -- manual 4-1
cargo run -- test 4-1
cargo run -- answer 4-1
```

每個子題至少使用十筆測試資料。完整驗收方式與測試資料政策見 [README](README.md)。起始程式可以編譯，但刻意印出「待完成」，尚未符合題目；只看到程式成功執行，不代表答案正確。

## 預期結果

使用起始參數時，標準輸出必須為：

```text
0
1
2
3
4
```

每個輸出列最後都有換行；沒有任何列的情況，連空白行也不要印出。

## 提示

把 `println!("{n}")` 放在迴圈本體，觀察右端為什麼沒有被印出。

## 參考答案

完成並通過驗收後，再比較 `solutions/step04_01.rs`。參考解法示範本題指定的迴圈方法；正確輸出之外，也請解釋範圍端點、變數更新與停止條件為何符合規格。

---

# 4-2：篩選偶數並累加

## 為什麼常見

統計符合條件的金額、分數或數量時，經常先篩選，再累加。

## 觀念

`1..=limit` 包含右端。`n % 2` 是除以２的餘數，餘數為０代表偶數。累加器 total 必須在迴圈外建立，才不會每次重新歸零。非負 limit 為０時，這個整數範圍為空。

## 手動追蹤

| n | 是偶數？ | 本次後 total |
|---|---|---|
| １ | 否 | ０ |
| ２ | 是 | ２ |
| ３ | 否 | ２ |
| ４ | 是 | ６ |

先遮住參考解法，手算預設參數的輸出；接著修改參數，再預測一次結果。

## 實作規格

加總１到 limit（含）之間的所有偶數，最後只印總和一行。limit 為０時印０。必須使用迴圈；不要直接填寫預設答案３０。

起始程式：`examples/step04_02.rs`。直接在 main 中練習，不需要先建立函式。保留原本的 `let` 參數名稱，驗收會在暫存副本替換參數，不會修改你的作答。

## 終端機操作

以下先進入 beginner 資料夾執行；若目前在 workspace 根目錄，先執行 `cd beginner`。`lesson` 閱讀題目，`hint` 查看提示，`run` 自動驗收，`manual` 手動觀察輸出，`test` 同樣執行子題自動驗收（等同 run，不是只有零項測試的 main 檢查），`answer` 顯示參考程式：

```sh
cargo run -- lesson 4-2
cargo run -- hint 4-2
cargo run -- run 4-2
cargo run -- manual 4-2
cargo run -- test 4-2
cargo run -- answer 4-2
```

每個子題至少使用十筆測試資料。完整驗收方式與測試資料政策見 [README](README.md)。起始程式可以編譯，但刻意印出「待完成」，尚未符合題目；只看到程式成功執行，不代表答案正確。

## 預期結果

使用起始參數時，標準輸出必須為：

```text
30
```

每個輸出列最後都有換行；沒有任何列的情況，連空白行也不要印出。

## 提示

先把 total 設為０；只有 `n % 2 == 0` 時才執行 `total += n`。

## 參考答案

完成並通過驗收後，再比較 `solutions/step04_02.rs`。參考解法示範本題指定的迴圈方法；正確輸出之外，也請解釋範圍端點、變數更新與停止條件為何符合規格。

---

# 4-3：continue 與符合條件的筆數

## 為什麼常見

在資料清單中略過不符合條件的項目，只統計符合條件的筆數，是常見的篩選工作。

## 觀念

`continue` 結束目前這一輪，直接進入下一輪；它不會離開整個迴圈。計數器每次加１代表一筆，不是加上 n 的數值。本題保證 divisor 是正整數，因此不會除以０。

## 手動追蹤

| n | n % 3 | 動作 | count |
|---|---|---|---|
| １ | １ | continue | ０ |
| ３ | ０ | 加１ | １ |
| ６ | ０ | 加１ | ２ |
| ９ | ０ | 加１ | ３ |

先遮住參考解法，手算預設參數的輸出；接著修改參數，再預測一次結果。

## 實作規格

計算１到 limit（含）可被 divisor 整除的整數個數，最後只印個數一行。limit 是非負整數，divisor 是正整數；limit＝０時印０。可使用 continue，或等價的條件判斷。

起始程式：`examples/step04_03.rs`。直接在 main 中練習，不需要先建立函式。保留原本的 `let` 參數名稱，驗收會在暫存副本替換參數，不會修改你的作答。

## 終端機操作

以下先進入 beginner 資料夾執行；若目前在 workspace 根目錄，先執行 `cd beginner`。`lesson` 閱讀題目，`hint` 查看提示，`run` 自動驗收，`manual` 手動觀察輸出，`test` 同樣執行子題自動驗收（等同 run，不是只有零項測試的 main 檢查），`answer` 顯示參考程式：

```sh
cargo run -- lesson 4-3
cargo run -- hint 4-3
cargo run -- run 4-3
cargo run -- manual 4-3
cargo run -- test 4-3
cargo run -- answer 4-3
```

每個子題至少使用十筆測試資料。完整驗收方式與測試資料政策見 [README](README.md)。起始程式可以編譯，但刻意印出「待完成」，尚未符合題目；只看到程式成功執行，不代表答案正確。

## 預期結果

使用起始參數時，標準輸出必須為：

```text
3
```

每個輸出列最後都有換行；沒有任何列的情況，連空白行也不要印出。

## 提示

不能整除時先 continue；能走到計數那一行的 n，才算一筆。

## 參考答案

完成並通過驗收後，再比較 `solutions/step04_03.rs`。參考解法示範本題指定的迴圈方法；正確輸出之外，也請解釋範圍端點、變數更新與停止條件為何符合規格。

---

# 4-4：rev 與倒數

## 為什麼常見

倒數計時、從最後一項往前檢查，常需要反向走訪。

## 觀念

`rev()` 把可反向走訪的序列改成倒過來取值。`(1..=limit).rev()` 反轉的是整個範圍；括號讓方法作用的對象清楚。limit 為０時，原本的範圍就是空的，反轉後仍然沒有值。

## 手動追蹤

| 第幾次 | n | 本次輸出 |
|---|---|---|
| １ | ５ | ５ |
| ２ | ４ | ４ |
| ５ | １ | １ |

先遮住參考解法，手算預設參數的輸出；接著修改參數，再預測一次結果。

## 實作規格

使用 rev，從 limit 倒數到１，每行一個整數。limit 是非負整數；limit＝０時不印任何內容。不要額外印０。

起始程式：`examples/step04_04.rs`。直接在 main 中練習，不需要先建立函式。保留原本的 `let` 參數名稱，驗收會在暫存副本替換參數，不會修改你的作答。

## 終端機操作

以下先進入 beginner 資料夾執行；若目前在 workspace 根目錄，先執行 `cd beginner`。`lesson` 閱讀題目，`hint` 查看提示，`run` 自動驗收，`manual` 手動觀察輸出，`test` 同樣執行子題自動驗收（等同 run，不是只有零項測試的 main 檢查），`answer` 顯示參考程式：

```sh
cargo run -- lesson 4-4
cargo run -- hint 4-4
cargo run -- run 4-4
cargo run -- manual 4-4
cargo run -- test 4-4
cargo run -- answer 4-4
```

每個子題至少使用十筆測試資料。完整驗收方式與測試資料政策見 [README](README.md)。起始程式可以編譯，但刻意印出「待完成」，尚未符合題目；只看到程式成功執行，不代表答案正確。

## 預期結果

使用起始參數時，標準輸出必須為：

```text
5
4
3
2
1
```

每個輸出列最後都有換行；沒有任何列的情況，連空白行也不要印出。

## 提示

先寫出遞增範圍 `1..=limit`，再用括號包住並加上 `.rev()`。

## 參考答案

完成並通過驗收後，再比較 `solutions/step04_04.rs`。參考解法示範本題指定的迴圈方法；正確輸出之外，也請解釋範圍端點、變數更新與停止條件為何符合規格。

---

# 4-5：break 與第一個符合條件的值

## 為什麼常見

搜尋第一個符合需求的商品、第一個超標數值時，找到後就能停止，不必繼續掃描。

## 觀念

`break` 離開整個最近一層迴圈；與只略過當輪的 continue 不同。因為 n 由小到大檢查，第一次達到條件的 n 就是最小答案。found 先設為０，作為「沒有找到」的約定。本題從１開始搜尋，所以０不會與合法答案混淆。

## 手動追蹤

| n | n × n | 是否達５０ | 動作 |
|---|---|---|---|
| ６ | ３６ | 否 | 繼續 |
| ７ | ４９ | 否 | 繼續 |
| ８ | ６４ | 是 | 記錄８並 break |

先遮住參考解法，手算預設參數的輸出；接著修改參數，再預測一次結果。

## 實作規格

由１到 limit（含）找第一個滿足 `n * n >= threshold` 的整數，找到後用 break 立即停止。最後只印答案一行；找不到或 limit＝０時印０。測試的 limit 介於０與１００，threshold 介於０與１００００，避免乘法溢位；threshold＝０且 limit 至少１時答案是１。

起始程式：`examples/step04_05.rs`。直接在 main 中練習，不需要先建立函式。保留原本的 `let` 參數名稱，驗收會在暫存副本替換參數，不會修改你的作答。

## 終端機操作

以下先進入 beginner 資料夾執行；若目前在 workspace 根目錄，先執行 `cd beginner`。`lesson` 閱讀題目，`hint` 查看提示，`run` 自動驗收，`manual` 手動觀察輸出，`test` 同樣執行子題自動驗收（等同 run，不是只有零項測試的 main 檢查），`answer` 顯示參考程式：

```sh
cargo run -- lesson 4-5
cargo run -- hint 4-5
cargo run -- run 4-5
cargo run -- manual 4-5
cargo run -- test 4-5
cargo run -- answer 4-5
```

每個子題至少使用十筆測試資料。完整驗收方式與測試資料政策見 [README](README.md)。起始程式可以編譯，但刻意印出「待完成」，尚未符合題目；只看到程式成功執行，不代表答案正確。

## 預期結果

使用起始參數時，標準輸出必須為：

```text
8
```

每個輸出列最後都有換行；沒有任何列的情況，連空白行也不要印出。

## 提示

建立可變 found＝０；在 if 成立時先記錄 n，再 break。不要把輸出放在迴圈裡。

## 參考答案

完成並通過驗收後，再比較 `solutions/step04_05.rs`。參考解法示範本題指定的迴圈方法；正確輸出之外，也請解釋範圍端點、變數更新與停止條件為何符合規格。

---

# 4-6：巢狀迴圈與乘法表

## 為什麼常見

表格、座位配置與二維圖形都有「逐列，再逐欄」的結構，適合用巢狀迴圈表達。

## 觀念

外層每走一輪，內層會完整走完所有欄位。`print!` 不自動換行，`println!` 會換行。每列只在第二個數字開始前印空白，就能避免行首與行尾多餘空白。

## 手動追蹤

| 外層 i | 內層 j | i × j | 列是否結束 |
|---|---|---|---|
| １ | １ | １ | 否 |
| １ | ３ | ３ | 是，換行 |
| ２ | １ | ２ | 否 |

先遮住參考解法，手算預設參數的輸出；接著修改參數，再預測一次結果。

## 實作規格

外層 i 由１到 rows，內層 j 由１到 columns，每列依序印出 i × j。相鄰數字以單一空白分隔，不含行首或行尾空白，每列最後換行。rows 為非負整數，columns 至少１；rows＝０時沒有輸出。

起始程式：`examples/step04_06.rs`。直接在 main 中練習，不需要先建立函式。保留原本的 `let` 參數名稱，驗收會在暫存副本替換參數，不會修改你的作答。

## 終端機操作

以下先進入 beginner 資料夾執行；若目前在 workspace 根目錄，先執行 `cd beginner`。`lesson` 閱讀題目，`hint` 查看提示，`run` 自動驗收，`manual` 手動觀察輸出，`test` 同樣執行子題自動驗收（等同 run，不是只有零項測試的 main 檢查），`answer` 顯示參考程式：

```sh
cargo run -- lesson 4-6
cargo run -- hint 4-6
cargo run -- run 4-6
cargo run -- manual 4-6
cargo run -- test 4-6
cargo run -- answer 4-6
```

每個子題至少使用十筆測試資料。完整驗收方式與測試資料政策見 [README](README.md)。起始程式可以編譯，但刻意印出「待完成」，尚未符合題目；只看到程式成功執行，不代表答案正確。

## 預期結果

使用起始參數時，標準輸出必須為：

```text
1 2 3
2 4 6
3 6 9
```

每個輸出列最後都有換行；沒有任何列的情況，連空白行也不要印出。

## 提示

內層印數字，外層尾端換行。只有 `j > 1` 時，才在數字前先印一個空白。

## 參考答案

完成並通過驗收後，再比較 `solutions/step04_06.rs`。參考解法示範本題指定的迴圈方法；正確輸出之外，也請解釋外內層的執行次序與空白、換行位置為何符合規格。

---

# 4-7：陣列、iter 與 enumerate

## 為什麼常見

顯示一份成績或清單時，常要同時知道項目的位置與內容。

## 觀念

陣列用中括號儲存固定個數、相同型別的值。`iter()` 依序借看每個元素，不需要把元素搬走；此處先把它當成逐項讀取即可。`enumerate()` 為每項附上從０開始的索引，`(index, value)` 同時接住兩項資訊。顯示給人看的序號常從１開始，所以輸出 index＋１。這裡不需要 Vec、鍵盤輸入或自行撰寫函式。

## 手動追蹤

| index | value | 顯示序號 | 輸出 |
|---|---|---|---|
| ０ | ７０ | １ | 1: 70 |
| １ | ８５ | ２ | 2: 85 |
| ２ | ９０ | ３ | 3: 90 |

先遮住參考解法，手算預設參數的輸出；接著修改參數，再預測一次結果。

## 實作規格

用 `values.iter().enumerate()` 依原順序輸出，每行格式為 `序號: 數值`：冒號後恰好一個空白，序號從１開始。保留參數名稱 values，允許不同長度與負整數。若自行練習空陣列，寫 `let values = [] as [i32; 0];`，讓編譯器知道元素型別；空陣列不輸出。

起始程式：`examples/step04_07.rs`。直接在 main 中練習，不需要先建立函式。保留原本的 `let` 參數名稱，驗收會在暫存副本替換參數，不會修改你的作答。

## 終端機操作

以下先進入 beginner 資料夾執行；若目前在 workspace 根目錄，先執行 `cd beginner`。`lesson` 閱讀題目，`hint` 查看提示，`run` 自動驗收，`manual` 手動觀察輸出，`test` 同樣執行子題自動驗收（等同 run，不是只有零項測試的 main 檢查），`answer` 顯示參考程式：

```sh
cargo run -- lesson 4-7
cargo run -- hint 4-7
cargo run -- run 4-7
cargo run -- manual 4-7
cargo run -- test 4-7
cargo run -- answer 4-7
```

每個子題至少使用十筆測試資料。完整驗收方式與測試資料政策見 [README](README.md)。起始程式可以編譯，但刻意印出「待完成」，尚未符合題目；只看到程式成功執行，不代表答案正確。

## 預期結果

使用起始參數時，標準輸出必須為：

```text
1: 70
2: 85
3: 90
```

每個輸出列最後都有換行；沒有任何列的情況，連空白行也不要印出。

## 提示

迴圈可寫 `for (index, value) in values.iter().enumerate()`，再以 `index + 1` 顯示序號。

## 參考答案

完成並通過驗收後，再比較 `solutions/step04_07.rs`。參考解法示範本題指定的迴圈方法；正確輸出之外，也請解釋範圍端點、變數更新與停止條件為何符合規格。

---

# 4-8：從陣列走訪讀懂方法與配對

4-7 已介紹陣列、iter、enumerate，這裡把它們分開，避免一次看不懂整串語法。本節不是新的待評分子題。

## 先只有資料與逐項走訪

```rust
fn main() {
    let values = [70, 85, 90];
    for value in values.iter() {
        println!("{value}");
    }
}
```

陣列每個元素型別相同，這裡有三個整數。iter() 依順序借看元素，不需要搬走整份資料。先把迴圈想成每輪拿到一項，分別印出 70、85、90；之後第七課才完整解釋參照的型別。

## 再加位置資訊

```rust
fn main() {
    let values = [70, 85, 90];
    for (index, value) in values.iter().enumerate() {
        println!("{}: {}", index + 1, value);
    }
}
```

enumerate() 在每項前加上從零開始的位置，得到配對，例如 (0, 70)。for 的 (index, value) 是解構，把配對的兩部分各交給一個名稱，不是呼叫名為 index 的函式。內部索引從零開始，人看的序號則在顯示時加一。

## 點號、雙冒號與括號

values.iter() 是對某個值呼叫方法；後面再接 enumerate()，就是把前一步產生的逐項走訪繼續加工。寫成一串不表示全部工作立刻完成，for 逐輪需要元素時才推進；本階段先理解資料如何逐步流動。

(1..=5).rev() 的括號把「整個範圍」當作方法對象。:: 常用來沿路徑找名稱或呼叫與型別關聯的函式，例如下一個字串單元的 String::new()；它和某個值後面的 . 不是隨意互換的標點。

```rust
fn main() {
    let empty: [i32; 0] = [];
    let pair = (3, "第三筆");
    let (position, description) = pair;
    println!("{} {position} {description}", empty.len());
}
```

[i32; 0] 指「元素為 i32、長度為零的陣列」，不是分號在這裡結束宣告。配對可以包含不同型別，陣列則要求同型別元素。這些都是型別與資料表示，不需要先學動態 Vec。

自我檢核：拿掉 index + 1 會怎樣？第一筆顯示零。把整數位置誤當分數會怎樣？輸出型別也許仍合法，但資料意義錯了。空陣列走訪幾次？零次。

回到 cargo run -- lesson 4-7；先完成只有 value 的走訪，再加入 enumerate，最後以 run 4-7 驗收。

原始資料：[複合型別](https://doc.rust-lang.org/book/ch03-02-data-types.html#compound-types)、[Iterator](https://doc.rust-lang.org/std/iter/trait.Iterator.html)。

---

# 第 5 步：函式與檢查

## 閱讀路線

[5-3：函式參數、呼叫與回傳流程；5-1為實作，5-2補assert系列](lessons/05-3.md)。終端機：`cargo run -- lesson 5-3`。

主線實作仍編輯原本的 examples/step05.rs；補充閱讀不增加需要繳交的程式。

## 本課分成兩節

5-1 是原本的函式與速度實作，直接使用 assert!；5-2 集中補充 assert!、assert_eq!、assert_ne!、panic! 與 debug_assert!；5-3 則追蹤函式參數、呼叫與回傳。主線題目不再插入一長段補課。

在 beginner 資料夾執行：

```sh
cargo run -- lesson 5-1
cargo run -- lesson 5-2
```

5-1 繼續編輯原本 examples/step05.rs，以 cargo run -- run 5-1 驗收；原本 run 5 保留相同十項驗收。5-2 是補充教材，不需要提交新程式、不會列出假造的通過數。

Markdown 閱讀入口：[5-1 實作](lessons/05-1.md)、[5-2 補充教材](lessons/05-2.md)。

---

# 5-1：函式與速度實作

## 學習重點

fn 名稱(參數: 型別) -> 回傳型別 定義函式；參數是傳入的資料，最後一行不加分號的表達式可作為回傳值。這題計算有號位移／時間，時間必須為正，負位移可以得到負速度。

## 起始程式與既有作答

使用原本的 examples/step05.rs；你的檔案不會被重新建立或搬移。以下是新學習者的模板，本節直接使用 assert! 檢查時間；它的完整用法與類似巨集集中放在 5-2。

```rust
fn speed(distance: f64, time: f64) -> f64 {
    assert!(time > 0.0, "時間必須為正");
    0.0 // 改成位移除以時間的回傳表達式
}
fn main() {
    println!("{} m/s", speed(100.0, 20.0));
}
```

## 動手練習

保留檢查時間的 assert!，完成回傳公式。正常的 100 公尺、20 秒應得到 5 m/s；零秒及負秒數應被拒絕並觸發 panic。公式最後不要加分號，否則不會回傳所需的 f64。若看不懂 assert!，請執行 cargo run -- lesson 5-2。

## 操作與驗收

在 beginner 資料夾執行：

```sh
cargo run -- lesson 5-1
cargo run -- hint 5-1
cargo run -- run 5-1
cargo run -- manual 5-1
cargo run -- test 5-1
cargo run -- answer 5-1
```

run／test 會使用原本第五課十個獨立驗收案例，不建立第二份作答，也不把相同測試冒充新增資料。原有 run 5／manual 5 仍可使用。manual 依目前 main 中的參數執行；不自行把 main 改成零秒，就只會看到正常結果。

## 預期結果

```text
5 m/s
```

## 提示

檢查寫在除法之前，最後用 distance / time 回傳。assert! 成功時不印訊息，失敗時觸發 panic；需要完整語法、例子與 assert_eq! 等說明，請閱讀 5-2。

## 參考答案

使用原本 solutions/step05.rs；以 cargo run -- answer 5-1 顯示，不另造一份答案檔。

---

# 5-2：assert 與相關檢查的補充教材

本節集中解釋 5-1 直接使用的 assert!，並比較 assert_eq!、assert_ne!、panic! 與 debug_assert!。你可以先照 5-1 的模板完成函式，需要理解檢查機制時再回來閱讀。本節是補充閱讀與示範，不新增需要繳交的實作，也不顯示假造的驗收通過數。

## 把「時間必須為正」寫成條件

第三課學過比較運算。`time > 0.0` 的結果是 bool，也就是 true 或 false：time 為 2.0 時是 true，為 0.0 或 -1.0 時是 false。注意是 `>`，因為這題不允許零秒。

函式的前置條件，是呼叫者在使用它時應滿足的要求。本題把「時間必須為正」當成 speed 的前置條件。除以零是數學上沒有定義的運算；Rust 浮點運算卻可能產生無限大或 NaN，不會自動替你拒絕這筆資料，所以要自己寫下規則。

## assert! 的寫法

```text
assert!(布林條件);
assert!(布林條件, "失敗時要顯示的訊息");
```

assert! 可以讀成「我斷言這個條件必須成立」。條件是 true：不印任何訊息，繼續下一行。條件是 false：觸發 panic。驚嘆號表示它是巨集，與第一課的 println! 相同，不是這裡的邏輯否定。

## 先預測一個會成功的例子

```rust
fn main() {
    let time = 2.0;
    println!("檢查前");
    assert!(time > 0.0, "時間必須為正");
    println!("檢查後");
}
```

依序輸出「檢查前」與「檢查後」。assert! 成功時不會幫你印出「通過」，也不會回傳速度；它只做這項條件檢查。

## 再預測一個會失敗的例子

```rust
fn main() {
    let time = 0.0;
    println!("檢查前");
    assert!(time > 0.0, "時間必須為正");
    println!("檢查後");
}
```

這段程式仍能編譯，錯誤是在執行時發生的。會先印「檢查前」，接著在標準錯誤輸出顯示 panic 與「時間必須為正」，不會執行「檢查後」。在這個直接從 main 執行、沒有另外捕捉 panic 的例子中，這次程式會以非零退出碼結束。路徑、行號等診斷會因環境而不同。

panic 是執行期的失敗機制，不等於編譯錯誤；更精確地說，assert! 失敗會讓目前執行緒 panic。先用上面這種單執行緒例子理解即可，後面再學測試如何觀察它。

## 與 if 的差別，為什麼不直接印錯誤？

if 可以依條件選擇不同工作，例如成績及格或未及格。assert! 則用來表明「接下來的計算要求這個條件成立」，條件不成立就觸發 panic。只有 println!("時間錯誤") 不會自動阻止下一行繼續相除。

這一課用 assert! 練習程式內部的前置條件，不把它當成日常使用者輸入錯誤的通用處理方式。若希望顯示提示後重試或交給呼叫者處理，後面會用 match、Result 等方式。它也不是只在 debug 才檢查的指令；一般 assert! 在 release 仍會檢查。

## 回到 speed：先檢查，再計算

函式內先放 `assert!(time > 0.0, "時間必須為正");`，下一步才計算位移除以時間。assert! 這一行要有分號；最後的計算表達式不加分號，才能成為 f64 回傳值。這同時練習「檢查」與「回傳計算結果」是兩件不同的事。

先用 100 公尺、20 秒確認正常結果，再用零秒與負秒數觀察拒絕行為。負位移本身不是錯誤：它代表反方向，速度可以為負。

`cargo run -- run 5-1` 的十個案例包含兩項「預期 panic」檢查。這兩項測試刻意傳入零秒與負秒數，確認函式有拒絕它們；顯示測試成功不代表原始資料可用，而是拒絕行為符合規格。`manual 5-1` 才是依目前 main 的參數直接執行。

完成後，請先用自己的話說明：條件為 true 時印什麼？false 時哪一行不會執行？為什麼 guard 要放在除法之前？

## assert_eq!：檢查兩個值相等

assert! 接收一個布林條件；assert_eq! 接收左右兩個值，比較是否相等。相等就繼續，不相等則 panic，並在診斷中列出左右值。比較整數、字串或已知精確結果時很方便。

```rust
fn main() {
    let total = 1 + 2 + 3;
    assert_eq!(total, 6, "總和不符合預期");
    assert_eq!("Rust", "Rust");
    println!("相等檢查完成");
}
```

assert_eq!(total, 6) 可理解成更方便顯示差異的 assert!(total == 6)。本節先使用整數與字串；一般浮點計算可能有捨入誤差，不要把 assert_eq! 當作所有浮點結果的通用比較。第十一課再正式學容許誤差與測試組織。

## assert_ne!：檢查兩個值不相等

assert_ne! 要求左右兩個值不同；若相等才會 panic。ne 是 not equal 的縮寫。不要和 assert_eq! 的成立方向弄反。

```rust
fn main() {
    let divisor = 3;
    assert_ne!(divisor, 0, "除數不可為零");
    println!("不相等檢查完成");
}
```

對整數檢查除數非零，可寫 assert!(divisor != 0) 或 assert_ne!(divisor, 0)。對第五課的時間，僅檢查不等於零還不夠，因為負時間也必須拒絕，所以仍需 time > 0.0。

## panic! 與 debug_assert! 的位置

panic!("失敗原因") 不先比較條件，執行到該行就直接觸發 panic；assert 系列則根據條件決定是否觸發。panic! 不是讓使用者重新輸入的迴圈，也不是從函式回傳一個正常錯誤值。

debug_assert! 的條件在一般 debug 設定會檢查，但在一般 release 設定預設不檢查，實際取決於編譯設定。assert! 則在 debug／release 都檢查。因此第五課不能直接把 assert! 換成 debug_assert!，否則不再保證所有編譯設定都拒絕無效時間。

## 用自己的話確認理解

assert!(2 > 0) 會繼續；assert_eq!(2, 3) 會 panic；assert_ne!(2, 3) 會繼續；panic!("停止") 會直接 panic。這些都是示範，不是四筆需要提交的習題。未來第十一課會把斷言放進 #[test]，再說明如何由測試工具判斷成功與失敗。

在 beginner 閱讀本節：`cargo run -- lesson 5-2`。回到實作：`cargo run -- lesson 5-1`；驗收實作：`cargo run -- run 5-1`。

官方依據：[assert!](https://doc.rust-lang.org/std/macro.assert.html)、[assert_eq!](https://doc.rust-lang.org/std/macro.assert_eq.html)、[assert_ne!](https://doc.rust-lang.org/std/macro.assert_ne.html)、[debug_assert!](https://doc.rust-lang.org/std/macro.debug_assert.html)。

---

# 5-3：函式呼叫、區域參數與回傳值

5-1 練函式，5-2 補 assert 系列，本節專門追蹤函式如何收到資料並把結果交回呼叫處。

## 呼叫時的值與定義中的參數

```rust
fn twice(value: i32) -> i32 {
    value * 2
}
fn main() {
    let original = 7;
    let result = twice(original);
    println!("原值={original}，結果={result}");
}
```

執行 twice(original) 時先取得 original 的整數值 7，讓這次呼叫的參數 value 接收它；算出 14 後回到呼叫位置，綁定給 result。名稱不必相同：呼叫者叫 original，函式裡叫 value。這個 i32 可以複製；第七課會說明 String 為什麼不總是同樣行為。

| 時點 | 呼叫者 | 函式內 |
| --- | --- | --- |
| 呼叫前 | original=7 | 尚未執行 |
| 函式執行 | 等待結果 | value=7，算得14 |
| 返回後 | result=14，original仍是7 | 此次區域參數不再可用 |

## 回傳不是印出

```rust
fn add(a: i32, b: i32) -> i32 { a + b }
fn show(a: i32, b: i32) { println!("{}", a + b); }
fn main() {
    let answer = add(2, 3);
    show(2, 3);
    println!("{}", answer * 10);
}
```

add 回傳數值，所以呼叫者能繼續乘十；show 只顯示文字，沒有回傳那個整數。先印 5，再印 50。終端機看見一個數字，不代表該函式的回傳型別就是整數。

## return 與最後一個表達式

```rust
fn positive_or_zero(value: i32) -> i32 {
    if value < 0 { return 0; }
    value
}
fn main() {
    println!("{} {}", positive_or_zero(-2), positive_or_zero(3));
}
```

return 0; 立刻離開目前函式；最後一行 value 則在走到結尾時回傳。兩種方式都能表達結果，但最後寫成 value; 會捨棄該整數值，無法滿足 -> i32。大括號內的名稱屬於當次呼叫，不會自動修改另一個函式中的同名變數。

自我檢核：twice(3) + twice(4) 是多少？6+8=14，每次呼叫的參數各自建立。函式只 println! 結果，能否拿來除以時間？不能把終端機文字當成 f64 回傳值。

回到 cargo run -- lesson 5-1，指出 speed 的兩個參數、回傳型別與 main 接收結果的位置，再用 run 5-1 驗收。

原始資料：[函式](https://doc.rust-lang.org/book/ch03-03-how-functions-work.html)。

---

# 第 6 步：輸入與字串轉數字

## 閱讀路線

[6-1：逐段讀懂固定輸入模板](lessons/06-1.md)。終端機：`cargo run -- lesson 6-1`。

[6-2：文字解析與match成功／失敗分支](lessons/06-2.md)。終端機：`cargo run -- lesson 6-2`。

主線實作仍編輯原本的 examples/step06.rs；補充閱讀不增加需要繳交的程式。

## 核心觀念

read_line 將輸入附加到 String；&mut 表示可變借用。trim 去除兩端空白；parse::<f64>() 嘗試轉換數字。match 區分 Ok 與 Err。

## 起始程式

```rust
use std::io;
fn main() {
    let mut input = String::new();
    println!("輸入攝氏溫度：");
    io::stdin().read_line(&mut input).expect("讀取失敗");
    println!("你輸入：{}", input.trim());
}
```

## 動手練習

將輸入轉為 f64 後換算華氏；輸入 abc 時顯示「請輸入數字」，不要直接崩潰。Playground 不適合本課互動輸入，請在本機終端機操作。

自動驗收：`cargo run -- run 6`。手動執行：`cargo run -- manual 6`。

## 提示

match input.trim().parse::<f64>() { Ok(c) => ... , Err(_) => ... }

## 預期結果

```text
輸入 25 → 77 F
輸入 abc → 請輸入數字
```

驗收：測試 25、-40、abc 及空白輸入。

## 參考答案

```rust
use std::io;
fn main() {
    let mut input = String::new();
    println!("輸入攝氏溫度：");
    io::stdin().read_line(&mut input).expect("讀取失敗");
    match input.trim().parse::<f64>() {
        Ok(c) => println!("{} F", c * 9.0 / 5.0 + 32.0),
        Err(_) => println!("請輸入數字"),
    }
}
```

自我解釋：你改了哪裡？為什麼這樣寫？哪個邊界案例最容易漏掉？

---

# 6-1：逐段讀懂終端機輸入模板

本節是補充閱讀，不是新作業，不另外計分。先知道每一段負責什麼，再回原第六課換算溫度；不需要現在就理解 Rust 所有的所有權規則。

## 模型：鍵盤送進來的是文字

終端機輸入先成為一串文字，不會因為你打的是２５就自動變成 f64。可以把流程畫成：

```text
terminal stdin -> read_line -> String -> trim -> parse -> number
```

本節先完成到 trim。下一節才把「讀到文字」和「文字轉成數字」接起來。輸入成功不代表解析成功：輸入 abc 可以順利讀入，卻不能當作溫度數字。

## 從名字讀懂模板

| 片段 | 這裡的工作 |
|---|---|
| `std` | Rust 標準函式庫的名字 |
| `::` | 沿著路徑找名字，例如 std 裡的 io；也可用於型別所提供的相關函式 |
| `use std::io;` | 讓這個範圍可以直接以 io 這個短名字使用 std::io |
| `String::new()` | 建立可擁有文字內容、目前為空的 String |
| `io::stdin()` | 取得標準輸入的控制代碼；一般終端機中通常來自鍵盤，也能來自管線 |
| `.read_line(...)` | 呼叫物件的方法，讀一行並附加到指定 String |
| `&mut input` | 暫時讓方法可修改 input，將文字存進去 |
| `.expect("讀取失敗")` | 讀取成功就取出成功結果；真的發生讀取錯誤時以這則訊息觸發 panic |

`::` 和 `.` 不是可以隨便互換的標點。這裡 `String::new()` 不需要先有一個 String，因為它負責建立；`input.trim()` 則對已經存在的 input 呼叫方法。

## 示例一：字串常值與 String

```rust
fn main() {
    let label = "輸入內容";
    let mut input = String::new();
    println!("{} 的初始位元組數：{}", label, input.len());
    input.push_str("25");
    println!("{}：{}", label, input);
}
```

輸出先是「輸入內容 的初始位元組數：0」，再是「輸入內容：25」。雙引號中的文字是字串常值，這裡 label 的型別是 &str；input 是自己擁有內容、可增添文字的 String。`push_str` 是為了觀察「空容器後來裝入文字」而使用的方法，不是讀取鍵盤所必需的步驟。

`mut` 允許改變 input；`&mut input` 則是這一次方法呼叫用來修改它的借用。兩個都需要，但代表不同角色。先把 `read_line(&mut input)` 當作固定配對，之後第七課再用所有權模型解釋。

## 示例二：可先使用的固定讀取框架

```rust
use std::io;

fn main() {
    let mut input = String::new();
    println!("輸入一行文字：");
    io::stdin()
        .read_line(&mut input)
        .expect("讀取失敗");
    println!("原始內容：{input:?}");
    println!("去除兩端空白：{}", input.trim());
}
```

逐步追蹤輸入２５後按 Enter：

| 步驟 | input／結果 | 意義 |
|---|---|---|
| String::new | 空文字 | 等待接收內容 |
| read_line | 通常包含 `"25\n"`，實際行尾依環境 | Enter 的行尾也可能被讀入 |
| trim | 借看 `"25"` | 去掉兩端空白與行尾，不改寫 input |
| 第二次輸出 | 25 | 此時仍是文字，不是數字 |

`{:?}` 是偵錯輸出形式；在這裡會加上引號，並以 `\n` 顯示換行，方便觀察讀進來的內容。它不等於一般使用者介面的排版方式。多行拆開的 `.read_line(...).expect(...)` 是同一個方法串接，等同寫在一行。

若輸入 abc，`read_line` 仍然成功，最後會印 abc；`expect` 並不會檢查是不是數字。若輸入一個空白行再 Enter，也會成功讀取，但 trim 後是空文字。檔案結尾則可能成功回傳讀取零個位元組；它和「讀取失敗」不同，這個簡單框架尚未分開處理 EOF。

## 示例三：trim 不會修改原始資料

```rust
fn main() {
    let text = String::from("  25\n");
    let cleaned = text.trim();
    println!("整理後：{cleaned:?}");
    println!("原始值：{text:?}");
}
```

輸出為整理後的 `"25"`，以及仍含空白與換行的原始值。`String::from` 把給定文字建立為自己擁有的 String；`String::new` 則從空文字開始。trim 去掉兩端的空白，不會把中間所有空白刪除。

## 自我檢核與答案

１．打入 abc，是否一定觸發「讀取失敗」？答案：不會。讀取文字與解析數字是不同工作。

２．input 是 mut，為何還要 &mut？答案：mut 允許變數可變；&mut 是把可修改的借用交給 read_line，讓方法能附加內容。

３．trim 後 input 變短了嗎？答案：沒有，trim 回傳去掉兩端空白的文字檢視，不修改原始 String。

４．重複 read_line 到同一個 input，會自動清空舊文字嗎？答案：不會，read_line 是附加；本課只讀一次，多次輸入要另外決定何時清空。

## 接回原實作

以下先進入 beginner 資料夾；本節只供閱讀：

```sh
cargo run -- lesson 6-1
cargo run -- lesson 6-2
cargo run -- lesson 6
cargo run -- manual 6
cargo run -- run 6
```

原作答仍是 `examples/step06.rs`。先保留固定輸入框架，下一節處理解析結果。這裡尚未建立重試迴圈、分開處理 EOF 或完整的 I/O 錯誤政策。

---

# 6-2：parse 與 match，把文字變成可判斷的結果

本節是補充閱讀，不新增作業或計分。目標是逐行讀懂原第六課的成功、失敗分支；先不用 map_err、closure 或 ? 的簡寫。

## 模型：轉換不是保證成功的動作

`"25"` 是文字，`25.0` 是 f64 數字。`parse::<f64>()` 嘗試把文字解讀成 f64，但 abc、空文字都無法這樣轉換。因此回傳的不是直接的 f64，而是 Result：成功為 `Ok(數字)`，失敗為 `Err(原因)`。

`::<f64>` 指定這次想轉成哪個型別，常被叫作 turbofish 語法。現在只需知道把 f64 放在這個位置，就選擇浮點轉換；不是把文字用符號強制變成成功的數字，也不需要先學會自己寫泛型函式。

## 示例一：同一個 match，走兩種路徑

```rust
fn main() {
    for text in ["25", "abc", ""] {
        match text.parse::<f64>() {
            Ok(number) => println!("成功：{number}"),
            Err(_) => println!("失敗：請輸入數字"),
        }
    }
}
```

輸出依序是成功２５、失敗、失敗。注意成功結果外面的 Ok 是標記，number 才是取出來的 f64 值。

| 原始文字 | parse 的結果形狀 | 選中的分支 | 分支內可用的值 |
|---|---|---|---|
| `"25"` | Ok(25.0) | Ok(number) | number 為２５．０ |
| `"abc"` | Err(解析錯誤) | Err(_) | 這裡刻意忽略錯誤內容 |
| `""` | Err(解析錯誤) | Err(_) | 沒有可換算的數字 |

## 把語法逐段展開

```text
match expression {
    pattern => action,
    another_pattern => another_action,
}
```

match 先計算 expression，再依符合的模式執行一個分支。`=>` 左邊是模式，右邊是這個情況要做的工作。`Ok(c)` 表示這個分支接收成功結果，並把裡面的數值命名為 c。它不是另一個名為 Ok 的換算函式呼叫。

`Err(_)` 的底線是萬用模式，表示「不管錯誤值的內容是什麼，這裡都不要替它取名字」。它沒有把失敗改成成功；只是不顯示技術細節。match 必須處理所有可能情況，所以不能只寫 Ok 分支而省略 Err。

若想觀察原因，可以把 `_` 換成一個名字；分支內需要多行工作時，使用大括號。

## 示例二：先存結果，再拆開

```rust
fn main() {
    let text = " 25 ";
    let cleaned = text.trim();
    let result = cleaned.parse::<f64>();
    match result {
        Ok(c) => {
            let f = c * 9.0 / 5.0 + 32.0;
            println!("{f} F");
        }
        Err(reason) => {
            println!("請輸入數字");
            println!("解析診斷：{reason}");
        }
    }
}
```

預期輸出為 `77 F`，失敗分支不執行。這個展開版與把 trim、parse 接在一起的寫法具有相同的計算順序；先分行能幫助你知道每一步拿到的是文字還是結果。

## 示例三：完整接上標準輸入

```rust
use std::io;

fn main() {
    let mut input = String::new();
    println!("輸入攝氏溫度：");
    io::stdin().read_line(&mut input).expect("讀取失敗");
    match input.trim().parse::<f64>() {
        Ok(c) => {
            let f = c * 9.0 / 5.0 + 32.0;
            println!("{f} F");
        }
        Err(_) => println!("請輸入數字"),
    }
}
```

輸入２５得到 `77 F`；輸入 abc 或空白行得到「請輸入數字」。遇到字母時程式沒有因解析失敗而 panic，因為 Err 已被分支處理。read_line 的 expect 仍只處理另一種情況：讀取本身失敗。這個版本只讀一次，沒有要求使用者一直重試。

## 自我檢核與答案

１．`Ok(c)` 中的 c 是字串還是數字？答案：此處是 f64，因為 parse 指定了 f64。

２．把 Err(_) 改成 Err(error)，一定要顯示 error 嗎？答案：不必；那只是替錯誤值取名，是否輸出由分支決定。

３．為何空白輸入不會被當成０？答案：trim 後是空文字，parse 失敗；沒有任何規則把它當作零。

４．成功解析就代表合理溫度嗎？答案：不一定。f64 也有 NaN、無限大，能解析也不保證換算不超出範圍；原題先練解析分支，有限值與業務規則後面再討論。不要在未修改規格前自行把額外限制當成原題要求。

## 接回原實作

在 beginner 資料夾執行：

```sh
cargo run -- lesson 6-2
cargo run -- lesson 6
cargo run -- manual 6
cargo run -- run 6
```

完成 `examples/step06.rs` 的 match。先用 manual 分別輸入２５與 abc，再用 run 自動驗收。本節沒有教完整 Result API、重試策略或 I/O 錯誤復原。

---

# 第 7 步：所有權與借用

## 閱讀路線

[7-1：所有權、移動與複製](lessons/07-1.md)。終端機：`cargo run -- lesson 7-1`。

[7-2：String、字串借用與字元計數](lessons/07-2.md)。終端機：`cargo run -- lesson 7-2`。

主線實作仍編輯原本的 examples/step07.rs；補充閱讀不增加需要繳交的程式。

## 核心觀念

String 擁有堆積上的文字資料。把 String 傳給另一個變數通常會移動所有權；&String 或 &str 可以借用而不移動。len() 是位元組數，chars().count() 才是 Unicode scalar value 數量，仍不一定等於人眼認知的字元數。

## 起始程式

```rust
fn count(text: String) -> usize { text.chars().count() }
fn main() {
    let name = String::from("Rust");
    let size = count(name);
    // 請保留 name 仍可使用
    println!("字元數：{size}");
}
```

## 動手練習

將 count 改成接收 &str，並在計算後輸出原始 name。先嘗試直接輸出已被移動的 name，閱讀編譯器提示。

自動驗收：`cargo run -- run 7`。手動執行：`cargo run -- manual 7`。

## 提示

函式參數改成 text: &str，呼叫改成 count(&name)。

## 預期結果

```text
Rust：4
```

驗收：Rust 得到 4；物理 得到 2，且原始字串可繼續使用。

## 參考答案

```rust
fn count(text: &str) -> usize { text.chars().count() }
fn main() {
    let name = String::from("Rust");
    let size = count(&name);
    println!("{name}：{size}");
}
```

自我解釋：你改了哪裡？為什麼這樣寫？哪個邊界案例最容易漏掉？

---

# 7-1：所有權、move、Copy 與 clone

本節是補充閱讀，不另出題或計分。先理解為何一個名字突然不能用了，再學第七課如何借用。

## 模型：變數名字與資源不是同一件事

String 可以擁有一塊文字資料的配置與釋放責任。把 String 指派給另一個名字，通常轉移的是這個擁有關係，不是自動建立第二份文字。新的所有者負責資料，舊名字不能再拿來使用這個已移動的值。這種轉移叫 move。

```text
before: first -> owned text
move:   second -> same owned text
        first can no longer be used
```

這個模型讓程式清楚知道誰負責資源，避免把一份文字當成有兩個互不相干的釋放責任。實際配置策略可留到進階課；這裡不必畫出所有機器位址，也不用生命週期標註。

## 示例一：String 移動到新名字

```rust
fn main() {
    let first = String::from("Rust");
    let second = first;
    println!("新所有者：{second}");
}
```

程式成功輸出「新所有者：Rust」。移動後 first 這個名字雖仍寫在原始碼裡，卻不再能讀取那個值。

下例預期無法編譯，目的是觀察 moved value 的診斷：

```compile_fail
fn main() {
    let first = String::from("Rust");
    let second = first;
    println!("{first} / {second}");
}
```

不要為了讓這個失敗示例能跑而改掉所有權模型；先指出哪一行轉移，再指出哪一行違反規則。

## 示例二：i32 的 Copy 行為

```rust
fn main() {
    let first: i32 = 25;
    let mut second = first;
    second += 1;
    println!("{first} / {second}");
}
```

輸出 `25 / 26`。i32 支援 Copy：這次指派複製數值，兩個名字都可以繼續使用；改變 second 不會改變 first。不能從這個例子推論「所有 Rust 型別都會 Copy」；String 就不是。

| 操作 | String | i32 |
|---|---|---|
| `let b = a;` | 移動值，a 之後不能再使用該值 | 複製值，a 仍可使用 |
| 修改 b | 先確保 b 可變 | 只改變 b 的數值 |
| 需要另一份獨立文字 | 明確 clone | 普通指派已能複製數值 |

## 示例三：clone 是明確要求另一份內容

```rust
fn main() {
    let original = String::from("Rust");
    let mut copied = original.clone();
    copied.push_str(" language");
    println!("原本：{original}");
    println!("副本：{copied}");
}
```

輸出原本的 Rust 與副本的 Rust language。clone 不是把 old name 交給新名字，而是建立可獨立修改的 String。它可能涉及配置與複製成本，所以「哪裡有錯就加 clone」不是好的預設；若只是讀文字，第七課可以借用而不複製。

## 移動也會發生在函式呼叫

原第七課的 `fn count(text: String)` 宣告「接收一個擁有文字的 String 值」。因此 `count(name)` 會把 name 的值移進函式。步驟是：main 擁有文字、呼叫時轉移給 text、函式結束時 text 的值離開作用域。main 不能假裝還擁有原來的 name。

解法方向有兩個：若確實要另存一份，clone；若只要讀取原有文字，改成借用。下一節說明為何 count 適合接收 &str。

## 自我檢核與答案

１．String 移動後，文字內容一定被複製兩次嗎？答案：沒有；move 表示所有權轉移，不等於 clone。

２．`let b = a;` 是否永遠讓 a 失效？答案：不一定，取決於型別。i32 是 Copy，String 不是。

３．count 只數字元，是否一定要 clone？答案：不需要；借用通常更符合只讀的需求。

４．clone 後修改 copied，original 會跟著變嗎？答案：上面的 String 範例不會，兩份文字可獨立修改。

## 接回原實作

在 beginner 資料夾執行：

```sh
cargo run -- lesson 7-1
cargo run -- lesson 7-2
cargo run -- lesson 7
cargo run -- manual 7
cargo run -- run 7
```

原作答為 `examples/step07.rs`。先嘗試觀察原函式移動 name 的編譯錯誤，再用下一節的只讀借用完成。這裡不涵蓋自訂 Copy 型別、Drop 實作、共享所有權或生命週期標註。

---

# 7-2：String、&String、&str 與文字長度

本節是補充閱讀，不新增作業或計分。把文字的擁有方式、借看方式與長度單位分開，才能解釋原第七課的答案。

## 三種名字，三種角色

| 型別 | 可以先怎麼理解 | 常見來源 |
|---|---|---|
| String | 自己擁有 UTF-8 文字內容 | `String::new()`、`String::from("Rust")` |
| &String | 暫時借看某個 String 物件 | String 變數前加 `&` |
| &str | 借看一段有效 UTF-8 文字 | 字串常值、String 的文字切片 |

雙引號字串常值在這裡的型別是 &str；它不是需要先用 String 才能存在。`String::from("Rust")` 則建立自己擁有內容的 String。`&` 讀作借用：讓另一段程式讀資料，同時不把擁有責任交出去。

## 示例一：同一個只讀函式接受不同來源

```rust
fn count(text: &str) -> usize {
    text.chars().count()
}

fn main() {
    let owned = String::from("Rust");
    let borrowed: &String = &owned;
    let literal: &str = "物理";
    println!("{}", count(borrowed));
    println!("{}", count(literal));
    println!("原文字仍在：{owned}");
}
```

輸出為４、２，以及原文字仍在。count 要的是 &str，不要求呼叫者必須擁有 String。把 &String 傳到預期 &str 的參數位置時，Rust 可自動把它轉成對 String 內容的文字借用。這是一種由型別提供的借用轉換，不代表所有型別前加 & 都能轉成任何參數型別。

所以原題 `count(&name)` 可以接到 `fn count(text: &str)`。也能更明確寫 `count(name.as_str())`，但兩者都沒有把 name 移進函式。對只需要讀文字的參數，&str 通常比 &String 接受更多合理來源。

## 示例二：明確取得 String 的文字檢視

```rust
fn main() {
    let name = String::from("Rust");
    let text: &str = name.as_str();
    println!("借看的內容：{text}");
    println!("所有者的內容：{name}");
}
```

把時間順序列出：name 建立並擁有內容；text 借看內容；輸出 text；再輸出 name。沒有為 text 建立另一份文字，所以它不是 clone。借用能使用的時間必須受到所有者有效性的限制；目前先遵守「不要讓借用跑到所有者已不存在之後」，進階再學編譯器如何追蹤。

## usize 是什麼單位？

`usize` 是用於長度、數量和索引的無號整數型別，大小依目標平台而定。它不是浮點數，也不等於「字元專用型別」。本題 count 的回傳值是數量，因此使用 usize；不需現在背誦每個平台的位元數。

同一段 UTF-8 文字可能有幾種不同的長度問題：佔幾個位元組、有幾個 Unicode scalar value、人眼看成幾個字。這些不是同一個量。

## 示例三：位元組數與 scalar 數量

```rust
fn main() {
    for text in ["Rust", "物理", "e\u{301}"] {
        let bytes: usize = text.len();
        let scalars: usize = text.chars().count();
        println!("{text:?}: bytes={bytes}, scalars={scalars}");
    }
}
```

| 文字 | UTF-8 位元組數 | chars().count() | 觀察 |
|---|---|---|---|
| Rust | ４ | ４ | ASCII 字母在此剛好一對一 |
| 物理 | ６ | ２ | 每個中文字在此使用三個位元組 |
| e 加組合重音 | ３ | ２ | 通常顯示成一個帶重音字，但由兩個 scalar 組成 |

程式中的 `\u{301}` 指定 Unicode 組合重音；不用現在背轉義碼，這個例子只是證明「chars 數量一定等於人眼字數」並不成立。本課 count 的規格是 Unicode scalar value 數，不是斷詞或人眼字元的完整分析。

## 自我檢核與答案

１．為何 count(&name) 後 name 仍可輸出？答案：傳入的是只讀借用，沒有移動 String 的所有權。

２．&str 是否一定來自 String？答案：不是，字串常值也是一種來源。

３．「物理」的 len 是否為２？答案：不是，這裡 len 是 UTF-8 位元組數６；chars().count() 才為２。

４．把 `.chars().count()` 改成 `.len()`，Rust 英文測試仍會通過，是否足夠？答案：不夠，只有 ASCII 例子看不出單位錯誤；中文與組合字能揭露差異。

## 接回原實作

在 beginner 資料夾執行：

```sh
cargo run -- lesson 7-2
cargo run -- lesson 7
cargo run -- manual 7
cargo run -- run 7
```

回到 `examples/step07.rs`，把參數改為 &str，呼叫時借用 name，並保留原文字輸出。尚未涵蓋可變文字借用、任意字串索引、grapheme segmentation 或生命週期標註。

---

# 第 8 步：Vec 與 Option

## 閱讀路線

[8-1：陣列、Vec與切片](lessons/08-1.md)。終端機：`cargo run -- lesson 8-1`。

[8-2：Option如何表達有值與無值](lessons/08-2.md)。終端機：`cargo run -- lesson 8-2`。

[8-3：先for累加，再轉型與除法，最後比較iterator簡寫](lessons/08-3.md)。終端機：`cargo run -- lesson 8-3`。

主線實作仍編輯原本的 examples/step08.rs；補充閱讀不增加需要繳交的程式。

## 核心觀念

Vec<T> 是可變長度集合。&[i32] 是借用的整數切片。空集合沒有平均值，Option<f64> 以 Some(value) 或 None 表達；不要用 0 假裝沒有資料。

## 起始程式

```rust
fn average(scores: &[i32]) -> Option<f64> {
    None // 實作空集合與平均值
}
fn main() {
    let scores = vec![60, 80, 100];
    println!("{:?}", average(&scores));
}
```

## 動手練習

完成平均值函式；空切片回傳 None，其餘回傳 Some。用浮點除法避免截斷。

自動驗收：`cargo run -- run 8`。手動執行：`cargo run -- manual 8`。

## 提示

先判斷空集合，非空時用已學的 for 逐項累加，再把總和與筆數轉成 f64 相除。8-3 先展示完整步驟，再對照參考答案的 iter().sum::<i32>() 簡寫。分數限 0 到 100，資料量限班級規模。

## 預期結果

```text
Some(80.0)
```

驗收：空集合：None；[60, 80, 100]：Some(80.0)；[60, 61]：Some(60.5)。

## 參考答案

```rust
fn average(scores: &[i32]) -> Option<f64> {
    if scores.is_empty() { return None; }
    Some(scores.iter().sum::<i32>() as f64 / scores.len() as f64)
}
fn main() {
    let scores = vec![60, 80, 100];
    println!("{:?}", average(&scores));
}
```

自我解釋：你改了哪裡？為什麼這樣寫？哪個邊界案例最容易漏掉？

---

# 8-1：陣列、Vec 與切片，分清容器和借用

本節是補充閱讀，不新增作業或計分。４－７已用過陣列與 iter；現在把固定長度、可變長度與通用讀取介面連起來。

## 模型：資料放在哪裡，與函式怎麼讀，是兩件事

| 寫法 | 角色 | 長度的意義 |
|---|---|---|
| `[i32; 3]` | 擁有三個 i32 的陣列型別 | 長度３是型別的一部分 |
| `Vec<i32>` | 擁有一串 i32 的可變長度集合 | 可在執行時增減元素 |
| `&[i32]` | 借看一段 i32 序列的切片 | 長度由這次借用所指的內容決定 |

「固定長度」不代表陣列的值不能改；「可變長度」也不代表不寫 mut 就能修改。型別決定能做哪些事，變數是否允許修改還要看 mut。

`Vec<i32>` 的角括號表示這個 Vec 存的是 i32；不是小於、大於比較式。先會讀懂具體型別即可，不要求現在自己定義泛型容器。`vec![...]` 是建立 Vec 的巨集；`[...]` 沒有 vec! 則建立陣列。

## 示例一：陣列能改元素，但不能多塞一項

```rust
fn main() {
    let mut scores: [i32; 3] = [60, 80, 100];
    scores[0] = 70;
    println!("{scores:?}");
    println!("長度：{}", scores.len());
}
```

索引從０開始，`scores[0]` 指第一個元素。輸出為 `[70, 80, 100]`，長度仍是３。此處只使用已知存在的第０項；超出範圍的索引會 panic，讀取前不能憑空假設一定有某個位置。

## 示例二：Vec 可改變長度

```rust
fn main() {
    let mut scores = vec![60, 80];
    println!("加入前：{}", scores.len());
    scores.push(100);
    println!("加入後：{}", scores.len());
    println!("{scores:?}");
}
```

逐步追蹤：

| 步驟 | 內容 | len |
|---|---|---|
| 建立 Vec | ６０、８０ | ２ |
| push(100) | ６０、８０、１００ | ３ |

`push` 在尾端加入一項，必須有可修改的 Vec；它沒有把原有元素改成另一種型別。本課的平均值函式只需讀，不需要 push。

## 示例三：同一個切片函式接收兩種容器

```rust
fn describe(scores: &[i32]) {
    println!("長度：{}，是空的：{}", scores.len(), scores.is_empty());
}

fn main() {
    let array = [60, 80, 100];
    let vector = vec![70, 90];
    describe(&array);
    describe(&vector);
    describe(&[]);
    println!("原陣列：{array:?}");
    println!("原 Vec：{vector:?}");
}
```

三次輸出依序為長度３／false、長度２／false、長度０／true。`&array`、`&vector` 都可在這個參數位置轉成對序列的切片借用。函式只需要元素與長度，不必要求資料一定是 Vec；原本容器也沒有被移進函式。

`is_empty()` 回答是否沒有元素，型別是 bool；`len()` 回傳元素個數，型別是 usize。空切片不是不存在的變數，而是長度為０的有效序列。這個例子的 describe(&[]) 已有參數型別可推論元素是 i32，不需要另寫空陣列型別。

## 自我檢核與答案

１．把陣列寫成 mut，可以 push 變長嗎？答案：不能。mut 允許改值，不會替固定長度陣列增加 Vec 的能力。

２．`Vec<i32>` 裡可再放一段文字嗎？答案：不能，這個集合的元素型別是 i32。

３．average 只讀分數，參數用 &[i32] 有什麼好處？答案：可以借看陣列或 Vec，不需要取得容器所有權，也不把呼叫者限制成某一種容器。

４．len 為０時一定是錯誤嗎？答案：容器本身仍有效；平均值這個問題是否有定義，要由函式契約決定，下一節用 Option 表達。

## 接回原實作

在 beginner 資料夾執行：

```sh
cargo run -- lesson 8-1
cargo run -- lesson 8-2
cargo run -- lesson 8
cargo run -- manual 8
cargo run -- run 8
```

原作答為 `examples/step08.rs`。先保留 `fn average(scores: &[i32])` 這個只讀介面，再討論回傳型別。這裡尚未涵蓋容量、重新配置、切片索引範圍或 Vec 的完整 API。

---

# 8-2：Option，讓沒有答案也成為明確結果

本節是補充閱讀，不新增作業或計分。上一節已有可能為空的切片，現在決定函式該如何告訴呼叫者「這次沒有平均值」。

## 模型：數值零與沒有數值不同

一份分數全為０，平均值是０；一份根本沒有分數的資料，平均值沒有定義。若兩者都回傳０，呼叫者就失去區分能力。

`Option<f64>` 表示「可能有一個 f64，也可能沒有」。兩種情況是 `Some(value)` 與 `None`：Some 裡裝一個值，None 不裝任何值。尖括號中的 f64 告訴你有值時的型別。None 不是另一個拼法的０，也不是某個隱藏的浮點數。

```text
Option<f64>
  Some(0.0) -> a real numeric result
  None      -> no numeric result
```

## 示例一：分開顯示有值與無值

```rust
fn show(result: Option<f64>) {
    match result {
        Some(value) => println!("數值：{value}"),
        None => println!("目前沒有資料"),
    }
}

fn main() {
    show(Some(0.0));
    show(Some(80.0));
    show(None);
}
```

輸出依序為數值０、數值８０、目前沒有資料。match 的讀法沿用第六課：Some(value) 拆出裡面的數字；None 是另一種沒有攜帶數值的情況。處理兩種分支，比假設永遠有資料更清楚。

## 示例二：從可能為空的切片取第一筆

```rust
fn first_score(scores: &[i32]) -> Option<i32> {
    if scores.is_empty() {
        None
    } else {
        Some(scores[0])
    }
}

fn main() {
    println!("{:?}", first_score(&[0, 80]));
    println!("{:?}", first_score(&[]));
}
```

預期先印 `Some(0)`，再印 `None`。參數的 &[i32] 型別，讓編譯器知道空陣列的元素應為 i32。

先檢查空資料，才可以安全地讀取第０項。第一筆值為０時回傳 Some(0)，空切片時回傳 None。此函式只示範 Option，不是拿第一筆充當平均值。

## 示例三：使用已知的 Option 值，而不是猜 None 等於零

```rust
fn main() {
    let with_data: Option<f64> = Some(0.0);
    let without_data: Option<f64> = None;
    println!("偵錯顯示：{with_data:?} / {without_data:?}");
    match without_data {
        Some(value) => println!("平均值：{value}"),
        None => println!("請先提供分數"),
    }
}
```

`{:?}` 的偵錯輸出可直接看見 `Some(0.0)` 與 `None` 的外形；真正要呈現給使用者的訊息，可以像後面的 match 自己決定。

| 回傳結果 | 表達的事實 | 呼叫者能否當作 f64 計算 |
|---|---|---|
| Some(80.0) | 有平均值８０ | 先用模式取出數值，再計算 |
| Some(0.0) | 有平均值０ | 同樣先取出數值 |
| None | 沒有平均值 | 沒有數字可取，應走另一個分支 |

## 自我檢核與答案

１．所有分數都０，應回傳 None 嗎？答案：不應，資料存在而且平均值為０，應回傳 Some(0.0)。

２．空資料回傳 Some(0.0)，會丟掉什麼資訊？答案：無法和真的平均為０區分。

３．為什麼不能只寫 Some 分支？答案：Option 的另一種合法狀態就是 None，match 必須完整處理。

４．Option 是否一定表示發生錯誤？答案：不一定，它表達有值或無值；本題把空資料定義為沒有平均值。需要失敗原因時，後面才學 Result。

## 接回原實作

在 beginner 資料夾執行：

```sh
cargo run -- lesson 8-2
cargo run -- lesson 8-3
cargo run -- lesson 8
cargo run -- manual 8
cargo run -- run 8
```

原函式 `average` 的契約是空資料回傳 None，其餘回傳 Some(平均值)。下一節把計算逐步寫出來。本節不使用 unwrap 或 ? 捷徑，也不介紹 Option 的完整方法清單。

---

# 8-3：平均值，先看懂每一步，再讀懂迭代器簡寫

本節是補充閱讀，不新增作業或計分。原題的分數範圍為０到１００，資料量為班級規模；以下依這個範圍學習，不把函式另外改成處理任意巨大整數集合的契約。

## 模型：空資料先決定，有資料才相除

平均值是總分除以筆數。流程可以拆成：檢查有沒有資料、累加總分、取得筆數、把兩者轉為浮點數、相除、用 Some 包起來。

先檢查空資料，不只是避免計算問題，也是兌現回傳 None 的介面承諾。若資料存在但全為０，仍然走正常計算並得到 Some(0.0)。

## 示例一：完整 for 版本

```rust
fn average(scores: &[i32]) -> Option<f64> {
    if scores.is_empty() {
        return None;
    }
    let mut total: i32 = 0;
    for score in scores {
        total += *score;
    }
    let count = scores.len();
    let value = total as f64 / count as f64;
    Some(value)
}

fn main() {
    println!("{:?}", average(&[60, 61]));
    println!("{:?}", average(&[0, 0]));
    println!("{:?}", average(&[]));
}
```

輸出依序是 `Some(60.5)`、`Some(0.0)`、`None`。走訪借用切片時，score 是某個 i32 的借用；這裡 `*score` 讀出它指向的 i32 數值，不是乘法，也沒有取得容器的所有權。i32 支援 Copy，因此這種讀取可供加總。

| 步驟 | 處理的值 | total | count／結果 |
|---|---|---|---|
| 開始 | `[60, 61]` 不為空 | ０ | 尚未相除 |
| 第一輪 | ６０ | ６０ | 繼續 |
| 第二輪 | ６１ | １２１ | 兩筆 |
| 轉型相除 | １２１．０／２．０ | 不再改變 | ６０．５ |
| 回傳 | Some(60.5) | — | 有數值的結果 |

## return 與最後一行不是同一個位置

`return None;` 表示立即離開目前函式；空資料不會繼續走到 total 或除法。這和迴圈的 break 不同，break 只離開最近一層迴圈。

最後的 `Some(value)` 不加分號，則是這個函式正常走到底時的回傳表達式。兩個出口都符合 Option<f64>：一個是 None，另一個是包著 f64 的 Some。若把最後一行改成只有帶分號的敘述，這個函式就無法回傳宣告的型別。

## 示例二：先轉型，才能保留小數

```rust
fn main() {
    let total: i32 = 121;
    let count: usize = 2;
    let integer_result = total / count as i32;
    let floating_result = total as f64 / count as f64;
    println!("整數除法：{integer_result}");
    println!("浮點除法：{floating_result}");
}
```

輸出為整數除法６０、浮點除法６０．５。`as f64` 把此處的整數值轉成 f64；它不是告訴 println 多印幾位小數。若先做整數除法，已失去的小數不會因為事後轉型而回來。

一般型別轉換可能損失資訊；非常大的整數也未必能被 f64 精確表示。此處依原題的小分數與班級規模範圍教學，沒有把 `as` 說成任何情況都安全的萬用轉換。

## 示例三：對照 iter().sum 的簡寫

```rust
fn average(scores: &[i32]) -> Option<f64> {
    if scores.is_empty() {
        return None;
    }
    let total = scores.iter().sum::<i32>();
    Some(total as f64 / scores.len() as f64)
}

fn main() {
    println!("{:?}", average(&[60, 80, 100]));
    println!("{:?}", average(&[]));
}
```

輸出為 `Some(80.0)`、`None`。這裡 iter 依序借看每個分數，sum 將這些值加總，`::<i32>` 明確指定加總結果型別。它與第六課 `parse::<f64>()` 一樣，是在呼叫位置指定型別的使用方式，但兩個方法的工作不同：parse 解析文字，sum 加總序列。

這個簡寫把逐項累加的工作交給 iterator 方法，不是憑空跳過資料；仍須處理每筆分數。先能解釋 for 版本，再選擇自己讀得懂的寫法。原題不強迫使用 sum，符合契約的 for 實作同樣合理。

## 自我檢核與答案

１．為何 count 是 usize、total 是 i32，仍可相除？答案：先分別轉為 f64，再以相同數值型別運算。

２．先算 `121 / 2` 再轉型，會變成６０．５嗎？答案：不會，整數除法已得到６０，之後轉為 f64 仍是６０．０。

３．return None 後面的累加會不會執行？答案：同一次函式呼叫不會，return 已離開函式。

４．空切片的 sum 可為０，是否代表平均值也該為０？答案：不代表，總和與平均值的數學定義不同；本題仍須先回傳 None。

５．sum::<i32> 是否保證任意多筆整數都不溢位？答案：沒有；原題限定分數與資料規模，不能把它擴大宣稱為任意輸入都安全。

## 接回原實作

在 beginner 資料夾執行：

```sh
cargo run -- lesson 8-3
cargo run -- lesson 8
cargo run -- manual 8
cargo run -- run 8
```

完成 `examples/step08.rs`。先以 `[60, 61]`、`[0, 0]`、空資料確認契約，再做自動驗收。這裡不涵蓋任意規模加總、防溢位 API、浮點誤差分析或自行定義泛型 iterator。

---

# 第 9 步：結構與方法

## 閱讀路線

[9-1：資料型別、實例、欄位與方法的關係](lessons/09-1.md)。終端機：`cargo run -- lesson 9-1`。

主線實作仍編輯原本的 examples/step09.rs；補充閱讀不增加需要繳交的程式。

## 核心觀念

struct 將相關資料放在一起，impl 定義方法。&self 借用目前的物件。欄位名稱可讓物理量的意義比一堆位置參數更清楚。

## 起始程式

```rust
struct Motion { distance: f64, time: f64 }
impl Motion {
    fn speed(&self) -> f64 { 0.0 }
}
fn main() {
    let m = Motion { distance: 120.0, time: 10.0 };
    println!("{} m/s", m.speed());
}
```

## 動手練習

完成 Motion::speed，並檢查時間為正。新增第二筆 50 公尺、5 秒的資料。

自動驗收：`cargo run -- run 9`。手動執行：`cargo run -- manual 9`。

## 提示

方法中使用 self.distance 與 self.time。

## 預期結果

```text
12 m/s
10 m/s
```

驗收：兩筆分別為 12 與 10 m/s；零秒應觸發 assertion。

## 參考答案

```rust
struct Motion { distance: f64, time: f64 }
impl Motion {
    fn speed(&self) -> f64 {
        assert!(self.time > 0.0);
        self.distance / self.time
    }
}
fn main() {
    for m in [Motion { distance: 120.0, time: 10.0 }, Motion { distance: 50.0, time: 5.0 }] {
        println!("{} m/s", m.speed());
    }
}
```

自我解釋：你改了哪裡？為什麼這樣寫？哪個邊界案例最容易漏掉？

---

# 9-1：從兩個參數到一筆資料與方法

第九課不是只要背 struct 和 impl，而是把「哪些值屬於同一筆資料」與「對這筆資料做什麼」表達清楚。

## 先定義資料，再建立一筆實例

```rust
struct Motion { distance: f64, time: f64 }
fn main() {
    let first = Motion { distance: 120.0, time: 10.0 };
    let second = Motion { distance: 50.0, time: 5.0 };
    println!("第一筆位移={}，第二筆時間={}", first.distance, second.time);
}
```

Motion 是資料型別的名稱；first、second 才是各自的實例。型別定義不會自動建立一筆運動。建立時用欄位名稱填入數值，存取時用 實例.欄位。這比兩個平行陣列各存位移與時間，更能保留一筆資料的對應關係。

## 先用普通函式處理資料

```rust
struct Motion { distance: f64, time: f64 }
fn speed(motion: &Motion) -> f64 {
    assert!(motion.time > 0.0);
    motion.distance / motion.time
}
fn main() {
    let record = Motion { distance: 120.0, time: 10.0 };
    println!("{} m/s", speed(&record));
    println!("仍可讀時間：{}", record.time);
}
```

&Motion 表示借看這筆資料，函式不需要取得整個物件的所有權；呼叫後仍可用 record。這延續第七課借用，不是另一套互不相關的規則。

## 再把操作移到 impl 中

```rust
struct Motion { distance: f64, time: f64 }
impl Motion {
    fn speed(&self) -> f64 {
        assert!(self.time > 0.0);
        self.distance / self.time
    }
}
fn main() {
    let record = Motion { distance: 120.0, time: 10.0 };
    println!("{} m/s", record.speed());
    println!("{} m/s", Motion::speed(&record));
}
```

impl Motion 是替這個型別定義相關操作。&self 可理解為 self: &Motion，self 代表這次呼叫的那筆資料。record.speed() 會把 record 作為方法接收者，不是憑空多出第三個速度參數；同一個方法也能用 Motion::speed(&record) 呼叫。

這裡只介紹借用 self。若改成 self，會有取得所有權的不同效果；若要修改欄位，則需討論 &mut self，先不要只靠刪掉符號讓編譯器安靜。

自我檢核：first.time 和 second.time 是同一個位置嗎？不是，每個實例各有資料。impl 內為什麼用 self.time？因為要讀這次呼叫的實例。可以只建立型別、不建立任何實例嗎？可以，但沒有一筆資料可供這個方法計算。

回到 cargo run -- lesson 9。先手算兩筆結果，再完成方法並用 run 9 驗收。

原始資料：[結構](https://doc.rust-lang.org/book/ch05-01-defining-structs.html)、[方法](https://doc.rust-lang.org/book/ch05-03-method-syntax.html)。

---

# 第 10 步：Result 與可恢復錯誤

## 閱讀路線

[10-1：先用match完整表達Result錯誤流程](lessons/10-1.md)。終端機：`cargo run -- lesson 10-1`。

[10-2：再讀?、map_err與閉包的等價改寫](lessons/10-2.md)。終端機：`cargo run -- lesson 10-2`。

主線實作仍編輯原本的 examples/step10.rs；補充閱讀不增加需要繳交的程式。

## 核心觀念

Result<T, E> 用 Ok 傳成功值，用 Err 傳失敗原因。? 會在 Err 時提早回傳；呼叫者可以決定如何顯示錯誤。is_finite 排除 NaN 與無限大。

## 起始程式

```rust
fn parse_time(text: &str) -> Result<f64, String> {
    Err(String::from("尚未完成"))
}
fn main() { println!("{:?}", parse_time("2.5")); }
```

## 動手練習

把文字轉成正且有限的秒數；拒絕 0、負數、abc、NaN、inf。

自動驗收：`cargo run -- run 10`。手動執行：`cargo run -- manual 10`。

## 提示

先照10-1以match分別處理解析成功／失敗，再檢查時間有限且為正；完成後，讀10-2比較參考答案的map_err與?簡寫。無須強制使用簡寫才能通過驗收。

## 預期結果

```text
Ok(2.5)
```

驗收：2.5 成功；0、-1、abc、NaN、inf 失敗。

## 參考答案

```rust
fn parse_time(text: &str) -> Result<f64, String> {
    let t = text.trim().parse::<f64>().map_err(|_| String::from("不是數字"))?;
    if !t.is_finite() || t <= 0.0 { return Err(String::from("時間必須為有限正數")); }
    Ok(t)
}
fn main() { println!("{:?}", parse_time("2.5")); }
```

自我解釋：你改了哪裡？為什麼這樣寫？哪個邊界案例最容易漏掉？

---

# 10-1：用 Result 與完整 match 表達成功和失敗

## 為什麼需要這一節

第六課已經看過 Ok／Err，但輸入程式很容易變成固定模板。本節先不使用問號或閉包，直接追蹤「解析失敗如何回到呼叫者」。先備是函式、match、String，以及第七課的借用。這是補充閱讀，不新增作答檔或評分。

## 把回傳值想成兩條明確的路

Result<T, E> 表示一次呼叫可能成功，也可能失敗。T 是成功內容的型別，E 是錯誤內容的型別。例如 Result<f64, String>：成功時是 Ok(2.5)，失敗時是 Err(一段擁有的文字)。Ok／Err 不是印出的提示文字，而是程式可以判斷、取出內容的不同狀態。

讀取錯誤、文字不是數字，以及數字不符合領域要求，是不同層次。本題只處理傳入文字，不在函式內讀鍵盤；成功解析成 f64 也不代表它一定是可用的時間。

## 範例一：先看清解析函式本來回傳什麼

```rust
fn main() {
    for text in ["2.5", "abc"] {
        let parsed = text.parse::<f64>();
        match parsed {
            Ok(value) => println!("數值：{value}"),
            Err(error) => println!("解析失敗：{error}"),
        }
    }
}
```

第一筆走 Ok 分支，印出數值２．５；第二筆走 Err 分支，印出解析失敗與標準函式庫提供的原因。錯誤文案的細節不應當成這個函式對所有版本的固定承諾。

這裡 parse 的錯誤內容是標準函式庫的 ParseFloatError，不是 String。若我們的 API 宣告回傳 Result<f64, String>，就要明確決定如何把這個解析錯誤表示成 String，不能因為兩者都叫 Err 就假設內容型別相同。

## 範例二：把所有失敗都寫成看得見的 return

```rust
fn parse_time(text: &str) -> Result<f64, String> {
    let time = match text.trim().parse::<f64>() {
        Ok(value) => value,
        Err(_) => return Err(String::from("不是數字")),
    };
    if !time.is_finite() {
        return Err(String::from("時間必須有限"));
    }
    if time <= 0.0 {
        return Err(String::from("時間必須為正"));
    }
    Ok(time)
}
fn main() {
    for text in [" 2.5 ", "abc", "0", "NaN"] {
        match parse_time(text) {
            Ok(time) => println!("可用時間：{time}"),
            Err(message) => println!("無法使用：{message}"),
        }
    }
}
```

`Ok(value) => value` 把成功內容取出，交給外面的 time。`Err(_)` 的底線表示不綁定原本的錯誤內容，本例改用自己選定的文字。`return Err(...)` 立即結束 parse_time，不會再執行後續時間檢查。

| 輸入 | 數字解析 | 領域檢查 | 最後結果 |
| --- | --- | --- | --- |
| ` 2.5 ` | Ok(2.5) | 有限且正 | Ok(2.5) |
| `abc` | Err | 不再執行 | Err，不是數字 |
| `0` | Ok(0.0) | 不是正數 | Err，時間必須為正 |
| `NaN` | 可解析為特殊浮點值 | 不是有限數 | Err，時間必須有限 |

兩個 Err 分支都回傳同一個錯誤型別 String，但訊息可以不同。回傳 Err 不會自動印字，也不會自動讓整個應用程式停止；上面的 main 選擇把訊息印出，然後處理下一筆。

## 與 assert! 的責任差異

5-1 用 assert! 表達程式呼叫的前置條件，錯誤會 panic。此處使用者打錯文字是預期會發生的情況，Result 讓外層決定顯示訊息、重試或停止。不要在 parse_time 裡用 expect 取代需要處理的外部資料錯誤。

## 自我檢核與答案

１．為什麼 `abc` 不會再檢查 time 是否大於零？因為 Err 分支已 return，函式結束。
２．為什麼 `NaN` 需要另外檢查？能解析成浮點值，不等於符合「有限正時間」的領域要求。
３．Err 的型別由哪裡決定？函式簽名中的 E；本題是 String，不是任何錯誤值都能直接放入。

回到原實作：`cargo run -- lesson 10`，編輯 examples/step10.rs，以 `cargo run -- run 10` 驗收。先用本節完整 match 寫對，再閱讀 10-2 的簡寫。

官方閱讀：[Result 錯誤處理](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html)。

---

# 10-2：從 match 走到 ?、map_err 與閉包

## 先確定你知道簡寫省略了什麼

先讀 10-1 的完整 match，再讀本節。目標是能把簡寫還原成控制流程，不是記住一串符號。這是補充閱讀，仍使用原本第十課的作答與驗收。

## 範例一：? 只省略錯誤傳遞的分支

```rust
fn positive_with_match(text: &str) -> Result<f64, String> {
    let parsed = match text.parse::<f64>() {
        Ok(value) => Ok(value),
        Err(_) => Err(String::from("不是數字")),
    };
    let time = match parsed {
        Ok(value) => value,
        Err(message) => return Err(message),
    };
    if !time.is_finite() || time <= 0.0 {
        return Err(String::from("時間必須為有限正數"));
    }
    Ok(time)
}
fn positive_with_question(text: &str) -> Result<f64, String> {
    let parsed = match text.parse::<f64>() {
        Ok(value) => Ok(value),
        Err(_) => Err(String::from("不是數字")),
    };
    let time = parsed?;
    if !time.is_finite() || time <= 0.0 {
        return Err(String::from("時間必須為有限正數"));
    }
    Ok(time)
}
fn main() {
    for text in ["2.5", "abc", "0", "inf"] {
        assert_eq!(positive_with_match(text), positive_with_question(text));
    }
    println!("兩個版本的結果一致");
}
```

兩版只有「取出成功值，否則提前回傳錯誤」那段不同。? 遇到 Ok 就取得內容；遇到 Err 則把錯誤傳出去，不是忽略它。當錯誤型別不同時，? 需要可用的錯誤型別轉換；不能任意把 ParseFloatError 放入宣告為 String 的錯誤位置。

? 也不是任何 main 都能隨意使用。先把它放在回傳相容 Result 的函式中，如本題的 parse_time；不要在沒有回傳 Result 的普通函式裡硬加問號。

## 範例二：把錯誤改寫成自己的訊息

```rust
fn parse_time(text: &str) -> Result<f64, String> {
    let time = text.trim().parse::<f64>()
        .map_err(|_| String::from("不是數字"))?;
    if !time.is_finite() || time <= 0.0 {
        return Err(String::from("時間必須為有限正數"));
    }
    Ok(time)
}
fn main() {
    assert_eq!(parse_time(" 2.5 "), Ok(2.5));
    assert_eq!(parse_time("abc"), Err(String::from("不是數字")));
    for text in ["0", "-1", "NaN", "inf"] {
        assert!(parse_time(text).is_err());
    }
    println!("解析與時間檢查完成");
}
```

逐段讀取這一行：

| 片段 | 工作 |
| --- | --- |
| `text.trim()` | 借看去掉兩端空白的文字 |
| `.parse::<f64>()` | 嘗試轉成 f64，得到 Result |
| `.map_err(...)` | 成功內容不動；失敗時改寫錯誤內容 |
| `|_| String::from(...)` | 一個短小的匿名函式，接到原錯誤但不使用它，產生 String |
| `?` | 成功則取出 f64；失敗則提早回傳新的 Err |

`|參數| 表達式` 是閉包的基本形式。這裡的 `_` 是不綁定參數的模式，不是減號，也不代表未知型別。本例閉包只需要轉換錯誤，還不需要學閉包捕捉周圍變數的進階規則。

## 否定、或與短路

`!time.is_finite() || time <= 0.0` 表示「不是有限數，或不是正數」。左側為 true 時，|| 已能確定整個條件成立，不再計算右側，稱為短路。不要把 ! 與巨集名稱結尾的驚嘆號混在一起：這裡 ! 是布林否定。

| time | is_finite | !is_finite | <= 0 | 是否拒絕 |
| --- | --- | --- | --- | --- |
| 2.5 | true | false | false | 否 |
| 0 | true | false | true | 是 |
| inf | false | true | 不需計算 | 是 |
| NaN | false | true | 不需計算 | 是 |

is_finite 同時排除 NaN 與正負無限大。NaN 不適合用一般大小或相等比較來判定；先檢查有限性，才能把它納入拒絕規則。

## 自我檢核與答案

１．拿掉 ?，time 會直接是 f64 嗎？不會，map_err 的結果仍是 Result。
２．map_err 會修改成功的數值嗎？不會，只轉換 Err 的內容。
３．為什麼先學完整 match？簡寫應是已理解控制流程的縮寫，而不是新的魔法。

回到第十課：`cargo run -- lesson 10`，寫完後 `cargo run -- run 10`。完整 match 與本節簡寫只要符合相同契約，都可以是正確作答。

官方閱讀：[Result 與 ?](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html)、[Result::map_err](https://doc.rust-lang.org/std/result/enum.Result.html#method.map_err)。

---

# 第 11 步：用測試保護程式

## 閱讀路線

[11-1：固定測試模板與新增測試](lessons/11-1.md)。終端機：`cargo run -- lesson 11-1`。

[11-2：浮點誤差、abs與科學記號](lessons/11-2.md)。終端機：`cargo run -- lesson 11-2`。

主線實作仍編輯原本的 examples/step11.rs；補充閱讀不增加需要繳交的程式。

## 核心觀念

#[test] 標記測試。assert_eq! 比較相等；浮點數一般用誤差範圍檢查。測試應涵蓋正常值、邊界與錯誤輸入。

## 起始程式

```rust
fn c_to_f(c: f64) -> f64 { 0.0 }
fn main() { println!("{}", c_to_f(25.0)); }
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn freezing() { assert!((c_to_f(0.0) - 32.0).abs() < 1e-9); }
}
```

## 動手練習

先執行測試並閱讀失敗訊息，再修正換算公式，新增沸點與負 40 度測試。

自動驗收：`cargo run -- run 11`。手動執行：`cargo run -- manual 11`。

## 提示

在終端機執行 cargo test --example step11；這一課的起始測試故意會失敗。

## 預期結果

```text
77
測試結果：通過
```

驗收：三個溫度測試全部通過。

## 參考答案

```rust
fn c_to_f(c: f64) -> f64 { c * 9.0 / 5.0 + 32.0 }
fn main() { println!("{}", c_to_f(25.0)); }
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn temperatures() {
        for (c, f) in [(0.0,32.0),(100.0,212.0),(-40.0,-40.0)] {
            assert!((c_to_f(c)-f).abs() < 1e-9);
        }
    }
}
```

自我解釋：你改了哪裡？為什麼這樣寫？哪個邊界案例最容易漏掉？

---

# 11-1：逐行讀懂測試框架與失敗訊息

## 測試不是另一套程式語言

第五課補充已介紹 assert 系列。這一節補的是「把檢查放在哪裡、誰會執行、失敗怎麼讀」。測試仍是 Rust 函式，只是交由測試工具安排呼叫；不需要在 main 手動呼叫每個測試。本節是閱讀示範，不新增作答檔。

## 範例一：完整且可以先沿用的框架

```rust
fn add(a: i32, b: i32) -> i32 { a + b }
fn main() { println!("{}", add(2, 3)); }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn ordinary_sum() { assert_eq!(add(2, 3), 5); }
    #[test]
    fn negative_sum() { assert_eq!(add(-2, 1), -1); }
}
```

| 行 | 作用 | 初學時如何處理 |
| --- | --- | --- |
| `#[cfg(test)]` | 這個區塊只在測試設定下編譯 | 先保留框架 |
| `mod tests { ... }` | 將相關測試放進名為 tests 的模組 | 在大括號裡加測試 |
| `use super::*;` | 從上層模組引入可使用的名稱 | 先保留，讓測試可呼叫 add |
| `#[test]` | 把下面函式交給測試工具執行 | 每個獨立測試都加上 |
| `fn ordinary_sum()` | 這個案例的名稱與執行內容 | 名稱寫出案例意義 |

普通執行此檔時 main 印５；使用測試工具時會自動執行兩個帶 #[test] 的函式。這不是 `mod` 完整教學：先把模組理解為程式的命名與組織區塊，進階再討論跨檔案模組與公開介面。

## 範例二：增加一個測試就是增加一份可重現的檢查

```rust
fn add(a: i32, b: i32) -> i32 { a + b }
fn main() {}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn zero_identity() { assert_eq!(add(8, 0), 8); }
    #[test]
    fn mixed_signs() { assert_eq!(add(-8, 8), 0); }
    #[test]
    fn both_negative() { assert_eq!(add(-2, -3), -5); }
}
```

先決定一個與既有案例不同的輸入及預期，再命名函式，最後加入 assertion。不要把所有預期結果都從同一個待測函式再算一次，否則錯誤可能被同樣方式複製。這三個案例驗證不同情況，仍不代表所有整數都已驗證，也沒有承諾處理加法溢位。

## 在本專案如何操作

以下都在 beginner 資料夾執行，對象是你真正修改的 examples/step11.rs：

```sh
cargo run -- manual 11
cargo test --example step11
cargo run -- test 11
cargo run -- run 11
```

manual 只執行 main。原生 cargo test 與主課程 test 11 執行作答檔中帶 #[test] 的函式。run 11 則額外載入教材的獨立驗收資料；它不是只確認你自己寫的測試通過。第四課子題的 test 是 run 的別名，與此處主課 test 的用途不同。

## 失敗時依這個順序看

先找測試名稱，再找 assertion 的左右值或條件，然後回到對應輸入。編譯錯誤表示測試尚未開始，例如拼錯函式名；FAILED 表示測試已執行但檢查不成立。0 tests 只表示沒有找到測試，不能宣稱題目完成。

| 現象 | 解讀 | 下一步 |
| --- | --- | --- |
| could not compile | 程式／測試尚未可編譯 | 先修正位置與型別訊息 |
| ordinary_sum ... FAILED | 這個案例的檢查失敗 | 比對輸入與預期 |
| 3 passed | 三個已列出的案例通過 | 再確認是否缺邊界案例 |

## 自我檢核與答案

１．只在 main 寫 assert 算自動被測試工具找到的 #[test] 嗎？不算；它是普通執行路徑上的檢查。
２．新增測試要改函式公式嗎？不一定，先固定案例，再讓它檢查現有公式。
３．為什麼保留模板而不先講完模組系統？本課要先建立可執行的測試習慣，明確標記框架能避免學生誤以為那些語法已全部學完。

回到原實作：`cargo run -- lesson 11`。浮點比較的 abs 與 1e-9 請接著讀 11-2。

官方閱讀：[Rust 測試](https://doc.rust-lang.org/book/ch11-01-writing-tests.html)。

---

# 11-2：浮點誤差、abs 與 1e-9

## 從「答案相等」改問「誤差是否足夠小」

f64 以有限位元表示數值，不能精確保存所有實數與十進位小數。即使公式寫對，運算後的近似值也可能與另一條計算路徑略有差異。本節接續 5-2 的斷言與 11-1 的測試框架；先理解計算誤差，不背一個固定小數當萬用設定。

## 範例一：觀察實際保存的值

```rust
fn main() {
    let actual = 0.1_f64 + 0.2_f64;
    let expected = 0.3_f64;
    println!("actual={actual:.17}");
    println!("expected={expected:.17}");
    println!("difference={:.17}", actual - expected);
    assert!((actual - expected).abs() < 1e-9);
}
```

可以看到足夠多位數時，兩者有極小差異。這不表示每次浮點相等比較都錯，例如本課某些可精確表示的案例可以相等；它表示不能假設所有數學上相等的運算路徑都產生相同位元。

## 把 assertion 一步一步展開

`(actual - expected).abs() < 1e-9` 有三個工作：先求差，再取絕對值，最後與容許誤差比較。abs 是 absolute value 的縮寫，負０．０１與正０．０１都變成０．０１，因為我們關心偏離多少，而不是偏大或偏小。

1e-9 是科學記號，表示１０的負九次方，也就是０．００００００００１。程式中的 e 不是變數，不能把它讀成 `1 * e - 9`。

| actual | expected | 差 | 絕對誤差 | 若容許 0.02 |
| --- | --- | --- | --- | --- | --- |
| 5.01 | 5.00 | 0.01 | 0.01 | 通過 |
| 4.99 | 5.00 | -0.01 | 0.01 | 通過 |
| 5.10 | 5.00 | 0.10 | 0.10 | 失敗 |

## 範例二：在測試裡顯示足夠的資訊

```rust
fn c_to_f(c: f64) -> f64 { c * 9.0 / 5.0 + 32.0 }
fn main() {}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn body_temperature() {
        let actual = c_to_f(37.0);
        let expected = 98.6;
        let error = (actual - expected).abs();
        assert!(error < 1e-9,
            "actual={actual}, expected={expected}, error={error}");
    }
}
```

把中間量命名能讓失敗訊息更清楚。這裡選擇 1e-9 是針對本練習的數值尺度與固定運算，不是物理量測精度的普遍規定。若需求是允許０．１度，就不應僅因範例寫 1e-9 而照搬。

## 範例三：絕對與相對容許的不同角色

```rust
fn close(a: f64, b: f64, absolute: f64, relative: f64) -> bool {
    if !a.is_finite() || !b.is_finite() { return false; }
    let scale = a.abs().max(b.abs());
    (a - b).abs() <= absolute + relative * scale
}
fn main() {
    assert!(close(0.0, 1e-12, 1e-9, 1e-6));
    assert!(close(1_000_000.0, 1_000_000.1, 1e-9, 1e-6));
    assert!(!close(1.0, 2.0, 1e-9, 1e-6));
    println!("容許誤差示範完成");
}
```

靠近零時，相對誤差的尺度太小，絕對容許能給一個底線；數值很大時，相對容許會隨尺度增加。這只是有限數、非負合理容許量的入門示範，不是涵蓋所有極值、溢位及領域需求的通用比較函式。max 只是取兩者較大值，作為比較尺度。

## 自我檢核與答案

１．為什麼不只檢查 actual - expected < tolerance？很大的負差也可能通過，所以要取絕對值。
２．為什麼 1e-9 不是所有題目都適合？不同單位、數量級與需求容許的誤差不同。
３．容許誤差能掩蓋錯誤公式嗎？若選得過大就可能，因此要先推導合理預期，再選有意義的容許範圍。

回到原實作：`cargo run -- lesson 11`，新增測試後使用 `cargo test --example step11`；再用 `cargo run -- run 11` 執行教材驗收。

官方閱讀：[f64](https://doc.rust-lang.org/std/primitive.f64.html)。

---

# 第 12 步：期末小專案：運動紀錄分析

## 閱讀路線

[12-1：期末Debug、轉型與測試簡寫整理](lessons/12-1.md)。終端機：`cargo run -- lesson 12-1`。

[12-2：完整數值與錯誤契約](lessons/12-2.md)。終端機：`cargo run -- lesson 12-2`。

主線實作仍編輯原本的 examples/step12.rs；補充閱讀不增加需要繳交的程式。

## 核心觀念

整合切片、結構、Result、迴圈與測試。每一筆資料包含位移與時間；平均速度必須是總位移／總時間，不能直接平均各段速度。此處位移為有號量，沒有聲稱計算平均速率。

## 起始程式

```rust
#[derive(Debug)]
struct Record { displacement: f64, seconds: f64 }
fn average_velocity(records: &[Record]) -> Result<f64, String> {
    Err(String::from("請完成分析"))
}
fn main() {
    let records = [Record { displacement: 100.0, seconds: 10.0 }, Record { displacement: -40.0, seconds: 20.0 }];
    println!("{:?}", average_velocity(&records));
}
```

## 動手練習

完成平均速度；空資料、非有限位移、非正或非有限時間必須回傳 Err。每筆有效後，仍要檢查累加的總位移、總時間及最後比值是否有限；超出範圍回傳 Err，完整理由見12-2。測試往返運動與兩段時間不相等的情況。進階：讀取文字檔，每行「位移,秒數」。

自動驗收：`cargo run -- run 12`。手動執行：`cargo run -- manual 12`。

## 提示

先檢查每筆資料，再分別累加總位移與總時間。結果也應檢查是否有限。

## 預期結果

```text
Ok(2.0)
```

驗收：總位移 60 m／總時間 30 s＝2 m/s；往返位移為零；錯誤資料回傳 Err。

## 參考答案

```rust
#[derive(Debug)]
struct Record { displacement: f64, seconds: f64 }
fn average_velocity(records: &[Record]) -> Result<f64, String> {
    if records.is_empty() { return Err("沒有資料".into()); }
    let (mut d, mut t) = (0.0, 0.0);
    for r in records {
        if !r.displacement.is_finite() || !r.seconds.is_finite() || r.seconds <= 0.0 {
            return Err("資料必須有限且時間為正".into());
        }
        d += r.displacement; t += r.seconds;
    }
    let v = d / t;
    if !d.is_finite() || !t.is_finite() || !v.is_finite() { return Err("數值超出範圍".into()); }
    Ok(v)
}
fn main() {
    let records = [Record { displacement: 100.0, seconds: 10.0 }, Record { displacement: -40.0, seconds: 20.0 }];
    println!("{:?}", average_velocity(&records));
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn weighted() {
        let rs = [Record { displacement:100.0, seconds:10.0 }, Record { displacement:-40.0, seconds:20.0 }];
        assert!((average_velocity(&rs).unwrap()-2.0).abs()<1e-9);
    }
    #[test] fn invalid() {
        assert!(average_velocity(&[]).is_err());
        for (d,t) in [(1.0,0.0),(1.0,-1.0),(f64::NAN,1.0),(1.0,f64::INFINITY)] {
            assert!(average_velocity(&[Record { displacement:d, seconds:t }]).is_err());
        }
    }
    #[test] fn round_trip() {
        let rs = [Record { displacement:10.0, seconds:2.0 }, Record { displacement:-10.0, seconds:3.0 }];
        assert_eq!(average_velocity(&rs).unwrap(),0.0);
    }
}
```

自我解釋：你改了哪裡？為什麼這樣寫？哪個邊界案例最容易漏掉？

---

# 12-1：期末前的語法整理：Debug、into 與解構

## 不讓整合題偷偷變成新語法考試

第十二課應整合已學的運算、借用、Result 與測試。它的範本另用了幾個簡寫，本節把它們逐一展開。先備是第四課的配對解構、第九課結構與第十課 Result。這是補充閱讀，不新增作答檔，也不改變原本驗收。

## 範例一：Debug 是讓資料能被檢視的格式

```rust
#[derive(Debug)]
struct Record { displacement: f64, seconds: f64 }
fn main() {
    let record = Record { displacement: 100.0, seconds: 10.0 };
    println!("{record:?}");
    println!("位移={} m，時間={} s", record.displacement, record.seconds);
}
```

第一行輸出類似 `Record { displacement: 100.0, seconds: 10.0 }`；第二行是我們自己設計給讀者看的文字。`#[derive(Debug)]` 請編譯器為這個結構產生 Debug 實作；`{:?}` 或 `{record:?}` 要求使用這種除錯格式。它不改變資料的數值，也不表示已做正確性驗證。

`{}` 與 `{:?}` 使用的格式介面不同，不能因為加了 Debug 就假設可以直接用 `{record}`。此處先沿用 derive 模板，等進階 trait 課程再討論介面的實作。Debug 格式適合檢查內容；若對外輸出有固定規格，仍要像第二行一樣明確設計格式。

## 範例二：String::from 與 into 的轉換方向

```rust
fn require_data(has_data: bool) -> Result<(), String> {
    if !has_data { return Err("沒有資料".into()); }
    Ok(())
}
fn main() {
    let explicit = String::from("沒有資料");
    let inferred: String = "沒有資料".into();
    assert_eq!(explicit, inferred);
    assert!(require_data(false).is_err());
    assert!(require_data(true).is_ok());
    println!("兩種方式都建立 String");
}
```

字串常值「沒有資料」本身是借用的文字；String::from 明寫目標是 String。`.into()` 則請型別系統依需要的目標型別進行轉換：inferred 的宣告給了 String，require_data 的回傳型別也給了錯誤內容為 String 的資訊。若周圍沒有足夠型別資訊，編譯器可能不知道你要轉成哪個型別。

本例把字串常值轉成 String 時兩種寫法達到同一目的；不能因此推論任何型別都能隨意 into 任意其他型別。Into 需要已有對應轉換，而且消耗它所接收的值。初學時選擇 String::from 完全可以，清楚比短更重要。

Result<(), String> 的 `()` 是單元型別，表示成功時不另帶有用的資料；Ok(()) 就是成功但沒有要交出的數值。這裡只用來示範錯誤字串轉換，不要求期末改成這種回傳型別。

## 範例三：兩個累加器與測試中的 unwrap

```rust
fn main() {
    let (mut total_d, mut total_t) = (0.0_f64, 0.0_f64);
    for (d, t) in [(100.0, 10.0), (-40.0, 20.0)] {
        total_d += d;
        total_t += t;
    }
    let result: Result<f64, String> = Ok(total_d / total_t);
    assert_eq!(result.unwrap(), 2.0);
    let error: Result<f64, String> = Err(String::from("無效資料"));
    assert!(error.is_err());
    println!("總位移={total_d}，總時間={total_t}");
}
```

４－７曾用 `(index, value)` 同時接收兩項資訊；此處是相同的配對解構，把左邊兩個名字依序綁到右邊兩個值。兩個 mut 分別允許兩個變數被更新，不是對整個 tuple 施加神秘設定。也可以改寫成兩行獨立的 let mut，語意更容易追蹤時就用長寫法。

| 資料處理完畢 | total_d | total_t |
| --- | --- | --- |
| 尚無資料 | 0 | 0 |
| 第一筆 | 100 | 10 |
| 第二筆 | 60 | 30 |

unwrap 在 Result 為 Ok 時取出成功內容，在 Err 時會 panic。測試裡預期這組資料一定成功，故意讓失敗直接中止測試是合理選擇；面對使用者輸入，不應用 unwrap 代替錯誤處理。is_err 只問是不是 Err，不會幫你取出錯誤內容。

## 自我檢核與答案

１．derive(Debug) 能讓錯誤公式通過測試嗎？不能，它只提供顯示資料的能力。
２．不知道 into 要轉成什麼時如何寫得清楚？明寫型別或直接使用 String::from。
３．unwrap 是安全檢查資料的通用工具嗎？不是；它是「預期成功，失敗就 panic」的選擇，使用者資料通常應用 match／Result 正常處理。

回到原實作：`cargo run -- lesson 12`。遇到這些簡寫時可先改寫成長版本理解；以 `cargo run -- run 12` 檢查行為是否仍符合規格。

官方閱讀：[Debug](https://doc.rust-lang.org/std/fmt/trait.Debug.html)、[Into](https://doc.rust-lang.org/std/convert/trait.Into.html)、[Result](https://doc.rust-lang.org/std/result/enum.Result.html)。

---

# 12-2：期末資料契約與完整數值檢查

## 先寫清楚哪些資料可以接受

本節釐清原本運動分析題的要求，不新增輸入格式、讀檔功能或額外作業。每筆 Record 記錄一段的有號位移（公尺）與時間（秒）。位移須為有限數，可以是零或負；時間須為有限正數。資料集合不能為空。成功回傳總位移除以總時間，錯誤則回傳 Err。

平均速度不是每段速度的直接平均。若兩段所花時間不同，直接平均會給每段同樣權重；本題要求依時間所代表的整體運動計算。平均速率需要路程，本題每筆只記錄有號位移，不能憑這些資料保證知道每段的實際路程，所以不把結果稱為平均速率。

## 三組先用紙筆驗證的資料

| 組別 | 各段位移／時間 | 總位移 | 總時間 | 預期平均速度 |
| --- | --- | --- | --- | --- |
| Ａ | 100／10、-40／20 | 60 m | 30 s | 2 m/s |
| Ｂ | 10／2、-10／3 | 0 m | 5 s | 0 m/s |
| Ｃ | -12／3 | -12 m | 3 s | -4 m/s |

以Ａ組追蹤累加器：起始 d＝0、t＝0；第一筆後 d＝100、t＝10；第二筆後 d＝60、t＝30；最後才計算 60／30。不能在第一筆就把當時的速度當成整組答案。

## 範例一：每筆有限，不保證最後有限

```rust
fn main() {
    let a = 1e308_f64;
    let b = 1e308_f64;
    assert!(a.is_finite() && b.is_finite());
    let total = a + b;
    assert!(!total.is_finite());
    let tiny_time = 5e-324_f64;
    assert!(tiny_time.is_finite() && tiny_time > 0.0);
    let velocity = 1.0 / tiny_time;
    assert!(!velocity.is_finite());
    println!("單筆、累加與相除都需要檢查");
}
```

第一個案例的兩筆位移單獨可由 f64 表示，加總卻超出有限範圍。第二個案例的時間是極小正數，位移與時間都有限，但比值超出有限範圍。這些是不同的失敗位置，不能只檢查輸入就結束。

## 分三層檢查，再決定回傳

| 檢查階段 | 必須拒絕的情況 | 下一步 |
| --- | --- | --- |
| 集合 | 沒有任何資料 | 回傳 Err |
| 單筆 | NaN、無限大、非正時間 | 回傳 Err，不繼續加這筆 |
| 總結 | 位移總和、時間總和或最後比值非有限 | 回傳 Err |
| 全部通過 | 有效總位移與正總時間 | 回傳 Ok(平均速度) |

本題沒有要求特定錯誤文字，但錯誤必須透過 Result 交給呼叫者，而不是印完訊息仍回傳假的零速度。零速度是Ｂ組的合法結果，不能拿它兼作沒有資料或失敗的代號。

## 範例二：將完整契約放進可測的函式

```rust
struct Record { displacement: f64, seconds: f64 }
fn average_velocity(records: &[Record]) -> Result<f64, String> {
    if records.is_empty() { return Err(String::from("沒有資料")); }
    let mut displacement = 0.0;
    let mut seconds = 0.0;
    for record in records {
        if !record.displacement.is_finite()
            || !record.seconds.is_finite()
            || record.seconds <= 0.0 {
            return Err(String::from("資料必須有限且時間為正"));
        }
        displacement += record.displacement;
        seconds += record.seconds;
    }
    let velocity = displacement / seconds;
    if !displacement.is_finite() || !seconds.is_finite() || !velocity.is_finite() {
        return Err(String::from("數值超出範圍"));
    }
    Ok(velocity)
}
fn main() {
    let a = [Record { displacement: 100.0, seconds: 10.0 },
             Record { displacement: -40.0, seconds: 20.0 }];
    let b = [Record { displacement: 10.0, seconds: 2.0 },
             Record { displacement: -10.0, seconds: 3.0 }];
    let c = [Record { displacement: -12.0, seconds: 3.0 }];
    assert_eq!(average_velocity(&a).unwrap(), 2.0);
    assert_eq!(average_velocity(&b).unwrap(), 0.0);
    assert_eq!(average_velocity(&c).unwrap(), -4.0);
    assert!(average_velocity(&[]).is_err());
    assert!(average_velocity(&[Record { displacement: 1.0, seconds: 0.0 }]).is_err());
    assert!(average_velocity(&[Record { displacement: 1.0, seconds: 5e-324 }]).is_err());
    println!("三組正常資料與錯誤案例通過");
}
```

這些選定結果可以精確比較；一般浮點測試仍需依 11-2 考慮容許誤差。函式只計算與回傳，不讀鍵盤、不決定錯誤顯示方式，這讓測試可直接提供不同切片。

## 檢查通過仍有什麼限制

is_finite 排除了 NaN 與無限大，不代表沒有捨入誤差、消去誤差或量測不確定度。本課使用班級練習尺度的 f64 運算，不宣稱可取代完整科學數值分析。若實際需求允許巨大數值或非常不同的尺度，必須重新評估表示法、加總方式與誤差預算，不能只放寬 assertion。

目前原驗收會檢查輸入、累加與比值的非有限情況；本節把這項契約明寫出來，沒有臨時新增隱藏要求。既有程式可採不同寫法，只要成功與失敗的意義一致。

## 自我檢核與答案

１．兩個有限數相加一定有限嗎？不一定，可能超出 f64 有限範圍。
２．總位移為零是錯誤嗎？不是，往返後的平均速度可以合法為零。
３．時間大於零就足夠嗎？不夠，還要有限，並確認整組累加與比值都有限。

回到原實作：`cargo run -- lesson 12`，再以 `cargo run -- run 12` 驗收。先把紙筆推導與函式契約寫清楚，再考慮原課程所列的讀檔延伸。

官方閱讀：[f64 的有限性與特殊數值](https://doc.rust-lang.org/std/primitive.f64.html)。
