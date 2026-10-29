mod analysis;
mod input;
mod model;
mod parse;
use std::process::ExitCode;
fn report() -> Result<String, (u8, String)> {
    let text = input::read_text()?;
    let records = match parse::records(&text) {
        Ok(rows) => rows,
        Err(message) => return Err((1, message)),
    };
    let velocity = match analysis::velocity(&records) {
        Ok(value) => value,
        Err(message) => return Err((1, message)),
    };
    Ok(format!(
        "records: {}\nvelocity: {velocity:.3}",
        records.len()
    ))
}
fn main() -> ExitCode {
    match report() {
        Ok(text) => {
            println!("{text}");
            ExitCode::SUCCESS
        }
        Err((code, message)) => {
            eprintln!("{message}");
            ExitCode::from(code)
        }
    }
}
