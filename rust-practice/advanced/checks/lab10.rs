#[cfg(test)]
mod course_checks {
    use super::*;

    #[test]
    fn ordinary() {
        assert_eq!(parse_record("100,20"), Ok((100.0, 20.0)));
    }
    #[test]
    fn negative_displacement() {
        assert_eq!(parse_record(" -3, 2 "), Ok((-3.0, 2.0)));
    }
    #[test]
    fn zero_displacement() {
        assert_eq!(parse_record("0,1"), Ok((0.0, 1.0)));
    }
    #[test]
    fn missing_column() {
        assert_eq!(parse_record("1"), Err(ParseError::Columns));
    }
    #[test]
    fn extra_column() {
        assert_eq!(parse_record("1,2,3"), Err(ParseError::Columns));
    }
    #[test]
    fn bad_displacement() {
        assert_eq!(parse_record("abc,2"), Err(ParseError::Number));
    }
    #[test]
    fn bad_time() {
        assert_eq!(parse_record("1,abc"), Err(ParseError::Number));
    }
    #[test]
    fn nan() {
        assert_eq!(parse_record("NaN,2"), Err(ParseError::NonFinite));
    }
    #[test]
    fn infinite_time() {
        assert_eq!(parse_record("1,inf"), Err(ParseError::NonFinite));
    }
    #[test]
    fn zero_time() {
        assert_eq!(parse_record("1,0"), Err(ParseError::NonPositiveTime));
    }
    #[test]
    fn negative_time() {
        assert_eq!(parse_record("1,-2"), Err(ParseError::NonPositiveTime));
    }
}
