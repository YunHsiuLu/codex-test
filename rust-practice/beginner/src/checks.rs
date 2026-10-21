use crate::runner::{self, Case};
use std::path::Path;
fn output(name: &'static str, input: &'static str, expected: &'static str) -> Case {
    Case {
        name,
        input,
        expected,
        args: &[],
        exit: 0,
    }
}
fn temperature_output(_: &Case, stdout: &str) -> Result<(), String> {
    let parts: Vec<_> = stdout.split_whitespace().collect();
    if parts.len() != 5 || parts[1] != "C" || parts[2] != "=" || parts[4] != "F" {
        return Err("請輸出「攝氏值 C = 華氏值 F」。".into());
    }
    let c = parts[0].parse::<f64>().map_err(|_| "攝氏值不是數字")?;
    let f = parts[3].parse::<f64>().map_err(|_| "華氏值不是數字")?;
    let want = c * 9.0 / 5.0 + 32.0;
    if c.is_finite()
        && f.is_finite()
        && want.is_finite()
        && (f - want).abs() <= 1e-9 * want.abs().max(1.0)
    {
        Ok(())
    } else {
        Err(format!("攝氏 {c} 應換算為華氏 {want}，實際為 {f}"))
    }
}
fn sum_output(_: &Case, stdout: &str) -> Result<(), String> {
    match stdout.trim() {
        "15" | "5050" => Ok(()),
        _ => Err("本題請計算 1 到 5（15），或課程延伸的 1 到 100（5050）。".into()),
    }
}
fn input_temperature(case: &Case, stdout: &str) -> Result<(), String> {
    let normalized = stdout.replace("\r\n", "\n");
    let answer = normalized
        .strip_prefix("輸入攝氏溫度：\n")
        .unwrap_or(&normalized)
        .trim_end_matches('\n');
    if case.expected == "請輸入數字" {
        if answer == case.expected {
            Ok(())
        } else {
            Err("非數字輸入應顯示「請輸入數字」。".into())
        }
    } else {
        let tokens: Vec<_> = answer.split_whitespace().collect();
        let want = case
            .expected
            .split_whitespace()
            .next()
            .unwrap()
            .parse::<f64>()
            .unwrap();
        if tokens.len() == 2
            && tokens[1] == "F"
            && tokens[0]
                .parse::<f64>()
                .is_ok_and(|v| v.is_finite() && (v - want).abs() < 1e-9)
        {
            Ok(())
        } else {
            Err("請輸出換算結果及 F，例如 77 F（可保留起始的輸入提示行）。".into())
        }
    }
}
pub fn verify(n: usize) -> Result<bool, String> {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"));
    verify_source(n, &root.join(format!("examples/step{n:02}.rs")))
}
pub fn verify_source(n: usize, source: &Path) -> Result<bool, String> {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"));
    let harness = match n {
        5 => include_str!("../checks/step05.rs"),
        7 => include_str!("../checks/step07.rs"),
        8 => include_str!("../checks/step08.rs"),
        9 => include_str!("../checks/step09.rs"),
        10 => include_str!("../checks/step10.rs"),
        11 => include_str!("../checks/step11.rs"),
        12 => include_str!("../checks/step12.rs"),
        _ => "",
    };
    let cases = match n {
        1 => vec![output(
            "第一支程式的兩行輸出",
            "",
            "Hello, Rust!\n我正在學 Rust\n",
        )],
        2 => vec![output("驗證目前程式設定的溫度換算", "", "25 C = 77 F\n")],
        3 => vec![output("原題 score = 60 的及格邊界", "", "及格\n")],
        4 => vec![output("1..=5 或延伸的 1..=100 總和", "", "15\n")],
        6 => vec![
            output("室溫", "25\n", "77 F"),
            output("冰點", "0\n", "32 F"),
            output("沸點", "100\n", "212 F"),
            output("負溫", "-40\n", "-40 F"),
            output("小數與空白", " 12.5 \n", "54.5 F"),
            output("非數字", "abc\n", "請輸入數字"),
            output("空白輸入", "\n", "請輸入數字"),
        ],
        _ => vec![],
    };
    let validator: Option<fn(&Case, &str) -> Result<(), String>> = match n {
        2 => Some(temperature_output),
        4 => Some(sum_output),
        6 => Some(input_temperature),
        _ => None,
    };
    if validator.is_some() {
        runner::check_validated(root, source, &cases, harness, validator)
    } else {
        runner::check(root, source, &cases, harness)
    }
}
