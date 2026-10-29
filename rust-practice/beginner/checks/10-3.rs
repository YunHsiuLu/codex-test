#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn pair_1() {
        assert_eq!(parse_pair("1,2"), Ok((1.0_f64, 2.0_f64)));
    }
    #[test]
    fn pair_2() {
        assert_eq!(parse_pair(" -3 , 4 "), Ok((-3.0_f64, 4.0_f64)));
    }
    #[test]
    fn pair_3() {
        assert_eq!(parse_pair("0,0.5"), Ok((0.0_f64, 0.5_f64)));
    }
    #[test]
    fn pair_4() {
        assert!(parse_pair("").is_err());
    }
    #[test]
    fn pair_5() {
        assert!(parse_pair("1").is_err());
    }
    #[test]
    fn pair_6() {
        assert!(parse_pair("1,2,3").is_err());
    }
    #[test]
    fn pair_7() {
        assert!(parse_pair(",2").is_err());
    }
    #[test]
    fn pair_8() {
        assert!(parse_pair("1,").is_err());
    }
    #[test]
    fn pair_9() {
        assert!(parse_pair("abc,2").is_err());
    }
    #[test]
    fn pair_10() {
        assert!(parse_pair("1,0").is_err());
    }
    #[test]
    fn pair_11() {
        assert!(parse_pair("1,-2").is_err());
    }
    #[test]
    fn pair_12() {
        assert!(parse_pair("NaN,2").is_err());
    }
    #[test]
    fn pair_13() {
        assert!(parse_pair("1,inf").is_err());
    }
    #[test]
    fn pair_14() {
        assert_eq!(parse_pair("1e2,2e1"), Ok((100.0_f64, 20.0_f64)));
    }
}
