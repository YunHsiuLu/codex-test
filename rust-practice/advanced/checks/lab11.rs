#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn serial_equivalence() {
        for a in [vec![], vec![1], vec![-3, 2, 7], vec![i32::MAX, i32::MAX]] {
            assert_eq!(
                parallel_sum(&a),
                a.iter().map(|&n| i64::from(n)).sum::<i64>()
            );
        }
    }
}
