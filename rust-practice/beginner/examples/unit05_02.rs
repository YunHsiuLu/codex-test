fn clamp(value: i64, low: i64, high: i64) -> i64 {
    assert!(low <= high, "low必須小於high");
    if value < low {
        return low;
    } else if value > high {
        return high;
    } else {
        value
    }
}
fn main() {}
