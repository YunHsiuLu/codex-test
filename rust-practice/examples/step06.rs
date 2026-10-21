use std::io;
fn main() {
    let mut input = String::new();
    println!("輸入攝氏溫度：");
    io::stdin().read_line(&mut input).expect("讀取失敗");
    println!("你輸入：{}", input.trim());
}
