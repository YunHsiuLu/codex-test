#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn bonus_1() {
        let mut score = 0;
        add_bonus(&mut score, 0);
        assert_eq!(score, 0);
    }
    #[test]
    fn bonus_2() {
        let mut score = 0;
        add_bonus(&mut score, 10);
        assert_eq!(score, 10);
    }
    #[test]
    fn bonus_3() {
        let mut score = 100;
        add_bonus(&mut score, 0);
        assert_eq!(score, 100);
    }
    #[test]
    fn bonus_4() {
        let mut score = 100;
        add_bonus(&mut score, 1);
        assert_eq!(score, 100);
    }
    #[test]
    fn bonus_5() {
        let mut score = 50;
        add_bonus(&mut score, 20);
        assert_eq!(score, 70);
    }
    #[test]
    fn bonus_6() {
        let mut score = 50;
        add_bonus(&mut score, -20);
        assert_eq!(score, 30);
    }
    #[test]
    fn bonus_7() {
        let mut score = 10;
        add_bonus(&mut score, -100);
        assert_eq!(score, 0);
    }
    #[test]
    fn bonus_8() {
        let mut score = 90;
        add_bonus(&mut score, 100);
        assert_eq!(score, 100);
    }
    #[test]
    fn bonus_9() {
        let mut score = 0;
        add_bonus(&mut score, -1);
        assert_eq!(score, 0);
    }
    #[test]
    fn bonus_10() {
        let mut score = 100;
        add_bonus(&mut score, -100);
        assert_eq!(score, 0);
    }
}
