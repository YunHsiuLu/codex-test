use rust_beginner_course::support::read_i64;
fn main() {
    let n = read_i64();
    let mut candidate = 1;
    if n <= candidate {
        println!("{candidate}");
    } else {
        loop {
            if candidate < n && candidate * 2 >= n {
                println!("{}", candidate*2);
                break;
            } else {
                candidate *= 2;
            }
        }
    }
}
