#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn invariant() {
        assert_eq!(Seconds::new(2.0).unwrap().get(), 2.0);
        for x in [0.0, -1.0, f64::NAN, f64::INFINITY] {
            assert!(Seconds::new(x).is_err());
        }
    }
}
