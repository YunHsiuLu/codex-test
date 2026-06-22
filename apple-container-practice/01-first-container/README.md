# 01．第一個容器

## 學習目標

- 從公開 Registry 取得 OCI 映像。
- 分辨前景、互動與自動刪除模式。
- 確認容器中的作業系統與主機不同。

## 動手做

先下載小型 Alpine Linux 映像：

```zsh
container image pull docker.io/library/alpine:3.22
container image list
```

執行一次性指令：

```zsh
container run --rm docker.io/library/alpine:3.22 echo 'Hello from Apple container'
container run --rm docker.io/library/alpine:3.22 uname -a
```

`--rm` 會在程序結束後刪除容器，但不刪除映像。

開啟互動式 shell：

```zsh
container run --rm -it docker.io/library/alpine:3.22 sh
```

進入後執行：

```sh
cat /etc/os-release
pwd
whoami
exit
```

## 驗證

```zsh
container list --all
container image list
```

一次性容器應已消失，Alpine 映像則仍存在。

## 挑戰題

1. 執行 `arch`，比較容器與 macOS 的輸出。
2. 移除 `--rm` 再執行一次，觀察 `container list --all`。
3. 解釋 `-i` 與 `-t` 各自的用途。

## 清理

若挑戰題留下容器，從清單取得 ID 後刪除：

```zsh
container delete <容器-ID>
```
