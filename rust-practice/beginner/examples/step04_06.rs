fn main() {
    let rows = 3;
    let columns = 3;
    // TODO：依教材完成迴圈，保留上方參數名稱。
    for i in 1..=rows {
        for j in 1..=columns {
            if (j == columns) {println!("{}", i*j);}
            else {print!("{} ", i*j)};
        }
    }
}
