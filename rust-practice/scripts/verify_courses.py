"""Verify reference answers using public graders; never overwrite learner programs."""
from pathlib import Path
import json, os, re, subprocess, tempfile
ROOT=Path(__file__).resolve().parents[1]
TARGET=ROOT/'target'
TARGET.mkdir(exist_ok=True)
data=json.loads((ROOT/'beginner/curriculum.json').read_text())
expected=len(data['exercises'])
result=subprocess.run(['cargo','run','--offline','-q','-p','rust-beginner-course','--','verify-solutions'],cwd=ROOT,capture_output=True,text=True,timeout=240)
(TARGET/'verify-beginner.log').write_text(result.stdout+result.stderr)
if result.returncode or f'REFERENCE {expected}/{expected}' not in result.stdout:
 print(result.stdout);print(result.stderr);raise SystemExit('Beginner reference verification failed.')
totals=re.findall(r'驗收：(\d+)/(\d+) 項',result.stdout)
assert len(totals)==expected,totals
assert all(int(a)==int(b) and int(b)>=10 for a,b in totals),totals
print(f'Beginner: {expected} reference implementations, {sum(int(b) for _,b in totals)} checks passed.')
with tempfile.TemporaryDirectory(prefix='verify-advanced-',dir=TARGET) as temp:
 d=Path(temp)
 driver=f'#[path={json.dumps(str(ROOT/"runner/mod.rs"))}] mod runner;\n'
 driver+=f'#[path={json.dumps(str(ROOT/"advanced/src/checks.rs"))}] mod checks;\n'
 driver+='fn main(){for n in 1..=12 { let source=std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join(format!("solutions/lab{n:02}.rs"));assert!(checks::verify_source(n,&source).unwrap());}}'
 (d/'driver.rs').write_text(driver)
 binary=d/('driver.exe' if os.name=='nt' else 'driver')
 env=dict(os.environ,CARGO_MANIFEST_DIR=str(ROOT/'advanced'))
 subprocess.run(['rustc','--edition=2024','--allow','dead_code',str(d/'driver.rs'),'-o',str(binary)],env=env,cwd=ROOT,check=True,capture_output=True,text=True)
 result=subprocess.run([str(binary)],cwd=ROOT,capture_output=True,text=True,timeout=180)
 (TARGET/'verify-advanced.log').write_text(result.stdout+result.stderr)
 if result.returncode:print(result.stdout);print(result.stderr);raise SystemExit('Advanced reference verification failed.')
 totals=re.findall(r'驗收：(\d+)/(\d+) 組',result.stdout)
 assert len(totals)==12,totals
 assert all(int(a)==int(b) and int(b)>=10 for a,b in totals),totals
 print(f'Advanced: 12 reference implementations, {sum(int(b) for _,b in totals)} checks passed.')
print('All reference solutions passed. Learner sources untouched. See target/verify-beginner.log and verify-advanced.log.')
