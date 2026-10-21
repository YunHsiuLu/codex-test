#[cfg(test)]
mod course_checks {
    use super::*;
    struct Time(f64);
    impl Measured for Time {
        fn magnitude(&self) -> f64 {
            self.0
        }
    }
    struct Doubled(f64);
    impl Measured for Doubled {
        fn magnitude(&self) -> f64 {
            self.0 * 2.0
        }
    }
    #[test]
    fn static_empty() {
        assert_eq!(total_static::<Distance>(&[]), 0.0);
    }
    #[test]
    fn static_single() {
        assert_eq!(total_static(&[Distance(7.0)]), 7.0);
    }
    #[test]
    fn static_pair() {
        assert_eq!(total_static(&[Distance(2.0), Distance(3.0)]), 5.0);
    }
    #[test]
    fn static_fraction() {
        assert_eq!(total_static(&[Distance(0.25), Distance(0.5)]), 0.75);
    }
    #[test]
    fn static_other_type() {
        assert_eq!(total_static(&[Time(1.0), Time(3.0)]), 4.0);
    }
    #[test]
    fn dynamic_empty() {
        assert_eq!(total_dynamic(&[]), 0.0);
    }
    #[test]
    fn dynamic_single() {
        assert_eq!(total_dynamic(&[&Distance(9.0)]), 9.0);
    }
    #[test]
    fn dynamic_heterogeneous() {
        assert_eq!(total_dynamic(&[&Distance(2.0), &Time(4.0)]), 6.0);
    }
    #[test]
    fn custom_behavior() {
        assert_eq!(total_static(&[Doubled(3.0)]), 6.0);
        assert_eq!(total_dynamic(&[&Doubled(4.0)]), 8.0);
    }
    #[test]
    fn large_collection() {
        let a: Vec<_> = (0..1000).map(|_| Distance(1.0)).collect();
        assert_eq!(total_static(&a), 1000.0);
    }
}
