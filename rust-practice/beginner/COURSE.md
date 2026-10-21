# Rust Beginner Course

已安裝 Rust 的使用者，可在專案資料夾執行 `cargo run` 查看終端機操作方法，並以 `cargo run -- lesson 1` 開始第一課。修改本機 examples 的程式，再用 `cargo run -- run 1` 執行。

每題可用 `cargo run -- run N` 自動驗收，或用 `cargo run -- manual N` 手動操作。每題至少十項具名驗收；第二～四課會在暫存副本代入不同設定，不修改作答。完整資料與無參數題的契約檢查說明見 TEST_CASES.md，限制見 README.md。

每課約３０～５０分鐘；先預測、動手修改、對照驗收，再讀答案。第一輪可安排為１２～１６節高中選修課，仍需依學生實作速度調整。

網頁 index.html 可直接開啟，不需伺服器。網頁筆記與進度僅存在目前瀏覽器，請使用匯出備份。網頁不會自動修改本機 .rs 檔。

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

# 第 2 步：變數與溫度換算

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

# 第 3 步：條件判斷與邊界

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

# 第 4 步：迴圈與累加

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

# 第 5 步：函式與速度

## 核心觀念

fn 名稱(參數: 型別) -> 回傳型別 定義函式。最後一行不加分號可作為回傳值。速度＝位移／時間，這題限制時間必須為正。

## 起始程式

```rust
fn speed(distance: f64, time: f64) -> f64 {
    0.0 // 替換為公式
}
fn main() {
    println!("{} m/s", speed(100.0, 20.0));
}
```

## 動手練習

完成 speed，100 公尺、20 秒得到 5 m/s。加入 assert! 檢查 time > 0.0，觀察傳入 0 時的錯誤。

自動驗收：`cargo run -- run 5`。手動執行：`cargo run -- manual 5`。

## 提示

assert!(time > 0.0); 放在除法前。正式處理錯誤會在第十課使用 Result。

## 預期結果

```text
5 m/s
```

驗收：100／20＝5；負位移可以得到負速度；零秒應觸發 assertion。

## 參考答案

```rust
fn speed(distance: f64, time: f64) -> f64 {
    assert!(time > 0.0, "時間必須為正");
    distance / time
}
fn main() { println!("{} m/s", speed(100.0, 20.0)); }
```

自我解釋：你改了哪裡？為什麼這樣寫？哪個邊界案例最容易漏掉？

# 第 6 步：輸入與字串轉數字

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

# 第 7 步：所有權與借用

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

# 第 8 步：Vec 與 Option

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

先 is_empty()，再以 iter().sum::<i32>() 加總。本題分數限 0 到 100，資料量限班級規模。

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

# 第 9 步：結構與方法

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

# 第 10 步：Result 與可恢復錯誤

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

parse::<f64>().map_err(|_| String::from("不是數字"))?，再檢查 > 0.0 與 is_finite()。

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

# 第 11 步：用測試保護程式

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

# 第 12 步：期末小專案：運動紀錄分析

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

完成平均速度；空資料、非有限位移、非正或非有限時間必須回傳 Err。測試往返運動與兩段時間不相等的情況。進階：讀取文字檔，每行「位移,秒數」。

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

# 教師備課建議

第零步安裝可作為課前作業；第一～四步搭配紙筆追蹤，第五～八步採兩人討論，第九～十二步以個人實作驗收。評量可採正確性４０％、邊界測試２５％、口頭解釋２０％、可讀性１５％。這是教學建議，尚未經學生試教。

期末必做為記憶體內的運動紀錄分析；讀檔、CLI 參數與 CSV 錯誤行號是延伸題，沒有在本版提供完整實作。可先讓學生以三筆手算資料驗證，再寫自動測試。

延伸閱讀：[The Rust Book](https://doc.rust-lang.org/book/)、[標準函式庫](https://doc.rust-lang.org/std/)、[Rust by Example](https://doc.rust-lang.org/rust-by-example/)。
