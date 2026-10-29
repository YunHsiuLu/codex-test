#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn clamp_1() {
        assert_eq!(clamp(-1, 0, 10), 0);
    }
    #[test]
    fn clamp_2() {
        assert_eq!(clamp(0, 0, 10), 0);
    }
    #[test]
    fn clamp_3() {
        assert_eq!(clamp(5, 0, 10), 5);
    }
    #[test]
    fn clamp_4() {
        assert_eq!(clamp(10, 0, 10), 10);
    }
    #[test]
    fn clamp_5() {
        assert_eq!(clamp(11, 0, 10), 10);
    }
    #[test]
    fn clamp_6() {
        assert_eq!(clamp(-20, -10, -5), -10);
    }
    #[test]
    fn clamp_7() {
        assert_eq!(clamp(-7, -10, -5), -7);
    }
    #[test]
    fn clamp_8() {
        assert_eq!(clamp(9, 2, 2), 2);
    }
    #[test]
    fn clamp_9() {
        assert_eq!(clamp(0, 2, 2), 2);
    }
    #[test]
    fn clamp_10() {
        assert!(std::panic::catch_unwind(|| clamp(3, 5, 4)).is_err());
    }
}
