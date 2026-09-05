#!/usr/bin/env zsh
set -euo pipefail
ROOT_DIR="${0:A:h}"
cd "$ROOT_DIR"
if [[ ! -x .venv/bin/python ]]; then
  echo '請先執行：python3 -m venv .venv'
  echo '再執行：.venv/bin/python -m pip install -r requirements.txt'
  exit 1
fi
exec .venv/bin/python -u extract_schedule.py "$@"
