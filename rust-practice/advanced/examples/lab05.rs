// 別名、可變性與不重疊借用
// TODO：依 lessons/05.md 的契約完成；測試初始為紅燈。
fn two_mut<T>(values: &mut [T], i: usize, j: usize) -> Option<(&mut T, &mut T)> {
    todo!("請先閱讀教材，再實作")
}
fn main() {
    let mut a = [1, 2];
    let (x, y) = two_mut(&mut a, 0, 1).unwrap();
    *x += *y;
    println!("{a:?}");
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn index_order_and_independence() {
        let mut a = [10, 20, 30];
        let (x, y) = two_mut(&mut a, 2, 0).unwrap();
        *x += 1;
        *y += 2;
        assert_eq!(a, [12, 20, 31]);
        let (x, y) = two_mut(&mut a, 0, 1).unwrap();
        std::mem::swap(x, y);
        assert_eq!(a, [20, 12, 31]);
    }
    #[test]
    fn rejects_overlap_and_bounds() {
        assert!(two_mut(&mut [1], 0, 0).is_none());
        assert!(two_mut(&mut [1], 0, 1).is_none());
        assert!(two_mut::<i32>(&mut [], 0, 1).is_none());
    }
}
