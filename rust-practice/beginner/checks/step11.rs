#[cfg(test)]
mod course_checks {
    use super::*;

    #[test]
    fn freezing() {
        assert!((c_to_f(0.0) - (32.0)).abs() < 1e-9, "攝氏=0，預期華氏=32");
    }
    #[test]
    fn room() {
        assert!((c_to_f(25.0) - (77.0)).abs() < 1e-9, "攝氏=25，預期華氏=77");
    }
    #[test]
    fn boiling() {
        assert!(
            (c_to_f(100.0) - (212.0)).abs() < 1e-9,
            "攝氏=100，預期華氏=212"
        );
    }
    #[test]
    fn equal_scales() {
        assert!(
            (c_to_f(-40.0) - (-40.0)).abs() < 1e-9,
            "攝氏=-40，預期華氏=-40"
        );
    }
    #[test]
    fn negative() {
        assert!(
            (c_to_f(-10.0) - (14.0)).abs() < 1e-9,
            "攝氏=-10，預期華氏=14"
        );
    }
    #[test]
    fn body() {
        assert!(
            (c_to_f(37.0) - (98.6)).abs() < 1e-9,
            "攝氏=37，預期華氏=98.6"
        );
    }
    #[test]
    fn fraction() {
        assert!(
            (c_to_f(12.5) - (54.5)).abs() < 1e-9,
            "攝氏=12.5，預期華氏=54.5"
        );
    }
    #[test]
    fn twenty() {
        assert!((c_to_f(20.0) - (68.0)).abs() < 1e-9, "攝氏=20，預期華氏=68");
    }
    #[test]
    fn absolute_zero() {
        assert!(
            (c_to_f(-273.15) - (-459.67)).abs() < 1e-9,
            "攝氏=-273.15，預期華氏=-459.67"
        );
    }
    #[test]
    fn fifty() {
        assert!(
            (c_to_f(50.0) - (122.0)).abs() < 1e-9,
            "攝氏=50，預期華氏=122"
        );
    }
    #[test]
    fn linear_difference() {
        assert!((c_to_f(35.0) - c_to_f(25.0) - 18.0).abs() < 1e-9);
    }
}
