use std::io;

fn main() {
    // loop：讀取、分辨 EOF/quit、解析、重試或結束。
    let mut input = String::new();
    loop {
        input.clear();
        let bytes = io::stdin().read_line(&mut input).expect("read failed"); // stdin回傳的數值，是資料的大小，也就是bytes
        // input.trim()才是真正去看input裡面是什麼

        if bytes == 0 || input.trim() == "quit" {
            println!("bye");
            break;
        }
        // 而input.trim().parse則是把該文字轉成i64的數字
        match input.trim().parse::<i64>() {
            Ok(value) if value > 0 => {
                println!("ok: {value}");
                break;
            }
            _ => println!("retry"),
        }
    }
}
