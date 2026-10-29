#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn scalar_1() {
        let text = String::from("");
        assert_eq!(scalar_count(&text), 0);
        assert_eq!(text, "");
    }
    #[test]
    fn scalar_2() {
        let text = String::from("Rust");
        assert_eq!(scalar_count(&text), 4);
        assert_eq!(text, "Rust");
    }
    #[test]
    fn scalar_3() {
        let text = String::from("物理");
        assert_eq!(scalar_count(&text), 2);
        assert_eq!(text, "物理");
    }
    #[test]
    fn scalar_4() {
        let text = String::from("a b");
        assert_eq!(scalar_count(&text), 3);
        assert_eq!(text, "a b");
    }
    #[test]
    fn scalar_5() {
        let text = String::from("12345");
        assert_eq!(scalar_count(&text), 5);
        assert_eq!(text, "12345");
    }
    #[test]
    fn scalar_6() {
        let text = String::from("\n");
        assert_eq!(scalar_count(&text), 1);
        assert_eq!(text, "\n");
    }
    #[test]
    fn scalar_7() {
        let text = String::from("🦀");
        assert_eq!(scalar_count(&text), 1);
        assert_eq!(text, "🦀");
    }
    #[test]
    fn scalar_8() {
        let text = String::from("é");
        assert_eq!(scalar_count(&text), 2);
        assert_eq!(text, "é");
    }
    #[test]
    fn scalar_9() {
        let text = String::from("Rust物理");
        assert_eq!(scalar_count(&text), 6);
        assert_eq!(text, "Rust物理");
    }
    #[test]
    fn scalar_10() {
        let text = String::from("é");
        assert_eq!(scalar_count(&text), 1);
        assert_eq!(text, "é");
    }
}
