"""Maintainer regression checks; student files are never modified."""
from pathlib import Path
import os, subprocess, tempfile, json
root=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='runner-regression-',dir=root/'target') as tmp:
    d=Path(tmp)
    programs={
        'echo':'use std::io::{self,Read}; fn main(){let mut s=String::new();io::stdin().read_to_string(&mut s).unwrap();print!("{s}");}',
        'wrong':'fn main(){println!("wrong");}',
        'exit':'fn main(){std::process::exit(3);}',
        'hang':'fn main(){loop {std::hint::spin_loop();}}',
        'syntax':'fn main( {',
        'temperature_wrong':'fn main(){let celsius:f64=25.0;let fahrenheit=77.0;println!("{celsius} C = {fahrenheit} F");}',
        'score_wrong':'fn main(){let score=60;println!("{}",if score>60 {"及格"} else {"再試一次"});}',
        'sum_wrong':'fn main(){let mut total=0;for n in 1..=5{total+=0;}println!("{total}");}',
    }
    for name,code in programs.items():(d/f'{name}.rs').write_text(code)
    # The Rust driver exercises the same runner used by both course CLIs.
    driver=f'#[path={json.dumps(str(root/"runner/mod.rs"))}] mod runner;\n'
    driver+=f'#[path={json.dumps(str(root/"beginner/src/checks.rs"))}] mod checks;\n'
    driver+=f'#[path={json.dumps(str(root/"beginner/src/variants.rs"))}] mod variants;\n'
    driver+='''use std::path::Path;
fn main(){
 let base=std::env::args().nth(1).unwrap();let dir=Path::new(&base);
 let course=Path::new(env!("CARGO_MANIFEST_DIR"));
 let echo=runner::Case{name:"CRLF normalized",input:"abc\\r\\n",expected:"abc\\n",args:&[],exit:0};
 assert!(runner::check(course,&dir.join("echo.rs"),&[echo],"").unwrap());
 let eof=runner::Case{name:"EOF closes input",input:"",expected:"",args:&[],exit:0};
 assert!(runner::check(course,&dir.join("echo.rs"),&[eof],"").unwrap());
 for name in ["wrong","exit","hang","syntax"]{
  let sample=runner::Case{name:"must reject",input:"",expected:"expected",args:&[],exit:0};
  assert!(!runner::check(course,&dir.join(format!("{name}.rs")),&[sample],"").unwrap(),"{name}");
 }
 for (n,name) in [(2,"temperature_wrong"),(3,"score_wrong"),(4,"sum_wrong")] {
  assert!(!checks::verify_source(n,&dir.join(format!("{name}.rs"))).unwrap(),"incorrect answer must fail: {name}");
 }
 println!("Runner regression checks passed.");
}
'''
    (d/'driver.rs').write_text(driver)
    binary=d/('driver.exe' if os.name=='nt' else 'driver')
    env=dict(os.environ,CARGO_MANIFEST_DIR=str(root/'beginner'))
    subprocess.run(['rustc','--edition=2024','--allow','dead_code',str(d/'driver.rs'),'-o',str(binary)],env=env,check=True)
    subprocess.run([str(binary),str(d)],check=True,timeout=90)
