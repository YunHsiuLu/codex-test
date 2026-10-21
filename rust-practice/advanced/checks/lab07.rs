#[cfg(test)]
mod course_checks {
    use super::*;

    #[test]
    fn ordinary() {
        assert_eq!(Seconds::new(2.0).unwrap().get(), 2.0);
    }
    #[test]
    fn fraction() {
        assert_eq!(Seconds::new(0.25).unwrap().get(), 0.25);
    }
    #[test]
    fn max_finite() {
        assert_eq!(Seconds::new(f64::MAX).unwrap().get(), f64::MAX);
    }
    #[test]
    fn min_normal() {
        assert_eq!(
            Seconds::new(f64::MIN_POSITIVE).unwrap().get(),
            f64::MIN_POSITIVE
        );
    }
    #[test]
    fn subnormal() {
        assert_eq!(
            Seconds::new(f64::from_bits(1)).unwrap().get(),
            f64::from_bits(1)
        );
    }
    #[test]
    fn zero() {
        assert!(Seconds::new(0.0).is_err());
    }
    #[test]
    fn negative_zero() {
        assert!(Seconds::new(-0.0).is_err());
    }
    #[test]
    fn negative() {
        assert!(Seconds::new(-2.0).is_err());
    }
    #[test]
    fn nan() {
        assert!(Seconds::new(f64::NAN).is_err());
    }
    #[test]
    fn positive_infinity() {
        assert!(Seconds::new(f64::INFINITY).is_err());
    }
    #[test]
    fn negative_infinity() {
        assert!(Seconds::new(f64::NEG_INFINITY).is_err());
    }
}
