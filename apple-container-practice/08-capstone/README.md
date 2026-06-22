# 08．綜合實作：班級公告網站

## 任務

建立一個以 Nginx 提供的班級公告網站，並符合下列條件：

- 使用本章的 `Containerfile` 建置映像。
- 容器根檔案系統唯讀。
- 將 `site/` 以只讀方式掛載，讓教師可直接修改公告。
- 將 Nginx 紀錄保存在具名卷。
- 限制為 1 CPU、256 MB 記憶體。
- 只在 macOS 本機的 8082 提供服務。

## 專案結構

```text
08-capstone/
├── Containerfile
├── README.md
└── site/
    └── index.html
```

## 動手做

建置映像並建立紀錄卷：

```zsh
container build --tag acp-class-site:v1 .
container volume create acp-class-logs
```

啟動服務：

```zsh
container run \
  --name acp-class-site \
  --detach \
  --read-only \
  --cpus 1 \
  --memory 256M \
  --publish 127.0.0.1:8082:80 \
  --mount "type=bind,source=$PWD/site,target=/usr/share/nginx/html,readonly" \
  --volume acp-class-logs:/var/log/nginx \
  --tmpfs /var/cache/nginx \
  --tmpfs /var/run \
  acp-class-site:v1
```

驗證網站與設定：

```zsh
curl http://127.0.0.1:8082
container inspect acp-class-site
container stats --no-stream acp-class-site
```

修改 `site/index.html` 的公告內容，不重建映像，然後重新 `curl`。接著讀取紀錄卷：

```zsh
container run --rm --volume acp-class-logs:/logs docker.io/library/alpine:3.22 ls -l /logs
```

## 驗收標準

- `curl` 能取得自訂公告頁。
- 修改 `site/index.html` 後立即生效。
- 容器設定顯示唯讀根檔案系統及資源限制。
- 存取紀錄在重建網站容器後仍保留。
- `container list --all` 中只留下本章刻意建立的資源。

## 延伸挑戰

1. 新增第二個 HTML 頁面與導覽連結。
2. 自訂 `404.html` 並驗證 HTTP 狀態碼。
3. 建立 `start.zsh` 與 `stop.zsh`，讓啟停流程可重複執行，並避免重複建立資源時失敗。
4. 說明哪些資料應放進映像、bind mount 與具名卷。

## 清理

```zsh
container stop acp-class-site
container delete acp-class-site
container volume delete acp-class-logs
container image delete acp-class-site:v1
container builder stop
```
