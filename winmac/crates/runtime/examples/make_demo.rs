#[path = "support/demo.rs"]
mod demo;
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let path = std::env::args()
        .nth(1)
        .ok_or("Usage: make_demo <output.exe>")?;
    std::fs::write(&path, demo::minimal_console_pe())?;
    println!("Wrote {path}");
    Ok(())
}
