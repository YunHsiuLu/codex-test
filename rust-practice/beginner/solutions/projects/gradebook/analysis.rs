use crate::model::Grade;
use std::collections::BTreeMap;
pub fn averages(grades: &[Grade]) -> BTreeMap<String, f64> {
    let mut groups: BTreeMap<String, (f64, usize)> = BTreeMap::new();
    for grade in grades {
        let entry = groups.entry(grade.name.clone()).or_insert((0.0, 0));
        entry.0 += grade.score;
        entry.1 += 1;
    }
    let mut result = BTreeMap::new();
    for (name, (sum, count)) in groups {
        result.insert(name, sum / count as f64);
    }
    result
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn same_name_groups() {
        let rows = [
            Grade {
                name: "A".into(),
                score: 10.0,
            },
            Grade {
                name: "A".into(),
                score: 30.0,
            },
        ];
        assert_eq!(averages(&rows).get("A"), Some(&20.0));
    }
}
