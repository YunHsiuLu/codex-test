#[cfg(test)]
mod course_checks {
    use super::*;

    #[test]
    fn weighted_velocity() {
        assert_eq!(analyze("100,10\n-40,20\n").unwrap().velocity(), 2.0);
    }
    #[test]
    fn return_to_origin() {
        assert_eq!(analyze("10,2\n-10,3").unwrap().velocity(), 0.0);
    }
    #[test]
    fn crlf() {
        let s = analyze("-4,2\r\n").unwrap();
        assert_eq!(
            (s.count, s.displacement, s.seconds, s.velocity()),
            (1, -4.0, 2.0, -2.0)
        );
    }
    #[test]
    fn empty() {
        assert_eq!(analyze(""), Err(AnalysisError::Empty));
    }
    #[test]
    fn blank_line() {
        assert!(matches!(
            analyze("1,1\n \n"),
            Err(AnalysisError::Line { number: 2, .. })
        ));
    }
    #[test]
    fn bad_number() {
        assert!(matches!(
            analyze("1,1\n2,2\nx,3"),
            Err(AnalysisError::Line { number: 3, .. })
        ));
    }
    #[test]
    fn extra_column() {
        assert!(matches!(
            analyze("1,2,3"),
            Err(AnalysisError::Line { number: 1, .. })
        ));
    }
    #[test]
    fn nonfinite() {
        assert!(matches!(
            analyze("NaN,1"),
            Err(AnalysisError::Line { number: 1, .. })
        ));
    }
    #[test]
    fn zero_time() {
        assert!(matches!(
            analyze("1,0"),
            Err(AnalysisError::Line { number: 1, .. })
        ));
    }
    #[test]
    fn negative_time() {
        assert!(matches!(
            analyze("1,-1"),
            Err(AnalysisError::Line { number: 1, .. })
        ));
    }
    #[test]
    fn sum_overflow() {
        assert_eq!(analyze("1e308,1\n1e308,1"), Err(AnalysisError::Overflow));
    }
    #[test]
    fn ratio_overflow() {
        assert_eq!(analyze("1,5e-324"), Err(AnalysisError::Overflow));
    }
    #[test]
    fn time_overflow() {
        assert_eq!(analyze("1,1e308\n1,1e308"), Err(AnalysisError::Overflow));
    }
}
