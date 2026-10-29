#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn average_1() {
        assert_eq!(average(&[]), None);
    }
    #[test]
    fn average_2() {
        let actual = average(&[0]).expect("非空應有平均");
        assert!(actual.is_finite());
        assert!((actual - (0.0_f64)).abs() < 1e-9);
    }
    #[test]
    fn average_3() {
        let actual = average(&[60, 80, 100]).expect("非空應有平均");
        assert!(actual.is_finite());
        assert!((actual - (80.0_f64)).abs() < 1e-9);
    }
    #[test]
    fn average_4() {
        let actual = average(&[60, 61]).expect("非空應有平均");
        assert!(actual.is_finite());
        assert!((actual - (60.5_f64)).abs() < 1e-9);
    }
    #[test]
    fn average_5() {
        let actual = average(&[-1, 1]).expect("非空應有平均");
        assert!(actual.is_finite());
        assert!((actual - (0.0_f64)).abs() < 1e-9);
    }
    #[test]
    fn average_6() {
        let actual = average(&[-3, -2]).expect("非空應有平均");
        assert!(actual.is_finite());
        assert!((actual - (-2.5_f64)).abs() < 1e-9);
    }
    #[test]
    fn average_7() {
        let actual = average(&[1000000, -1000000]).expect("非空應有平均");
        assert!(actual.is_finite());
        assert!((actual - (0.0_f64)).abs() < 1e-9);
    }
    #[test]
    fn average_8() {
        let actual = average(&[1, 2, 3, 4]).expect("非空應有平均");
        assert!(actual.is_finite());
        assert!((actual - (2.5_f64)).abs() < 1e-9);
    }
    #[test]
    fn average_9() {
        let actual = average(&[100, 0, 0]).expect("非空應有平均");
        assert!(actual.is_finite());
        assert!((actual - (33.333333333333336_f64)).abs() < 1e-9);
    }
    #[test]
    fn average_10() {
        let actual = average(&[
            7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
            7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
            7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
            7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
        ])
        .expect("非空應有平均");
        assert!(actual.is_finite());
        assert!((actual - (7.0_f64)).abs() < 1e-9);
    }
}
