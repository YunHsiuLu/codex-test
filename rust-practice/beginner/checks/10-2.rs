#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn score_error_1() {
        assert_eq!(parse_score(""), Err(ParseError::Empty));
    }
    #[test]
    fn score_error_2() {
        assert_eq!(parse_score(" \t"), Err(ParseError::Empty));
    }
    #[test]
    fn score_error_3() {
        assert_eq!(parse_score("abc"), Err(ParseError::NotInteger));
    }
    #[test]
    fn score_error_4() {
        assert_eq!(parse_score("1.5"), Err(ParseError::NotInteger));
    }
    #[test]
    fn score_error_5() {
        assert_eq!(
            parse_score("9223372036854775808"),
            Err(ParseError::NotInteger)
        );
    }
    #[test]
    fn score_error_6() {
        assert_eq!(parse_score("-1"), Err(ParseError::OutOfRange));
    }
    #[test]
    fn score_error_7() {
        assert_eq!(parse_score("101"), Err(ParseError::OutOfRange));
    }
    #[test]
    fn score_error_8() {
        assert_eq!(parse_score("0"), Ok(0));
    }
    #[test]
    fn score_error_9() {
        assert_eq!(parse_score("100"), Ok(100));
    }
    #[test]
    fn score_error_10() {
        assert_eq!(parse_score(" 75 "), Ok(75));
    }
    #[test]
    fn score_error_11() {
        assert_eq!(parse_score("+60"), Ok(60));
    }
    #[test]
    fn score_error_12() {
        assert_eq!(parse_score("1 2"), Err(ParseError::NotInteger));
    }
}
