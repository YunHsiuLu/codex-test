use rust_beginner_course::support::read_i64;
fn main() {
    let n = read_i64();
    // 逐行、逐欄輸出。
    for i in 1..=n {
        for j in 1..n {
            print!("{} ", i * j);
        }
        println!("{}", i * n);
    }
}
