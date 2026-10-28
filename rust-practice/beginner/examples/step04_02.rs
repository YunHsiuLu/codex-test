fn main() {
    let limit = 10;
    // TODO：依教材完成迴圈，保留上方參數名稱。
    let mut total = 0;
    for n in 1..=limit {
        total = if (n % 2 == 0) {total + n} else {total};
    }
    println!("{}", total);
}
