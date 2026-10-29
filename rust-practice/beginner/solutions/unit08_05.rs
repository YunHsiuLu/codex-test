use std::collections::HashMap;
fn word_counts(text: &str) -> HashMap<String, usize> {
    let mut result = HashMap::new();
    for word in text.split_whitespace() {
        let count = result.entry(String::from(word)).or_insert(0);
        *count += 1;
    }
    result
}
fn main() {
    println!("{:?}", word_counts("a b a"));
}
