fn add_bonus(score: &mut i64, bonus: i64) {
    let updated = *score + bonus;
    *score = if updated < 0 {
        0
    } else if updated > 100 {
        100
    } else {
        updated
    };
}
fn main() {
    let mut score = 90;
    add_bonus(&mut score, 20);
    println!("{score}");
}
