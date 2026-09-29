#!/bin/sh
# Start Together in the background. Works from any working directory.
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
  echo '找不到 Node.js，請先安裝 Node.js 22 或以上版本。' >&2
  exit 1
fi

cd "$PROJECT_DIR"
exec "$NODE_BIN" "$PROJECT_DIR/scripts/service.js" start
