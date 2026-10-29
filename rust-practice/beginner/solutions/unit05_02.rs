fn clamp(value: i64, low: i64, high: i64) -> i64 {
    assert!(low <= high, "下限不得大於上限");
    if value < low {
        low
    } else if value > high {
        high
    } else {
        value
    }
}
fn main() {
    println!("{}", clamp(120, 0, 100));
}
