#[cfg(test)]
mod course_checks {
    use super::*;

    #[test]
    fn stationary() {
        assert!(
            (average_velocity(&[Record {
                displacement: 0.0,
                seconds: 1.0
            }])
            .unwrap()
                - (0.0))
                .abs()
                < 1e-9
        );
    }
    #[test]
    fn forward() {
        assert!(
            (average_velocity(&[Record {
                displacement: 12.0,
                seconds: 2.0
            }])
            .unwrap()
                - (6.0))
                .abs()
                < 1e-9
        );
    }
    #[test]
    fn backward() {
        assert!(
            (average_velocity(&[Record {
                displacement: -12.0,
                seconds: 2.0
            }])
            .unwrap()
                - (-6.0))
                .abs()
                < 1e-9
        );
    }
    #[test]
    fn weighted() {
        assert!(
            (average_velocity(&[
                Record {
                    displacement: 100.0,
                    seconds: 10.0
                },
                Record {
                    displacement: -40.0,
                    seconds: 20.0
                }
            ])
            .unwrap()
                - (2.0))
                .abs()
                < 1e-9
        );
    }
    #[test]
    fn round_trip() {
        assert!(
            (average_velocity(&[
                Record {
                    displacement: 10.0,
                    seconds: 2.0
                },
                Record {
                    displacement: -10.0,
                    seconds: 3.0
                }
            ])
            .unwrap()
                - (0.0))
                .abs()
                < 1e-9
        );
    }
    #[test]
    fn empty() {
        assert!(average_velocity(&[]).is_err());
    }
    #[test]
    fn zero_time() {
        assert!(
            average_velocity(&[Record {
                displacement: 1.0,
                seconds: 0.0
            }])
            .is_err()
        );
    }
    #[test]
    fn negative_time() {
        assert!(
            average_velocity(&[Record {
                displacement: 1.0,
                seconds: -1.0
            }])
            .is_err()
        );
    }
    #[test]
    fn nan_displacement() {
        assert!(
            average_velocity(&[Record {
                displacement: f64::NAN,
                seconds: 1.0
            }])
            .is_err()
        );
    }
    #[test]
    fn nan_time() {
        assert!(
            average_velocity(&[Record {
                displacement: 1.0,
                seconds: f64::NAN
            }])
            .is_err()
        );
    }
    #[test]
    fn infinite_displacement() {
        assert!(
            average_velocity(&[Record {
                displacement: f64::INFINITY,
                seconds: 1.0
            }])
            .is_err()
        );
    }
    #[test]
    fn infinite_time() {
        assert!(
            average_velocity(&[Record {
                displacement: 1.0,
                seconds: f64::INFINITY
            }])
            .is_err()
        );
    }
    #[test]
    fn displacement_overflow() {
        assert!(
            average_velocity(&[
                Record {
                    displacement: 1e308,
                    seconds: 1.0
                },
                Record {
                    displacement: 1e308,
                    seconds: 1.0
                }
            ])
            .is_err()
        );
    }
    #[test]
    fn time_overflow() {
        assert!(
            average_velocity(&[
                Record {
                    displacement: 1.0,
                    seconds: 1e308
                },
                Record {
                    displacement: 1.0,
                    seconds: 1e308
                }
            ])
            .is_err()
        );
    }
    #[test]
    fn division_overflow() {
        assert!(
            average_velocity(&[Record {
                displacement: 1.0,
                seconds: 5e-324
            }])
            .is_err()
        );
    }
}
