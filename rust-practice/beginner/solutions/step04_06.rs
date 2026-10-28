fn main() {
    let rows = 3;
    let columns = 3;
    for i in 1..=rows {
        for j in 1..=columns {
            if j > 1 {
                print!(" ");
            }
            print!("{}", i * j);
        }
        println!();
    }
}
