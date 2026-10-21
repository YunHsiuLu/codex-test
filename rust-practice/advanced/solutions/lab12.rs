use std::io::{self, Read};
#[derive(Debug, PartialEq)]
struct Summary {
    count: usize,
    displacement: f64,
    seconds: f64,
}
impl Summary {
    fn velocity(&self) -> f64 {
        self.displacement / self.seconds
    }
}
#[derive(Debug, PartialEq)]
enum AnalysisError {
    Empty,
    Line { number: usize, reason: &'static str },
    Overflow,
}
fn analyze(text: &str) -> Result<Summary, AnalysisError> {
    let mut s = Summary {
        count: 0,
        displacement: 0.0,
        seconds: 0.0,
    };
    for (i, line) in text.lines().enumerate() {
        let fail = |reason| AnalysisError::Line {
            number: i + 1,
            reason,
        };
        if line.trim().is_empty() {
            return Err(fail("空白行"));
        }
        let columns: Vec<_> = line.split(',').collect();
        if columns.len() != 2 {
            return Err(fail("需要位移,秒數兩欄"));
        }
        let d = columns[0]
            .trim()
            .parse::<f64>()
            .map_err(|_| fail("位移不是數字"))?;
        let t = columns[1]
            .trim()
            .parse::<f64>()
            .map_err(|_| fail("時間不是數字"))?;
        if !d.is_finite() || !t.is_finite() || t <= 0.0 {
            return Err(fail("數值須有限且時間為正"));
        }
        s.displacement += d;
        s.seconds += t;
        s.count += 1;
        if !s.displacement.is_finite() || !s.seconds.is_finite() {
            return Err(AnalysisError::Overflow);
        }
    }
    if s.count == 0 {
        return Err(AnalysisError::Empty);
    }
    if !s.velocity().is_finite() {
        return Err(AnalysisError::Overflow);
    }
    Ok(s)
}
fn main() {
    if let Err(e) = cli() {
        eprintln!("{e}");
        std::process::exit(1);
    }
}
fn cli() -> Result<(), String> {
    let args: Vec<_> = std::env::args().skip(1).collect();
    if args.len() > 1 {
        return Err("用法：程式 [檔案路徑或 -]".into());
    }
    let text = match args.first().map(String::as_str) {
        Some(path) if path != "-" => {
            std::fs::read_to_string(path).map_err(|e| format!("讀檔失敗：{e}"))?
        }
        _ => {
            let mut s = String::new();
            io::stdin()
                .read_to_string(&mut s)
                .map_err(|e| e.to_string())?;
            s
        }
    };
    let s = analyze(&text).map_err(|e| format!("分析失敗：{e:?}"))?;
    println!(
        "count={} displacement_m={} seconds={} velocity_m_s={}",
        s.count,
        s.displacement,
        s.seconds,
        s.velocity()
    );
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn weighted_and_round_trip() {
        assert_eq!(analyze("100,10\n-40,20\n").unwrap().velocity(), 2.0);
        assert_eq!(analyze("10,2\n-10,3").unwrap().velocity(), 0.0);
    }
    #[test]
    fn rejects_bad_records_with_line() {
        assert_eq!(analyze(""), Err(AnalysisError::Empty));
        for row in ["a,1", "1,0", "NaN,1", "1,inf", "1,2,3", ""] {
            assert!(matches!(
                analyze(&format!("1,1\n{row}\n")),
                Err(AnalysisError::Line { number: 2, .. })
            ));
        }
    }
    #[test]
    fn overflow_is_error() {
        assert_eq!(analyze("1e308,1\n1e308,1"), Err(AnalysisError::Overflow));
        assert_eq!(analyze("1,5e-324"), Err(AnalysisError::Overflow));
    }
}
