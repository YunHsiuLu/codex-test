#!/usr/bin/env bash
set -euo pipefail

GAME_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$GAME_DIR/.game-server.pid"
LOG_FILE="$GAME_DIR/.game-server.log"
GAME_URL="http://localhost:3000/"

if [[ -f "$PID_FILE" ]]; then
  SERVER_PID="$(<"$PID_FILE")"
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "遊戲已在執行中：$GAME_URL"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "找不到 npm。請先安裝 Node.js 22.13.0 或更新版本。" >&2
  exit 1
fi

if [[ ! -d "$GAME_DIR/node_modules" ]]; then
  echo "尚未安裝遊戲套件。請先在遊戲資料夾執行：npm install" >&2
  exit 1
fi

echo "正在啟動晶圓帝國…"
(
  cd "$GAME_DIR"
  nohup npm run dev >"$LOG_FILE" 2>&1 &
  echo $! >"$PID_FILE"
)
SERVER_PID="$(<"$PID_FILE")"

for _ in {1..25}; do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "遊戲無法啟動，請查看記錄：$LOG_FILE" >&2
    rm -f "$PID_FILE"
    exit 1
  fi
  if curl --silent --fail "$GAME_URL" >/dev/null 2>&1; then
    echo "遊戲已啟動：$GAME_URL"
    echo "關閉遊戲請執行：./stop.sh"
    exit 0
  fi
  sleep 1
done

echo "遊戲仍在啟動中，請稍後開啟：$GAME_URL"
echo "若無法開啟，請查看記錄：$LOG_FILE"
