trait Measured {
    fn magnitude(&self) -> f64;
}
struct Distance(f64);
impl Measured for Distance {
    fn magnitude(&self) -> f64 {
        self.0
    }
}
fn total_static<T: Measured>(values: &[T]) -> f64 {
    todo!("靜態分派")
}
fn total_dynamic(values: &[&dyn Measured]) -> f64 {
    todo!("動態分派")
}
fn main() {
    println!("{}", total_static(&[Distance(2.0), Distance(3.0)]));
}
#[cfg(test)]
mod tests {
    use super::*;
    struct Time(f64);
    impl Measured for Time {
        fn magnitude(&self) -> f64 {
            self.0
        }
    }
    #[test]
    fn dispatch() {
        assert_eq!(total_static(&[Distance(2.0), Distance(3.0)]), 5.0);
        let d = Distance(2.0);
        let t = Time(3.0);
        assert_eq!(total_dynamic(&[&d, &t]), 5.0);
        assert_eq!(total_static::<Distance>(&[]), 0.0);
    }
}
