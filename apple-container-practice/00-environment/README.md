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

<details>
<summary>點此顯示解答</summary>

1. 映像是建立容器所用的唯讀範本，容器則是由映像建立的執行個體。停止或刪除容器只改變容器資源，不會自動刪除仍可供其他容器重複使用的映像。
2. 傳統做法通常讓許多容器共用同一個 Linux 核心，或先共用一部 Linux VM 再執行容器。Apple `container` 則讓每個 Linux 容器在各自的輕量 VM 中執行，因此 VM 邊界、核心與資源設定彼此獨立，隔離程度較高，但每個容器也有個別 VM 的啟動與資源成本。
3. 先查閱說明，再搜尋 CPU 相關旗標：

   ```zsh
   container run --help | grep -i cpu
   ```

   可找到 `--cpus <cpus>`；例如 `--cpus 2`。若目前版本的子指令說明未正常顯示，先用 `container --version` 確認版本並更新 CLI。

</details>

本章不會建立資源，不需要清理。
