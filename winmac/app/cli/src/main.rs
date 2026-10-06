use std::env;
use std::fs;
use std::process::ExitCode;

fn main() -> ExitCode {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: winmac-cli <path-to-executable>");
        return ExitCode::FAILURE;
    }

    let file_path = &args[1];
    if let Err(e) = run(file_path) {
        eprintln!("Error: {:#}", e);
        return ExitCode::FAILURE;
    }

    ExitCode::SUCCESS
}

fn run(path: &str) -> anyhow::Result<()> {
    let bytes = fs::read(path)?;
    let pe = winmac_pe::parse_pe(&bytes)?;

    println!("WinMac PE Inspector\n");
    println!("File: {}", path);
    println!("DOS Signature: MZ");
    println!("PE Signature: PE\\0\\0");
    println!("Architecture: {}", pe.coff_header.machine);
    println!("Sections: {}", pe.coff_header.number_of_sections);
    println!(
        "Optional Header Size: {}",
        pe.coff_header.size_of_optional_header
    );
    println!("Characteristics: {:#06x}", pe.coff_header.characteristics);

    Ok(())
}
