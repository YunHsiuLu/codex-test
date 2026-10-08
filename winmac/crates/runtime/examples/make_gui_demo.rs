#[path = "support/demo.rs"]
mod demo;
#[path = "support/gui.rs"]
mod gui;
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let path = std::env::args()
        .nth(1)
        .ok_or("Usage: make_gui_demo <output.exe>")?;
    std::fs::write(&path, gui::quiz_pe())?;
    println!("Wrote {path}");
    Ok(())
}
