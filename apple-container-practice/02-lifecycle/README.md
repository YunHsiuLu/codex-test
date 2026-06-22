# 02．容器生命週期

## 學習目標

- 分開執行 create 與 start。
- 控制容器的啟動、停止及刪除。
- 理解容器狀態與程序生命週期的關係。

## 動手做

建立一個每 2 秒輸出時間的容器，但先不啟動：

```zsh
container create --name acp-clock docker.io/library/alpine:3.22 sh -c 'while true; do date; sleep 2; done'
container list --all
```

啟動並觀察：

```zsh
container start acp-clock
container list
container logs -n 5 acp-clock
```

停止後重新啟動：

```zsh
container stop acp-clock
container list --all
container start acp-clock
container logs -n 5 acp-clock
```

最後停止並刪除：

```zsh
container stop acp-clock
container delete acp-clock
```

## 驗證

```zsh
container list --all
```

清單中不應再有 `acp-clock`。

## 挑戰題

1. 使用 `container start --attach acp-clock` 前景觀看輸出；按 `Control + C` 後觀察狀態。
2. 查閱 `container stop --help`，將等待時間改為 10 秒。
3. 說明 `run` 與 `create` 加上 `start` 的適用情境差異。

<details>
<summary>點此顯示解答</summary>

前面的動手做已刪除 `acp-clock`，先重新建立：

```zsh
container create --name acp-clock docker.io/library/alpine:3.22 sh -c 'while true; do date; sleep 2; done'
```

1. 執行 `container start --attach acp-clock` 後會在前景看到日期輸出。按 `Control + C` 會中斷附加的前景工作；再用下列指令確認容器實際狀態，因版本與訊號處理方式不同，不應只憑終端返回來判斷：

   ```zsh
   container list --all
   ```

2. `--time` 的單位是秒，表示送出停止訊號後，強制終止前的等待時間：

   ```zsh
   container stop --time 10 acp-clock
   ```

3. `run` 是「建立並立即啟動」的捷徑，適合一次性工作及一般啟動流程。`create` 加上 `start` 把設定與執行分開，適合先建立、檢查設定，稍後再啟動，或由另一個流程控制啟動時機。

</details>

## 清理

若挑戰過程中容器仍存在：

```zsh
container stop acp-clock
container delete acp-clock
```
