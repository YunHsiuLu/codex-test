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
    println!("Architecture: {}", pe.coff_header.machine);
    println!("Format: {}", pe.optional_header.format);
    println!(
        "Entry Point: {:#010X}",
        pe.optional_header.address_of_entry_point
    );
    println!("Image Base: {:#018X}", pe.optional_header.image_base);
    println!(
        "Section Alignment: {}",
        pe.optional_header.section_alignment
    );
    println!("File Alignment: {}", pe.optional_header.file_alignment);
    println!("Image Size: {}", pe.optional_header.size_of_image);
    println!("Headers Size: {}", pe.optional_header.size_of_headers);
    println!("Subsystem: {}", pe.optional_header.subsystem);
    println!("Data Directories: {}", pe.data_directories.len());
    println!("\nSections ({}):", pe.sections.len());

    for sec in &pe.sections {
        println!("\n{}", sec.name_lossy());
        println!("  RVA:          {:#010X}", sec.virtual_address);
        println!("  Virtual Size: {:#010X}", sec.virtual_size);
        println!("  Raw Size:     {:#010X}", sec.size_of_raw_data);
        println!("  Raw Pointer:  {:#010X}", sec.pointer_to_raw_data);
    }

    Ok(())
}
