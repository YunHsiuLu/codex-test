#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn spaces_1() {
        assert_eq!(normalize_spaces(""), "");
    }
    #[test]
    fn spaces_2() {
        assert_eq!(normalize_spaces(" "), "");
    }
    #[test]
    fn spaces_3() {
        assert_eq!(normalize_spaces("Rust"), "Rust");
    }
    #[test]
    fn spaces_4() {
        assert_eq!(normalize_spaces("  Rust  "), "Rust");
    }
    #[test]
    fn spaces_5() {
        assert_eq!(normalize_spaces("a  b"), "a b");
    }
    #[test]
    fn spaces_6() {
        assert_eq!(normalize_spaces("a\tb\nc"), "a b c");
    }
    #[test]
    fn spaces_7() {
        assert_eq!(normalize_spaces("物理  課程"), "物理 課程");
    }
    #[test]
    fn spaces_8() {
        assert_eq!(normalize_spaces(" a　b "), "a b");
    }
    #[test]
    fn spaces_9() {
        assert_eq!(normalize_spaces("one two three"), "one two three");
    }
    #[test]
    fn spaces_10() {
        assert_eq!(normalize_spaces("\n\t"), "");
    }
}
