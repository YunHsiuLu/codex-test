#[cfg(test)]
mod course_checks {
    use super::*;

    #[test]
    fn zero() {
        let n: u32 = 0;
        let t = u64::from(n) * (u64::from(n) + 1) / 2;
        assert_eq!(triangular(n), u32::try_from(t).ok());
    }
    #[test]
    fn one() {
        let n: u32 = 1;
        let t = u64::from(n) * (u64::from(n) + 1) / 2;
        assert_eq!(triangular(n), u32::try_from(t).ok());
    }
    #[test]
    fn even_small() {
        let n: u32 = 2;
        let t = u64::from(n) * (u64::from(n) + 1) / 2;
        assert_eq!(triangular(n), u32::try_from(t).ok());
    }
    #[test]
    fn odd_small() {
        let n: u32 = 3;
        let t = u64::from(n) * (u64::from(n) + 1) / 2;
        assert_eq!(triangular(n), u32::try_from(t).ok());
    }
    #[test]
    fn ten() {
        let n: u32 = 10;
        let t = u64::from(n) * (u64::from(n) + 1) / 2;
        assert_eq!(triangular(n), u32::try_from(t).ok());
    }
    #[test]
    fn thousand() {
        let n: u32 = 1000;
        let t = u64::from(n) * (u64::from(n) + 1) / 2;
        assert_eq!(triangular(n), u32::try_from(t).ok());
    }
    #[test]
    fn intermediate_overflow() {
        let n: u32 = 65536;
        let t = u64::from(n) * (u64::from(n) + 1) / 2;
        assert_eq!(triangular(n), u32::try_from(t).ok());
    }
    #[test]
    fn largest_fitting() {
        let n: u32 = 92681;
        let t = u64::from(n) * (u64::from(n) + 1) / 2;
        assert_eq!(triangular(n), u32::try_from(t).ok());
    }
    #[test]
    fn first_overflow() {
        let n: u32 = 92682;
        let t = u64::from(n) * (u64::from(n) + 1) / 2;
        assert_eq!(triangular(n), u32::try_from(t).ok());
    }
    #[test]
    fn maximum() {
        let n: u32 = 4294967295;
        let t = u64::from(n) * (u64::from(n) + 1) / 2;
        assert_eq!(triangular(n), u32::try_from(t).ok());
    }
}
