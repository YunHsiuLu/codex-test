use rust_beginner_course::support::read_i64;
fn main() {
    let score = read_i64();
    let level = if score >= 90 {
        "A"
    } else if score >= 80 {
        "B"
    } else if score >= 70 {
        "C"
    } else if score >= 60 {
        "D"
    } else {
        "F"
    };
    println!("{level}");
}
