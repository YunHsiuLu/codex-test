fn main() {
    let limit = 10;
    let divisor = 3;
    let mut count = 0;
    for n in 1..=limit {
        if n % divisor != 0 {
            continue;
        }
        count += 1;
    }
    println!("{count}");
}
