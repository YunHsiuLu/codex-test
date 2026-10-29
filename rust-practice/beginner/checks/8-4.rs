#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn sort_1() {
        let input = vec![];
        assert_eq!(sorted_unique(&input), vec![]);
        assert_eq!(input, vec![]);
    }
    #[test]
    fn sort_2() {
        let input = vec![1];
        assert_eq!(sorted_unique(&input), vec![1]);
        assert_eq!(input, vec![1]);
    }
    #[test]
    fn sort_3() {
        let input = vec![2, 1];
        assert_eq!(sorted_unique(&input), vec![1, 2]);
        assert_eq!(input, vec![2, 1]);
    }
    #[test]
    fn sort_4() {
        let input = vec![1, 1];
        assert_eq!(sorted_unique(&input), vec![1]);
        assert_eq!(input, vec![1, 1]);
    }
    #[test]
    fn sort_5() {
        let input = vec![3, 1, 2, 1];
        assert_eq!(sorted_unique(&input), vec![1, 2, 3]);
        assert_eq!(input, vec![3, 1, 2, 1]);
    }
    #[test]
    fn sort_6() {
        let input = vec![-2, 0, -2, 3];
        assert_eq!(sorted_unique(&input), vec![-2, 0, 3]);
        assert_eq!(input, vec![-2, 0, -2, 3]);
    }
    #[test]
    fn sort_7() {
        let input = vec![5, 4, 3, 2, 1];
        assert_eq!(sorted_unique(&input), vec![1, 2, 3, 4, 5]);
        assert_eq!(input, vec![5, 4, 3, 2, 1]);
    }
    #[test]
    fn sort_8() {
        let input = vec![0, 0, 0];
        assert_eq!(sorted_unique(&input), vec![0]);
        assert_eq!(input, vec![0, 0, 0]);
    }
    #[test]
    fn sort_9() {
        let input = vec![9, -9, 9, -9];
        assert_eq!(sorted_unique(&input), vec![-9, 9]);
        assert_eq!(input, vec![9, -9, 9, -9]);
    }
    #[test]
    fn sort_10() {
        let input = vec![9223372036854775807, -9223372036854775808, 0];
        assert_eq!(
            sorted_unique(&input),
            vec![-9223372036854775808, 0, 9223372036854775807]
        );
        assert_eq!(input, vec![9223372036854775807, -9223372036854775808, 0]);
    }
}
