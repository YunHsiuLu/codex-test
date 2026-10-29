pub enum Action {
    Add(i64),
    Multiply(i64),
    Reset,
}
fn apply(value: i64, action: Action) -> i64 {
    match action {
        Action::Add(n) => value + n,
        Action::Multiply(n) => value * n,
        Action::Reset => 0,
    }
}
fn main() {
    println!("{}", apply(3, Action::Multiply(4)));
}
