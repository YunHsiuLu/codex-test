use crate::model::Record;
pub fn records(text: &str) -> Result<Vec<Record>, String> {
    let mut records = Vec::new();
    for (index, line) in text.lines().enumerate() {
        if line.trim().is_empty() {
            continue;
        }
        let fields: Vec<&str> = line.split(',').collect();
        let invalid = format!("error: line {}", index + 1);
        if fields.len() != 2 {
            return Err(invalid);
        }
        let displacement = match fields[0].trim().parse::<f64>() {
            Ok(value) => value,
            Err(_) => return Err(invalid),
        };
        let seconds = match fields[1].trim().parse::<f64>() {
            Ok(value) => value,
            Err(_) => return Err(invalid),
        };
        if !displacement.is_finite() || !seconds.is_finite() || seconds <= 0.0 {
            return Err(invalid);
        }
        records.push(Record {
            displacement,
            seconds,
        });
    }
    if records.is_empty() {
        return Err(String::from("error: no data"));
    }
    Ok(records)
}
