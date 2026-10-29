use crate::model::Grade;
pub fn grades(text: &str) -> Result<Vec<Grade>, String> {
    let mut result = Vec::new();
    for (index, line) in text.lines().enumerate() {
        if line.trim().is_empty() {
            continue;
        }
        let fields: Vec<&str> = line.split(',').collect();
        let invalid = format!("error: line {}", index + 1);
        if fields.len() != 2 || fields[0].trim().is_empty() {
            return Err(invalid);
        }
        let score = match fields[1].trim().parse::<f64>() {
            Ok(value) => value,
            Err(_) => return Err(invalid),
        };
        if !score.is_finite() || !(0.0..=100.0).contains(&score) {
            return Err(invalid);
        }
        result.push(Grade {
            name: String::from(fields[0].trim()),
            score,
        });
    }
    if result.is_empty() {
        return Err(String::from("error: no data"));
    }
    Ok(result)
}
