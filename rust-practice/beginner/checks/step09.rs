#[cfg(test)] mod course_checks {
    use super::*;
    #[test] fn different_records() {
        for (distance,time,v) in [(120.0,10.0,12.0),(50.0,5.0,10.0),(-6.0,2.0,-3.0),(0.0,1.0,0.0)] {
            assert!((Motion {distance,time}.speed()-v).abs()<1e-9);
        }
    }
    #[test] #[should_panic] fn zero_time() { Motion {distance:1.0,time:0.0}.speed(); }
    #[test] #[should_panic] fn negative_time() { Motion {distance:1.0,time:-1.0}.speed(); }
}
