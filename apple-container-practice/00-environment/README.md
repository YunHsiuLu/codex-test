# 00．環境與核心概念

## 學習目標

- 確認 Apple `container` 可用。
- 理解映像、容器與輕量 VM 的關係。
- 熟悉指令的說明系統。

## 核心概念

- **映像（image）**：唯讀的應用程式封裝範本，符合 OCI 標準。
- **容器（container）**：由映像建立的可執行個體。
- **Apple container**：macOS 上的管理工具；每個 Linux 容器各自在輕量 VM 中執行。
- **Registry**：儲存與提供 OCI 映像的服務，例如 Docker Hub 或 GitHub Container Registry。使用公開 OCI 映像不代表使用 Docker Desktop。

## 動手做

啟動服務並檢查版本：

```zsh
container --version
container system start
container system status
container system version
```

查看三級說明：

```zsh
container --help
container image --help
container image pull --help
```

查看目前資源：

```zsh
container list --all
container image list
container system df
```

## 驗證

- `container system status` 顯示 `running`。
- 能指出 `container image list` 與 `container list --all` 的差異。

## 挑戰題

1. 為什麼停止容器後，映像通常仍然存在？
2. Apple `container` 和傳統共用 Linux VM 的容器架構有何差異？
3. 找出查看 `run` 指令 CPU 選項的方法。

本章不會建立資源，不需要清理。
