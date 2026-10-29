"""Exercise real rejection paths in both graders without changing learner files."""
from pathlib import Path
import json, os, subprocess, tempfile
ROOT=Path(__file__).resolve().parents[1]
TARGET=ROOT/'target';TARGET.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='grader-regression-',dir=TARGET) as temp:
 d=Path(temp)
 programs={
 'echo':'use std::io::{self,Read};fn main(){let mut s=String::new();io::stdin().read_to_string(&mut s).unwrap();print!("{s}");}',
 'greeting':'fn main(){println!("Hello, Rust!\\n我正在學程式設計");}',
 'stderr':'fn main(){println!("Hello, Rust!\\n我正在學程式設計");eprintln!("debug");}',
 'wrong':'fn main(){println!("wrong");}',
 'exit':'fn main(){println!("Hello, Rust!\\n我正在學程式設計");std::process::exit(3);}',
 'hang':'fn main(){loop{std::hint::spin_loop();}}',
 'syntax':'fn main( {',
 'nan':'fn main(){println!("NaN");}',
 'empty_tests':'// no tests',
 'weak_tests':'use super::subject::ticket;#[test]fn only_child(){assert_eq!(ticket(3),0);}',
 'always_fail':'#[test]fn broken(){assert!(false);}',
 }
 for name,source in programs.items():(d/f'{name}.rs').write_text(source)
 driver=f'#[path={json.dumps(str(ROOT/"runner/mod.rs"))}] mod runner;\n'
 driver+=f'#[path={json.dumps(str(ROOT/"beginner/src/catalog.rs"))}] mod catalog;\n'
 driver+=r'''use std::path::Path;
fn main(){
 let path=std::env::args().nth(1).unwrap();let temp=Path::new(&path);
 let root=Path::new(env!("CARGO_MANIFEST_DIR"));
 let task=|id:&str|catalog::EXERCISES.iter().find(|e|e.id==id).unwrap();
 assert!(runner::course::check_source(root,task("1-1"),&temp.join("greeting.rs")).unwrap());
 for name in ["wrong","stderr","exit","hang","syntax"]{
  assert!(!runner::course::check_source(root,task("1-1"),&temp.join(format!("{name}.rs"))).unwrap(),"must reject {name}");
 }
 assert!(!runner::course::check_source(root,task("2-1"),&temp.join("nan.rs")).unwrap());
 for name in ["empty_tests","weak_tests","always_fail"]{
  assert!(!runner::course::check_source(root,task("11-1"),&temp.join(format!("{name}.rs"))).unwrap(),"must reject {name}");
 }
 // The retained Advanced grader must still handle EOF, CRLF and exit status.
 let case=runner::Case{name:"CRLF",input:"abc\r\n",expected:"abc\n",args:&[],exit:0};
 assert!(runner::check(root,&temp.join("echo.rs"),&[case],"").unwrap());
 let case=runner::Case{name:"EOF",input:"",expected:"",args:&[],exit:0};
 assert!(runner::check(root,&temp.join("echo.rs"),&[case],"").unwrap());
 let case=runner::Case{name:"wrong exit",input:"",expected:"",args:&[],exit:0};
 assert!(!runner::check(root,&temp.join("exit.rs"),&[case],"").unwrap());
 println!("REGRESSION PASSED");
}
'''
 (d/'driver.rs').write_text(driver)
 binary=d/('driver.exe' if os.name=='nt' else 'driver')
 env=dict(os.environ,CARGO_MANIFEST_DIR=str(ROOT/'beginner'))
 subprocess.run(['rustc','--edition=2024','--allow','dead_code',str(d/'driver.rs'),'-o',str(binary)],env=env,check=True,capture_output=True,text=True)
 result=subprocess.run([str(binary),str(d)],cwd=ROOT,capture_output=True,text=True,timeout=120)
 (TARGET/'verify-runner.log').write_text(result.stdout+result.stderr)
 if result.returncode or 'REGRESSION PASSED' not in result.stdout:
  print(result.stdout);print(result.stderr);raise SystemExit('Grader regression failed.')
print('Graders reject wrong output, stderr, exit, timeout, compile errors, NaN, empty/weak/always-failing student tests; legacy EOF/CRLF verified.')
