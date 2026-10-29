#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn find_1() {
        assert_eq!(first_index(&[], 1), None);
    }
    #[test]
    fn find_2() {
        assert_eq!(first_index(&[1], 1), Some(0));
    }
    #[test]
    fn find_3() {
        assert_eq!(first_index(&[1], 0), None);
    }
    #[test]
    fn find_4() {
        assert_eq!(first_index(&[2, 1, 2], 2), Some(0));
    }
    #[test]
    fn find_5() {
        assert_eq!(first_index(&[2, 1, 2], 1), Some(1));
    }
    #[test]
    fn find_6() {
        assert_eq!(first_index(&[1, 2, 3], 3), Some(2));
    }
    #[test]
    fn find_7() {
        assert_eq!(first_index(&[-3, 0, 3], -3), Some(0));
    }
    #[test]
    fn find_8() {
        assert_eq!(first_index(&[0, 0], 0), Some(0));
    }
    #[test]
    fn find_9() {
        assert_eq!(first_index(&[1, 2, 3], 9), None);
    }
    #[test]
    fn find_10() {
        assert_eq!(first_index(&[9, 8, 7, 6], 7), Some(2));
    }
}
