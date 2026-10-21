fn parse_time(text: &str) -> Result<f64, String> {
    let t = text.trim().parse::<f64>().map_err(|_| String::from("不是數字"))?;
    if !t.is_finite() || t <= 0.0 { return Err(String::from("時間必須為有限正數")); }
    Ok(t)
}
fn main() { println!("{:?}", parse_time("2.5")); }
