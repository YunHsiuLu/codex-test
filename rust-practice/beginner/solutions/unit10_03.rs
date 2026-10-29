fn parse_pair(text: &str) -> Result<(f64, f64), String> {
    let parts: Vec<&str> = text.split(',').collect();
    if parts.len() != 2 {
        return Err(String::from("需要兩欄"));
    }
    let left = parts[0]
        .trim()
        .parse::<f64>()
        .map_err(|_| String::from("左欄不是數字"))?;
    let right = parts[1]
        .trim()
        .parse::<f64>()
        .map_err(|_| String::from("右欄不是數字"))?;
    if !left.is_finite() || !right.is_finite() || right <= 0.0 {
        return Err(String::from("數值無效"));
    }
    Ok((left, right))
}
fn main() {
    println!("{:?}", parse_pair("-3,2"));
}
