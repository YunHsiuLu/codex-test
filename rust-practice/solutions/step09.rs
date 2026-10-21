struct Motion { distance: f64, time: f64 }
impl Motion {
    fn speed(&self) -> f64 {
        assert!(self.time > 0.0);
        self.distance / self.time
    }
}
fn main() {
    for m in [Motion { distance: 120.0, time: 10.0 }, Motion { distance: 50.0, time: 5.0 }] {
        println!("{} m/s", m.speed());
    }
}
