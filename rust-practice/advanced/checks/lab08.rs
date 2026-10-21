#[cfg(test)]
mod course_checks {
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
