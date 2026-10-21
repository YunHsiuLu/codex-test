// 所有權與資源釋放
// TODO：依 lessons/04.md 的契約完成；測試初始為紅燈。
fn scope_trace() -> Vec<&'static str> {
    todo!("請先閱讀教材，再實作")
}
fn main() {
    println!("{:?}", scope_trace());
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn drop_once_in_scope_order() {
        assert_eq!(
            scope_trace(),
            vec!["enter", "inner dropped", "outer dropped"]
        );
    }
}
