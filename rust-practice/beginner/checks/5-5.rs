#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn gcd_case_1() {
        assert_eq!(gcd(48_u64, 18_u64), 6_u64);
    }
    #[test]
    fn gcd_case_2() {
        assert_eq!(gcd(35_u64, 14_u64), 7_u64);
    }
    #[test]
    fn gcd_case_3() {
        assert_eq!(gcd(0_u64, 9_u64), 9_u64);
    }
    #[test]
    fn gcd_case_4() {
        assert_eq!(gcd(9_u64, 0_u64), 9_u64);
    }
    #[test]
    fn gcd_case_5() {
        assert_eq!(gcd(0_u64, 0_u64), 0_u64);
    }
    #[test]
    fn gcd_case_6() {
        assert_eq!(gcd(12_u64, 12_u64), 12_u64);
    }
    #[test]
    fn gcd_case_7() {
        assert_eq!(gcd(18_u64, 48_u64), 6_u64);
    }
    #[test]
    fn gcd_case_8() {
        assert_eq!(gcd(100_u64, 25_u64), 25_u64);
    }
    #[test]
    fn gcd_case_9() {
        assert_eq!(gcd(270_u64, 192_u64), 6_u64);
    }
    #[test]
    fn gcd_case_10() {
        assert_eq!(gcd(1_u64, 18446744073709551615_u64), 1_u64);
    }
    #[test]
    fn gcd_case_11() {
        assert_eq!(
            gcd(18446744073709551615_u64, 0_u64),
            18446744073709551615_u64
        );
    }
    #[test]
    fn gcd_case_12() {
        assert_eq!(
            gcd(18446744073709551615_u64, 18446744073709551615_u64),
            18446744073709551615_u64
        );
    }
    #[test]
    fn gcd_case_13() {
        assert_eq!(
            gcd(18446744073709551615_u64, 18446744073709551614_u64),
            1_u64
        );
    }
    #[test]
    fn gcd_case_14() {
        assert_eq!(
            gcd(9223372036854775808_u64, 4611686018427387904_u64),
            4611686018427387904_u64
        );
    }
}
