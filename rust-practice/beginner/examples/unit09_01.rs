pub struct Account {
    pub balance: i64,
}
impl Account {
    pub fn new(balance: i64) -> Self {
        todo!("建立帳戶")
    }
    pub fn deposit(&mut self, amount: i64) -> bool {
        todo!("存款")
    }
    pub fn withdraw(&mut self, amount: i64) -> bool {
        todo!("提款")
    }
}
fn main() {}
