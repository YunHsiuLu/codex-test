fn factorial(n: u32) -> u64 {
    assert!(n <= 20, "超過最大值");
    if n == 0 {
        return 1;
    } else {
       return n as u64 * factorial(n-1); 
    }
}

fn main() {}
