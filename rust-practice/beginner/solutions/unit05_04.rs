fn factorial(n: u32) -> u64 {
    assert!(n <= 20, "n必須介於0到20");
    if n == 0 {
        return 1;
    }
    n as u64 * factorial(n - 1)
}

fn main() {
    println!("{}", factorial(5));
}
