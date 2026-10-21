#[cfg(test)] mod course_checks {
    use super::*;
    #[test] fn empty() { assert_eq!(average(&[]),None); }
    #[test] fn fractional_average() {
        for (scores,want) in [(&[60,80,100][..],80.0),(&[60,61][..],60.5),(&[0][..],0.0),(&[100][..],100.0)] {
            let value=average(scores).expect("非空集合應回傳 Some");
            assert!((value-want).abs()<1e-9,"輸入：{scores:?}，預期：{want}");
        }
    }
}
