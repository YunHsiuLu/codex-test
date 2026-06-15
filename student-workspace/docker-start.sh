#!/bin/zsh

set -eu

SCRIPT_DIR=${0:A:h}
ENV_FILE="$SCRIPT_DIR/.env"

if ! command -v docker >/dev/null 2>&1; then
    echo "找不到 Docker。請先安裝並啟動 Docker Desktop。"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    echo "Docker 尚未啟動。請先開啟 Docker Desktop。"
    exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
    umask 077
    SECRET=$(openssl rand -hex 32)
    {
        echo "STUDENT_WORKSPACE_SECRET=$SECRET"
        echo "STUDENT_WORKSPACE_PORT=5002"
        echo "STUDENT_WORKSPACE_BIND_IP=0.0.0.0"
        echo "HOST_UID=$(id -u)"
        echo "HOST_GID=$(id -g)"
    } > "$ENV_FILE"
    echo "已建立僅供本機使用的 .env。"
fi

mkdir -p "$SCRIPT_DIR/data/storage"
chmod u+rwX "$SCRIPT_DIR/data" "$SCRIPT_DIR/data/storage"
[[ ! -f "$SCRIPT_DIR/data/accounts.db" ]] || chmod u+rw "$SCRIPT_DIR/data/accounts.db"
cd "$SCRIPT_DIR"
docker compose up --build --detach

PORT=$(sed -n 's/^STUDENT_WORKSPACE_PORT=//p' "$ENV_FILE" | tail -1)
PORT=${PORT:-5002}
BIND_IP=$(sed -n 's/^STUDENT_WORKSPACE_BIND_IP=//p' "$ENV_FILE" | tail -1)
BIND_IP=${BIND_IP:-0.0.0.0}

echo "等待服務完成健康檢查……"
for attempt in {1..30}; do
    STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' student-workspace 2>/dev/null || true)
    if [[ "$STATUS" == "healthy" ]]; then
        docker compose ps
        echo "本機網址：http://127.0.0.1:$PORT"
        if [[ "$BIND_IP" != "0.0.0.0" && "$BIND_IP" != "127.0.0.1" ]]; then
            echo "學生網址：http://$BIND_IP:$PORT"
        else
            echo "學生網址：請使用教師電腦有線網卡的 IP，加上連接埠 $PORT。"
            ifconfig | awk '
                /^[a-z0-9]+:/ { interface=$1; sub(/:$/, "", interface) }
                /inet / && $2 != "127.0.0.1" {
                    printf "  http://%s:'"$PORT"'（%s）\n", $2, interface
                }
            '
        fi
        echo "查看紀錄：cd \"$SCRIPT_DIR\" && docker compose logs -f"
        exit 0
    fi
    if [[ "$STATUS" == "unhealthy" || "$STATUS" == "exited" ]]; then
        docker compose logs --tail=100
        echo "服務啟動失敗，狀態：$STATUS"
        exit 1
    fi
    sleep 1
done

docker compose logs --tail=100
echo "健康檢查逾時。"
exit 1
