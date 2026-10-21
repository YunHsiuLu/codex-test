use std::{
    env,
    process::{self, Command},
};

const COURSE: &str = include_str!("../COURSE.md");
const TITLES: [&str; 13] = [
    "下載、安裝與環境驗收",
    "讓程式說話",
    "變數與溫度換算",
    "條件判斷與邊界",
    "迴圈與累加",
    "函式與速度",
    "輸入與字串轉數字",
    "所有權與借用",
    "Vec 與 Option",
    "結構與方法",
    "Result 與可恢復錯誤",
    "用測試保護程式",
    "期末小專案：運動紀錄分析",
];
fn help() {
    println!("Rust 終端機練習工作室\n\n你已安裝 Rust，可以直接從第一課開始。\n");
    for (n, title) in TITLES.iter().enumerate() {
        println!("  {n:02}  {title}");
    }
    println!(
        "\n在專案資料夾執行：\n  cargo run -- lesson 1    閱讀觀念、題目與驗收\n  cargo run -- hint 1      只看提示\n  cargo run -- run 1       執行 examples/step01.rs\n  cargo run -- test 11     執行第十一課的測試\n  cargo run -- answer 1    查看參考答案\n\n用你熟悉的編輯器修改 examples/step01.rs，存檔後再次執行。\n第十一課起始測試故意失敗，請依題目修正。\n亦可直接使用：cargo run --example step01\n安裝與網頁閱讀保留為選用功能。"
    );
}
fn number(text: Option<&String>) -> Result<usize, String> {
    text.and_then(|s| s.parse::<usize>().ok())
        .filter(|n| *n <= 12)
        .ok_or_else(|| "請提供課號 0 到 12，例如 cargo run -- lesson 1".into())
}
fn section(n: usize) -> String {
    if n == 0 {
        return include_str!("../docs/00-install.md").to_owned();
    }
    let heading = format!("# 第 {n} 步：");
    COURSE
        .split_once(&heading)
        .expect("教材缺少課程")
        .1
        .split("\n# ")
        .next()
        .map(|s| format!("{heading}{s}"))
        .unwrap()
}
fn show(n: usize, command: &str) {
    let text = section(n);
    match command {
        "lesson" => {
            println!("{}", text.split("\n## 提示").next().unwrap());
            if let Some((_, tail)) = text.split_once("\n## 預期結果\n") {
                println!(
                    "\n## 預期結果\n{}",
                    tail.split("\n## 參考答案").next().unwrap()
                );
            }
            if n > 0 {
                println!("\n提示：cargo run -- hint {n}\n參考答案：cargo run -- answer {n}");
            }
        }
        "hint" => println!(
            "{}",
            text.split_once("\n## 提示\n")
                .map(|(_, s)| s.split("\n## 預期結果").next().unwrap())
                .unwrap_or("第零步請直接閱讀安裝說明。")
        ),
        "answer" => println!(
            "{}",
            text.split_once("\n## 參考答案\n")
                .map(|(_, s)| s)
                .unwrap_or("第零步沒有程式答案。")
        ),
        _ => unreachable!(),
    }
}
fn execute(n: usize, test: bool) -> Result<(), String> {
    if n == 0 {
        return Err("第零步是環境準備，請執行 cargo run -- lesson 0".into());
    }
    let status = Command::new(env::var_os("CARGO").unwrap_or_else(|| "cargo".into()))
        .current_dir(env!("CARGO_MANIFEST_DIR"))
        .args([
            if test { "test" } else { "run" },
            "--example",
            &format!("step{n:02}"),
        ])
        .status()
        .map_err(|e| format!("無法啟動 Cargo：{e}"))?;
    if !status.success() {
        process::exit(status.code().unwrap_or(1));
    }
    Ok(())
}
fn run() -> Result<(), String> {
    let args: Vec<String> = env::args().skip(1).collect();
    let command = args.first().map(String::as_str).unwrap_or("help");
    if matches!(command, "help" | "--help" | "-h" | "list") {
        if args.len() > 1 {
            return Err("這個指令不需要其他參數。".into());
        }
        help();
        return Ok(());
    }
    if !matches!(command, "lesson" | "hint" | "answer" | "run" | "test") {
        return Err(format!("未知指令：{command}。執行 cargo run 查看用法。"));
    }
    if args.len() != 2 {
        return Err("用法：cargo run -- lesson 1（每次提供一個課號）".into());
    }
    let n = number(args.get(1))?;
    match command {
        "run" => execute(n, false)?,
        "test" => execute(n, true)?,
        _ => show(n, command),
    }
    Ok(())
}
fn main() {
    if let Err(message) = run() {
        eprintln!("{message}");
        process::exit(2);
    }
}
