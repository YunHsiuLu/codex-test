#[cfg(test)] mod course_checks {
    use super::*;
    #[test] fn weighted_not_arithmetic_mean() {
        let r=[Record {displacement:100.0,seconds:10.0},Record {displacement:-40.0,seconds:20.0}];
        assert!((average_velocity(&r).unwrap()-2.0).abs()<1e-9);
    }
    #[test] fn round_trip() {
        let r=[Record {displacement:10.0,seconds:2.0},Record {displacement:-10.0,seconds:3.0}];
        assert!((average_velocity(&r).unwrap()).abs()<1e-9);
    }
    #[test] fn invalid_input() {
        assert!(average_velocity(&[]).is_err());
        for (displacement,seconds) in [(1.0,0.0),(1.0,-1.0),(f64::NAN,1.0),(1.0,f64::INFINITY)] {
            assert!(average_velocity(&[Record {displacement,seconds}]).is_err());
        }
    }
    #[test] fn non_finite_totals() {
        let r=[Record {displacement:1e308,seconds:1.0},Record {displacement:1e308,seconds:1.0}];
        assert!(average_velocity(&r).is_err());
    }
}
