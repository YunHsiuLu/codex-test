"""Refresh course reading materials. Student code is preserved unless explicitly reset."""
from pathlib import Path
import argparse, json, os, re, subprocess, sys
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--reset-exercises',action='store_true',help='Overwrite main examples and solutions with the initial templates. Back up your work first.')
args=parser.parse_args()
data=json.loads((root/'lessons/course_data.json').read_text())
registry=json.loads((root/'lessons/sublessons.json').read_text())

def links_from(text, source):
    def replace(match):
        target=match.group(1)
        if '://' in target or target.startswith('#'): return match.group(0)
        path,sep,fragment=target.partition('#')
        absolute=(source.parent/path).resolve()
        try: normalized=absolute.relative_to(root).as_posix()
        except ValueError: return match.group(0)
        return ']('+normalized+(sep+fragment if sep else '')+')'
    return re.sub(r'\]\(([^)]+)\)',replace,text)

intro='''# Rust Beginner Course

先進入 beginner 資料夾，以 `cargo run -- lesson` 查看總覽；指定章節，例如 `cargo run -- lesson 6`，閱讀主線題目。新增的補充節次在總覽標示「補充」，可直接閱讀，不會建立另一份作答或假報驗收。

每課先看閱讀路線，再預測、修改、執行與解釋。主線 `run N` 自動驗收，`manual N` 手動操作；第四課另有七個實作子題，每題十筆資料。固定輸出／固定追蹤題採具名契約檢查，範圍見 TEST_CASES.md。測試通過不是一般性正確性證明。

本版主線、七個迴圈實作與補充閱讀已拆開。課程時數依閱讀與實作節奏調整，新增補充後不再以原先每課三十至五十分鐘視為固定時程；尚未正式試教。
'''
install_path=root/'docs/00-install.md'
data[0]['install']=install_path.read_text()
parts=[intro,links_from(data[0]['install'],install_path)]
for entry in data[1:]:
    n=entry['id'];main_path=root/f'lessons/main/{n:02}.md'
    parts.append(links_from(main_path.read_text(),main_path))
    children=[item for item in registry if int(item['id'].split('-')[0])==n]
    if children:
        entry['preparation']='## 閱讀路線\n\n'+ '\n\n'.join(f"{item['id']}：{item['title']}（{'補充閱讀' if item.get('mode')=='reading' else '實作'}）。終端機：`cargo run -- lesson {item['id']}`。" for item in children)
    for item in children:
        path=root/item['lesson']
        parts.append(links_from(path.read_text(),path))
    if args.reset_exercises:
        (root/f'examples/step{n:02}.rs').write_text(entry['code']+'\n')
        (root/f'solutions/step{n:02}.rs').write_text(entry['solution']+'\n')
(root/'COURSE.md').write_text('\n\n---\n\n'.join(part.strip() for part in parts)+'\n')
(root/'lessons.js').write_text('window.COURSE = '+json.dumps(data,ensure_ascii=False)+';\n')
subprocess.run([sys.executable,str(root/'scripts/build_sublessons.py')],check=True)
print('Updated COURSE.md, lessons.js and sublesson registry. '+('Main exercises RESET.' if args.reset_exercises else 'All student code and reference solutions preserved.'))
