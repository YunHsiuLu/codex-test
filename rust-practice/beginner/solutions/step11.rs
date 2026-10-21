fn c_to_f(c: f64) -> f64 { c * 9.0 / 5.0 + 32.0 }
fn main() { println!("{}", c_to_f(25.0)); }
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn temperatures() {
        for (c, f) in [(0.0,32.0),(100.0,212.0),(-40.0,-40.0)] {
            assert!((c_to_f(c)-f).abs() < 1e-9);
        }
    }
}
