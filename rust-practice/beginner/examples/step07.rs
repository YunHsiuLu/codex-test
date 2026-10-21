fn count(text: String) -> usize { text.chars().count() }
fn main() {
    let name = String::from("Rust");
    let size = count(name);
    // 請保留 name 仍可使用
    println!("字元數：{size}");
}
