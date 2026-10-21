#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn drop_once_in_scope_order() {
        assert_eq!(
            scope_trace(),
            vec!["enter", "inner dropped", "outer dropped"]
        );
    }
}
