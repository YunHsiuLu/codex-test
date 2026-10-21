#[derive(Debug, PartialEq)]
enum ParseError {
    Columns,
    Number,
    NonFinite,
    NonPositiveTime,
}
fn parse_record(line: &str) -> Result<(f64, f64), ParseError> {
    let parts: Vec<_> = line.split(',').collect();
    if parts.len() != 2 {
        return Err(ParseError::Columns);
    }
    let d = parts[0]
        .trim()
        .parse::<f64>()
        .map_err(|_| ParseError::Number)?;
    let t = parts[1]
        .trim()
        .parse::<f64>()
        .map_err(|_| ParseError::Number)?;
    if !d.is_finite() || !t.is_finite() {
        return Err(ParseError::NonFinite);
    }
    if t <= 0.0 {
        return Err(ParseError::NonPositiveTime);
    }
    Ok((d, t))
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
