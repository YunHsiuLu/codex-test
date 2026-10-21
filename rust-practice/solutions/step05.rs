fn speed(distance: f64, time: f64) -> f64 {
    assert!(time > 0.0, "時間必須為正");
    distance / time
}
fn main() { println!("{} m/s", speed(100.0, 20.0)); }
