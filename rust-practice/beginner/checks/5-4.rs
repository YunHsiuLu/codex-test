#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn factorial_0() {
        assert_eq!(factorial(0), 1_u64);
    }
    #[test]
    fn factorial_1() {
        assert_eq!(factorial(1), 1_u64);
    }
    #[test]
    fn factorial_2() {
        assert_eq!(factorial(2), 2_u64);
    }
    #[test]
    fn factorial_3() {
        assert_eq!(factorial(3), 6_u64);
    }
    #[test]
    fn factorial_4() {
        assert_eq!(factorial(4), 24_u64);
    }
    #[test]
    fn factorial_5() {
        assert_eq!(factorial(5), 120_u64);
    }
    #[test]
    fn factorial_8() {
        assert_eq!(factorial(8), 40320_u64);
    }
    #[test]
    fn factorial_10() {
        assert_eq!(factorial(10), 3628800_u64);
    }
    #[test]
    fn factorial_15() {
        assert_eq!(factorial(15), 1307674368000_u64);
    }
    #[test]
    fn factorial_19() {
        assert_eq!(factorial(19), 121645100408832000_u64);
    }
    #[test]
    fn factorial_20() {
        assert_eq!(factorial(20), 2432902008176640000_u64);
    }
    #[test]
    fn reject_twenty_one() {
        assert!(std::panic::catch_unwind(|| factorial(21)).is_err());
    }
    #[test]
    fn reject_maximum_input() {
        assert!(std::panic::catch_unwind(|| factorial(u32::MAX)).is_err());
    }
}
