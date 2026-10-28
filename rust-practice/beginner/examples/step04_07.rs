fn main() {
    let values = [70, 85, 90];
    // TODO：依教材完成迴圈，保留上方參數名稱。
    for (index, value) in values.iter().enumerate() {
        println!("{}: {}", index+1, value);
    }
}
