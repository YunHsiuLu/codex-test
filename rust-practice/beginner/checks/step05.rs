#[cfg(test)] mod course_checks {
    use super::*;
    #[test] fn positive_time() {
        for (d,t,v) in [(100.0,20.0,5.0),(0.0,2.0,0.0),(-30.0,3.0,-10.0),(5.0,2.0,2.5)] {
            assert!((speed(d,t)-v).abs()<1e-9,"位移={d}，時間={t}，預期速度={v}");
        }
    }
    #[test] #[should_panic] fn zero_time() { speed(1.0,0.0); }
    #[test] #[should_panic] fn negative_time() { speed(1.0,-1.0); }
}
