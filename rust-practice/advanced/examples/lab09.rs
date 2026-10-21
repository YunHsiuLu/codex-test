// 迭代器、惰性求值與成本模型
// TODO：依 lessons/09.md 的契約完成；測試初始為紅燈。
fn first_positive_squares(values: &[i32], count: usize) -> Vec<i64> {
    todo!("請先閱讀教材，再實作")
}
fn main() {
    println!("{:?}", first_positive_squares(&[-1, 2, 3, 4], 2));
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn order_limits_and_widening() {
        assert_eq!(first_positive_squares(&[-2, 3, 0, 4, 5], 2), vec![9, 16]);
        assert!(first_positive_squares(&[1, 2], 0).is_empty());
        assert_eq!(
            first_positive_squares(&[i32::MAX], 1),
            vec![4611686014132420609]
        );
    }
    #[test]
    fn laziness_can_be_observed() {
        let mut visits = 0;
        let result: Vec<_> = [1, 2, 3, 4]
            .iter()
            .inspect(|_| visits += 1)
            .take(2)
            .collect();
        assert_eq!(result.len(), 2);
        assert_eq!(visits, 2);
    }
}
