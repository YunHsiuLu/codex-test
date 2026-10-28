//! Controlled test copies for pre-input lessons. Never writes student sources.
use std::{
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};
struct Token {
    text: String,
    start: usize,
    end: usize,
}
// This is a narrow tokenizer for the course templates, not a Rust parser.
fn tokens(source: &str) -> Vec<Token> {
    let bytes = source.as_bytes();
    let mut i = 0;
    let mut out = Vec::new();
    while i < bytes.len() {
        if bytes[i].is_ascii_whitespace() {
            i += 1;
            continue;
        }
        if bytes.get(i..i + 2) == Some(b"//") {
            while i < bytes.len() && bytes[i] != b'\n' {
                i += 1;
            }
            continue;
        }
        if bytes.get(i..i + 2) == Some(b"/*") {
            i += 2;
            let mut depth = 1;
            while i < bytes.len() && depth > 0 {
                if bytes.get(i..i + 2) == Some(b"/*") {
                    depth += 1;
                    i += 2;
                } else if bytes.get(i..i + 2) == Some(b"*/") {
                    depth -= 1;
                    i += 2;
                } else {
                    i += 1;
                }
            }
            continue;
        }
        // Skip ordinary quoted strings, including escaped quotes.
        if bytes[i] == b'"' {
            i += 1;
            while i < bytes.len() {
                if bytes[i] == b'\\' {
                    i = (i + 2).min(bytes.len());
                } else if bytes[i] == b'"' {
                    i += 1;
                    break;
                } else {
                    i += 1;
                }
            }
            continue;
        }
        let start = i;
        if bytes[i].is_ascii_alphabetic() || bytes[i] == b'_' {
            i += 1;
            while i < bytes.len() && (bytes[i].is_ascii_alphanumeric() || bytes[i] == b'_') {
                i += 1;
            }
        } else if bytes.get(i..i + 3) == Some(b"..=") {
            i += 3;
        } else {
            i += 1;
            while !source.is_char_boundary(i) {
                i += 1;
            }
        }
        out.push(Token {
            text: source[start..i].into(),
            start,
            end: i,
        });
    }
    out
}
fn replace_binding(source: &str, binding: &str, value: &str) -> Result<String, String> {
    let ts = tokens(source);
    for (i, t) in ts.iter().enumerate() {
        if t.text != "let" {
            continue;
        }
        let mut name = i + 1;
        if ts.get(name).is_some_and(|t| t.text == "mut") {
            name += 1;
        }
        if !ts.get(name).is_some_and(|t| t.text == binding) {
            continue;
        }
        let eq = (name + 1..ts.len())
            .take_while(|&j| ts[j].text != ";")
            .find(|&j| ts[j].text == "=")
            .ok_or_else(|| format!("找不到 {binding} 的初始值。"))?;
        let mut depth = 0;
        let mut end = None;
        for j in eq + 1..ts.len() {
            match ts[j].text.as_str() {
                "(" | "[" | "{" => depth += 1,
                ")" | "]" | "}" => depth -= 1,
                ";" if depth == 0 => {
                    end = Some(j);
                    break;
                }
                _ => {}
            }
        }
        let end = end.ok_or("初始值後需要分號。")?;
        let mut result = source.to_owned();
        result.replace_range(ts[eq].end..ts[end].start, &format!(" {value}"));
        return Ok(result);
    }
    Err(format!(
        "驗收需要保留原題的 let {binding} 初始值設定；請勿更名。"
    ))
}
fn replace_limit(source: &str, value: &str) -> Result<String, String> {
    let ts = tokens(source);
    for i in 0..ts.len() {
        if ts[i].text != "for" {
            continue;
        }
        let Some(in_pos) = (i + 1..ts.len())
            .take_while(|&j| ts[j].text != "{")
            .find(|&j| ts[j].text == "in")
        else {
            continue;
        };
        let Some(range) = (in_pos + 1..ts.len())
            .take_while(|&j| ts[j].text != "{")
            .find(|&j| ts[j].text == "..=")
        else {
            continue;
        };
        let open = (range + 1..ts.len())
            .find(|&j| ts[j].text == "{")
            .ok_or("找不到 for 迴圈區塊。")?;
        let mut result = source.to_owned();
        result.replace_range(ts[in_pos].end..ts[open].start, &format!(" 1..={value} "));
        return Ok(result);
    }
    Err("第四課驗收需要保留原題 for ... in 1..=... 的迴圈結構。".into())
}
pub struct Variants {
    path: PathBuf,
    dir: PathBuf,
}
impl Variants {
    pub fn path(&self) -> &Path {
        &self.path
    }
}
impl Drop for Variants {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.dir);
    }
}
pub fn prepare(
    course: &Path,
    source: &Path,
    n: usize,
    values: &[&str],
) -> Result<Variants, String> {
    let original = fs::read_to_string(source).map_err(|e| e.to_string())?;
    let mut bodies = Vec::new();
    for value in values {
        bodies.push(match n {
            2 => replace_binding(&original, "celsius", value)?,
            3 => replace_binding(&original, "score", value)?,
            4 => replace_limit(&original, value)?,
            _ => return Err("不支援的暫存題型。".into()),
        });
    }
    emit(course, &bodies)
}

