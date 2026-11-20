use std::io;

fn main() {
    // 使用標準函式庫讀一行，整理後分支輸出。
    let mut input = String::new();
    io::stdin().read_line(&mut input).expect("read failed");
    let name = input.trim();
    if name.is_empty() {
        println!("empty");
    } else {
        println!("Hello, {name}!");
    }
}
