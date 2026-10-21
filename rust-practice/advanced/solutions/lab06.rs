fn field<'a>(line: &'a str, key: &str) -> Option<&'a str> {
    for part in line.split(';') {
        if let Some((k, v)) = part.split_once('=') {
            if k.trim() == key {
                return Some(v.trim());
            }
        }
    }
    None
}
fn main() {
    println!("{:?}", field("name=物理; unit=m/s", "name"));
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn unicode_and_empty_value() {
        let s = String::from("name=物理; unit= m/s ; empty=");
        assert_eq!(field(&s, "name"), Some("物理"));
        assert_eq!(field(&s, "empty"), Some(""));
        assert_eq!(field(&s, "missing"), None);
    }
    #[test]
    fn key_need_not_live_as_long() {
        let line = String::from("unit=m/s");
        let value;
        {
            let key = String::from("unit");
            value = field(&line, &key);
        }
        assert_eq!(value, Some("m/s"));
    }
}
