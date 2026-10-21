#[cfg(test)]
mod course_checks {
    use super::*;

    #[test]
    fn unicode() {
        assert_eq!(field("name=物理", "name"), Some("物理"));
    }
    #[test]
    fn empty_value() {
        assert_eq!(field("empty=", "empty"), Some(""));
    }
    #[test]
    fn missing() {
        assert_eq!(field("x=1", "y"), None);
    }
    #[test]
    fn empty_line() {
        assert_eq!(field("", "x"), None);
    }
    #[test]
    fn whitespace() {
        assert_eq!(field(" unit = m/s ", "unit"), Some("m/s"));
    }
    #[test]
    fn duplicate_first() {
        assert_eq!(field("x=1;x=2", "x"), Some("1"));
    }
    #[test]
    fn skip_malformed() {
        assert_eq!(field("bad;x=3", "x"), Some("3"));
    }
    #[test]
    fn last_field() {
        assert_eq!(field("a=1;b=2;c=3", "c"), Some("3"));
    }
    #[test]
    fn embedded_equals() {
        assert_eq!(field("expr=a=b", "expr"), Some("a=b"));
    }
    #[test]
    fn short_key_lifetime() {
        let line = String::from("unit=m/s");
        let value;
        {
            let key = String::from("unit");
            value = field(&line, &key);
        }
        assert_eq!(value, Some("m/s"));
    }
}
