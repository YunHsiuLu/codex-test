#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn boundaries() {
        assert_eq!(triangular(0), Some(0));
        assert_eq!(triangular(1), Some(1));
        assert_eq!(triangular(10), Some(55));
        assert_eq!(triangular(65536), Some(2147516416));
        assert_eq!(triangular(u32::MAX), None);
    }
    #[test]
    fn agrees_with_small_oracle() {
        for n in 0..1000 {
            assert_eq!(triangular(n), Some((0..=n).sum()));
        }
    }
}

#[cfg(test)]
mod extra_checks {
    use super::*;
    #[test]
    fn exact_last_boundary() {
        for n in 92679..=92683 {
            let t = u64::from(n) * (u64::from(n) + 1) / 2;
            assert_eq!(triangular(n), u32::try_from(t).ok());
        }
    }
}
