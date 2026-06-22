# 05．以 Containerfile 建置映像

## 學習目標

- 閱讀 Containerfile 的常用指令。
- 建置、檢查並執行自製 OCI 映像。
- 觀察建置快取的效果。

## 範例檔案

本章已有：

```text
05-build-image/
├── Containerfile
├── README.md
└── app/
    └── index.html
```

`Containerfile` 使用 `FROM` 選擇基礎映像、`COPY` 加入網頁、`EXPOSE` 記錄服務連接埠，並以 `CMD` 定義預設程序。

## 動手做

在本章目錄執行：

```zsh
container build --tag acp-web:v1 .
container image list
container image inspect acp-web:v1
```

啟動並發布到 macOS 的 8080：

```zsh
container run --name acp-web --detach --publish 127.0.0.1:8080:80 acp-web:v1
curl http://127.0.0.1:8080
container logs acp-web
```

修改 `app/index.html` 後再次建置，觀察哪些步驟使用快取：

```zsh
container build --tag acp-web:v2 .
```

## 驗證

- `container image list` 中有 `acp-web:v1`。
- `curl` 回傳本章的 HTML。
- `container inspect acp-web` 顯示主機與容器的連接埠設定。

## 挑戰題

1. 在 HTML 加上自己的姓名並建置 `v2`。
2. 比較 `v1`、`v2` 的映像資訊。
3. 使用 `--no-cache` 重建，觀察耗時差異。

## 清理

```zsh
container stop acp-web
container delete acp-web
container image delete acp-web:v1 acp-web:v2
container builder stop
```

`container builder stop` 只停止建置用 VM，不會刪除映像。
