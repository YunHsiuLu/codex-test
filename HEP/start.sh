#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$PROJECT_DIR/.venv"
PYTHON="$VENV_DIR/bin/python"
REQUIREMENTS="$PROJECT_DIR/requirements.txt"
REQUIREMENTS_STAMP="$VENV_DIR/.installed-requirements.txt"
DEFAULT_CACHE="$PROJECT_DIR/data/dimuon_skim.parquet"

cd "$PROJECT_DIR"

if ! command -v python3 >/dev/null 2>&1; then
    echo "錯誤：找不到 python3。請先安裝 Python 3.10 或更新版本。" >&2
    exit 1
fi

if ! python3 -c 'import sys; raise SystemExit(sys.version_info < (3, 10))'; then
    echo "錯誤：需要 Python 3.10 或更新版本，目前為 $(python3 --version)。" >&2
    exit 1
fi

if [[ ! -x "$PYTHON" ]] || ! "$PYTHON" -c 'import sys' >/dev/null 2>&1; then
    echo "首次執行：正在建立專案 Python 環境 .venv……"
    python3 -m venv --clear "$VENV_DIR"
fi

if [[ ! -f "$REQUIREMENTS_STAMP" ]] || ! cmp -s "$REQUIREMENTS" "$REQUIREMENTS_STAMP"; then
    echo "正在安裝或更新分析套件……"
    "$PYTHON" -m pip install --disable-pip-version-check -r "$REQUIREMENTS"
    cp "$REQUIREMENTS" "$REQUIREMENTS_STAMP"
fi

USE_DEFAULT_CACHE=true
for argument in "$@"; do
    if [[ "$argument" == "--source" || "$argument" == --source=* ]]; then
        USE_DEFAULT_CACHE=false
        break
    fi
done

if [[ "$USE_DEFAULT_CACHE" == true && ! -f "$DEFAULT_CACHE" ]]; then
    echo "找不到本機 skim，正在從 CERN 建立 ${HEP_CACHE_EVENTS:-100000} 筆事件的資料……"
    "$PYTHON" prepare_data.py --max-events "${HEP_CACHE_EVENTS:-100000}"
fi

exec "$PYTHON" analysis.py "$@"
