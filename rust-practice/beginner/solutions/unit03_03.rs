use rust_beginner_course::support::read_i64;
fn main() {
    let a = read_i64();
    let b = read_i64();
    let c = read_i64();
    let valid = a > 0 && b > 0 && c > 0 && a + b > c && a + c > b && b + c > a;
    println!("{}", if valid { "valid" } else { "invalid" });
}
