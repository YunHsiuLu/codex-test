#[cfg(test)]
mod course_checks {
    use super::*;

    #[test]
    fn ordinary() {
        assert_eq!(midpoint(2.0, 4.0), Some(3.0));
    }
    #[test]
    fn negative() {
        assert_eq!(midpoint(-6.0, -2.0), Some(-4.0));
    }
    #[test]
    fn opposite() {
        assert_eq!(midpoint(-f64::MAX, f64::MAX), Some(0.0));
    }
    #[test]
    fn largest() {
        assert_eq!(midpoint(f64::MAX, f64::MAX), Some(f64::MAX));
    }
    #[test]
    fn small_normal() {
        assert_eq!(
            midpoint(f64::MIN_POSITIVE, f64::MIN_POSITIVE),
            Some(f64::MIN_POSITIVE)
        );
    }
    #[test]
    fn subnormal() {
        assert_eq!(
            midpoint(f64::from_bits(1), f64::from_bits(1)),
            Some(f64::from_bits(1))
        );
    }
    #[test]
    fn zero() {
        assert_eq!(midpoint(0.0, 0.0), Some(0.0));
    }
    #[test]
    fn reversed() {
        assert_eq!(midpoint(8.0, 2.0), Some(5.0));
    }
    #[test]
    fn nan() {
        assert_eq!(midpoint(f64::NAN, 1.0), None);
    }
    #[test]
    fn positive_infinity() {
        assert_eq!(midpoint(1.0, f64::INFINITY), None);
    }
    #[test]
    fn negative_infinity() {
        assert_eq!(midpoint(f64::NEG_INFINITY, 0.0), None);
    }
}
