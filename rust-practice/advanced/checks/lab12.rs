#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn weighted_and_round_trip() {
        assert_eq!(analyze("100,10\n-40,20\n").unwrap().velocity(), 2.0);
        assert_eq!(analyze("10,2\n-10,3").unwrap().velocity(), 0.0);
    }
    #[test]
    fn rejects_bad_records_with_line() {
        assert_eq!(analyze(""), Err(AnalysisError::Empty));
        for row in ["a,1", "1,0", "NaN,1", "1,inf", "1,2,3", ""] {
            assert!(matches!(
                analyze(&format!("1,1\n{row}\n")),
                Err(AnalysisError::Line { number: 2, .. })
            ));
        }
    }
    #[test]
    fn overflow_is_error() {
        assert_eq!(analyze("1e308,1\n1e308,1"), Err(AnalysisError::Overflow));
        assert_eq!(analyze("1,5e-324"), Err(AnalysisError::Overflow));
    }
}
