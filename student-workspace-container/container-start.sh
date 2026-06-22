#!/bin/zsh

set -eu

SCRIPT_DIR=${0:A:h}
ENV_FILE="$SCRIPT_DIR/.env"
IMAGE_NAME="student-workspace-apple:local"
CONTAINER_NAME="student-workspace-apple"
IMAGE_MARKER="$SCRIPT_DIR/.image-built"
FORCE_BUILD=false

if [[ "${1:-}" == "--build" ]]; then
    FORCE_BUILD=true
elif [[ $# -gt 0 ]]; then
    echo "用法：./container-start.sh [--build]"
    exit 1
fi

if ! command -v container >/dev/null 2>&1; then
    echo "找不到 Apple container CLI。"
    exit 1
fi

if ! container system status 2>/dev/null | grep -q 'status.*running'; then
    echo "正在啟動 Apple container 系統服務……"
    container system start --enable-kernel-install
fi

if [[ ! -f "$ENV_FILE" ]]; then
    umask 077
    SECRET=$(openssl rand -hex 32)
    {
        echo "STUDENT_WORKSPACE_SECRET=$SECRET"
        echo "STUDENT_WORKSPACE_PORT=5002"
        echo "STUDENT_WORKSPACE_BIND_IP=0.0.0.0"
    } > "$ENV_FILE"
    echo "已建立僅供本機使用的 .env。"
fi

PORT=$(sed -n 's/^STUDENT_WORKSPACE_PORT=//p' "$ENV_FILE" | tail -1)
PORT=${PORT:-5002}
BIND_IP=$(sed -n 's/^STUDENT_WORKSPACE_BIND_IP=//p' "$ENV_FILE" | tail -1)
BIND_IP=${BIND_IP:-0.0.0.0}

mkdir -p "$SCRIPT_DIR/data/storage"
chmod u+rwX "$SCRIPT_DIR/data" "$SCRIPT_DIR/data/storage"
[[ ! -f "$SCRIPT_DIR/data/accounts.db" ]] || chmod u+rw "$SCRIPT_DIR/data/accounts.db"

cd "$SCRIPT_DIR"
if [[ "$FORCE_BUILD" == true || ! -f "$IMAGE_MARKER" ]]; then
    container build --tag "$IMAGE_NAME" --file Containerfile .
    touch "$IMAGE_MARKER"
    container builder stop >/dev/null 2>&1 || true
else
    echo "使用既有映像：$IMAGE_NAME"
fi

container delete --force "$CONTAINER_NAME" >/dev/null 2>&1 || true

container run --detach \
    --name "$CONTAINER_NAME" \
    --cpus 1 \
    --memory 512m \
    --read-only \
    --tmpfs /tmp \
    --shm-size 64m \
    --cap-drop ALL \
    --init \
    --user "$(id -u):$(id -g)" \
    --ulimit nproc=128:128 \
    --env-file "$ENV_FILE" \
    --env STUDENT_WORKSPACE_DATA_DIR=/data \
    --volume "$SCRIPT_DIR/data:/data" \
    --publish "$BIND_IP:$PORT:5002" \
    "$IMAGE_NAME"

echo "等待服務啟動……"
for attempt in {1..30}; do
    if curl -fsS "http://127.0.0.1:$PORT/healthz" >/dev/null 2>&1; then
        echo "本機網址：http://127.0.0.1:$PORT"
        if [[ "$BIND_IP" != "0.0.0.0" && "$BIND_IP" != "127.0.0.1" ]]; then
            echo "學生網址：http://$BIND_IP:$PORT"
        else
            echo "區網網址：請使用教師電腦的區網 IP，加上連接埠 $PORT。"
            ifconfig | awk '
                /^[a-z0-9]+:/ { interface=$1; sub(/:$/, "", interface) }
                /inet / && $2 != "127.0.0.1" {
                    printf "  http://%s:'"$PORT"'（%s）\n", $2, interface
                }
            '
        fi
        echo "查看紀錄：container logs $CONTAINER_NAME"
        exit 0
    fi
    sleep 1
done

container logs "$CONTAINER_NAME" || true
echo "服務啟動逾時。"
exit 1
