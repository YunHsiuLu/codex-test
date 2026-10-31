use rust_beginner_course::support::read_i64;
fn main() {
    let n = read_i64();
    let mut count = 0;
    for i in 1..=n {
        if i % 3 == 0 && i % 5 != 0 {
            count += 1;
        }
    }
    println!("{count}");
}
