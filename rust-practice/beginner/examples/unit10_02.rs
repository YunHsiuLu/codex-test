#[derive(Debug, PartialEq, Eq)]
pub enum ParseError {
    Empty,
    NotInteger,
    OutOfRange,
}
fn parse_score(text: &str) -> Result<i64, ParseError> {
    todo!("分類錯誤")
}
fn main() {}
