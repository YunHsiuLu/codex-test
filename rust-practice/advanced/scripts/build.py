"""Rebuild the combined reading document without touching student code."""
from pathlib import Path
root = Path(__file__).resolve().parents[1]
parts = [root.joinpath('SYLLABUS.md').read_text()]
parts.extend(p.read_text() for p in sorted(root.joinpath('lessons').glob('*.md')))
root.joinpath('COURSE.md').write_text('\n\n---\n\n'.join(parts))
print('Updated advanced/COURSE.md; exercises and solutions preserved.')
