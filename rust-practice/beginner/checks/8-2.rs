#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn remove_1() {
        let mut values = vec![];
        assert_eq!(remove_value(&mut values, 0), 0);
        assert_eq!(values, vec![]);
    }
    #[test]
    fn remove_2() {
        let mut values = vec![1];
        assert_eq!(remove_value(&mut values, 1), 1);
        assert_eq!(values, vec![]);
    }
    #[test]
    fn remove_3() {
        let mut values = vec![1];
        assert_eq!(remove_value(&mut values, 2), 0);
        assert_eq!(values, vec![1]);
    }
    #[test]
    fn remove_4() {
        let mut values = vec![2, 2, 2];
        assert_eq!(remove_value(&mut values, 2), 3);
        assert_eq!(values, vec![]);
    }
    #[test]
    fn remove_5() {
        let mut values = vec![1, 2, 1, 3];
        assert_eq!(remove_value(&mut values, 1), 2);
        assert_eq!(values, vec![2, 3]);
    }
    #[test]
    fn remove_6() {
        let mut values = vec![1, 2, 3];
        assert_eq!(remove_value(&mut values, 2), 1);
        assert_eq!(values, vec![1, 3]);
    }
    #[test]
    fn remove_7() {
        let mut values = vec![0, -1, 0];
        assert_eq!(remove_value(&mut values, 0), 2);
        assert_eq!(values, vec![-1]);
    }
    #[test]
    fn remove_8() {
        let mut values = vec![1, 2, 3];
        assert_eq!(remove_value(&mut values, 9), 0);
        assert_eq!(values, vec![1, 2, 3]);
    }
    #[test]
    fn remove_9() {
        let mut values = vec![5, 5, 1, 5];
        assert_eq!(remove_value(&mut values, 5), 3);
        assert_eq!(values, vec![1]);
    }
    #[test]
    fn remove_10() {
        let mut values = vec![1, 1, 2, 2];
        assert_eq!(remove_value(&mut values, 2), 2);
        assert_eq!(values, vec![1, 1]);
    }
}
