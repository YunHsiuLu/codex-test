#[cfg(test)] mod course_checks {
    use super::*;
    #[test] fn borrowed_unicode_text() {
        for (text,want) in [("",0),("Rust",4),("物理",2),("a b",3)] {
            let original=String::from(text);
            assert_eq!(count(&original),want,"輸入：{text:?}");
            assert_eq!(original,text);
        }
    }
}
