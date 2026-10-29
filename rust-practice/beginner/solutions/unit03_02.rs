use rust_beginner_course::support::read_i64;
fn main() {
    let year = read_i64();
    let leap = year % 400 == 0 || (year % 4 == 0 && year % 100 != 0);
    println!("{}", if leap { "yes" } else { "no" });
}
