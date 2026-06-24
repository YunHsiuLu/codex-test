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

<details>
<summary>點此顯示解答</summary>

1. 執行並比較：

   ```zsh
   arch
   container run --rm docker.io/library/alpine:3.22 arch
   ```

   Apple silicon 的 macOS 通常顯示 `arm64`，Alpine 通常顯示 `aarch64`；兩者名稱不同，但都是 ARM 64 位元架構。若指定不同平台的映像，容器結果可能不同。
2. 可執行：

   ```zsh
   container run docker.io/library/alpine:3.22 echo '保留此容器'
   container list --all
   ```

   程序結束後容器會呈現停止狀態並保留，直到手動 `container delete <容器-ID>`。
3. `-i` 讓標準輸入保持開啟，使終端輸入能傳給容器程序；`-t` 配置虛擬終端（TTY），提供提示字元、行編輯及較自然的互動顯示。互動式 shell 通常同時需要兩者。

</details>

## 清理

若挑戰題留下容器，從清單取得 ID 後刪除：

```zsh
container delete <容器-ID>
```
