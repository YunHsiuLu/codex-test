pub struct Account {
    pub balance: i64,
}
impl Account {
    pub fn new(balance: i64) -> Self {
        assert!(balance >= 0);
        Self { balance }
    }
    pub fn deposit(&mut self, amount: i64) -> bool {
        if amount <= 0 {
            return false;
        }
        self.balance += amount;
        true
    }
    pub fn withdraw(&mut self, amount: i64) -> bool {
        if amount <= 0 || amount > self.balance {
            return false;
        }
        self.balance -= amount;
        true
    }
}
fn main() {
    let mut a = Account::new(100);
    a.withdraw(30);
    println!("{}", a.balance);
}
