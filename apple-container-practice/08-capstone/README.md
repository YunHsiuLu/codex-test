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

<details>
<summary>點此顯示參考解答</summary>

1. 在 `site/` 新增 `schedule.html`，並在兩個 HTML 頁面加入彼此的連結，例如：

   ```html
   <nav>
     <a href="/index.html">公告</a>
     <a href="/schedule.html">課程表</a>
   </nav>
   ```

   因 `site/` 是 bind mount，不必重建映像；直接開啟 `http://127.0.0.1:8082/schedule.html` 即可驗證。
2. 只放入 `site/404.html` 不會讓 Nginx 自動使用它。可在映像中加入自訂設定檔，例如建立 `default.conf`：

   ```nginx
   server {
       listen 80;
       root /usr/share/nginx/html;
       error_page 404 /404.html;
   }
   ```

   並在 `Containerfile` 加入：

   ```dockerfile
   COPY default.conf /etc/nginx/conf.d/default.conf
   ```

   重新建置、重建容器後驗證：

   ```zsh
   curl -i http://127.0.0.1:8082/not-found
   ```

   回應本文應是自訂頁面，HTTP 狀態仍應為 `404`。
3. `start.zsh` 的核心是先確保舊容器不存在，再以「已存在也可接受」的方式建立卷：

   ```zsh
   #!/bin/zsh
   set -e
   container stop acp-class-site 2>/dev/null || true
   container delete acp-class-site 2>/dev/null || true
   container volume inspect acp-class-logs >/dev/null 2>&1 || \
     container volume create acp-class-logs
   container build --tag acp-class-site:v1 .
   container run \
     --name acp-class-site --detach --read-only --cpus 1 --memory 256M \
     --publish 127.0.0.1:8082:80 \
     --mount "type=bind,source=$PWD/site,target=/usr/share/nginx/html,readonly" \
     --volume acp-class-logs:/var/log/nginx \
     --tmpfs /var/cache/nginx --tmpfs /var/run \
     acp-class-site:v1
   ```

   `stop.zsh` 只移除容器，保留紀錄卷與映像，所以下次可繼續使用：

   ```zsh
   #!/bin/zsh
   set -e
   container stop acp-class-site 2>/dev/null || true
   container delete acp-class-site 2>/dev/null || true
   ```

   儲存後執行 `chmod +x start.zsh stop.zsh`。若要完整清除資料，應另做明確的清理指令，不能混入一般停止流程。
4. 映像應放版本化且部署時固定的內容，例如 Nginx、預設設定與正式版靜態檔；bind mount 適合教師要直接修改、立即生效的 `site/`；具名卷適合由服務產生且跨容器重建仍要保留的存取紀錄。機密資料不應直接寫入映像。

</details>

## 清理

```zsh
container stop acp-class-site
container delete acp-class-site
container volume delete acp-class-logs
container image delete acp-class-site:v1
container builder stop
```
