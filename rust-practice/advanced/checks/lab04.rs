#[cfg(test)]
mod course_checks {
    use super::*;

    #[test]
    fn exact_trace() {
        assert_eq!(
            scope_trace(),
            vec!["enter", "inner dropped", "outer dropped"]
        );
    }
    #[test]
    fn three_events() {
        assert_eq!(scope_trace().len(), 3);
    }
    #[test]
    fn entry_first() {
        assert_eq!(scope_trace().first(), Some(&"enter"));
    }
    #[test]
    fn inner_second() {
        assert_eq!(scope_trace().get(1), Some(&"inner dropped"));
    }
    #[test]
    fn outer_last() {
        assert_eq!(scope_trace().last(), Some(&"outer dropped"));
    }
    #[test]
    fn entry_once() {
        assert_eq!(scope_trace().iter().filter(|&&e| e == "enter").count(), 1);
    }
    #[test]
    fn inner_once() {
        assert_eq!(
            scope_trace()
                .iter()
                .filter(|&&e| e == "inner dropped")
                .count(),
            1
        );
    }
    #[test]
    fn outer_once() {
        assert_eq!(
            scope_trace()
                .iter()
                .filter(|&&e| e == "outer dropped")
                .count(),
            1
        );
    }
    #[test]
    fn inner_before_outer() {
        let e = scope_trace();
        assert!(
            e.iter().position(|&x| x == "inner dropped").unwrap()
                < e.iter().position(|&x| x == "outer dropped").unwrap()
        );
    }
    #[test]
    fn repeat_independent() {
        let first = scope_trace();
        let second = scope_trace();
        assert_eq!(first, second);
        assert_eq!(second.len(), 3);
    }
}
