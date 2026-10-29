fn scalar_count(text: &str) -> usize {
    text.chars().count()
}
fn main() {
    let name = String::from("物理");
    println!("{} {}", scalar_count(&name), name);
}
