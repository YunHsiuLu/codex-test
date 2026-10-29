use rust_beginner_course::support::read_i64;
fn main() {
    let mut n = read_i64();
    let mut digits = 1;
    while n >= 10 {
        n /= 10;
        digits += 1;
    }
    println!("{digits}");
}
