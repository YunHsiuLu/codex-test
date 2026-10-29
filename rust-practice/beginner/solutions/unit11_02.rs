use super::subject::c_to_f;
#[test]
fn selected_temperatures() {
    for (c, f) in [
        (0.0, 32.0),
        (100.0, 212.0),
        (-40.0, -40.0),
        (12.5, 54.5),
        (37.0, 98.6),
    ] {
        assert!((c_to_f(c) - f).abs() < 1e-9, "c={c}");
    }
}
