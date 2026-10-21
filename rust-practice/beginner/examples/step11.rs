fn c_to_f(c: f64) -> f64 { 0.0 }
fn main() { println!("{}", c_to_f(25.0)); }
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn freezing() { assert!((c_to_f(0.0) - 32.0).abs() < 1e-9); }
}
