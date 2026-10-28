fn main() {
    let limit = 20;
    let threshold = 50;
    let mut found = false;
    // TODO：依教材完成迴圈，保留上方參數名稱。
    for n in 1..=limit {
        if (limit == 0) {break;}
        if (n*n >= threshold) {
            println!("{}", n);
            found = true;
            break;
        }
    }
    if (!found) {println!("0");}
}
