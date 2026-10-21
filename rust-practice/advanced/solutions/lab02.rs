fn midpoint(a: f64, b: f64) -> Option<f64> {
    if !a.is_finite() || !b.is_finite() {
        return None;
    }
    let m = if a.is_sign_positive() == b.is_sign_positive() {
        a + (b - a) / 2.0
    } else {
        (a + b) / 2.0
    };
    m.is_finite().then_some(m)
}
fn main() {
    println!("{:?}", midpoint(f64::MAX, f64::MAX));
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn finite_boundaries() {
        assert_eq!(midpoint(2.0, 4.0), Some(3.0));
        assert_eq!(midpoint(f64::MAX, f64::MAX), Some(f64::MAX));
        assert_eq!(midpoint(-f64::MAX, f64::MAX), Some(0.0));
        assert_eq!(
            midpoint(f64::MIN_POSITIVE, f64::MIN_POSITIVE),
            Some(f64::MIN_POSITIVE)
        );
        assert!(midpoint(f64::NAN, 1.0).is_none());
        assert!(midpoint(0.0, f64::INFINITY).is_none());
    }
    #[test]
    fn cancellation_is_observable() {
        assert_ne!((1e16_f64 + 1.0) - 1e16_f64, 1.0);
    }
}
