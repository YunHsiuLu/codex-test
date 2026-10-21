#[cfg(test)]
mod course_checks {
    use super::*;

    #[test]
    fn empty() {
        let a: Vec<i32> = vec![];
        assert_eq!(
            parallel_sum(&a),
            a.iter().map(|&x| i64::from(x)).sum::<i64>()
        );
    }
    #[test]
    fn single_positive() {
        let a: Vec<i32> = vec![1];
        assert_eq!(
            parallel_sum(&a),
            a.iter().map(|&x| i64::from(x)).sum::<i64>()
        );
    }
    #[test]
    fn single_negative() {
        let a: Vec<i32> = vec![-7];
        assert_eq!(
            parallel_sum(&a),
            a.iter().map(|&x| i64::from(x)).sum::<i64>()
        );
    }
    #[test]
    fn two_values() {
        let a: Vec<i32> = vec![3, 9];
        assert_eq!(
            parallel_sum(&a),
            a.iter().map(|&x| i64::from(x)).sum::<i64>()
        );
    }
    #[test]
    fn odd_length() {
        let a: Vec<i32> = vec![-3, 2, 7];
        assert_eq!(
            parallel_sum(&a),
            a.iter().map(|&x| i64::from(x)).sum::<i64>()
        );
    }
    #[test]
    fn all_zero() {
        let a: Vec<i32> = vec![0; 8];
        assert_eq!(
            parallel_sum(&a),
            a.iter().map(|&x| i64::from(x)).sum::<i64>()
        );
    }
    #[test]
    fn all_negative() {
        let a: Vec<i32> = vec![-1, -2, -3, -4];
        assert_eq!(
            parallel_sum(&a),
            a.iter().map(|&x| i64::from(x)).sum::<i64>()
        );
    }
    #[test]
    fn wide_sum() {
        let a: Vec<i32> = vec![i32::MAX, i32::MAX];
        assert_eq!(
            parallel_sum(&a),
            a.iter().map(|&x| i64::from(x)).sum::<i64>()
        );
    }
    #[test]
    fn minimum_values() {
        let a: Vec<i32> = vec![i32::MIN, i32::MIN];
        assert_eq!(
            parallel_sum(&a),
            a.iter().map(|&x| i64::from(x)).sum::<i64>()
        );
    }
    #[test]
    fn mixed_cancellation() {
        let a: Vec<i32> = vec![i32::MIN, i32::MAX, 1];
        assert_eq!(
            parallel_sum(&a),
            a.iter().map(|&x| i64::from(x)).sum::<i64>()
        );
    }
    #[test]
    fn larger_collection() {
        let a: Vec<i32> = (0..1000).collect();
        assert_eq!(
            parallel_sum(&a),
            a.iter().map(|&x| i64::from(x)).sum::<i64>()
        );
    }
}
