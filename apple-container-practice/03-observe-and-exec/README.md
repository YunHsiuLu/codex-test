# 03．觀察與操作執行中的容器

## 學習目標

- 讀取應用程式與開機紀錄。
- 在執行中的容器啟動額外程序。
- 查看設定與即時資源用量。

## 動手做

```zsh
container run --name acp-observe --detach docker.io/library/alpine:3.22 sh -c 'i=0; while true; do i=$((i+1)); echo "tick=$i"; sleep 2; done'
```

查看紀錄：

```zsh
container logs -n 5 acp-observe
container logs --boot acp-observe
container logs --follow acp-observe
```

按 `Control + C` 只會停止追蹤紀錄，不會停止容器。

在容器內執行新指令：

```zsh
container exec acp-observe ps
container exec acp-observe cat /etc/os-release
container exec -it acp-observe sh
```

在互動 shell 輸入 `exit` 返回 macOS。接著檢查設定與單次資源快照：

```zsh
container inspect acp-observe
container stats --no-stream acp-observe
```

若已安裝 `jq`，可擷取容器狀態：

```zsh
container inspect acp-observe | jq '.[0].status'
```

## 驗證

- `logs` 持續出現遞增的 tick。
- `exec` 顯示的程序包含原本的 shell。
- `stats` 能顯示 CPU 與記憶體資料。

## 挑戰題

1. 使用 `exec -e COURSE=physics` 執行 `env` 並找出變數。
2. 將 stats 輸出改為 JSON 格式。
3. `logs` 與 `logs --boot` 的資料來源有何差異？

<details>
<summary>點此顯示解答</summary>

1. 對新程序設定環境變數，再以 `grep` 找出它：

   ```zsh
   container exec -e COURSE=physics acp-observe env | grep '^COURSE='
   ```

   預期輸出為 `COURSE=physics`。此變數只提供給這次 `exec` 啟動的程序，不會永久改寫容器設定。
2. 取得單次 JSON 快照：

   ```zsh
   container stats --format json --no-stream acp-observe
   ```

   若已安裝 `jq`，可在最後加上 `| jq` 排版。
3. `container logs` 讀取容器主要應用程式的標準輸出與標準錯誤；`container logs --boot` 讀取該容器輕量 VM 的開機紀錄，內容通常是核心及系統初始化訊息。兩者用來診斷的層級不同。

</details>

## 清理

```zsh
container stop acp-observe
container delete acp-observe
```
