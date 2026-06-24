# 07．具名卷與資源限制

## 學習目標

- 使用具名卷保存容器資料。
- 驗證刪除容器後資料仍存在。
- 限制容器 CPU 與記憶體。

## 動手做 A：具名卷

```zsh
container volume create acp-data
container volume list
container volume inspect acp-data
```

將具名卷掛載到 `/data`，並寫入資料：

```zsh
container run --name acp-writer --volume acp-data:/data docker.io/library/alpine:3.22 sh -c 'date > /data/created-at.txt'
container delete acp-writer
container run --rm --volume acp-data:/data docker.io/library/alpine:3.22 cat /data/created-at.txt
```

容器已被刪除，但具名卷是獨立資源，因此資料仍在。

## 動手做 B：資源限制

```zsh
container run --name acp-limited --detach --cpus 1 --memory 256M docker.io/library/alpine:3.22 sleep 3600
container inspect acp-limited
container stats --no-stream acp-limited
```

Apple `container` 的每個容器都有輕量 VM，CPU 與記憶體選項是在限制該容器 VM 的資源。

再嘗試唯讀根檔案系統，並以 tmpfs 提供暫存空間：

```zsh
container run --rm --read-only --tmpfs /tmp docker.io/library/alpine:3.22 sh -c 'echo ok > /tmp/result && cat /tmp/result'
```

## 驗證

- 第二個容器能讀到第一個容器寫入的時間。
- inspect 顯示 1 CPU 與 256 MB 左右的記憶體設定。
- 唯讀根檔案系統仍可寫入 `/tmp`。

## 挑戰題

1. 不掛載 tmpfs，嘗試在唯讀根檔案系統寫檔。
2. 使用 `--cap-drop ALL` 執行一個簡單程序。
3. 比較 bind mount 與具名卷的管理者、路徑可見性與適用情境。

<details>
<summary>點此顯示解答</summary>

1. 不提供可寫掛載時，寫入根檔案系統應失敗：

   ```zsh
   container run --rm --read-only \
     docker.io/library/alpine:3.22 \
     sh -c 'echo test > /result.txt'
   ```

   預期回報 `Read-only file system`。
2. 移除所有 Linux capabilities 後執行不需要特權的程序：

   ```zsh
   container run --rm --cap-drop ALL \
     docker.io/library/alpine:3.22 \
     sh -c 'echo ok; id'
   ```

   簡單輸出仍能執行，但需要特定 capability 的操作會失敗。這符合最小權限原則。
3. bind mount 由使用者管理 macOS 上的明確路徑，主機可直接編輯，適合原始碼、設定及開發時即時同步；但會耦合主機路徑，也必須自行管理權限。具名卷由 `container` 管理，主機路徑不是日常操作介面，適合資料庫及應用程式持久資料，也較容易用名稱在容器間重用。兩者的生命週期都獨立於容器，但具名卷要用 `container volume` 指令管理。

</details>

## 清理

```zsh
container stop acp-limited
container delete acp-limited
container volume delete acp-data
```

刪除具名卷會永久刪除其中資料，因此要先確認沒有需要保留的內容。
