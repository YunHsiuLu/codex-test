use rust_beginner_course::support::read_i64;
fn main() {
    let a = read_i64();
    let b = read_i64();
    let c = read_i64();
    if a <= 0 || b <= 0 || c <= 0 {
        println!("invalid");
    } else {
       if a + b <= c || b + c <= a || a + c <= b {
        println!("invalid");
       } else {
        println!("valid");
       }
    }
}
