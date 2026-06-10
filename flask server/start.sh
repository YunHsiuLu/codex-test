#!/bin/zsh

set -eu

SCRIPT_DIR=${0:A:h}
PID_FILE="$SCRIPT_DIR/data/server.pid"
LOG_FILE="$SCRIPT_DIR/server.log"

get_lan_ip() {
    local interface
    local address

    interface=$(route -n get default 2>/dev/null | awk '/interface:/{print $2}')
    if [[ -n "$interface" ]]; then
        address=$(ipconfig getifaddr "$interface" 2>/dev/null || true)
    fi

    if [[ -z "${address:-}" ]]; then
        for interface in en0 en1 en2; do
            address=$(ipconfig getifaddr "$interface" 2>/dev/null || true)
            [[ -n "$address" ]] && break
        done
    fi

    printf '%s' "${address:-}"
}

show_urls() {
    local lan_ip
    lan_ip=$(get_lan_ip)

    echo "本機網址：http://127.0.0.1:5001"
    if [[ -n "$lan_ip" ]]; then
        echo "手機網址：http://$lan_ip:5001"
        echo "手機與電腦必須連接同一個網路。"
    else
        echo "目前無法取得區域網路 IP，請確認 Wi-Fi 或網路連線。"
    fi
}

if [[ -f "$PID_FILE" ]]; then
    PID=$(<"$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "留言板已在背景執行，PID：$PID"
        show_urls
        exit 0
    fi
    rm -f "$PID_FILE"
fi

if [[ -n "${PYTHON_BIN:-}" ]]; then
    PYTHON="$PYTHON_BIN"
elif [[ -x "$SCRIPT_DIR/.venv/bin/python" ]]; then
    PYTHON="$SCRIPT_DIR/.venv/bin/python"
elif [[ -x "$HOME/.venv/flask/bin/python" ]]; then
    PYTHON="$HOME/.venv/flask/bin/python"
else
    PYTHON=$(command -v python3)
fi

if ! "$PYTHON" -c 'import flask, flask_socketio' 2>/dev/null; then
    echo "找不到 Flask 執行環境。請先安裝：python3 -m pip install flask flask-socketio"
    exit 1
fi

cd "$SCRIPT_DIR"
nohup "$PYTHON" server.py >> "$LOG_FILE" 2>&1 &
PID=$!
echo "$PID" > "$PID_FILE"
sleep 1

if kill -0 "$PID" 2>/dev/null; then
    echo "留言板已在背景啟動，PID：$PID"
    show_urls
    echo "紀錄：$LOG_FILE"
else
    rm -f "$PID_FILE"
    echo "留言板啟動失敗，請查看：$LOG_FILE"
    exit 1
fi
