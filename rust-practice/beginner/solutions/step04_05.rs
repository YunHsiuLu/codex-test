fn main() {
    let limit = 20;
    let threshold = 50;
    let mut found = 0;
    for n in 1..=limit {
        if n * n >= threshold {
            found = n;
            break;
        }
    }
    println!("{found}");
}
