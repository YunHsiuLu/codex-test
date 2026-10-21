#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn duplicates_and_edges() {
        let a = [1, 3, 3, 7];
        for (x, want) in [(0, 0), (1, 0), (3, 1), (4, 3), (8, 4)] {
            assert_eq!(lower_bound(&a, x), want);
        }
        assert_eq!(lower_bound(&[], 5), 0);
    }
    #[test]
    fn compare_linear_specification() {
        for len in 0..30 {
            let a: Vec<i32> = (0..len).map(|i| i / 3).collect();
            for t in -1..12 {
                assert_eq!(
                    lower_bound(&a, t),
                    a.iter().position(|&x| x >= t).unwrap_or(a.len())
                );
            }
        }
    }
}

#[cfg(test)]
mod extra_checks {
    use super::*;
    #[test]
    fn signed_extremes() {
        let a = [i32::MIN, 0, i32::MAX];
        assert_eq!(lower_bound(&a, i32::MIN), 0);
        assert_eq!(lower_bound(&a, i32::MAX), 2);
    }
}
