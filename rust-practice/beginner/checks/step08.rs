#[cfg(test)]
mod course_checks {
    use super::*;
    fn assert_average(a: &[i32], v: f64) {
        assert!(
            (average(a).expect("非空集合須有平均") - v).abs() < 1e-9,
            "資料={a:?}，預期={v}"
        );
    }
    #[test]
    fn empty() {
        assert_eq!(average(&[]), None);
    }
    #[test]
    fn zero() {
        assert_average(&[0], 0.0);
    }
    #[test]
    fn full() {
        assert_average(&[100], 100.0);
    }
    #[test]
    fn fractional() {
        assert_average(&[60, 61], 60.5);
    }
    #[test]
    fn three_scores() {
        assert_average(&[60, 80, 100], 80.0);
    }
    #[test]
    fn all_zero() {
        assert_average(&[0, 0, 0], 0.0);
    }
    #[test]
    fn all_full() {
        assert_average(&[100, 100, 100], 100.0);
    }
    #[test]
    fn extremes() {
        assert_average(&[0, 100], 50.0);
    }
    #[test]
    fn unsorted() {
        assert_average(&[90, 30, 60], 60.0);
    }
    #[test]
    fn repeated() {
        assert_average(&[75, 75, 75, 75], 75.0);
    }
    #[test]
    fn odd_length() {
        assert_average(&[1, 2, 3, 4, 5], 3.0);
    }
}
