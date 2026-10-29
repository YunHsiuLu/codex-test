mod catalog;
#[path = "../../runner/mod.rs"]
#[allow(dead_code)]
mod runner;
use runner::course::{Exercise, Kind};
use std::{
    env, fs,
    path::Path,
    process::{self, Command},
};

fn overview() {
    println!("Rust Beginner Course｜Rust 程式設計課程\n");
    for unit in catalog::UNITS {
        println!("{:02}  {}", unit.id, unit.title);
        for item in catalog::EXERCISES.iter().filter(|e| e.unit == unit.id) {
            let mode = match item.kind {
                Kind::Program => "程式輸入輸出",
                Kind::Function => "函式契約",
                Kind::TestDesign => "測試設計",
                Kind::Project => "整合專案",
            };
            println!("    {}  {}【{}】", item.id, item.title, mode);
        }
    }
    println!(
        "\n閱讀單元：cargo run -- lesson 2\n閱讀作業：cargo run -- lesson 2-1\n自動驗收：cargo run -- run 2-1\n手動操作：cargo run -- manual 2-1\n提示／答案：cargo run -- hint 2-1 ／ cargo run -- answer 2-1\nrun 2 可驗收該單元全部作業；test 與 run 同義。\n原生工具：cargo run --example unit02_01\n這些 lesson／run 是本課程程式定義的命令，-- 把參數交給它。"
    );
}
fn find(id: &str) -> Result<&'static Exercise, String> {
    catalog::EXERCISES.iter().find(|e|e.id==id).ok_or_else(||format!("找不到作業 {id}。請用 cargo run -- lesson 查看課號；新版作業例如 2-1，舊 stepNN 已重製。"))
}
fn manual(root: &Path, item: &Exercise, args: &[String]) -> Result<i32, String> {
    let mut command = Command::new(env::var_os("CARGO").unwrap_or_else(|| "cargo".into()));
    command.current_dir(root);
    if item.kind == Kind::Project {
        command.args(["run", "--manifest-path", item.target]);
    } else if item.kind == Kind::TestDesign {
        command.args(["test", "--example", item.target]);
        if !args.is_empty() {
            return Err("測試設計作業的 manual 不接受程式參數。".into());
        }
    } else {
        command.args(["run", "--example", item.target]);
    }
    if !args.is_empty() {
        command.arg("--").args(args);
    }
    Ok(command
        .status()
        .map_err(|e| format!("無法啟動 Cargo：{e}"))?
        .code()
        .unwrap_or(1))
}
fn answer(root: &Path, item: &Exercise) -> Result<(), String> {
    let path = root.join(item.solution);
    println!("參考答案只是一種設計；請先完成並解釋自己的程式。\n");
    if item.kind == Kind::Project {
        let mut files: Vec<_> = fs::read_dir(path.parent().ok_or("答案路徑錯誤")?)
            .map_err(|e| e.to_string())?
            .filter_map(Result::ok)
            .map(|e| e.path())
            .filter(|p| matches!(p.extension().and_then(|s| s.to_str()), Some("rs" | "md")))
            .collect();
        files.sort();
        for file in files {
            println!(
                "\n{}\n```{}\n{}\n```",
                file.file_name().unwrap().to_string_lossy(),
                if file.extension().and_then(|e| e.to_str()) == Some("rs") {
                    "rust"
                } else {
                    "markdown"
                },
                fs::read_to_string(&file).map_err(|e| e.to_string())?
            );
        }
    } else {
        println!(
            "```rust\n{}\n```",
            fs::read_to_string(path).map_err(|e| e.to_string())?
        );
    }
    Ok(())
}
fn run() -> Result<i32, String> {
    let args: Vec<_> = env::args().skip(1).collect();
    let mode = args.first().map(String::as_str).unwrap_or("help");
    if matches!(mode, "help" | "list" | "--help" | "-h") || (mode == "lesson" && args.len() == 1) {
        if args.len() > 1 {
            return Err("總覽指令不接受額外參數。".into());
        }
        overview();
        return Ok(0);
    }
    let root = Path::new(env!("CARGO_MANIFEST_DIR"));
    if mode == "verify-solutions" {
        if args.len() > 1 {
            return Err("verify-solutions 不接受額外參數。".into());
        }
        let mut passed = 0;
        for item in catalog::EXERCISES {
            if runner::course::check(root, item, true)? {
                passed += 1;
            }
        }
        println!("REFERENCE {passed}/{}", catalog::EXERCISES.len());
        return Ok(if passed == catalog::EXERCISES.len() {
            0
        } else {
            1
        });
    }
    if !matches!(
        mode,
        "lesson" | "run" | "test" | "manual" | "hint" | "answer"
    ) {
        return Err(format!(
            "未知指令 {mode}。請用 cargo run -- lesson 查看用法。"
        ));
    }
    let id = args
        .get(1)
        .ok_or("請提供單元或作業課號，例如 lesson 2 或 run 2-1。")?;
    if mode != "manual" && args.len() != 2 {
        return Err("這個指令只能接一個課號；例如 lesson 2-1。".into());
    }
    if let Ok(unit) = id.parse::<usize>() {
        let lesson = catalog::UNITS
            .iter()
            .find(|u| u.id == unit)
            .ok_or("單元為 0～12。")?;
        if mode == "lesson" {
            println!("{}", lesson.text);
            return Ok(0);
        }
        if matches!(mode, "run" | "test") {
            let items: Vec<_> = catalog::EXERCISES
                .iter()
                .filter(|e| e.unit == unit)
                .collect();
            if items.is_empty() {
                return Err("本單元是環境準備，請依單元中的人工驗收清單操作。".into());
            }
            let mut okay = true;
            for item in items {
                okay = runner::course::check(root, item, false)? && okay;
            }
            return Ok(if okay { 0 } else { 1 });
        }
        return Err(format!("{mode} 請指定作業課號，例如 {unit}-1。"));
    }
    let item = find(id)?;
    match mode {
        "lesson" => println!("{}", item.prompt),
        "hint" => println!("{}", item.hint),
        "answer" => answer(root, item)?,
        "manual" => return manual(root, item, &args[2..]),
        "run" | "test" => {
            return Ok(if runner::course::check(root, item, false)? {
                0
            } else {
                1
            });
        }
        _ => unreachable!(),
    }
    Ok(0)
}
fn main() {
    match run() {
        Ok(code) => process::exit(code),
        Err(message) => {
            eprintln!("{message}");
            process::exit(2);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn all_exercises_have_unique_ids() {
        let mut seen = std::collections::HashSet::new();
        for e in catalog::EXERCISES {
            assert!(seen.insert(e.id));
            assert!((1..=12).contains(&e.unit));
        }
    }
    #[test]
    fn unknown_exercises_are_rejected() {
        for id in ["99-1", "4-99", "4--1", "4-01", ""] {
            assert!(find(id).is_err());
        }
    }
}
