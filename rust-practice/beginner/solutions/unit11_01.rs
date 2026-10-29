use super::subject::ticket;
#[test]
fn boundaries() {
    for (age, price) in [
        (0, 0),
        (5, 0),
        (6, 50),
        (17, 50),
        (18, 100),
        (64, 100),
        (65, 40),
        (90, 40),
    ] {
        assert_eq!(ticket(age), price, "age={age}");
    }
}
