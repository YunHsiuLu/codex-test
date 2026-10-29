fn remove_value(values: &mut Vec<i64>, target: i64) -> usize {
    let old_len = values.len();
    let mut index = 0;
    while index < values.len() {
        if values[index] == target {
            values.remove(index);
        } else {
            index += 1;
        }
    }
    old_len - values.len()
}
fn main() {
    let mut v = vec![1, 2, 1];
    println!("{}", remove_value(&mut v, 1));
    println!("{v:?}");
}
