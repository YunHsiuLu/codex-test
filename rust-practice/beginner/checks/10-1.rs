#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn positive_1() {
        let actual = parse_positive("1").expect("應成功");
        assert!(actual.is_finite() && actual > 0.0);
        assert!(
            (actual - (1.0_f64)).abs() <= f64::EPSILON * (1.0_f64).abs().max(f64::MIN_POSITIVE)
        );
    }
    #[test]
    fn positive_2() {
        let actual = parse_positive(" 2.5 ").expect("應成功");
        assert!(actual.is_finite() && actual > 0.0);
        assert!(
            (actual - (2.5_f64)).abs() <= f64::EPSILON * (2.5_f64).abs().max(f64::MIN_POSITIVE)
        );
    }
    #[test]
    fn positive_3() {
        assert!(parse_positive("0").is_err());
    }
    #[test]
    fn positive_4() {
        assert!(parse_positive("-1").is_err());
    }
    #[test]
    fn positive_5() {
        assert!(parse_positive("abc").is_err());
    }
    #[test]
    fn positive_6() {
        assert!(parse_positive("").is_err());
    }
    #[test]
    fn positive_7() {
        assert!(parse_positive("NaN").is_err());
    }
    #[test]
    fn positive_8() {
        assert!(parse_positive("inf").is_err());
    }
    #[test]
    fn positive_9() {
        assert!(parse_positive("-inf").is_err());
    }
    #[test]
    fn positive_10() {
        let actual = parse_positive("1e2").expect("應成功");
        assert!(actual.is_finite() && actual > 0.0);
        assert!(
            (actual - (100.0_f64)).abs() <= f64::EPSILON * (100.0_f64).abs().max(f64::MIN_POSITIVE)
        );
    }
    #[test]
    fn positive_11() {
        let actual = parse_positive("5e-324").expect("應成功");
        assert!(actual.is_finite() && actual > 0.0);
        assert!(
            (actual - (5e-324_f64)).abs()
                <= f64::EPSILON * (5e-324_f64).abs().max(f64::MIN_POSITIVE)
        );
    }
    #[test]
    fn positive_12() {
        assert!(parse_positive("1e309").is_err());
    }
}
