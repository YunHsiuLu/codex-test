#!/bin/sh
set -eu
PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
command -v node >/dev/null 2>&1 || { echo '需要 Node.js 才能安全核對及停止服務。' >&2; exit 1; }
exec node "$PROJECT_DIR/scripts/service.js" stop
