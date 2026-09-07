#!/bin/zsh
set -eu
cd -- "${0:A:h}"
if [[ ! -x .venv/bin/python ]]; then
  print '請先建立環境：python3 -m venv .venv'
  print '再安裝套件：.venv/bin/python -m pip install -r requirements.txt'
  exit 1
fi
exec .venv/bin/python -m streamlit run app.py "$@"
