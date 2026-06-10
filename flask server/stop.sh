#!/bin/zsh

set -eu

SCRIPT_DIR=${0:A:h}
PID_FILE="$SCRIPT_DIR/data/server.pid"

if [[ ! -f "$PID_FILE" ]]; then
    echo "找不到背景服務的 PID，留言板可能尚未啟動。"
    exit 0
fi

PID=$(<"$PID_FILE")
if kill -0 "$PID" 2>/dev/null; then
    kill "$PID"
    echo "留言板已停止，PID：$PID"
else
    echo "PID $PID 已不存在，清除舊紀錄。"
fi

rm -f "$PID_FILE"
