//! Local course checks. Student sources are never edited.
#[allow(dead_code)]
pub mod course;
use std::{
    env, fs,
    path::{Path, PathBuf},
    process::{Command, ExitStatus, Stdio},
    thread,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

pub struct Case {
    pub name: &'static str,
    pub input: &'static str,
    pub expected: &'static str,
    pub args: &'static [&'static str],
    pub exit: i32,
}

type Validator = fn(&Case, &str) -> Result<(), String>;
struct Scratch(PathBuf);
impl Drop for Scratch {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}
#[derive(Clone)]
struct Captured {
    status: ExitStatus,
    stdout: String,
    stderr: String,
    timed_out: bool,
}
fn capture(
    mut command: Command,
    input: &str,
    dir: &Path,
    seconds: u64,
) -> Result<Captured, String> {
    // Files avoid pipe deadlock if a student produces a large amount of output.
    let stdin_path = dir.join("stdin");
    let out_path = dir.join("stdout");
    let err_path = dir.join("stderr");
    fs::write(&stdin_path, input).map_err(|e| e.to_string())?;
    command.stdin(Stdio::from(
        fs::File::open(&stdin_path).map_err(|e| e.to_string())?,
    ));
    command.stdout(Stdio::from(
        fs::File::create(&out_path).map_err(|e| e.to_string())?,
    ));
    command.stderr(Stdio::from(
        fs::File::create(&err_path).map_err(|e| e.to_string())?,
    ));
    let mut child = command.spawn().map_err(|e| format!("無法啟動程序：{e}"))?;
    let deadline = Instant::now() + Duration::from_secs(seconds);
    let mut timed_out = false;
    let status = loop {
        if let Some(status) = child.try_wait().map_err(|e| e.to_string())? {
            break status;
        }
        if Instant::now() >= deadline {
            timed_out = true;
            let _ = child.kill();
            break child.wait().map_err(|e| e.to_string())?;
        }
        thread::sleep(Duration::from_millis(15));
    };
    // Bound diagnostics shown to students; no need to print megabytes on failure.
    fn read(path: &Path) -> String {
        use std::io::Read;
        let mut bytes = Vec::new();
        if let Ok(file) = fs::File::open(path) {
            let _ = file.take(64 * 1024 + 1).read_to_end(&mut bytes);
        }
        let truncated = bytes.len() > 64 * 1024;
        bytes.truncate(64 * 1024);
        let mut value = String::from_utf8_lossy(&bytes).into_owned();
        if truncated {
            value.push_str("\n[輸出超過 64 KiB，已截斷]");
        }
        value
    }
    Ok(Captured {
        status,
        stdout: read(&out_path),
        stderr: read(&err_path),
        timed_out,
    })
}
fn normalize(text: &str) -> String {
    text.replace("\r\n", "\n").trim_end_matches('\n').to_owned()
}
fn rustc() -> Command {
    Command::new(env::var_os("RUSTC").unwrap_or_else(|| "rustc".into()))
}
fn compile(source: &Path, output: &Path, test: bool, dir: &Path) -> Result<bool, String> {
    let mut command = rustc();
    command
        .args(["--edition=2024", "--crate-name", "course_exercise"])
        .arg(source)
        .arg("-o")
        .arg(output);
    if test {
        command.arg("--test");
    }
    let result = capture(command, "", dir, 60)?;
    if result.timed_out {
        println!("失敗：編譯超過 60 秒。");
        return Ok(false);
    }
    if !result.status.success() {
        println!("失敗：程式無法編譯。\n{}", result.stderr);
        return Ok(false);
    }
    Ok(true)
}

