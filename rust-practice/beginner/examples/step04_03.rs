fn main() {
    let limit = 10;
    let divisor = 3;
    // TODO：依教材完成迴圈，保留上方參數名稱。
    let mut count = 0;
    for n in 1..=limit {
        count = if (n % divisor == 0) {count + 1} else {count};
    }
    println!("{}", count);
}
