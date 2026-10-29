fn normalize_spaces(text: &str) -> String {
    let mut output = String::new();
    for word in text.split_whitespace() {
        if !output.is_empty() {
            output.push(' ');
        }
        output.push_str(word);
    }
    output
}
fn main() {
    println!("{}", normalize_spaces("  Rust   course "));
}
