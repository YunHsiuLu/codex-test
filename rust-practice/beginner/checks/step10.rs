#[cfg(test)]
mod course_checks {
    use super::*;

    #[test]
    fn decimal() {
        assert!((parse_time("2.5").unwrap() - 2.5).abs() < 1e-9);
    }
    #[test]
    fn trimmed() {
        assert!((parse_time(" 3 ").unwrap() - 3.0).abs() < 1e-9);
    }
    #[test]
    fn small() {
        assert!((parse_time("0.001").unwrap() - 0.001).abs() < 1e-9);
    }
    #[test]
    fn exponent() {
        assert!((parse_time("1e2").unwrap() - 100.0).abs() < 1e-9);
    }
    #[test]
    fn plus() {
        assert!((parse_time("+2").unwrap() - 2.0).abs() < 1e-9);
    }
    #[test]
    fn zero() {
        assert!(parse_time("0").is_err(), "應拒絕輸入：0");
    }
    #[test]
    fn negative_zero() {
        assert!(parse_time("-0").is_err(), "應拒絕輸入：-0");
    }
    #[test]
    fn negative() {
        assert!(parse_time("-1").is_err(), "應拒絕輸入：-1");
    }
    #[test]
    fn letters() {
        assert!(parse_time("abc").is_err(), "應拒絕輸入：abc");
    }
    #[test]
    fn nan() {
        assert!(parse_time("NaN").is_err(), "應拒絕輸入：NaN");
    }
    #[test]
    fn infinity() {
        assert!(parse_time("inf").is_err(), "應拒絕輸入：inf");
    }
    #[test]
    fn negative_infinity() {
        assert!(parse_time("-inf").is_err(), "應拒絕輸入：-inf");
    }
    #[test]
    fn empty() {
        assert!(parse_time("").is_err(), "應拒絕輸入：");
    }
    #[test]
    fn mixed() {
        assert!(parse_time("12abc").is_err(), "應拒絕輸入：12abc");
    }
    #[test]
    fn blank() {
        assert!(parse_time("   ").is_err(), "應拒絕輸入：   ");
    }
}
