#!/bin/zsh

set -eu

SCRIPT_DIR=${0:A:h}
PID_FILE="$SCRIPT_DIR/data/server.pid"
MODE_FILE="$SCRIPT_DIR/data/server.mode"
CERT_PID_FILE="$SCRIPT_DIR/data/cert-server.pid"

stop_from_pid_file() {
    local pid_file=$1
    local service_name=$2

    if [[ ! -f "$pid_file" ]]; then
        echo "找不到${service_name}的 PID，可能尚未啟動。"
        return
    fi

    local pid
    pid=$(<"$pid_file")
    if kill -0 "$pid" 2>/dev/null; then
        kill "$pid"
        echo "${service_name}已停止，PID：$pid"
    else
        echo "${service_name} PID $pid 已不存在，清除舊紀錄。"
    fi

    rm -f "$pid_file"
}

stop_from_pid_file "$PID_FILE" "留言板"
stop_from_pid_file "$CERT_PID_FILE" "憑證下載服務"
rm -f "$MODE_FILE"
