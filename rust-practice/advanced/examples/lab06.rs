// 生命週期與零複製介面
// TODO：依 lessons/06.md 的契約完成；測試初始為紅燈。
fn field<'a>(line: &'a str, key: &str) -> Option<&'a str> {
    todo!("請先閱讀教材，再實作")
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
