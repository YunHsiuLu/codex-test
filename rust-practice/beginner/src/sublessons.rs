use crate::{
    runner::{self, Case},
    variants,
};
use std::{
    env,
    path::Path,
    process::{self, Command},
};
pub struct Fixture {
    pub name: &'static str,
    pub parameters: &'static [(&'static str, &'static str)],
    pub expected: &'static str,
    pub args: &'static [&'static str],
}
#[derive(Clone, Copy)]
pub enum Kind {
    Variants,
    Main(usize),
    Reading,
}
pub struct Exercise {
    pub kind: Kind,
    pub id: &'static str,
    pub title: &'static str,
    pub example: &'static str,
    pub lesson: &'static str,
    pub solution: &'static str,
    pub fixtures: &'static [Fixture],
}
#[path = "sublessons_data.rs"]
mod data;
pub fn all() -> &'static [Exercise] {
    data::EXERCISES
}
pub fn find(major: usize, part: usize) -> Option<&'static Exercise> {
    let id = format!("{major}-{part}");
    all().iter().find(|x| x.id == id)
}
fn matches_output(case: &Case, actual: &str) -> Result<(), String> {
    let actual = actual.replace("\r\n", "\n");
    if (case.expected.is_empty() && actual.is_empty())
        || (!case.expected.is_empty()
            && actual.trim_end_matches('\n') == case.expected.trim_end_matches('\n'))
    {
        Ok(())
    } else {
        Err("輸出不符合本筆資料，請檢查範圍、運算或排列格式。".into())
    }
}
pub fn verify_source(exercise: &Exercise, source: &Path) -> Result<bool, String> {
    match exercise.kind {
        Kind::Main(n) => return crate::checks::verify_source(n, source),
        Kind::Reading => return Err("補充教材沒有待評分的作答。".into()),
        Kind::Variants => {}
    }
    if exercise.fixtures.len() < 10 {
        return Err("子題至少需要十筆驗收資料。".into());
    }
    let root = Path::new(env!("CARGO_MANIFEST_DIR"));
    let parameters: Vec<_> = exercise.fixtures.iter().map(|f| f.parameters).collect();
    let copies = variants::prepare_parameters(root, source, &parameters)?;
    println!(
        "{}：{}\n在暫存副本代入 {} 筆設定，保留原始作答。",
        exercise.id,
        exercise.title,
        exercise.fixtures.len()
    );
    for fixture in exercise.fixtures {
        let settings = fixture
            .parameters
            .iter()
            .map(|(k, v)| format!("{k}={v}"))
            .collect::<Vec<_>>()
            .join("，");
        println!("  {}：{settings}", fixture.name);
    }
    let cases: Vec<_> = exercise
        .fixtures
        .iter()
        .map(|f| Case {
            name: f.name,
            input: "",
            expected: f.expected,
            args: f.args,
            exit: 0,
        })
        .collect();
    runner::check_validated(root, copies.path(), &cases, "", Some(matches_output))
}
pub fn dispatch(exercise: &Exercise, mode: &str) -> Result<(), String> {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"));
    if matches!(exercise.kind, Kind::Reading) {
        if mode == "lesson" {
            println!("{}", exercise.lesson);
        } else {
            println!(
                "{} 是補充教材，不需要提交程式，也沒有自動評分或獨立參考答案。\n請用 cargo run -- lesson {} 閱讀；回到主線：cargo run -- lesson {}。",
                exercise.id,
                exercise.id,
                exercise.id.split('-').next().unwrap()
            );
        }
        return Ok(());
    }
    match mode {
        "lesson" => {
            println!("{}", exercise.lesson.split("\n## 提示\n").next().unwrap());
            println!(
                "\n提示：cargo run -- hint {}\n參考答案：cargo run -- answer {}",
                exercise.id, exercise.id
            );
        }
        "hint" => println!(
            "{}",
            exercise
                .lesson
                .split_once("\n## 提示\n")
                .map(|(_, s)| s.split("\n## ").next().unwrap())
                .unwrap_or("請先追蹤迴圈每一輪的值。")
        ),
        "answer" => println!(
            "{} 參考解法\n\n```rust\n{}\n```",
            exercise.id, exercise.solution
        ),
        "run" | "test" => {
            if !verify_source(
                exercise,
                &root.join(format!("examples/{}.rs", exercise.example)),
            )? {
                process::exit(1);
            }
        }
        "manual" => {
            let status = Command::new(env::var_os("CARGO").unwrap_or_else(|| "cargo".into()))
                .current_dir(root)
                .args(["run", "--example", exercise.example])
                .status()
                .map_err(|e| e.to_string())?;
            if !status.success() {
                process::exit(status.code().unwrap_or(1));
            }
        }
        _ => return Err("不支援的子題指令。".into()),
    }
    Ok(())
}
