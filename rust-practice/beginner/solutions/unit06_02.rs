use std::io;
fn main() {
    let mut input = String::new();
    loop {
        input.clear();
        let bytes = io::stdin().read_line(&mut input).expect("read failed");
        if bytes == 0 || input.trim() == "quit" {
            println!("bye");
            break;
        }
        match input.trim().parse::<i64>() {
            Ok(value) if value > 0 => {
                println!("ok: {value}");
                break;
            }
            _ => println!("retry"),
        }
    }
}
