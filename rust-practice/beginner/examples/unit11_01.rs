#[path = "../testing/subjects/ticket.rs"]
mod subject;
fn main() {
    println!("請用 cargo test --example unit11_01 跑正確版；cargo run -- run 11-1 驗證測試品質。");
}
#[cfg(test)]
#[path = "../exercises/code/11-1.rs"]
mod student_tests;
