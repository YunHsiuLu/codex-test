#[derive(Debug, PartialEq, Eq)]
pub enum ParseError {
    Empty,
    NotInteger,
    OutOfRange,
}
fn parse_score(text: &str) -> Result<i64, ParseError> {
    let text = text.trim();
    if text.is_empty() {
        return Err(ParseError::Empty);
    }
    let score = match text.parse::<i64>() {
        Ok(v) => v,
        Err(_) => return Err(ParseError::NotInteger),
    };
    if !(0..=100).contains(&score) {
        return Err(ParseError::OutOfRange);
    }
    Ok(score)
}
fn main() {
    println!("{:?}", parse_score("120"));
}
