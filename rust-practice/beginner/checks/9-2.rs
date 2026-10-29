#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn action_1() {
        assert_eq!(apply(0, Action::Add(3)), 3);
    }
    #[test]
    fn action_2() {
        assert_eq!(apply(5, Action::Add(-2)), 3);
    }
    #[test]
    fn action_3() {
        assert_eq!(apply(-5, Action::Add(2)), -3);
    }
    #[test]
    fn action_4() {
        assert_eq!(apply(0, Action::Multiply(8)), 0);
    }
    #[test]
    fn action_5() {
        assert_eq!(apply(5, Action::Multiply(0)), 0);
    }
    #[test]
    fn action_6() {
        assert_eq!(apply(-3, Action::Multiply(-2)), 6);
    }
    #[test]
    fn action_7() {
        assert_eq!(apply(7, Action::Reset), 0);
    }
    #[test]
    fn action_8() {
        assert_eq!(apply(-7, Action::Reset), 0);
    }
    #[test]
    fn action_9() {
        assert_eq!(apply(1000, Action::Multiply(1000)), 1000000);
    }
    #[test]
    fn action_10() {
        assert_eq!(apply(-1000, Action::Add(-1000)), -2000);
    }
}
