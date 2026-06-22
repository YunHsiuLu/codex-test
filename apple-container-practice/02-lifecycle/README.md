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

## 清理

若挑戰過程中容器仍存在：

```zsh
container stop acp-clock
container delete acp-clock
```
