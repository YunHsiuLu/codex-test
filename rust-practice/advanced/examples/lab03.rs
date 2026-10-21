// 迴圈不變量與二分搜尋
// TODO：依 lessons/03.md 的契約完成；測試初始為紅燈。
fn lower_bound(values: &[i32], target: i32) -> usize {
    todo!("請先閱讀教材，再實作")
}
fn main() {
    println!("{}", lower_bound(&[1, 3, 3, 7], 3));
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn duplicates_and_edges() {
        let a = [1, 3, 3, 7];
        for (x, want) in [(0, 0), (1, 0), (3, 1), (4, 3), (8, 4)] {
            assert_eq!(lower_bound(&a, x), want);
        }
        assert_eq!(lower_bound(&[], 5), 0);
    }
    #[test]
    fn compare_linear_specification() {
        for len in 0..30 {
            let a: Vec<i32> = (0..len).map(|i| i / 3).collect();
            for t in -1..12 {
                assert_eq!(
                    lower_bound(&a, t),
                    a.iter().position(|&x| x >= t).unwrap_or(a.len())
                );
            }
        }
    }
}
