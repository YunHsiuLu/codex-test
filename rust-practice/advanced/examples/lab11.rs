// 並行、所有權與確定性
// TODO：依 lessons/11.md 的契約完成；測試初始為紅燈。
fn parallel_sum(values: &[i32]) -> i64 {
    todo!("請先閱讀教材，再實作")
}
fn main() {
    println!("{}", parallel_sum(&[1, 2, 3, 4]));
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn serial_equivalence() {
        for a in [vec![], vec![1], vec![-3, 2, 7], vec![i32::MAX, i32::MAX]] {
            assert_eq!(
                parallel_sum(&a),
                a.iter().map(|&n| i64::from(n)).sum::<i64>()
            );
        }
    }
}
