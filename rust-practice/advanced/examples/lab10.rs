#[derive(Debug, PartialEq)]
enum ParseError {
    Columns,
    Number,
    NonFinite,
    NonPositiveTime,
}
fn parse_record(line: &str) -> Result<(f64, f64), ParseError> {
    todo!("依錯誤種類回傳 Result")
}
fn main() {
    println!("{:?}", parse_record("100,20"));
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn classifies_errors() {
        assert_eq!(parse_record(" -3, 2 "), Ok((-3.0, 2.0)));
        assert_eq!(parse_record("1,2,3"), Err(ParseError::Columns));
        assert_eq!(parse_record("abc,2"), Err(ParseError::Number));
        assert_eq!(parse_record("NaN,2"), Err(ParseError::NonFinite));
        assert_eq!(parse_record("1,0"), Err(ParseError::NonPositiveTime));
    }
}
