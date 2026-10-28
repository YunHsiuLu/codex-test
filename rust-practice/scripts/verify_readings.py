"""Compile and execute standalone Rust snippets in all beginner reading sections."""
from pathlib import Path
import json, os, re, subprocess, tempfile
root=Path(__file__).resolve().parents[1]
course=root/'beginner'
registry=json.loads((course/'lessons/sublessons.json').read_text())
(root/'target').mkdir(exist_ok=True)
compiled=0;expected_failures=0;expected_panics=0;test_suites=0
with tempfile.TemporaryDirectory(prefix='reading-checks-',dir=root/'target') as tmp:
    temp=Path(tmp)
    for item in registry:
        if item.get('mode')!='reading':continue
        source=course/item['lesson']
        blocks=re.findall(r'^```(rust|compile_fail)\s*\n(.*?)^```',source.read_text(),re.M|re.S)
        assert blocks,(item['id'],'no runnable examples')
        for index,(language,code) in enumerate(blocks):
            stem=f'lesson_{item["id"].replace("-","_")}_{index}'
            path=temp/f'{stem}.rs';binary=temp/(stem+('.exe' if os.name=='nt' else ''))
            path.write_text(code)
            built=subprocess.run(['rustc','--edition=2024',str(path),'-o',str(binary)],capture_output=True,text=True,timeout=60)
            if language=='compile_fail':
                assert built.returncode!=0,(item['id'],index,'expected compilation rejection')
                expected_failures+=1;continue
            assert built.returncode==0,(item['id'],index,built.stderr)
            result=subprocess.run([str(binary)],input='25\n',capture_output=True,text=True,timeout=5)
            panic_expected=item['id']=='5-2' and index==1
            if panic_expected:
                assert result.returncode!=0 and '時間必須為正' in result.stderr,(item['id'],index,result.stderr)
                expected_panics+=1
            else:assert result.returncode==0,(item['id'],index,result.stderr)
            compiled+=1
            if '#[test]' in code:
                test_binary=temp/(stem+'_tests'+('.exe' if os.name=='nt' else ''))
                built=subprocess.run(['rustc','--edition=2024','--test',str(path),'-o',str(test_binary)],capture_output=True,text=True,timeout=60)
                assert built.returncode==0,(item['id'],index,built.stderr)
                result=subprocess.run([str(test_binary)],capture_output=True,text=True,timeout=5)
                assert result.returncode==0,(item['id'],index,result.stdout,result.stderr)
                test_suites+=1
print(f'{compiled} Rust snippets executed ({expected_panics} expected panic); {expected_failures} compile-fail examples rejected; {test_suites} embedded test suites passed.')
