#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn parity_1() {
        assert_eq!(is_even(-100), true);
    }
    #[test]
    fn parity_2() {
        assert_eq!(is_even(-3), false);
    }
    #[test]
    fn parity_3() {
        assert_eq!(is_even(-2), true);
    }
    #[test]
    fn parity_4() {
        assert_eq!(is_even(-1), false);
    }
    #[test]
    fn parity_5() {
        assert_eq!(is_even(0), true);
    }
    #[test]
    fn parity_6() {
        assert_eq!(is_even(1), false);
    }
    #[test]
    fn parity_7() {
        assert_eq!(is_even(2), true);
    }
    #[test]
    fn parity_8() {
        assert_eq!(is_even(3), false);
    }
    #[test]
    fn parity_9() {
        assert_eq!(is_even(100), true);
    }
    #[test]
    fn parity_10() {
        assert_eq!(is_even(9223372036854775807), false);
    }
}
