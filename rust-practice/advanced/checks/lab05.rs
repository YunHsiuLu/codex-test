#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn index_order_and_independence() {
        let mut a = [10, 20, 30];
        let (x, y) = two_mut(&mut a, 2, 0).unwrap();
        *x += 1;
        *y += 2;
        assert_eq!(a, [12, 20, 31]);
        let (x, y) = two_mut(&mut a, 0, 1).unwrap();
        std::mem::swap(x, y);
        assert_eq!(a, [20, 12, 31]);
    }
    #[test]
    fn rejects_overlap_and_bounds() {
        assert!(two_mut(&mut [1], 0, 0).is_none());
        assert!(two_mut(&mut [1], 0, 1).is_none());
        assert!(two_mut::<i32>(&mut [], 0, 1).is_none());
    }
}
