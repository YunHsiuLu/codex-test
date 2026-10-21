#[cfg(test)]
mod course_checks {
    use super::*;

    #[test]
    fn forward() {
        let mut a = [10, 20, 30];
        let mut want = a;
        want[0] = 40;
        want[2] = 50;
        let (x, y) = two_mut(&mut a, 0, 2).unwrap();
        *x = 40;
        *y = 50;
        assert_eq!(a, want);
    }
    #[test]
    fn reverse() {
        let mut a = [10, 20, 30];
        let mut want = a;
        want[2] = 40;
        want[0] = 50;
        let (x, y) = two_mut(&mut a, 2, 0).unwrap();
        *x = 40;
        *y = 50;
        assert_eq!(a, want);
    }
    #[test]
    fn adjacent() {
        let mut a = [1, 2, 3];
        let mut want = a;
        want[1] = 40;
        want[2] = 50;
        let (x, y) = two_mut(&mut a, 1, 2).unwrap();
        *x = 40;
        *y = 50;
        assert_eq!(a, want);
    }
    #[test]
    fn two_elements() {
        let mut a = [7, 8];
        let mut want = a;
        want[0] = 40;
        want[1] = 50;
        let (x, y) = two_mut(&mut a, 0, 1).unwrap();
        *x = 40;
        *y = 50;
        assert_eq!(a, want);
    }
    #[test]
    fn same() {
        let mut a: [i32; 2] = [1, 2];
        assert!(two_mut(&mut a, 1, 1).is_none());
    }
    #[test]
    fn left_out() {
        let mut a: [i32; 2] = [1, 2];
        assert!(two_mut(&mut a, 2, 0).is_none());
    }
    #[test]
    fn right_out() {
        let mut a: [i32; 2] = [1, 2];
        assert!(two_mut(&mut a, 0, 2).is_none());
    }
    #[test]
    fn both_out() {
        let mut a: [i32; 2] = [1, 2];
        assert!(two_mut(&mut a, 3, 4).is_none());
    }
    #[test]
    fn empty() {
        let mut a: [i32; 0] = [];
        assert!(two_mut(&mut a, 0, 1).is_none());
    }
    #[test]
    fn huge_index() {
        let mut a: [i32; 2] = [1, 2];
        assert!(two_mut(&mut a, 0, usize::MAX).is_none());
    }
}
