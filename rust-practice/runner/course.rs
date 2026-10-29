//! Course v2: real stdin/output, pure-function contracts, and student-designed tests.
use super::{Captured, Scratch, capture, normalize, rustc};
use std::{
    env, fs,
    path::{Path, PathBuf},
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};

#[derive(Clone, Copy)]
pub enum Rule {
    Text,
    Number,
    Greeting(u8),
}
pub struct IoCase {
    pub name: &'static str,
    pub input: &'static str,
    pub stdout: &'static str,
    pub stderr: &'static str,
    pub exit: i32,
    pub args: &'static [&'static str],
    pub rule: Rule,
}
pub struct Mutation {
    pub name: &'static str,
    pub code: &'static str,
}
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Kind {
    Program,
    Function,
    TestDesign,
    Project,
}
pub struct Exercise {
    pub id: &'static str,
    pub unit: usize,
    pub title: &'static str,
    pub kind: Kind,
    pub source: &'static str,
    pub solution: &'static str,
    pub target: &'static str,
    pub prompt: &'static str,
    pub hint: &'static str,
    pub support: bool,
    pub io: &'static [IoCase],
    pub harness: &'static str,
    pub subject: &'static str,
    pub mutations: &'static [Mutation],
}
pub struct Unit {
    pub id: usize,
    pub title: &'static str,
    pub text: &'static str,
}

fn scratch(root: &Path) -> Result<Scratch, String> {
    let serial = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_nanos();
    let path = root
        .parent()
        .ok_or("找不到 workspace")?
        .join("target")
        .join(format!("curriculum-{}-{serial}", std::process::id()));
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    Ok(Scratch(path))
}
fn compile(
    source: &Path,
    output: &Path,
    tests: bool,
    support: Option<&Path>,
    dir: &Path,
) -> Result<bool, String> {
    let mut command = rustc();
    command
        .args(["--edition=2024", "--crate-name", "course_submission"])
        .arg(source)
        .arg("-o")
        .arg(output);
    if tests {
        command.arg("--test");
    }
    if let Some(lib) = support {
        command
            .arg("--extern")
            .arg(format!("rust_beginner_course={}", lib.display()));
    }
    let result = capture(command, "", dir, 60)?;
    if result.timed_out || !result.status.success() {
        println!(
            "FAIL：編譯未完成。{}\n{}",
            if result.timed_out {
                "超過六十秒。"
            } else {
                ""
            },
            result.stderr
        );
        return Ok(false);
    }
    Ok(true)
}
fn support_library(root: &Path, dir: &Path) -> Result<Option<PathBuf>, String> {
    let output = dir.join("librust_beginner_course.rlib");
    let mut command = rustc();
    command
        .args([
            "--edition=2024",
            "--crate-type=rlib",
            "--crate-name",
            "rust_beginner_course",
        ])
        .arg(root.join("src/lib.rs"))
        .arg("-o")
        .arg(&output);
    let result = capture(command, "", dir, 60)?;
    if result.timed_out || !result.status.success() {
        return Err(format!("教學輸入工具編譯失敗：{}", result.stderr));
    }
    Ok(Some(output))
}
fn compare(case: &IoCase, actual: &str) -> bool {
    let value = normalize(actual);
    match case.rule {
        Rule::Text => {
            if case.stdout.is_empty() {
                actual.is_empty()
            } else {
                value == normalize(case.stdout)
            }
        }
        Rule::Number => {
            match (
                value.trim().parse::<f64>(),
                case.stdout.trim().parse::<f64>(),
            ) {
                (Ok(a), Ok(b)) => {
                    a.is_finite() && b.is_finite() && (a - b).abs() <= 1e-8 + 1e-9 * b.abs()
                }
                _ => false,
            }
        }
        Rule::Greeting(property) => {
            let lines: Vec<_> = value.lines().collect();
            let first = lines.first().copied().unwrap_or("");
            let second = lines.get(1).copied().unwrap_or("");
            match property {
                0 => value == normalize(case.stdout),
                1 => first == "Hello, Rust!",
                2 => second == "我正在學程式設計",
                3 => lines.len() == 2,
                4 => lines.iter().all(|s| !s.is_empty()) && !lines.is_empty(),
                5 => lines.iter().all(|s| s.trim_start() == *s),
                6 => lines.iter().all(|s| s.trim_end() == *s),
                7 => actual
                    .chars()
                    .all(|c| !c.is_control() || matches!(c, '\n' | '\r')),
                8 => first.is_ascii() && first.ends_with('!'),
                9 => second.chars().count() == 8 && second.starts_with("我正在學"),
                _ => false,
            }
        }
    }
}
fn test_count(binary: &Path, dir: &Path) -> Result<usize, String> {
    let mut command = Command::new(binary);
    command.args(["--list", "--format", "terse"]);
    let result = capture(command, "", dir, 3)?;
    if result.timed_out || !result.status.success() {
        return Err("無法列出測試。".into());
    }
    Ok(result
        .stdout
        .lines()
        .filter(|line| line.ends_with(": test"))
        .count())
}
fn run_tests(binary: &Path, root: &Path, dir: &Path) -> Result<Captured, String> {
    let mut command = Command::new(binary);
    command
        .current_dir(root)
        .args(["--test-threads=1", "--include-ignored", "--nocapture"]);
    capture(command, "", dir, 10)
}

