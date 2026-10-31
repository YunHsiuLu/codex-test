use rust_beginner_course::support::read_f64;
fn main() {
    let homework = read_f64();
    let midterm = read_f64();
    let final_exam = read_f64();
    let score = homework * 0.2 + midterm * 0.3 + final_exam * 0.5;
    println!("{score}");
}
