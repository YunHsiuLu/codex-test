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
fn temperature_output(case: &Case, stdout: &str) -> Result<(), String> {
    let parts: Vec<_> = stdout.split_whitespace().collect();
    if parts.len() != 5 || parts[1] != "C" || parts[2] != "=" || parts[4] != "F" {
        return Err("請輸出「攝氏值 C = 華氏值 F」。".into());
    }
    let c = parts[0].parse::<f64>().map_err(|_| "攝氏值不是數字")?;
    let f = parts[3].parse::<f64>().map_err(|_| "華氏值不是數字")?;
    let expected_c = case
        .expected
        .split_whitespace()
        .next()
        .unwrap()
        .parse::<f64>()
        .unwrap();
    if (c - expected_c).abs() > 1e-9 {
        return Err(format!("本案例代入攝氏 {expected_c}，程式卻輸出攝氏 {c}"));
    }
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
fn sum_output(case: &Case, stdout: &str) -> Result<(), String> {
    if stdout.trim() == case.expected.trim() {
        Ok(())
    } else {
        Err(format!("本案例預期總和 {}", case.expected.trim()))
    }
}
fn greeting_output(case: &Case, stdout: &str) -> Result<(), String> {
    let normalized = stdout.replace("\r\n", "\n");
    let lines: Vec<_> = normalized.trim_end_matches('\n').lines().collect();
    let first = lines.first().copied().unwrap_or("");
    let second = lines.get(1).copied().unwrap_or("");
    let ok = match case.name {
        "恰好兩行" => lines.len() == 2,
        "第一行問候文字" => first == "Hello, Rust!",
        "第二行學習文字" => second == "我正在學 Rust",
        "先問候再自我介紹" => normalized
            .find("Hello, Rust!")
            .zip(normalized.find("我正在學 Rust"))
            .is_some_and(|(a, b)| a < b),
        "沒有空白資料行" => !lines.is_empty() && lines.iter().all(|l| !l.is_empty()),
        "行首沒有多餘空白" => lines.iter().all(|l| l.trim_start() == *l),
        "行尾沒有多餘空白" => lines.iter().all(|l| l.trim_end() == *l),
        "不含終端機控制碼" => normalized.chars().all(|c| !c.is_control() || c == '\n'),
        "問候行採英文半形字元" => !first.is_empty() && first.is_ascii(),
        "中文與字元數正確" => {
            second.starts_with("我正在學 ") && second.chars().count() == 9
        }
        _ => false,
    };
    if ok {
        Ok(())
    } else {
        Err(format!("未符合輸出規格：{}", case.name))
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
    if (2..=4).contains(&n) {
        return verify_variants(n, root, source);
    }
    let cases = match n {
        1 => [
            "恰好兩行",
            "第一行問候文字",
            "第二行學習文字",
            "先問候再自我介紹",
            "沒有空白資料行",
            "行首沒有多餘空白",
            "行尾沒有多餘空白",
            "不含終端機控制碼",
            "問候行採英文半形字元",
            "中文與字元數正確",
        ]
        .into_iter()
        .map(|name| output(name, "", "Hello, Rust!\n我正在學 Rust\n"))
        .collect(),
        6 => vec![
            output("室溫", "25\n", "77 F"),
            output("冰點", "0\n", "32 F"),
            output("沸點", "100\n", "212 F"),
            output("負溫", "-40\n", "-40 F"),
            output("小數與空白", " 12.5 \n", "54.5 F"),
            output("非數字", "abc\n", "請輸入數字"),
            output("空白輸入", "\n", "請輸入數字"),
            output("零下十度", "-10\n", "14 F"),
            output("人體溫度", "37\n", "98.6 F"),
            output("正負號", "+20\n", "68 F"),
            output("科學記號", "1e2\n", "212 F"),
            output("混入文字", "25abc\n", "請輸入數字"),
            output("多個數字", "1 2\n", "請輸入數字"),
            output("CRLF輸入", "10\r\n", "50 F"),
        ],
        _ => vec![],
    };
    let validator: Option<fn(&Case, &str) -> Result<(), String>> = match n {
        1 => Some(greeting_output),
        6 => Some(input_temperature),
        _ => None,
    };
    if validator.is_some() {
        runner::check_validated(root, source, &cases, harness, validator)
    } else {
        runner::check(root, source, &cases, harness)
    }
}

fn verify_variants(n: usize, root: &Path, source: &Path) -> Result<bool, String> {
    let (values, expected): (&[&str], &[&str]) = match n {
        2 => (
            &[
                "0.0", "25.0", "100.0", "-40.0", "-273.15", "37.0", "12.5", "-10.0", "20.0", "50.0",
            ],
            &[
                "0 C = 32 F",
                "25 C = 77 F",
                "100 C = 212 F",
                "-40 C = -40 F",
                "-273.15 C = -459.67 F",
                "37 C = 98.6 F",
                "12.5 C = 54.5 F",
                "-10 C = 14 F",
                "20 C = 68 F",
                "50 C = 122 F",
            ],
        ),
        3 => (
            &["0", "10", "30", "58", "59", "60", "61", "70", "99", "100"],
            &[
                "再試一次",
                "再試一次",
                "再試一次",
                "再試一次",
                "再試一次",
                "及格",
                "及格",
                "及格",
                "及格",
                "及格",
            ],
        ),
        4 => (
            &["0", "1", "2", "3", "4", "5", "10", "20", "50", "100"],
            &["0", "1", "3", "6", "10", "15", "55", "210", "1275", "5050"],
        ),
        _ => unreachable!(),
    };
    const NAMES: [&str; 10] = [
        "資料01", "資料02", "資料03", "資料04", "資料05", "資料06", "資料07", "資料08", "資料09",
        "資料10",
    ];
    const ARGS: [&[&str]; 10] = [
        &["0"],
        &["1"],
        &["2"],
        &["3"],
        &["4"],
        &["5"],
        &["6"],
        &["7"],
        &["8"],
        &["9"],
    ];
    let variants = crate::variants::prepare(root, source, n, values)?;
    println!("驗收使用暫存副本代入十組初始值；原始作答不會被修改。");
    for (i, value) in values.iter().enumerate() {
        println!("  {}：設定 {}，預期 {}", NAMES[i], value, expected[i]);
    }
    let cases: Vec<_> = (0..10)
        .map(|i| Case {
            name: NAMES[i],
            input: "",
            expected: expected[i],
            args: ARGS[i],
            exit: 0,
        })
        .collect();
    match n {
        2 => runner::check_validated(root, variants.path(), &cases, "", Some(temperature_output)),
        4 => runner::check_validated(root, variants.path(), &cases, "", Some(sum_output)),
        _ => runner::check(root, variants.path(), &cases, ""),
    }
}
