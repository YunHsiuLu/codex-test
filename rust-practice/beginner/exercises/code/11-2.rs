use super::subject::c_to_f;
#[test]
fn freezing() {
    assert!((c_to_f(0.0) - 32.0).abs() < 1e-9);
}
