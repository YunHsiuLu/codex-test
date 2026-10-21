from pathlib import Path
import json, html
root=Path(__file__).resolve().parents[1]
lessons=[]
def lesson(title,concept,code,task,hint,solution,expected,check):
    lessons.append(dict(id=len(lessons)+1,title=title,concept=concept,code=code,task=task,hint=hint,solution=solution,expected=expected,check=check))
lesson('讓程式說話','fn main() 是程式入口；println! 是巨集，會在文字後換行。字串放在雙引號內，敘述通常用分號結束。','fn main() {\n    println!("Hello, Rust!");\n}', '讓程式依序輸出「Hello, Rust!」及「我正在學 Rust」。先預測目前程式會印出幾行。','新增一個 println!；中文也可以放進字串。','fn main() {\n    println!("Hello, Rust!");\n    println!("我正在學 Rust");\n}', 'Hello, Rust!\n我正在學 Rust','兩行文字與標點完全相同。')
lesson('變數與溫度換算','let 宣告變數，預設不可重新賦值；mut 允許更改。f64 是浮點數，i32 是有號整數。整數 9 / 5 得到 1，浮點運算要寫 9.0 / 5.0。','fn main() {\n    let celsius: f64 = 25.0;\n    let fahrenheit = 0.0; // 修改公式\n    println!("{celsius} C = {fahrenheit} F");\n}', '將攝氏換為華氏：F = C × 9／5 ＋ 32。測試 0、25、100 度。','使用 celsius * 9.0 / 5.0 + 32.0。','fn main() {\n    let celsius: f64 = 25.0;\n    let fahrenheit = celsius * 9.0 / 5.0 + 32.0;\n    println!("{celsius} C = {fahrenheit} F");\n}', '25 C = 77 F','0 → 32；25 → 77；100 → 212。')
lesson('條件判斷與邊界','if 的條件必須是 bool。>= 包含邊界；== 用於比較，= 是賦值。if 也能回傳值，各分支必須產生相容型別。','fn main() {\n    let score = 60;\n    let result = "待判斷";\n    println!("{result}");\n}', '成績大於等於 60 印出「及格」，否則印出「再試一次」。測試 59、60、100。','let result = if score >= 60 { ... } else { ... };','fn main() {\n    let score = 60;\n    let result = if score >= 60 { "及格" } else { "再試一次" };\n    println!("{result}");\n}', '及格','59：再試一次；60 與 100：及格。')
lesson('迴圈與累加','for n in 1..=5 會走過 1 到 5，1..5 則不包含 5。累加器需要 mut。先用紙筆追蹤每次迴圈的 total。','fn main() {\n    let mut total = 0;\n    for n in 1..=5 {\n        total += 0; // 使用 n\n    }\n    println!("{total}");\n}', '計算 1 到 5 的整數總和，再改成 1 到 100。','total += n 等同 total = total + n。','fn main() {\n    let mut total = 0;\n    for n in 1..=5 { total += n; }\n    println!("{total}");\n}', '15','1 到 5：15；1 到 100：5050。')
lesson('函式與速度','fn 名稱(參數: 型別) -> 回傳型別 定義函式。最後一行不加分號可作為回傳值。速度＝位移／時間，這題限制時間必須為正。','fn speed(distance: f64, time: f64) -> f64 {\n    0.0 // 替換為公式\n}\nfn main() {\n    println!("{} m/s", speed(100.0, 20.0));\n}', '完成 speed，100 公尺、20 秒得到 5 m/s。加入 assert! 檢查 time > 0.0，觀察傳入 0 時的錯誤。','assert!(time > 0.0); 放在除法前。正式處理錯誤會在第十課使用 Result。','fn speed(distance: f64, time: f64) -> f64 {\n    assert!(time > 0.0, "時間必須為正");\n    distance / time\n}\nfn main() { println!("{} m/s", speed(100.0, 20.0)); }','5 m/s','100／20＝5；負位移可以得到負速度；零秒應觸發 assertion。')
lesson('輸入與字串轉數字','read_line 將輸入附加到 String；&mut 表示可變借用。trim 去除兩端空白；parse::<f64>() 嘗試轉換數字。match 區分 Ok 與 Err。','use std::io;\nfn main() {\n    let mut input = String::new();\n    println!("輸入攝氏溫度：");\n    io::stdin().read_line(&mut input).expect("讀取失敗");\n    println!("你輸入：{}", input.trim());\n}', '將輸入轉為 f64 後換算華氏；輸入 abc 時顯示「請輸入數字」，不要直接崩潰。Playground 不適合本課互動輸入，請在本機終端機操作。','match input.trim().parse::<f64>() { Ok(c) => ... , Err(_) => ... }','use std::io;\nfn main() {\n    let mut input = String::new();\n    println!("輸入攝氏溫度：");\n    io::stdin().read_line(&mut input).expect("讀取失敗");\n    match input.trim().parse::<f64>() {\n        Ok(c) => println!("{} F", c * 9.0 / 5.0 + 32.0),\n        Err(_) => println!("請輸入數字"),\n    }\n}', '輸入 25 → 77 F\n輸入 abc → 請輸入數字','測試 25、-40、abc 及空白輸入。')
lesson('所有權與借用','String 擁有堆積上的文字資料。把 String 傳給另一個變數通常會移動所有權；&String 或 &str 可以借用而不移動。len() 是位元組數，chars().count() 才是 Unicode scalar value 數量，仍不一定等於人眼認知的字元數。','fn count(text: String) -> usize { text.chars().count() }\nfn main() {\n    let name = String::from("Rust");\n    let size = count(name);\n    // 請保留 name 仍可使用\n    println!("字元數：{size}");\n}', '將 count 改成接收 &str，並在計算後輸出原始 name。先嘗試直接輸出已被移動的 name，閱讀編譯器提示。','函式參數改成 text: &str，呼叫改成 count(&name)。','fn count(text: &str) -> usize { text.chars().count() }\nfn main() {\n    let name = String::from("Rust");\n    let size = count(&name);\n    println!("{name}：{size}");\n}', 'Rust：4','Rust 得到 4；物理 得到 2，且原始字串可繼續使用。')
lesson('Vec 與 Option','Vec<T> 是可變長度集合。&[i32] 是借用的整數切片。空集合沒有平均值，Option<f64> 以 Some(value) 或 None 表達；不要用 0 假裝沒有資料。','fn average(scores: &[i32]) -> Option<f64> {\n    None // 實作空集合與平均值\n}\nfn main() {\n    let scores = vec![60, 80, 100];\n    println!("{:?}", average(&scores));\n}', '完成平均值函式；空切片回傳 None，其餘回傳 Some。用浮點除法避免截斷。','先 is_empty()，再以 iter().sum::<i32>() 加總。本題分數限 0 到 100，資料量限班級規模。','fn average(scores: &[i32]) -> Option<f64> {\n    if scores.is_empty() { return None; }\n    Some(scores.iter().sum::<i32>() as f64 / scores.len() as f64)\n}\nfn main() {\n    let scores = vec![60, 80, 100];\n    println!("{:?}", average(&scores));\n}', 'Some(80.0)','空集合：None；[60, 80, 100]：Some(80.0)；[60, 61]：Some(60.5)。')
lesson('結構與方法','struct 將相關資料放在一起，impl 定義方法。&self 借用目前的物件。欄位名稱可讓物理量的意義比一堆位置參數更清楚。','struct Motion { distance: f64, time: f64 }\nimpl Motion {\n    fn speed(&self) -> f64 { 0.0 }\n}\nfn main() {\n    let m = Motion { distance: 120.0, time: 10.0 };\n    println!("{} m/s", m.speed());\n}', '完成 Motion::speed，並檢查時間為正。新增第二筆 50 公尺、5 秒的資料。','方法中使用 self.distance 與 self.time。','struct Motion { distance: f64, time: f64 }\nimpl Motion {\n    fn speed(&self) -> f64 {\n        assert!(self.time > 0.0);\n        self.distance / self.time\n    }\n}\nfn main() {\n    for m in [Motion { distance: 120.0, time: 10.0 }, Motion { distance: 50.0, time: 5.0 }] {\n        println!("{} m/s", m.speed());\n    }\n}', '12 m/s\n10 m/s','兩筆分別為 12 與 10 m/s；零秒應觸發 assertion。')
lesson('Result 與可恢復錯誤','Result<T, E> 用 Ok 傳成功值，用 Err 傳失敗原因。? 會在 Err 時提早回傳；呼叫者可以決定如何顯示錯誤。is_finite 排除 NaN 與無限大。','fn parse_time(text: &str) -> Result<f64, String> {\n    Err(String::from("尚未完成"))\n}\nfn main() { println!("{:?}", parse_time("2.5")); }', '把文字轉成正且有限的秒數；拒絕 0、負數、abc、NaN、inf。','parse::<f64>().map_err(|_| String::from("不是數字"))?，再檢查 > 0.0 與 is_finite()。','fn parse_time(text: &str) -> Result<f64, String> {\n    let t = text.trim().parse::<f64>().map_err(|_| String::from("不是數字"))?;\n    if !t.is_finite() || t <= 0.0 { return Err(String::from("時間必須為有限正數")); }\n    Ok(t)\n}\nfn main() { println!("{:?}", parse_time("2.5")); }','Ok(2.5)','2.5 成功；0、-1、abc、NaN、inf 失敗。')
lesson('用測試保護程式','#[test] 標記測試。assert_eq! 比較相等；浮點數一般用誤差範圍檢查。測試應涵蓋正常值、邊界與錯誤輸入。','fn c_to_f(c: f64) -> f64 { 0.0 }\nfn main() { println!("{}", c_to_f(25.0)); }\n#[cfg(test)]\nmod tests {\n    use super::*;\n    #[test]\n    fn freezing() { assert!((c_to_f(0.0) - 32.0).abs() < 1e-9); }\n}', '先執行測試並閱讀失敗訊息，再修正換算公式，新增沸點與負 40 度測試。','在終端機執行 cargo test --example step11；這一課的起始測試故意會失敗。','fn c_to_f(c: f64) -> f64 { c * 9.0 / 5.0 + 32.0 }\nfn main() { println!("{}", c_to_f(25.0)); }\n#[cfg(test)]\nmod tests {\n    use super::*;\n    #[test]\n    fn temperatures() {\n        for (c, f) in [(0.0,32.0),(100.0,212.0),(-40.0,-40.0)] {\n            assert!((c_to_f(c)-f).abs() < 1e-9);\n        }\n    }\n}', '77\n測試結果：通過','三個溫度測試全部通過。')
lesson('期末小專案：運動紀錄分析','整合切片、結構、Result、迴圈與測試。每一筆資料包含位移與時間；平均速度必須是總位移／總時間，不能直接平均各段速度。此處位移為有號量，沒有聲稱計算平均速率。','#[derive(Debug)]\nstruct Record { displacement: f64, seconds: f64 }\nfn average_velocity(records: &[Record]) -> Result<f64, String> {\n    Err(String::from("請完成分析"))\n}\nfn main() {\n    let records = [Record { displacement: 100.0, seconds: 10.0 }, Record { displacement: -40.0, seconds: 20.0 }];\n    println!("{:?}", average_velocity(&records));\n}', '完成平均速度；空資料、非有限位移、非正或非有限時間必須回傳 Err。測試往返運動與兩段時間不相等的情況。進階：讀取文字檔，每行「位移,秒數」。','先檢查每筆資料，再分別累加總位移與總時間。結果也應檢查是否有限。','#[derive(Debug)]\nstruct Record { displacement: f64, seconds: f64 }\nfn average_velocity(records: &[Record]) -> Result<f64, String> {\n    if records.is_empty() { return Err("沒有資料".into()); }\n    let (mut d, mut t) = (0.0, 0.0);\n    for r in records {\n        if !r.displacement.is_finite() || !r.seconds.is_finite() || r.seconds <= 0.0 {\n            return Err("資料必須有限且時間為正".into());\n        }\n        d += r.displacement; t += r.seconds;\n    }\n    let v = d / t;\n    if !d.is_finite() || !t.is_finite() || !v.is_finite() { return Err("數值超出範圍".into()); }\n    Ok(v)\n}\nfn main() {\n    let records = [Record { displacement: 100.0, seconds: 10.0 }, Record { displacement: -40.0, seconds: 20.0 }];\n    println!("{:?}", average_velocity(&records));\n}\n#[cfg(test)]\nmod tests {\n    use super::*;\n    #[test] fn weighted() {\n        let rs = [Record { displacement:100.0, seconds:10.0 }, Record { displacement:-40.0, seconds:20.0 }];\n        assert!((average_velocity(&rs).unwrap()-2.0).abs()<1e-9);\n    }\n    #[test] fn invalid() {\n        assert!(average_velocity(&[]).is_err());\n        for (d,t) in [(1.0,0.0),(1.0,-1.0),(f64::NAN,1.0),(1.0,f64::INFINITY)] {\n            assert!(average_velocity(&[Record { displacement:d, seconds:t }]).is_err());\n        }\n    }\n    #[test] fn round_trip() {\n        let rs = [Record { displacement:10.0, seconds:2.0 }, Record { displacement:-10.0, seconds:3.0 }];\n        assert_eq!(average_velocity(&rs).unwrap(),0.0);\n    }\n}', 'Ok(2.0)','總位移 60 m／總時間 30 s＝2 m/s；往返位移為零；錯誤資料回傳 Err。')
install='''# 第零步：準備你的 Rust 工作室

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

找不到 cargo：重開終端機，檢查 PATH 是否包含使用者目錄中的 `.cargo/bin`（Windows 為 `.cargo\\bin`）。macOS／Linux 亦可執行 `source "$HOME/.cargo/env"`。
linker／link.exe 錯誤：回到對應作業系統的編譯工具安裝步驟，單看 cargo 版本還不代表 linker 可用。
找不到 Cargo.toml：目前所在資料夾不正確，請切換到本專案根目錄。
更新工具鏈：`rustup update stable`。離線官方文件：`rustup doc`。

安裝資訊查核日期：２０２６－１０－２１。依據 [The Rust Book 安裝章](https://doc.rust-lang.org/book/ch01-01-installation.html) 與 [Rust 官方入門](https://rust-lang.org/learn/get-started/)。本次沒有在 Windows／Linux 實機執行安裝。
'''
(root/'docs/00-install.md').write_text(install)
course='# Rust Beginner Course\n\n已安裝 Rust 的使用者，可在專案資料夾執行 `cargo run` 查看終端機操作方法，並以 `cargo run -- lesson 1` 開始第一課。修改本機 examples 的程式，再用 `cargo run -- run 1` 執行。\n\n每題可用 `cargo run -- run N` 自動驗收，或用 `cargo run -- manual N` 手動操作。每題至少十項具名驗收；第二～四課會在暫存副本代入不同設定，不修改作答。完整資料與無參數題的契約檢查說明見 TEST_CASES.md，限制見 README.md。\n\n每課約３０～５０分鐘；先預測、動手修改、對照驗收，再讀答案。第一輪可安排為１２～１６節高中選修課，仍需依學生實作速度調整。\n\n網頁 index.html 可直接開啟，不需伺服器。網頁筆記與進度僅存在目前瀏覽器，請使用匯出備份。網頁不會自動修改本機 .rs 檔。\n\n'+install+'\n'
for x in lessons:
    n=x['id']; key=f'step{n:02d}'
    (root/f'examples/{key}.rs').write_text(x['code']+'\n')
    (root/f'solutions/{key}.rs').write_text(x['solution']+'\n')
    course+=f"\n# 第 {n} 步：{x['title']}\n\n## 核心觀念\n\n{x['concept']}\n\n## 起始程式\n\n```rust\n{x['code']}\n```\n\n## 動手練習\n\n{x['task']}\n\n自動驗收：`cargo run -- run {n}`。手動執行：`cargo run -- manual {n}`。\n\n## 提示\n\n{x['hint']}\n\n## 預期結果\n\n```text\n{x['expected']}\n```\n\n驗收：{x['check']}\n\n## 參考答案\n\n```rust\n{x['solution']}\n```\n\n自我解釋：你改了哪裡？為什麼這樣寫？哪個邊界案例最容易漏掉？\n"
