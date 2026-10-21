#[cfg(test)]
mod course_checks {
    use super::*;

    #[test]
    fn empty() {
        let original = String::from("");
        assert_eq!(count(&original), 0);
        assert_eq!(original, "");
    }
    #[test]
    fn ascii() {
        let original = String::from("Rust");
        assert_eq!(count(&original), 4);
        assert_eq!(original, "Rust");
    }
    #[test]
    fn chinese() {
        let original = String::from("物理");
        assert_eq!(count(&original), 2);
        assert_eq!(original, "物理");
    }
    #[test]
    fn spaces() {
        let original = String::from("a b");
        assert_eq!(count(&original), 3);
        assert_eq!(original, "a b");
    }
    #[test]
    fn digits() {
        let original = String::from("12345");
        assert_eq!(count(&original), 5);
        assert_eq!(original, "12345");
    }
    #[test]
    fn newline() {
        let original = String::from("\n");
        assert_eq!(count(&original), 1);
        assert_eq!(original, "\n");
    }
    #[test]
    fn emoji() {
        let original = String::from("🦀");
        assert_eq!(count(&original), 1);
        assert_eq!(original, "🦀");
    }
    #[test]
    fn combining() {
        let original = String::from("e\u{301}");
        assert_eq!(count(&original), 2);
        assert_eq!(original, "e\u{301}");
    }
    #[test]
    fn mixed() {
        let original = String::from("Rust物理");
        assert_eq!(count(&original), 6);
        assert_eq!(original, "Rust物理");
    }
    #[test]
    fn accent() {
        let original = String::from("é");
        assert_eq!(count(&original), 1);
        assert_eq!(original, "é");
    }
    #[test]
    fn retained_owner() {
        let original = String::from("borrow");
        assert_eq!(count(&original), 6);
        assert_eq!(original, "borrow");
    }
}
