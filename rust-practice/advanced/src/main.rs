mod checks;
#[path = "../../runner/mod.rs"]
mod runner;
use std::{
    env,
    process::{self, Command},
};
const LESSONS: [&str; 12] = [
    include_str!("../lessons/01.md"),
    include_str!("../lessons/02.md"),
    include_str!("../lessons/03.md"),
    include_str!("../lessons/04.md"),
    include_str!("../lessons/05.md"),
    include_str!("../lessons/06.md"),
    include_str!("../lessons/07.md"),
    include_str!("../lessons/08.md"),
    include_str!("../lessons/09.md"),
    include_str!("../lessons/10.md"),
    include_str!("../lessons/11.md"),
    include_str!("../lessons/12.md"),
];
fn overview() {
    println!("Rust Advanced Course\n\n課程總覽\n");
    for text in LESSONS {
        println!("{}", text.lines().next().unwrap().trim_start_matches("# "));
    }
    println!("\n閱讀課程：cargo run -- lesson 1");
}
fn help() {
    overview();
    println!(
        "\n在 advanced 資料夾執行（從 workspace 根目錄先 cd advanced）：\n  cargo run -- lesson      顯示課程總覽\n  cargo run -- lesson 1\n  cargo run -- hint 1\n  cargo run -- answer 1\n  cargo run -- run 1\n  cargo run -- test 1\n\n課號為 1 到 12。起始習題含 todo!()，請先修改 examples/labNN.rs。\nrun 會自動驗收；手動互動請用 manual 12 data/motion.csv"
    );
}
fn show(n: usize, mode: &str) -> Result<(), String> {
    let text = LESSONS[n - 1];
    match mode {
        "lesson" => {
            println!("{}", text.split("\n## 提示\n").next().unwrap());
            println!("\n提示：cargo run -- hint {n}\n答案：cargo run -- answer {n}");
        }
        "hint" => println!(
            "{}",
            text.split_once("\n## 提示\n")
                .unwrap()
                .1
                .split("\n## 參考解法\n")
                .next()
                .unwrap()
        ),
        "answer" => {
            let path = format!("{}/solutions/lab{n:02}.rs", env!("CARGO_MANIFEST_DIR"));
            println!("{}", text.split_once("\n## 參考解法\n").unwrap().1);
            println!(
                "\n設計理由：lessons/{n:02}.md 的「理論與設計理由」。\n\n```rust\n{}\n```",
                std::fs::read_to_string(path).map_err(|e| e.to_string())?
            );
        }
        _ => unreachable!(),
    }
    Ok(())
}
fn execute(n: usize, test: bool, args: &[String]) -> Result<(), String> {
    let manifest = format!("{}/Cargo.toml", env!("CARGO_MANIFEST_DIR"));
    let mut command = Command::new(env::var_os("CARGO").unwrap_or_else(|| "cargo".into()));
    command.args([
        if test { "test" } else { "run" },
        "--manifest-path",
        &manifest,
        "-p",
        "rust-advanced-course",
        "--example",
        &format!("lab{n:02}"),
    ]);
    if !args.is_empty() {
        command.arg("--").args(args);
    }
    let status = command
        .status()
        .map_err(|e| format!("無法啟動 Cargo：{e}"))?;
    if !status.success() {
        process::exit(status.code().unwrap_or(1));
    }
    Ok(())
}
fn run() -> Result<(), String> {
    let args: Vec<String> = env::args().skip(1).collect();
    let mode = args.first().map(String::as_str).unwrap_or("help");
    if matches!(mode, "help" | "--help" | "-h" | "list") {
        if args.len() > 1 {
            return Err("這個指令不接受其他參數。".into());
        }
        help();
        return Ok(());
    }
    if mode == "lesson" && args.len() == 1 {
        overview();
        return Ok(());
    }
    if !matches!(
        mode,
        "lesson" | "hint" | "answer" | "run" | "manual" | "test"
    ) {
        return Err(format!("未知指令：{mode}。執行 cargo run 查看用法。"));
    }
    let n = args
        .get(1)
        .and_then(|s| s.parse::<usize>().ok())
        .filter(|n| (1..=12).contains(n))
        .ok_or("請提供課號 1 到 12，例如：lesson 1")?;
    if mode != "manual" && args.len() != 2 {
        return Err("此指令只接受一個課號；只有 manual 可附加程式參數。".into());
    }
    match mode {
        "run" | "test" => {
            if !checks::verify(n)? {
                process::exit(1);
            }
            Ok(())
        }
        "manual" => execute(n, false, &args[2..]),
        _ => show(n, mode),
    }
}
fn main() {
    if let Err(e) = run() {
        eprintln!("{e}");
        process::exit(2);
    }
}
