use rust_beginner_course::support::read_i64;
fn main() {
    let mut total = read_i64();
    // 以 / 與 % 拆出三個數值，輸出一行。
    let second = total % 60;
    total = total / 60;
    let min = total % 60;
    total = total / 60;
    let hour = total;
    println!("{hour} {min} {second}");
}