/// Reference mode changes only the selected source path; it uses the same public checks.
pub fn check(root: &Path, exercise: &Exercise, reference: bool) -> Result<bool, String> {
    let source = root.join(if reference {
        exercise.solution
    } else {
        exercise.source
    });
    check_source(root, exercise, &source)
}
pub fn check_source(root: &Path, exercise: &Exercise, source: &Path) -> Result<bool, String> {
    let source = fs::canonicalize(source).map_err(|e| format!("讀取作答失敗：{e}"))?;
    let temp = scratch(root)?;
    let dir = &temp.0;
    let support = if exercise.support {
        support_library(root, dir)?
    } else {
        None
    };
    let binary = dir.join(format!("submission{}", env::consts::EXE_SUFFIX));
    println!("\n{} {}", exercise.id, exercise.title);
    if exercise.kind == Kind::TestDesign {
        return check_designed_tests(root, exercise, &source, &binary, dir);
    }
    if exercise.kind == Kind::Function {
        let wrapper = dir.join("contract.rs");
        fs::write(
            &wrapper,
            format!(
                "include!({:?});\n{}",
                source.to_string_lossy(),
                exercise.harness
            ),
        )
        .map_err(|e| e.to_string())?;
        if !compile(&wrapper, &binary, true, support.as_deref(), dir)? {
            return Ok(false);
        }
        let count = test_count(&binary, dir)?;
        if count < 10 {
            return Err("教材驗收資料不足十項，請通知維護者。".into());
        }
        let result = run_tests(&binary, root, dir)?;
        print!("{}", result.stdout);
        let passed = if result.status.success() && !result.timed_out {
            count
        } else {
            result
                .stdout
                .lines()
                .filter(|s| s.starts_with("test ") && s.ends_with(" ... ok"))
                .count()
                .min(count)
        };
        if result.timed_out {
            println!("FAIL：測試超過十秒。");
        }
        if !result.status.success() {
            print!("{}", result.stderr);
        }
        println!("驗收：{passed}/{count} 項。範圍：函式契約；main 只供示範。\n");
        return Ok(passed == count && !result.timed_out && result.status.success());
    }
    if exercise.io.len() < 10 {
        return Err("教材輸入／輸出案例不足十項。".into());
    }
    if !compile(&source, &binary, false, support.as_deref(), dir)? {
        return Ok(false);
    }
    let mut passed = 0;
    let mut cache = std::collections::HashMap::<(String, Vec<&str>), Captured>::new();
    for case in exercise.io {
        let key = (case.input.to_owned(), case.args.to_vec());
        let result = if let Some(result) = cache.get(&key) {
            result.clone()
        } else {
            let mut command = Command::new(&binary);
            command.current_dir(root).args(case.args);
            let result = capture(command, case.input, dir, 3)?;
            cache.insert(key, result.clone());
            result
        };
        let stderr_matches = if case.stderr.is_empty() {
            result.stderr.is_empty()
        } else {
            normalize(&result.stderr) == normalize(case.stderr)
        };
        let okay = !result.timed_out
            && result.status.code() == Some(case.exit)
            && compare(case, &result.stdout)
            && stderr_matches;
        if okay {
            passed += 1;
            println!("  PASS  {}", case.name);
        } else {
            println!(
                "  FAIL  {}\n    stdin={:?} args={:?}\n    預期 stdout={:?} stderr={:?} exit={}\n    實際 stdout={:?} stderr={:?} exit={:?}{}",
                case.name,
                case.input,
                case.args,
                case.stdout,
                case.stderr,
                case.exit,
                result.stdout,
                result.stderr,
                result.status.code(),
                if result.timed_out {
                    "（超過三秒）"
                } else {
                    ""
                }
            );
        }
    }
    println!(
        "驗收：{passed}/{} 項。範圍：stdin、stdout、stderr 與退出碼。",
        exercise.io.len()
    );
    Ok(passed == exercise.io.len())
}
fn check_designed_tests(
    root: &Path,
    exercise: &Exercise,
    source: &Path,
    binary: &Path,
    dir: &Path,
) -> Result<bool, String> {
    if exercise.mutations.len() < 9 {
        return Err("測試設計作業至少需要九個故障版本。".into());
    }
    let wrapper = dir.join("student_tests.rs");
    let write = |code: &str| -> Result<(), String> {
        fs::write(
            &wrapper,
            format!(
                "mod subject {{\n{code}\n}}\n#[cfg(test)] mod student_tests {{ include!({:?}); }}",
                source.to_string_lossy()
            ),
        )
        .map_err(|e| e.to_string())
    };
    write(exercise.subject)?;
    if !compile(&wrapper, binary, true, None, dir)? {
        return Ok(false);
    }
    let count = test_count(binary, dir)?;
    if count == 0 {
        println!("FAIL：沒有學生測試，不能視為完成。");
        return Ok(false);
    }
    let baseline = run_tests(binary, root, dir)?;
    if baseline.timed_out || !baseline.status.success() {
        println!(
            "FAIL：正確版本必須通過你的測試。\n{}\n{}",
            baseline.stdout, baseline.stderr
        );
        return Ok(false);
    }
    println!("  PASS  正確版本通過（{count} 個學生測試）");
    let mut passed = 1;
    for mutation in exercise.mutations {
        write(mutation.code)?;
        if !compile(&wrapper, binary, true, None, dir)? {
            println!(
                "  FAIL  {}：故障版未能編譯，不算抓到行為錯誤。",
                mutation.name
            );
            continue;
        }
        let result = run_tests(binary, root, dir)?;
        // A timeout, panic in a worker process, or malformed harness is not evidence of an assertion catching a bug.
        let failed_assertion =
            result.stdout.contains(" ... FAILED") && result.stdout.contains("test result: FAILED");
        if !result.timed_out && result.status.code() == Some(101) && failed_assertion {
            passed += 1;
            println!("  PASS  抓到：{}", mutation.name);
        } else {
            println!(
                "  FAIL  未抓到：{}{}",
                mutation.name,
                if result.timed_out {
                    "（逾時不計通過）"
                } else {
                    ""
                }
            );
        }
    }
    let total = exercise.mutations.len() + 1;
    println!("驗收：{passed}/{total} 項。範圍：正確版及故障版；不是十種鍵盤輸入。");
    Ok(passed == total)
}

