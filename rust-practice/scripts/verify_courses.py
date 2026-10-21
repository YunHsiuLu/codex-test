"""Validate all reference solutions with the public graders, without editing exercises."""
from pathlib import Path
import json, os, subprocess, tempfile, re
root=Path(__file__).resolve().parents[1]
(root/'target').mkdir(exist_ok=True)
for course,prefix in [('beginner','step'),('advanced','lab')]:
    with tempfile.TemporaryDirectory(prefix=f'verify-{course}-',dir=root/'target') as tmp:
        d=Path(tmp)
        source=f'#[path={json.dumps(str(root/"runner/mod.rs"))}] mod runner;\n'
        source+=f'#[path={json.dumps(str(root/course/"src/checks.rs"))}] mod checks;\n'
        if course=='beginner':
            source+=f'#[path={json.dumps(str(root/course/"src/variants.rs"))}] mod variants;\n'
        source+='fn main() { for n in 1..=12 { println!("\\nReference solution {n}");'
        source+=f'let path=std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join(format!("solutions/{prefix}'+'{n:02}.rs"));'
        source+='assert!(checks::verify_source(n,&path).unwrap()); } }'
        (d/'probe.rs').write_text(source)
        binary=d/('probe.exe' if os.name=='nt' else 'probe')
        env=dict(os.environ,CARGO_MANIFEST_DIR=str(root/course))
        subprocess.run(['rustc','--edition=2024','--allow','dead_code',str(d/'probe.rs'),'-o',str(binary)],env=env,check=True)
        result=subprocess.run([str(binary)],capture_output=True,text=True)
        print(result.stdout,end='')
        if result.stderr: print(result.stderr,end='')
        result.check_returncode()
        totals=re.findall(r'驗收：(\d+)/(\d+) 組通過',result.stdout)
        assert len(totals)==12,(course,totals)
        assert all(int(passed)==int(total) and int(total)>=10 for passed,total in totals),(course,totals)
        # Count independently authored tests, so original solution tests cannot mask missing coverage.
        for path in (root/course/'checks').glob('*.rs'):
            assert len(re.findall(r'#\[test\]',path.read_text()))>=10,path
print('All 24 reference solutions passed with at least 10 checks each; student sources untouched.')
