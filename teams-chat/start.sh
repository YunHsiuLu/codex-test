#!/bin/sh
set -eu
PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
command -v node >/dev/null 2>&1 || { echo '請先安裝 Node.js 22 或以上版本。' >&2; exit 1; }
exec node "$PROJECT_DIR/scripts/service.js" start
