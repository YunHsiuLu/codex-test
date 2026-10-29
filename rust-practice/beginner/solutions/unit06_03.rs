use std::io;
fn main() {
    let mut line = String::new();
    io::stdin().read_line(&mut line).expect("read failed");
    let mut total = 0_i64;
    let mut count = 0;
    for token in line.split_whitespace() {
        match token.parse::<i64>() {
            Ok(value) => {
                total += value;
                count += 1;
            }
            Err(_) => {
                println!("invalid");
                return;
            }
        }
    }
    if count == 0 {
        println!("empty");
    } else {
        println!("sum: {total}");
    }
}
