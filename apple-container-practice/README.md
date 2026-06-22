# Apple container 教學練習

這是一套獨立的 Apple `container` CLI 入門教材。所有操作都在 macOS 終端機完成，不需要 Docker Desktop，也不使用 `docker` 或 `docker compose` 指令。

Apple `container` 以 OCI 映像為基礎，並為每個 Linux 容器建立輕量虛擬機。因此，你仍會看到 `Containerfile`、映像、掛載與連接埠等容器概念，但執行工具是 Apple 的 `container`。

## 適用環境

- Apple silicon Mac。
- macOS 26 或更新版本。
- Apple `container` CLI 1.0.0 或相容版本。
- 可連上網路以下載公開 OCI 映像。

先確認環境：

```zsh
container --version
container system start
container system status
```

若尚未安裝，請由 [Apple container Releases](https://github.com/apple/container/releases) 下載安裝套件。

## 課程地圖

| 章節 | 主題 | 完成後能做到 |
| --- | --- | --- |
| [00](00-environment/README.md) | 環境與核心概念 | 啟動服務並辨識容器、映像與 VM |
| [01](01-first-container/README.md) | 第一個容器 | 前景、互動及自動刪除模式執行容器 |
| [02](02-lifecycle/README.md) | 生命週期 | 建立、啟動、停止、重新啟動與刪除容器 |
| [03](03-observe-and-exec/README.md) | 觀察與操作 | 使用 logs、exec、inspect 與 stats |
| [04](04-files-and-mounts/README.md) | 檔案與掛載 | 複製檔案並掛載 macOS 資料夾 |
| [05](05-build-image/README.md) | 建置映像 | 以 Containerfile 建置自己的映像 |
| [06](06-network-and-port/README.md) | 網路與連接埠 | 發布服務、建立隔離網路 |
| [07](07-volume-and-resources/README.md) | 儲存與資源 | 使用具名卷並限制 CPU、記憶體 |
| [08](08-capstone/README.md) | 綜合實作 | 建置並執行可持久化的班級公告網站 |

建議依編號完成。每章均包含「動手做」、「驗證」、「挑戰題」與「清理」。容器名稱統一以 `acp-` 開頭，避免和其他專案衝突。

每章的題目後方都有預設收合的解答。完成題目後，點擊「點此顯示解答」即可展開；這使用 HTML 的 `<details>` 元素，因此在 GitHub 與多數 Markdown 預覽器中不需要額外 JavaScript。

## 練習規則

1. 指令預設從該章目錄執行。
2. 不要跳過清理步驟，否則下一次練習可能發生名稱或連接埠衝突。
3. `container delete --all`、`container image delete --all`、`container volume delete --all` 會影響其他專案，本教材不使用這些全域刪除指令。
4. 指令若與本機版本不符，先執行 `container <子指令> --help`，因為 Apple `container` 仍會持續演進。

## 常用救援指令

```zsh
container list --all
container image list
container network list
container volume list
container system logs
```

官方參考：[Tutorial](https://github.com/apple/container/blob/main/docs/tutorial.md)、[How-to](https://github.com/apple/container/blob/main/docs/how-to.md)。
