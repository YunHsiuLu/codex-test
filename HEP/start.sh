#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$PROJECT_DIR/.venv"
PYTHON="$VENV_DIR/bin/python"
REQUIREMENTS="$PROJECT_DIR/requirements.txt"
REQUIREMENTS_STAMP="$VENV_DIR/.installed-requirements.txt"
DEFAULT_CACHE="$PROJECT_DIR/data/dimuon_skim.parquet"
PREPARE_DATASET="dimuon"
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

USE_DEFAULT_CACHE=true
LIST_ONLY=false
STATISTICS_LAB=false
ANALYSIS_NAME="z_to_mumu"
EXPECT_ANALYSIS_NAME=false
LAB_ARGUMENTS=()
for argument in "$@"; do
    if [[ "$EXPECT_ANALYSIS_NAME" == true ]]; then
        ANALYSIS_NAME="$argument"
        EXPECT_ANALYSIS_NAME=false
        continue
    fi
    if [[ "$argument" == "--analysis" ]]; then
        EXPECT_ANALYSIS_NAME=true
        continue
    fi
    if [[ "$argument" == --analysis=* ]]; then
        ANALYSIS_NAME="${argument#--analysis=}"
    fi
    if [[ "$argument" == "--source" || "$argument" == --source=* ]]; then
        USE_DEFAULT_CACHE=false
    fi
    if [[ "$argument" == "--list-analyses" ]]; then
        LIST_ONLY=true
    fi
    if [[ "$argument" == "--statistics-lab" ]]; then
        STATISTICS_LAB=true
    else
        LAB_ARGUMENTS+=("$argument")
    fi
done

if [[ "$ANALYSIS_NAME" == "h_to_4l" ]]; then
    DEFAULT_CACHE="$PROJECT_DIR/data/hzz4l_signal_skim.parquet"
    PREPARE_DATASET="hzz4l_signal"
fi

if [[ "$STATISTICS_LAB" == true ]]; then
    if (( ${#LAB_ARGUMENTS[@]} )); then
        exec "$PYTHON" statistics_lab.py "${LAB_ARGUMENTS[@]}"
    fi
    exec "$PYTHON" statistics_lab.py
fi

if [[ "$LIST_ONLY" == false && "$USE_DEFAULT_CACHE" == true && ! -f "$DEFAULT_CACHE" ]]; then
    echo "Local skim not found. Fetching ${HEP_CACHE_EVENTS:-100000} events from CERN..."
    "$PYTHON" prepare_data.py --dataset "$PREPARE_DATASET" --max-events "${HEP_CACHE_EVENTS:-100000}"
fi

exec "$PYTHON" analysis.py "$@"
