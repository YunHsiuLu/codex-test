use rust_beginner_course::support::read_i64;
fn main() {
    let total = read_i64();
    let hours = total / 3600;
    let minutes = total % 3600 / 60;
    let seconds = total % 60;
    println!("{hours} {minutes} {seconds}");
}
