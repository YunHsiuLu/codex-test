#[derive(Debug, PartialEq)]
struct Seconds(f64);
impl Seconds {
    fn new(value: f64) -> Result<Self, &'static str> {
        todo!("驗證有限且大於零")
    }
    fn get(&self) -> f64 {
        self.0
    }
}
fn main() {
    println!("{:?}", Seconds::new(2.0));
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn invariant() {
        assert_eq!(Seconds::new(2.0).unwrap().get(), 2.0);
        for x in [0.0, -1.0, f64::NAN, f64::INFINITY] {
            assert!(Seconds::new(x).is_err());
        }
    }
}
