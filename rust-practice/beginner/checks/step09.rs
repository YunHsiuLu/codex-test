#[cfg(test)]
mod course_checks {
    use super::*;
    fn assert_motion(d: f64, t: f64, v: f64) {
        assert!(
            (Motion {
                distance: d,
                time: t
            }
            .speed()
                - v)
                .abs()
                < 1e-9,
            "位移={d}，秒數={t}，預期={v}"
        );
    }
    #[test]
    fn standard() {
        assert_motion(120.0, 10.0, 12.0);
    }
    #[test]
    fn second_record() {
        assert_motion(50.0, 5.0, 10.0);
    }
    #[test]
    fn negative() {
        assert_motion(-6.0, 2.0, -3.0);
    }
    #[test]
    fn stationary() {
        assert_motion(0.0, 1.0, 0.0);
    }
    #[test]
    fn fraction() {
        assert_motion(5.0, 2.0, 2.5);
    }
    #[test]
    fn short_time() {
        assert_motion(1.0, 0.5, 2.0);
    }
    #[test]
    fn long_time() {
        assert_motion(2.0, 100.0, 0.02);
    }
    #[test]
    fn large() {
        assert_motion(1000.0, 1.0, 1000.0);
    }
    #[test]
    #[should_panic]
    fn reject_zero() {
        Motion {
            distance: 1.0,
            time: 0.0,
        }
        .speed();
    }
    #[test]
    #[should_panic]
    fn reject_negative() {
        Motion {
            distance: 1.0,
            time: -1.0,
        }
        .speed();
    }
}
