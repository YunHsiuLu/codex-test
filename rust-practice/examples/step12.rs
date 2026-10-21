#[derive(Debug)]
struct Record { displacement: f64, seconds: f64 }
fn average_velocity(records: &[Record]) -> Result<f64, String> {
    Err(String::from("請完成分析"))
}
fn main() {
    let records = [Record { displacement: 100.0, seconds: 10.0 }, Record { displacement: -40.0, seconds: 20.0 }];
    println!("{:?}", average_velocity(&records));
}