#[cfg(test)]
mod tests {
    use super::*;
    fn sample(rule: Rule, expected: &'static str) -> IoCase {
        IoCase {
            name: "unit",
            input: "",
            stdout: expected,
            stderr: "",
            exit: 0,
            args: &[],
            rule,
        }
    }
    #[test]
    fn text_accepts_crlf_but_preserves_spaces() {
        let c = sample(Rule::Text, "a\nb");
        assert!(compare(&c, "a\r\nb\r\n"));
        assert!(!compare(&c, "a\n b\n"));
    }
    #[test]
    fn empty_output_really_means_empty() {
        let c = sample(Rule::Text, "");
        assert!(compare(&c, ""));
        assert!(!compare(&c, "\n"));
    }
    #[test]
    fn numbers_reject_nonfinite_and_extra_text() {
        let c = sample(Rule::Number, "1.5");
        assert!(compare(&c, "1.5000000001\n"));
        for s in ["NaN", "inf", "1.5 debug"] {
            assert!(!compare(&c, s));
        }
    }
    #[test]
    fn greeting_properties_accept_the_spec() {
        for property in 0..10 {
            let c = sample(Rule::Greeting(property), "Hello, Rust!\n我正在學程式設計\n");
            assert!(compare(&c, c.stdout), "{property}");
        }
    }
}
