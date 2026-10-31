fn gcd(a: u64, b: u64) -> u64 {
    if b == 0 {
        return a;
    } else { 
        if a % b != 0 {
            return gcd(b, a % b);
        } else {
            return b;
        }
    }
}

fn main() {}
