#!/usr/bin/env zsh
set -euo pipefail
cd "${0:A:h}"
task_python="${ENG_EXAM_PYTHON:-python3}"
if [[ -z "${ENG_EXAM_PYTHON:-}" && -x /Users/lvyunxiu/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 ]]; then
  task_python=/Users/lvyunxiu/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3
fi
command -v xelatex >/dev/null || { print 'XeLaTeX is required for PDF export. Existing PDFs remain available.'; exit 1; }
mkdir -p tmp/latex output/pdf
"$task_python" scripts/index_sources.py
"$task_python" scripts/build_exam.py
for kind in student teacher; do
  for pass in 1 2; do
    if ! xelatex -interaction=nonstopmode -halt-on-error -output-directory=tmp/latex "output/tex/g11_midterm_v1_${kind}.tex" > "tmp/latex/${kind}-build.log" 2>&1; then
      tail -35 "tmp/latex/${kind}-build.log"
      exit 1
    fi
  done
  cp "tmp/latex/g11_midterm_v1_${kind}.pdf" output/pdf/
done
"$task_python" scripts/verify_exam.py
print 'Build complete. Render and inspect the PDFs before distributing a revised exam.'
