use rust_beginner_course::support::read_i64;
fn main() {
    let year = read_i64();
    if year % 400 == 0 || (year % 4 == 0 && year % 100 != 0) {
        println!("yes");
    } else {
        println!("no");
    }
}
