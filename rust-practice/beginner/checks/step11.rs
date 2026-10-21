#[cfg(test)] mod course_checks {
    use super::*;
    #[test] fn known_temperatures() {
        for (c,f) in [(0.0,32.0),(25.0,77.0),(100.0,212.0),(-40.0,-40.0),(-10.0,14.0)] {
            assert!((c_to_f(c)-f).abs()<1e-9,"攝氏={c}，預期華氏={f}");
        }
    }
    #[test] fn ten_degree_difference() { assert!((c_to_f(35.0)-c_to_f(25.0)-18.0).abs()<1e-9); }
}
