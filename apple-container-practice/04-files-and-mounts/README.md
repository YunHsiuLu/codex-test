# 04．檔案交換與主機掛載

## 學習目標

- 在 macOS 與容器之間複製檔案。
- 將主機資料夾掛載進容器。
- 理解容器檔案層與主機資料的差異。

## 動手做 A：copy

```zsh
container run --name acp-files --detach docker.io/library/alpine:3.22 sleep 3600
printf '來自 macOS 的資料\n' > message.txt
container copy message.txt acp-files:/tmp/message.txt
container exec acp-files cat /tmp/message.txt
container copy acp-files:/etc/os-release copied-os-release.txt
```

在 macOS 查看取回的檔案：

```zsh
sed -n '1,5p' copied-os-release.txt
```

## 動手做 B：bind mount

先清掉 A 的容器，再準備共享目錄：

```zsh
container stop acp-files
container delete acp-files
mkdir -p shared
printf '第一版\n' > shared/note.txt
```

以絕對路徑掛載：

```zsh
container run --name acp-mount --detach --volume "$PWD/shared:/course" docker.io/library/alpine:3.22 sleep 3600
container exec acp-mount cat /course/note.txt
printf '第二版\n' > shared/note.txt
container exec acp-mount cat /course/note.txt
```

容器與 macOS 看到的是同一份掛載資料。只讀掛載可改用：

```zsh
container run --rm --mount "type=bind,source=$PWD/shared,target=/course,readonly" docker.io/library/alpine:3.22 cat /course/note.txt
```

## 驗證

- `message.txt` 成功進入容器。
- `copied-os-release.txt` 成功回到 macOS。
- 修改 `shared/note.txt` 後，容器立即讀到新版。

## 挑戰題

1. 嘗試在只讀掛載中建立檔案，記錄錯誤訊息。
2. 停止並重建 `acp-mount`，確認主機資料仍存在。
3. 說明為何掛載整個家目錄通常不是好做法。

## 清理

```zsh
container stop acp-mount
container delete acp-mount
rm -f message.txt copied-os-release.txt
rm -rf shared
```
