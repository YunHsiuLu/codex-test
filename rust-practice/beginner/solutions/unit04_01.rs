use rust_beginner_course::support::read_i64;
fn main() {
    let n = read_i64();
    let mut total = 0;
    for value in 1..=n {
        total += value;
    }
    println!("{total}");
}
