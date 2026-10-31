use rust_beginner_course::support::read_i64;
fn main() {
    let score = read_i64();
    if score >= 90 {
        println!("A");
    } else if score >= 80 {
        println!("B");
    } else if score >= 70 {
        println!("C");
    } else if score >= 60 {
        println!("D");
    } else {
        println!("F");
    }
}
