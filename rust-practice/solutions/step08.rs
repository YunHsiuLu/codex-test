fn average(scores: &[i32]) -> Option<f64> {
    if scores.is_empty() { return None; }
    Some(scores.iter().sum::<i32>() as f64 / scores.len() as f64)
}
fn main() {
    let scores = vec![60, 80, 100];
    println!("{:?}", average(&scores));
}
