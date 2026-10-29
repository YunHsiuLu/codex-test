#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn new_zero() {
        assert_eq!(Account::new(0).balance, 0);
    }
    #[test]
    fn new_balance() {
        assert_eq!(Account::new(100).balance, 100);
    }
    #[test]
    fn deposit() {
        let mut a = Account::new(10);
        assert!(a.deposit(5));
        assert_eq!(a.balance, 15);
    }
    #[test]
    fn deposit_zero() {
        let mut a = Account::new(10);
        assert!(!a.deposit(0));
        assert_eq!(a.balance, 10);
    }
    #[test]
    fn deposit_negative() {
        let mut a = Account::new(10);
        assert!(!a.deposit(-1));
        assert_eq!(a.balance, 10);
    }
    #[test]
    fn withdraw() {
        let mut a = Account::new(10);
        assert!(a.withdraw(3));
        assert_eq!(a.balance, 7);
    }
    #[test]
    fn withdraw_all() {
        let mut a = Account::new(10);
        assert!(a.withdraw(10));
        assert_eq!(a.balance, 0);
    }
    #[test]
    fn insufficient() {
        let mut a = Account::new(10);
        assert!(!a.withdraw(11));
        assert_eq!(a.balance, 10);
    }
    #[test]
    fn invalid_withdraw() {
        let mut a = Account::new(10);
        assert!(!a.withdraw(0));
        assert!(!a.withdraw(-1));
        assert_eq!(a.balance, 10);
    }
    #[test]
    fn sequence() {
        let mut a = Account::new(0);
        assert!(a.deposit(50));
        assert!(a.withdraw(20));
        assert!(!a.withdraw(40));
        assert_eq!(a.balance, 30);
    }
    #[test]
    fn reject_initial() {
        assert!(std::panic::catch_unwind(|| Account::new(-1)).is_err());
    }
}
