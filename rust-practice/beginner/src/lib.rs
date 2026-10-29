//! Temporary teaching adapters for units 2–4. Unit 6 teaches the standard I/O behind them.
pub mod support {
    use std::{io, process};
    fn line() -> String {
        let mut text = String::new();
        match io::stdin().read_line(&mut text) {
            Ok(0) => {
                eprintln!("教學輸入工具：缺少一行資料。");
                process::exit(2);
            }
            Ok(_) => text,
            Err(_) => {
                eprintln!("教學輸入工具：無法讀取。");
                process::exit(2);
            }
        }
    }
    /// Read exactly one line containing one i64. Invalid input exits with code 2.
    pub fn read_i64() -> i64 {
        match line().trim().parse() {
            Ok(value) => value,
            Err(_) => {
                eprintln!("教學輸入工具：請提供一行整數。");
                process::exit(2);
            }
        }
    }
    /// Read exactly one line containing one finite f64. Invalid input exits with code 2.
    pub fn read_f64() -> f64 {
        match line().trim().parse::<f64>() {
            Ok(value) if value.is_finite() => value,
            _ => {
                eprintln!("教學輸入工具：請提供一行有限小數。");
                process::exit(2);
            }
        }
    }
}
