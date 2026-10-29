fn sorted_unique(values: &[i64]) -> Vec<i64> {
    let mut result = values.to_vec();
    result.sort();
    result.dedup();
    result
}
fn main() {
    println!("{:?}", sorted_unique(&[3, 1, 3]));
}
