#[cfg(test)]
mod course_checks {
    use super::*;
    fn assert_speed(d: f64, t: f64, v: f64) {
        assert!(
            (speed(d, t) - v).abs() < 1e-9,
            "位移={d}，秒數={t}，預期={v}"
        );
    }
    #[test]
    fn standard() {
        assert_speed(100.0, 20.0, 5.0);
    }
    #[test]
    fn zero_distance() {
        assert_speed(0.0, 1.0, 0.0);
    }
    #[test]
    fn negative_distance() {
        assert_speed(-30.0, 3.0, -10.0);
    }
    #[test]
    fn fraction() {
        assert_speed(5.0, 2.0, 2.5);
    }
    #[test]
    fn half_second() {
        assert_speed(1.0, 0.5, 2.0);
    }
    #[test]
    fn quarter_speed() {
        assert_speed(1.0, 4.0, 0.25);
    }
    #[test]
    fn large_distance() {
        assert_speed(1000.0, 1.0, 1000.0);
    }
    #[test]
    fn long_time() {
        assert_speed(2.0, 100.0, 0.02);
    }
    #[test]
    #[should_panic]
    fn reject_zero_time() {
        speed(1.0, 0.0);
    }
    #[test]
    #[should_panic]
    fn reject_negative_time() {
        speed(1.0, -1.0);
    }
}
