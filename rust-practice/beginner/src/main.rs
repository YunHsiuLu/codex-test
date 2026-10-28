mod checks;
#[path = "../../runner/mod.rs"]
mod runner;
mod sublessons;
mod variants;
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
    "函式與檢查",
    "輸入與字串轉數字",
    "所有權與借用",
    "Vec 與 Option",
    "結構與方法",
    "Result 與可恢復錯誤",
    "用測試保護程式",
    "期末小專案：運動紀錄分析",
];
fn overview() {
    println!("Rust Beginner Course\n\n課程總覽\n");
    for (n, title) in TITLES.iter().enumerate() {
        println!("  {n:02}  {title}");
        for exercise in sublessons::all()
            .iter()
            .filter(|e| e.id.starts_with(&format!("{n}-")))
        {
            let category = match exercise.kind {
                sublessons::Kind::Reading => "補充",
                sublessons::Kind::Main(_) => "實作入口",
                sublessons::Kind::Variants => "練習",
            };
            println!("      {}  {}【{}】", exercise.id, exercise.title, category);
        }
    }
    println!("\n閱讀課程：cargo run -- lesson 1\n閱讀子題：cargo run -- lesson 4-1");
}
fn help() {
    overview();
    println!(
        "\n在 beginner 資料夾執行：\n  cargo run -- lesson      顯示課程總覽\n  cargo run -- lesson 1    閱讀觀念、題目與驗收\n  cargo run -- hint 1      只看提示\n  cargo run -- run 1       自動驗收 examples/step01.rs\n  cargo run -- manual 1    手動執行程式，保留互動輸入\n  cargo run -- test 11     執行第十一課的測試\n  cargo run -- answer 1    查看參考答案\n  cargo run -- lesson 4-1  閱讀第四課小練習（4-1 到 4-7）\n  cargo run -- run 4-1     自動驗收子題\n\n用你熟悉的編輯器修改 examples/step01.rs，存檔後再次執行。\n第十一課起始測試故意失敗，請依題目修正。\n亦可直接使用：cargo run --example step01\n安裝與網頁閱讀保留為選用功能。"
    );
}
#[derive(Debug, PartialEq)]
struct LessonId {
    major: usize,
    minor: Option<usize>,
}
fn number(text: Option<&String>) -> Result<LessonId, String> {
    let text = text.ok_or("請提供課號，例如 4 或 4-1。")?;
    if let Some((major, minor)) = text.split_once('-') {
        let major = major
            .parse::<usize>()
            .map_err(|_| "課號格式錯誤，例如 4-1。")?;
        let minor = minor
            .parse::<usize>()
            .map_err(|_| "子題格式錯誤，例如 4-1。")?;
        if sublessons::find(major, minor).is_none() {
            return Err("找不到這個子題。請用 cargo run -- lesson 查看目前所有章節與子題。".into());
        }
        Ok(LessonId {
            major,
            minor: Some(minor),
        })
    } else {
        let major = text
            .parse::<usize>()
            .ok()
            .filter(|n| *n <= 12)
            .ok_or("請提供課號 0 到 12，或使用 cargo run -- lesson 查看可用子題。")?;
        Ok(LessonId { major, minor: None })
    }
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
            let related: Vec<_> = sublessons::all()
                .iter()
                .filter(|e| e.id.starts_with(&format!("{n}-")))
                .collect();
            if !related.is_empty() {
                println!("\n本課相關節次（補充閱讀不另交作業）：");
                for exercise in related {
                    println!("  {}  {}", exercise.id, exercise.title);
                }
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
    if command == "lesson" && args.len() == 1 {
        overview();
        return Ok(());
    }
    if !matches!(
        command,
        "lesson" | "hint" | "answer" | "run" | "manual" | "test"
    ) {
        return Err(format!("未知指令：{command}。執行 cargo run 查看用法。"));
    }
    if args.len() != 2 {
        return Err("用法：cargo run -- lesson 1（每次提供一個課號）".into());
    }
    let id = number(args.get(1))?;
    if let Some(part) = id.minor {
        return sublessons::dispatch(sublessons::find(id.major, part).unwrap(), command);
    }
    let n = id.major;
    if n == 5 && matches!(command, "hint" | "answer") {
        return sublessons::dispatch(sublessons::find(5, 1).unwrap(), command);
    }
    match command {
        "run" => {
            if n == 0 {
                return Err("第零步沒有練習程式，請從第一課開始。".into());
            }
            if !checks::verify(n)? {
                process::exit(1);
            }
        }
        "manual" => execute(n, false)?,
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

#[cfg(test)]
mod cli_tests {
    use super::*;
    fn parse(s: &str) -> Result<LessonId, String> {
        number(Some(&s.to_string()))
    }
    #[test]
    fn accepts_main_and_sublesson() {
        assert_eq!(
            parse("4").unwrap(),
            LessonId {
                major: 4,
                minor: None
            }
        );
        assert_eq!(
            parse("4-1").unwrap(),
            LessonId {
                major: 4,
                minor: Some(1)
            }
        );
        assert_eq!(
            parse("4-7").unwrap(),
            LessonId {
                major: 4,
                minor: Some(7)
            }
        );
    }
    #[test]
    fn accepts_split_fifth_lesson() {
        assert_eq!(
            parse("5-1").unwrap(),
            LessonId {
                major: 5,
                minor: Some(1)
            }
        );
        assert_eq!(
            parse("5-2").unwrap(),
            LessonId {
                major: 5,
                minor: Some(2)
            }
        );
    }
    #[test]
    fn rejects_unknown_and_malformed() {
        for input in [
            "4-0", "4-99", "3-99", "5-0", "5-99", "13", "-1", "4-1-2", "4-", "x",
        ] {
            assert!(parse(input).is_err(), "{input}");
        }
    }
}
