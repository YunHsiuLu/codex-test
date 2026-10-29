use rust_beginner_course::support::read_i64;
fn main() {
    let n = read_i64();
    let mut candidate = 1;
    loop {
        if candidate >= n {
            break;
        }
        candidate *= 2;
    }
    println!("{candidate}");
}
