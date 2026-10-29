pub struct Student {
    pub name: String,
    pub scores: Vec<i64>,
}
impl Student {
    pub fn add_score(&mut self, score: i64) -> bool {
        if !(0..=100).contains(&score) {
            return false;
        }
        self.scores.push(score);
        true
    }
    pub fn average(&self) -> Option<f64> {
        if self.scores.is_empty() {
            return None;
        }
        let mut total = 0;
        for s in &self.scores {
            total += *s;
        }
        Some(total as f64 / self.scores.len() as f64)
    }
}
fn main() {
    let mut s = Student {
        name: String::from("Amy"),
        scores: vec![],
    };
    s.add_score(80);
    println!("{:?}", s.average());
}
