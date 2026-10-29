#[path = "../testing/subjects/c_to_f.rs"]
mod subject;
fn main() {
    println!("請用 cargo test --example unit11_02 跑正確版；cargo run -- run 11-2 驗證測試品質。");
}
#[cfg(test)]
#[path = "../exercises/code/11-2.rs"]
mod student_tests;
