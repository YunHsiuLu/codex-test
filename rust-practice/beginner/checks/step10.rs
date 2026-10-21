#[cfg(test)] mod course_checks {
    use super::*;
    #[test] fn valid_times() {
        for (text,want) in [("2.5",2.5),(" 3 ",3.0),("0.001",0.001)] {
            assert!((parse_time(text).unwrap()-want).abs()<1e-9,"輸入：{text:?}");
        }
    }
    #[test] fn invalid_times() {
        for text in ["0","-1","abc","NaN","inf","-inf",""] {
            assert!(parse_time(text).is_err(),"應拒絕：{text:?}");
        }
    }
}
