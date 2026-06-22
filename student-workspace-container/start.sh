#!/bin/zsh

set -eu

SCRIPT_DIR=${0:A:h}

if [[ -x "$SCRIPT_DIR/.venv/bin/python" ]]; then
    PYTHON="$SCRIPT_DIR/.venv/bin/python"
elif [[ -x "$HOME/.venv/flask/bin/python" ]]; then
    PYTHON="$HOME/.venv/flask/bin/python"
else
    PYTHON=$(command -v python3)
fi

if ! "$PYTHON" -c 'import flask' 2>/dev/null; then
    echo "找不到 Flask。請先執行：python3 -m pip install -r requirements.txt"
    exit 1
fi

cd "$SCRIPT_DIR"
exec "$PYTHON" app.py