pub fn prepare_parameters(
    course: &Path,
    source: &Path,
    parameters: &[&[(&str, &str)]],
) -> Result<Variants, String> {
    let original = fs::read_to_string(source).map_err(|e| e.to_string())?;
    let mut bodies = Vec::new();
    for settings in parameters {
        let mut body = original.clone();
        for (name, value) in *settings {
            body = replace_binding(&body, name, value)?;
        }
        bodies.push(body);
    }
    emit(course, &bodies)
}

fn emit(course: &Path, bodies: &[String]) -> Result<Variants, String> {
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_nanos();
    let dir = course
        .parent()
        .ok_or("找不到 workspace")?
        .join("target")
        .join(format!("variants-{}-{stamp}", std::process::id()));
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let out = Variants {
        path: dir.join("variants.rs"),
        dir,
    };
    let mut generated = String::new();
    for (i, body) in bodies.iter().enumerate() {
        generated.push_str(&format!(
            "mod variant_{i} {{\n{body}\npub fn run_case() {{ main(); }}\n}}\n"
        ));
    }
    generated.push_str("fn main(){match std::env::args().nth(1).as_deref(){\n");
    for i in 0..bodies.len() {
        generated.push_str(&format!("Some(\"{i}\")=>variant_{i}::run_case(),\n"));
    }
    generated.push_str("_=>std::process::exit(2),}}\n");
    fs::write(&out.path, generated).map_err(|e| e.to_string())?;
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn binding_replacement_preserves_formula_and_comments() {
        let s =
            "// let celsius = -1.0;\nfn main(){let celsius: f64 = 100.0;let f=celsius*1.8+32.0;}";
        let out = replace_binding(s, "celsius", "-40.0").unwrap();
        assert!(out.contains("// let celsius = -1.0;"));
        assert!(out.contains("let celsius: f64 = -40.0;"));
        assert!(out.contains("let f=celsius*1.8+32.0;"));
    }
    #[test]
    fn quoted_text_is_not_a_binding() {
        let s = "fn main(){let text=\"let score = 100;\";let mut score = 59;}";
        let out = replace_binding(s, "score", "60").unwrap();
        assert!(out.contains("\"let score = 100;\""));
        assert!(out.contains("let mut score = 60;"));
    }
    #[test]
    fn inclusive_range_changes_only_test_copy_limit() {
        let s = "fn main(){let mut sum=0;for n in 1..=100 {sum+=n;}}";
        let out = replace_limit(s, "0").unwrap();
        assert!(out.contains("for n in 1..=0 {sum+=n;}"));
        assert!(s.contains("1..=100"));
    }
    #[test]
    fn array_repeat_initializer_keeps_statement_boundary() {
        let source = "fn main(){let values = [0_i32; 0];println!(\"{:?}\", values);}";
        let output = replace_binding(source, "values", "[1,2,3]").unwrap();
        assert!(output.contains("let values = [1,2,3];println!"));
    }
    #[test]
    fn unsupported_templates_report_errors() {
        assert!(replace_binding("fn main(){}", "celsius", "0.0").is_err());
        assert!(replace_limit("fn main(){}", "0").is_err());
    }
}
