use std::io;
fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).expect("read failed");
    let name = input.trim();
    if name.is_empty() {
        println!("empty");
    } else {
        println!("Hello, {name}!");
    }
}
