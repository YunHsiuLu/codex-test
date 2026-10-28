fn main() {
    let limit = 10;
    let mut total = 0;
    for n in 1..=limit {
        if n % 2 == 0 {
            total += n;
        }
    }
    println!("{total}");
}