pub fn check(
    course_dir: &Path,
    source: &Path,
    cases: &[Case],
    harness: &str,
) -> Result<bool, String> {
    check_validated(course_dir, source, cases, harness, None)
}
pub fn check_validated(
    course_dir: &Path,
    source: &Path,
    cases: &[Case],
    harness: &str,
    validator: Option<Validator>,
) -> Result<bool, String> {
    let workspace = course_dir.parent().ok_or("找不到 workspace")?;
    let serial = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_nanos();
    let scratch = Scratch(
        workspace
            .join("target")
            .join(format!("course-check-{}-{serial}", std::process::id())),
    );
    fs::create_dir_all(&scratch.0).map_err(|e| e.to_string())?;
    let source = fs::canonicalize(source).map_err(|e| format!("讀取作答失敗：{e}"))?;
    let program = scratch
        .0
        .join(format!("program{}", env::consts::EXE_SUFFIX));
    let tests = scratch.0.join(format!("tests{}", env::consts::EXE_SUFFIX));
    let mut passed = 0;
    let mut total = 0;
    let mut cache = std::collections::HashMap::new();
    if !cases.is_empty() {
        println!("編譯作答並驗證輸入／輸出……");
        if !compile(&source, &program, false, &scratch.0)? {
            return Ok(false);
        }
        for case in cases {
            total += 1;
            let key = (case.input.to_owned(), case.args.to_vec());
            let result = if let Some(previous) = cache.get(&key) {
                Captured::clone(previous)
            } else {
                let mut command = Command::new(&program);
                command.current_dir(course_dir).args(case.args);
                let result = capture(command, case.input, &scratch.0, 3)?;
                cache.insert(key, result.clone());
                result
            };
            let comparison = if let Some(validate) = validator {
                validate(case, &result.stdout)
            } else if normalize(&result.stdout) == normalize(case.expected) {
                Ok(())
            } else {
                Err("輸出與預期不符".into())
            };
            if !result.timed_out && result.status.code() == Some(case.exit) && comparison.is_ok() {
                passed += 1;
                println!("  PASS  {}", case.name);
            } else {
                println!("  FAIL  {}", case.name);
                if result.timed_out {
                    println!("    超過 3 秒，已停止。請檢查無限迴圈或是否在等待額外輸入。");
                }
                if result.status.code() != Some(case.exit) {
                    println!(
                        "    預期退出碼：{}；實際：{:?}",
                        case.exit,
                        result.status.code()
                    );
                }
                if let Err(message) = comparison {
                    println!("    {message}");
                }
                println!(
                    "    測試輸入：{:?}\n    預期輸出：{:?}\n    實際輸出：{:?}",
                    case.input, case.expected, result.stdout
                );
                if !result.stderr.is_empty() {
                    println!("    stderr：\n{}", result.stderr);
                }
            }
        }
    }
    if !harness.trim().is_empty() {
        let wrapper = scratch.0.join("checks.rs");
        fs::write(
            &wrapper,
            format!("include!({:?});\n{harness}\n", source.to_string_lossy()),
        )
        .map_err(|e| e.to_string())?;
        println!("編譯獨立的函式與邊界測試……");
        if !compile(&wrapper, &tests, true, &scratch.0)? {
            return Ok(false);
        }
        let mut listing = Command::new(&tests);
        listing.args(["--list", "--format", "terse"]);
        let listed = capture(listing, "", &scratch.0, 3)?;
        if !listed.status.success() || listed.timed_out {
            return Err("無法取得驗收測試清單。".into());
        }
        let test_count = listed
            .stdout
            .lines()
            .filter(|line| line.ends_with(": test"))
            .count();
        if test_count == 0 {
            return Err("驗收測試清單為空，不能視為通過。".into());
        }
        total += test_count;
        let mut command = Command::new(&tests);
        command.current_dir(course_dir).args([
            "--nocapture",
            "--test-threads=1",
            "--include-ignored",
        ]);
        let result = capture(command, "", &scratch.0, 10)?;
        print!("{}", result.stdout);
        if result.status.success() && !result.timed_out {
            passed += test_count;
        } else {
            passed += result
                .stdout
                .lines()
                .filter(|line| line.starts_with("test ") && line.ends_with(" ... ok"))
                .count()
                .min(test_count);
            if result.timed_out {
                println!("FAIL：函式測試超過 10 秒，已停止。");
            }
            if !result.stderr.is_empty() {
                println!("{}", result.stderr);
            }
        }
    }
    if total == 0 {
        return Err("本題尚未設定驗收資料。".into());
    }
    println!(
        "\n驗收：{passed}/{total} 組通過。{}",
        if passed == total {
            "已通過目前測試資料；仍需能解釋設計與限制。"
        } else {
            "請依差異與失敗案例修正。"
        }
    );
    Ok(passed == total)
}
