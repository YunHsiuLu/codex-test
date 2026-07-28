#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$PROJECT_DIR/.venv"
PYTHON="$VENV_DIR/bin/python"
REQUIREMENTS="$PROJECT_DIR/requirements.txt"
REQUIREMENTS_STAMP="$VENV_DIR/.installed-requirements.txt"
MPLCONFIGDIR="$PROJECT_DIR/.mplconfig"

cd "$PROJECT_DIR"
export MPLCONFIGDIR
export PYTHONDONTWRITEBYTECODE=1
mkdir -p "$MPLCONFIGDIR"

if ! command -v python3 >/dev/null 2>&1; then
    echo "Error: python3 was not found. Install Python 3.10 or newer." >&2
    exit 1
fi

if ! python3 -c 'import sys; raise SystemExit(sys.version_info < (3, 10))'; then
    echo "Error: Python 3.10 or newer is required. Found $(python3 --version)." >&2
    exit 1
fi

if [[ ! -x "$PYTHON" ]] || ! "$PYTHON" -c 'import sys' >/dev/null 2>&1; then
    echo "Creating the project environment in .venv..."
    python3 -m venv --clear "$VENV_DIR"
fi

if [[ ! -f "$REQUIREMENTS_STAMP" ]] || ! cmp -s "$REQUIREMENTS" "$REQUIREMENTS_STAMP"; then
    echo "Installing or updating analysis packages..."
    "$PYTHON" -m pip install --disable-pip-version-check -r "$REQUIREMENTS"
    cp "$REQUIREMENTS" "$REQUIREMENTS_STAMP"
fi

if (( $# == 0 )); then
    echo "Environment ready. Run ./start.sh --list-analyses to view available exercises."
    exit 0
fi

if [[ "${1:-}" == "--statistics-lab" ]]; then
    shift
    exec "$PYTHON" statistics_lab.py "$@"
fi

if [[ "${1:-}" == "--hgg-sideband-fit" ]]; then
    shift
    exec "$PYTHON" fit_hgg_background.py "$@"
fi

exec "$PYTHON" analysis.py "$@"
