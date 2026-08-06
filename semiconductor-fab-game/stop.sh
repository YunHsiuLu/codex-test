#!/usr/bin/env bash
set -euo pipefail

GAME_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$GAME_DIR/.game-server.pid"

stop_descendants() {
  local parent_pid="$1"
  local child_pid
  while read -r child_pid; do
    [[ -n "$child_pid" ]] || continue
    stop_descendants "$child_pid"
  done < <(pgrep -P "$parent_pid" 2>/dev/null || true)
  kill "$parent_pid" 2>/dev/null || true
}

if [[ ! -f "$PID_FILE" ]]; then
  echo "遊戲目前未透過 start.sh 執行。"
  exit 0
fi

SERVER_PID="$(<"$PID_FILE")"
if ! kill -0 "$SERVER_PID" 2>/dev/null; then
  rm -f "$PID_FILE"
  echo "找不到遊戲程序，已清除舊的狀態檔。"
  exit 0
fi

stop_descendants "$SERVER_PID"
for _ in {1..10}; do
  if ! kill -0 "$SERVER_PID" 2>/dev/null && ! pgrep -P "$SERVER_PID" >/dev/null 2>&1; then
    rm -f "$PID_FILE"
    echo "遊戲已關閉。"
    exit 0
  fi
  sleep 1
done

kill -9 "$SERVER_PID" 2>/dev/null || true
rm -f "$PID_FILE"
echo "遊戲已強制關閉。"
