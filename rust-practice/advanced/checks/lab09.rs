#[cfg(test)]
mod course_checks {
    use super::*;

    #[test]
    fn empty() {
        assert_eq!(first_positive_squares(&[], 3), Vec::<i64>::new());
    }
    #[test]
    fn zero_limit() {
        assert_eq!(first_positive_squares(&[1, 2], 0), Vec::<i64>::new());
    }
    #[test]
    fn negative_only() {
        assert_eq!(first_positive_squares(&[-1, -2], 3), Vec::<i64>::new());
    }
    #[test]
    fn zeros_only() {
        assert_eq!(first_positive_squares(&[0, 0], 2), Vec::<i64>::new());
    }
    #[test]
    fn single() {
        assert_eq!(first_positive_squares(&[3], 1), vec![9]);
    }
    #[test]
    fn filter_before_take() {
        assert_eq!(first_positive_squares(&[-2, 3, 0, 4, 5], 2), vec![9, 16]);
    }
    #[test]
    fn preserve_order() {
        assert_eq!(first_positive_squares(&[4, 2, 3], 3), vec![16, 4, 9]);
    }
    #[test]
    fn large_limit() {
        assert_eq!(first_positive_squares(&[-1, 2, -3], 99), vec![4]);
    }
    #[test]
    fn widen_before_square() {
        assert_eq!(
            first_positive_squares(&[i32::MAX], 1),
            vec![4611686014132420609]
        );
    }
    #[test]
    fn mixed_extremes() {
        assert_eq!(
            first_positive_squares(&[i32::MIN, 1, i32::MAX], 2),
            vec![1, 4611686014132420609]
        );
    }
}
