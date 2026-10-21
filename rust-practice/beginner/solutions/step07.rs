fn count(text: &str) -> usize { text.chars().count() }
fn main() {
    let name = String::from("Rust");
    let size = count(&name);
    println!("{name}：{size}");
}
