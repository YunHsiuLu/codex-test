#!/bin/zsh

set -eu

CONTAINER_NAME="student-workspace-apple"

container delete --force "$CONTAINER_NAME" >/dev/null 2>&1 || true
echo "Apple container 已停止或原先未建立。"
