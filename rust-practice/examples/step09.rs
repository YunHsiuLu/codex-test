struct Motion { distance: f64, time: f64 }
impl Motion {
    fn speed(&self) -> f64 { 0.0 }
}
fn main() {
    let m = Motion { distance: 120.0, time: 10.0 };
    println!("{} m/s", m.speed());
}
