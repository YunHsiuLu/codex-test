// 規格、契約與溢位
// TODO：依 lessons/01.md 的契約完成；測試初始為紅燈。
fn triangular(n: u32) -> Option<u32> {
    todo!("請先閱讀教材，再實作")
}
fn main() {
    println!("{:?}", triangular(65536));
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn boundaries() {
        assert_eq!(triangular(0), Some(0));
        assert_eq!(triangular(1), Some(1));
        assert_eq!(triangular(10), Some(55));
        assert_eq!(triangular(65536), Some(2147516416));
        assert_eq!(triangular(u32::MAX), None);
    }
    #[test]
    fn agrees_with_small_oracle() {
        for n in 0..1000 {
            assert_eq!(triangular(n), Some((0..=n).sum()));
        }
    }
}
