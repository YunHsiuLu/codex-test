use rust_beginner_course::support::read_i64;
fn main() {
    let n = read_i64();
    let mut total = 0;
    // 累加。
    for i in 1..=n {
        total += i;
    }
    println!("{total}");
}
