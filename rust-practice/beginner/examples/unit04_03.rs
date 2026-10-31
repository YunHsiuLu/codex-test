use rust_beginner_course::support::read_i64;
fn main() {
    let mut n = read_i64();
    let mut digits = 0;
    if n == 0 {
        digits += 1;
        println!("{digits}");
        return;
    }
    loop {
        if n > 0 {
            digits += 1;
            n /= 10;
        } else {
            break;
        }
    }
    println!("{digits}");
}
