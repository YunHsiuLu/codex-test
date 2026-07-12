#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="${0:A:h}"
PID_FILE="$ROOT_DIR/.class-search.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "沒有找到執行中的調代課查詢系統 PID。"
  exit 0
fi

PID="$(<"$PID_FILE")"
if [[ -z "$PID" ]] || ! kill -0 "$PID" 2>/dev/null; then
  rm -f "$PID_FILE"
  echo "PID 已失效，已清理記錄。"
  exit 0
fi

kill "$PID"
for _ in {1..20}; do
  if ! kill -0 "$PID" 2>/dev/null; then
    rm -f "$PID_FILE"
    echo "調代課查詢系統已停止。"
    exit 0
  fi
  sleep 0.1
done

echo "系統尚未停止，請手動檢查 PID $PID。"
exit 1
