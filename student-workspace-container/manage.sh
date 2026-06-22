#!/bin/zsh

set -eu

SCRIPT_DIR=${0:A:h}

if [[ $# -eq 0 ]]; then
    echo "用法："
    echo "  ./manage.sh list-users"
    echo "  ./manage.sh student-path ProgramDesign01"
    echo "  ./manage.sh create-user 帳號 顯示名稱 密碼"
    exit 1
fi

if [[ -x "$SCRIPT_DIR/.venv/bin/python" ]]; then
    PYTHON="$SCRIPT_DIR/.venv/bin/python"
elif [[ -x "$HOME/.venv/flask/bin/python" ]]; then
    PYTHON="$HOME/.venv/flask/bin/python"
else
    PYTHON=$(command -v python3)
fi

if ! "$PYTHON" -c 'import flask' 2>/dev/null; then
    echo "找不到 Flask。請先建立虛擬環境並安裝 requirements.txt。"
    exit 1
fi

cd "$SCRIPT_DIR"
STUDENT_WORKSPACE_DATA_DIR="$SCRIPT_DIR/data" \
STUDENT_WORKSPACE_SECRET="local-management-only" \
    "$PYTHON" app.py "$@"
