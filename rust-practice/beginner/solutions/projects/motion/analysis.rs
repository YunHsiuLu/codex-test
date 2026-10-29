use crate::model::Record;
pub fn velocity(records: &[Record]) -> Result<f64, String> {
    if records.is_empty() {
        return Err(String::from("error: no data"));
    }
    let mut displacement = 0.0;
    let mut seconds = 0.0;
    for record in records {
        displacement += record.displacement;
        seconds += record.seconds;
    }
    let result = displacement / seconds;
    if !displacement.is_finite() || !seconds.is_finite() || !result.is_finite() {
        return Err(String::from("error: numeric range"));
    }
    Ok(result)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn unequal_times() {
        let rows = [
            Record {
                displacement: 100.0,
                seconds: 10.0,
            },
            Record {
                displacement: -40.0,
                seconds: 20.0,
            },
        ];
        assert!((velocity(&rows).unwrap() - 2.0).abs() < 1e-9);
    }
}
