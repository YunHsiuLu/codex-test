#!/bin/sh
# Stop only the Together process recorded by start.sh.
set -eu
PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

NODE_BIN=$(command -v node || true)
if [ -z "$NODE_BIN" ]; then
  for candidate in /opt/homebrew/bin/node /usr/local/bin/node; do
    if [ -x "$candidate" ]; then
      NODE_BIN=$candidate
      break
    fi
  done
fi
if [ -z "$NODE_BIN" ]; then
  echo '找不到 Node.js，無法安全核對並停止服務。' >&2
  exit 1
fi

cd "$PROJECT_DIR"
exec "$NODE_BIN" "$PROJECT_DIR/scripts/service.js" stop
