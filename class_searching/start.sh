#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="${0:A:h}"
PORT="${PORT:-8765}"
BIND_HOST="${BIND_HOST:-127.0.0.1}"
PID_FILE="$ROOT_DIR/.class-search.pid"
LOG_FILE="$ROOT_DIR/.class-search.log"

if [[ -n "${PYTHON_BIN:-}" ]]; then
  PYTHON="$PYTHON_BIN"
elif [[ -x "/opt/homebrew/bin/python3" ]]; then
  PYTHON="/opt/homebrew/bin/python3"
else
  PYTHON="$(command -v python3)"
fi

if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(<"$PID_FILE")"
  if [[ -n "$OLD_PID" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "調代課查詢系統已在執行：PID $OLD_PID"
    echo "開啟：http://$BIND_HOST:$PORT"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT 已被占用，請先關閉占用的服務，或用 PORT=其他連接埠 ./start.sh"
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN
  exit 1
fi

cd "$ROOT_DIR"
nohup env CLASS_SEARCH_HOST="$BIND_HOST" PORT="$PORT" "$PYTHON" server.py >"$LOG_FILE" 2>&1 </dev/null &
PID="$!"
echo "$PID" >"$PID_FILE"

sleep 0.5
if ! kill -0 "$PID" 2>/dev/null; then
  echo "啟動失敗，請查看 log：$LOG_FILE"
  rm -f "$PID_FILE"
  exit 1
fi

echo "調代課查詢系統已啟動：PID $PID"
echo "開啟：http://$BIND_HOST:$PORT"
echo "停止：./stop.sh"
disown "$PID" 2>/dev/null || true
