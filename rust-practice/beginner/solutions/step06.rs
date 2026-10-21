use std::io;
fn main() {
    let mut input = String::new();
    println!("輸入攝氏溫度：");
    io::stdin().read_line(&mut input).expect("讀取失敗");
    match input.trim().parse::<f64>() {
        Ok(c) => println!("{} F", c * 9.0 / 5.0 + 32.0),
        Err(_) => println!("請輸入數字"),
    }
}