course+='''\n# 教師備課建議\n\n第零步安裝可作為課前作業；第一～四步搭配紙筆追蹤，第五～八步採兩人討論，第九～十二步以個人實作驗收。評量可採正確性４０％、邊界測試２５％、口頭解釋２０％、可讀性１５％。這是教學建議，尚未經學生試教。\n\n期末必做為記憶體內的運動紀錄分析；讀檔、CLI 參數與 CSV 錯誤行號是延伸題，沒有在本版提供完整實作。可先讓學生以三筆手算資料驗證，再寫自動測試。\n\n延伸閱讀：[The Rust Book](https://doc.rust-lang.org/book/)、[標準函式庫](https://doc.rust-lang.org/std/)、[Rust by Example](https://doc.rust-lang.org/rust-by-example/)。\n'''
(root/'COURSE.md').write_text(course)
(root/'lessons.js').write_text('window.COURSE = '+json.dumps([dict(id=0,title='下載、安裝與環境驗收',install=install)]+lessons,ensure_ascii=False)+';\n')
manifest='[package]\nname = "rust-beginner-course"\nversion = "0.1.0"\nedition = "2024"\npublish = false\ndefault-run = "rust-beginner-course"\n\n'
for x in lessons:
    manifest+=f'[[example]]\nname = "answer{x["id"]:02d}"\npath = "solutions/step{x["id"]:02d}.rs"\n\n'
(root/'Cargo.toml').write_text(manifest)
(root/'.gitignore').write_text('/target/\n.DS_Store\n')
