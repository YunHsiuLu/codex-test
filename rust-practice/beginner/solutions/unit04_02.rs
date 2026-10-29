use rust_beginner_course::support::read_i64;
fn main() {
    let n = read_i64();
    let mut count = 0;
    for value in 1..=n {
        if value % 5 == 0 {
            continue;
        }
        if value % 3 == 0 {
            count += 1;
        }
    }
    println!("{count}");
}
