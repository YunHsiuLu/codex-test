#[cfg(test)]
mod course_checks {
    use super::*;

    #[test]
    fn empty() {
        assert_eq!(lower_bound(&[], 3), 0);
    }
    #[test]
    fn single_below() {
        assert_eq!(lower_bound(&[5], 4), 0);
    }
    #[test]
    fn single_equal() {
        assert_eq!(lower_bound(&[5], 5), 0);
    }
    #[test]
    fn single_above() {
        assert_eq!(lower_bound(&[5], 6), 1);
    }
    #[test]
    fn duplicates() {
        assert_eq!(lower_bound(&[1, 3, 3, 7], 3), 1);
    }
    #[test]
    fn between() {
        assert_eq!(lower_bound(&[1, 3, 7], 4), 2);
    }
    #[test]
    fn all_equal() {
        assert_eq!(lower_bound(&[2, 2, 2], 2), 0);
    }
    #[test]
    fn negative() {
        assert_eq!(lower_bound(&[-9, -5, -1], -4), 2);
    }
    #[test]
    fn minimum() {
        assert_eq!(lower_bound(&[i32::MIN, 0, i32::MAX], i32::MIN), 0);
    }
    #[test]
    fn maximum() {
        assert_eq!(lower_bound(&[i32::MIN, 0, i32::MAX], i32::MAX), 2);
    }
}
