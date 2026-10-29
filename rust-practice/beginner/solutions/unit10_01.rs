fn parse_positive(text: &str) -> Result<f64, String> {
    let value = match text.trim().parse::<f64>() {
        Ok(v) => v,
        Err(_) => return Err(String::from("不是數字")),
    };
    if !value.is_finite() || value <= 0.0 {
        return Err(String::from("必須為有限正數"));
    }
    Ok(value)
}
fn main() {
    println!("{:?}", parse_positive("2.5"));
}
