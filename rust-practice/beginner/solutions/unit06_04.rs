use std::io;
fn main() {
    let mut text = String::new();
    let mut count = 0;
    let mut total = 0_i64;
    loop {
        text.clear();
        if io::stdin().read_line(&mut text).expect("read failed") == 0 {
            break;
        }
        let token = text.trim();
        if token.is_empty() {
            continue;
        }
        match token.parse::<i64>() {
            Ok(value) => {
                count += 1;
                total += value;
            }
            Err(_) => println!("invalid"),
        }
    }
    println!("count: {count}\nsum: {total}");
}
