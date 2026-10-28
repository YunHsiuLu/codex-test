fn main() {
    let values = [70, 85, 90];
    for (index, value) in values.iter().enumerate() {
        println!("{}: {}", index + 1, value);
    }
}
