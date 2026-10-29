fn average(values: &[i64]) -> Option<f64> {
    if values.is_empty() {
        return None;
    }
    let mut total = 0_i64;
    for value in values {
        total += *value;
    }
    Some(total as f64 / values.len() as f64)
}
fn main() {
    println!("{:?}", average(&[1, 2]));
}
