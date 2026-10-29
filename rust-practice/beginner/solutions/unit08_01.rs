fn first_index(values: &[i64], target: i64) -> Option<usize> {
    for (index, value) in values.iter().enumerate() {
        if *value == target {
            return Some(index);
        }
    }
    None
}
fn main() {
    println!("{:?}", first_index(&[4, 8, 4], 4));
}
