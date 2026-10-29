mod analysis;
mod input;
mod model;
mod parse;
use std::process::ExitCode;
fn report() -> Result<String, (u8, String)> {
    let text = input::read_text()?;
    let grades = match parse::grades(&text) {
        Ok(rows) => rows,
        Err(message) => return Err((1, message)),
    };
    let averages = analysis::averages(&grades);
    let mut output = String::from("name,average");
    for (name, average) in averages {
        output.push_str(&format!("\n{name},{average:.2}"));
    }
    Ok(output)
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
