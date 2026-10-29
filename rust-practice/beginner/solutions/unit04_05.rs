use rust_beginner_course::support::read_i64;
fn main() {
    let n = read_i64();
    for row in 1..=n {
        for column in 1..=n {
            if column > 1 {
                print!(" ");
            }
            print!("{}", row * column);
        }
        println!();
    }
}
