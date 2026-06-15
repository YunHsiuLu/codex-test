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

cd "$SCRIPT_DIR"
docker compose run --rm --no-deps web python app.py "$@"
