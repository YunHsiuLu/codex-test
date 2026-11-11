#!/bin/zsh

set -eu

SCRIPT_DIR=${0:A:h}
PID_FILE="$SCRIPT_DIR/data/server.pid"
MODE_FILE="$SCRIPT_DIR/data/server.mode"
CERT_PID_FILE="$SCRIPT_DIR/data/cert-server.pid"
LOG_FILE="$SCRIPT_DIR/server.log"
CERT_LOG_FILE="$SCRIPT_DIR/cert-server.log"
PRIVATE_CERT_DIR="$SCRIPT_DIR/data/https/private"
PUBLIC_CERT_DIR="$SCRIPT_DIR/data/https/public"

# Detach from the launching terminal/job so the services survive its exit.
start_detached() {
    "$PYTHON" - "$@" <<'PY'
import subprocess
import sys
with open(sys.argv[1], 'ab', buffering=0) as log:
    process = subprocess.Popen(
        sys.argv[2:], stdin=subprocess.DEVNULL, stdout=log, stderr=log,
        start_new_session=True, close_fds=True,
    )
print(process.pid)
PY
}

check_board() {
    "$PYTHON" - "$PUBLIC_CERT_DIR/teacher-messenger-ca.crt" <<'PY'
import ssl
import sys
import urllib.request
try:
    context = ssl.create_default_context(cafile=sys.argv[1])
    for path in ('/health', '/', '/service-worker.js'):
        with urllib.request.urlopen('https://127.0.0.1:5001' + path,
                                    context=context, timeout=3) as response:
            if response.status != 200:
                raise RuntimeError('Unhealthy response')
except Exception:
    sys.exit(1)
PY
}

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
    if [[ -z "$lan_ip" && -f "$PRIVATE_CERT_DIR/server-ip.txt" ]]; then
        lan_ip=$(<"$PRIVATE_CERT_DIR/server-ip.txt")
    fi

    echo "本機網址：https://127.0.0.1:5001"
    if [[ -n "$lan_ip" ]]; then
        echo "手機網址：https://$lan_ip:5001"
        echo "憑證網址：http://$lan_ip:5003/teacher-messenger-ca.crt"
        echo "手機與電腦必須連接同一個網路。"
        echo "iPhone 第一次安裝請閱讀：$SCRIPT_DIR/IPHONE_SETUP.md"
    else
        echo "目前無法取得區域網路 IP，請確認 Wi-Fi 或網路連線。"
    fi
}

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

"$SCRIPT_DIR/setup_https.sh" >/dev/null
CERT_RENEWED=false
if [[ -f "$SCRIPT_DIR/data/https/server-cert-renewed" ]]; then
    CERT_RENEWED=true
    rm -f "$SCRIPT_DIR/data/https/server-cert-renewed"
fi

if [[ -f "$CERT_PID_FILE" ]]; then
    CERT_PID=$(<"$CERT_PID_FILE")
    if ! kill -0 "$CERT_PID" 2>/dev/null; then
        rm -f "$CERT_PID_FILE"
    fi
fi

if [[ ! -f "$CERT_PID_FILE" ]]; then
    CERT_PID=$(start_detached "$CERT_LOG_FILE" "$PYTHON" -m http.server 5003 \
        --bind 0.0.0.0 \
        --directory "$PUBLIC_CERT_DIR")
    echo "$CERT_PID" > "$CERT_PID_FILE"
    sleep 1
    if ! kill -0 "$CERT_PID" 2>/dev/null; then
        rm -f "$CERT_PID_FILE"
        echo "憑證下載服務啟動失敗，請查看：$CERT_LOG_FILE"
        exit 1
    fi
fi

if [[ -f "$PID_FILE" ]]; then
    PID=$(<"$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        MODE=$(cat "$MODE_FILE" 2>/dev/null || true)
        if [[ "$MODE" == "https" && "$CERT_RENEWED" == false ]] && check_board; then
            echo "留言板已在背景執行，PID：$PID"
            show_urls
            exit 0
        fi
        kill "$PID"
        sleep 1
    fi
    rm -f "$PID_FILE" "$MODE_FILE"
fi

cd "$SCRIPT_DIR"
PID=$(SSL_CERT_FILE="$PRIVATE_CERT_DIR/server-cert.pem" \
SSL_KEY_FILE="$PRIVATE_CERT_DIR/server-key.pem" \
start_detached "$LOG_FILE" "$PYTHON" "$SCRIPT_DIR/server.py")
echo "$PID" > "$PID_FILE"
echo "https" > "$MODE_FILE"
sleep 1

if kill -0 "$PID" 2>/dev/null && check_board; then
    echo "留言板已在背景啟動，PID：$PID"
    show_urls
    echo "紀錄：$LOG_FILE"
else
    kill "$PID" 2>/dev/null || true
    rm -f "$PID_FILE" "$MODE_FILE"
    echo "留言板啟動失敗，請查看：$LOG_FILE"
    exit 1
fi
