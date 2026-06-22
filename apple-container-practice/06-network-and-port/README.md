# 06．網路與連接埠

## 學習目標

- 理解容器連接埠與 macOS 連接埠的映射。
- 建立獨立網路並連接兩個容器。
- 使用容器名稱進行 DNS 解析。

## 動手做 A：發布連接埠

```zsh
container run --name acp-server --detach --publish 127.0.0.1:8081:80 docker.io/library/nginx:1.29-alpine
curl http://127.0.0.1:8081
container inspect acp-server
```

`127.0.0.1:8081:80` 依序代表「macOS 綁定 IP：macOS 連接埠：容器連接埠」。限定 `127.0.0.1` 可避免服務直接暴露到區域網路。

## 動手做 B：隔離網路

```zsh
container network create acp-net
container network list
container network inspect acp-net
```

將伺服器與用戶端放入同一網路：

```zsh
container stop acp-server
container delete acp-server
container run --name acp-server --detach --network acp-net docker.io/library/nginx:1.29-alpine
container run --name acp-client --detach --network acp-net docker.io/library/alpine:3.22 sleep 3600
container exec acp-client wget -qO- http://acp-server.test
```

Apple `container` 會提供容器名稱加上 `.test` 的 DNS 名稱。同一網路中的用戶端可直接存取，不需要將連接埠發布給 macOS。

## 驗證

- A 中 macOS 可透過 8081 存取 Nginx。
- B 中 `acp-client` 可解析並存取 `acp-server.test`。
- B 中服務沒有發布到 macOS 的 8081。

## 挑戰題

1. 建立第二個網路，驗證不同網路的容器彼此隔離。
2. 為 `acp-net` 指定不與現有網路重疊的 IPv4 subnet。
3. 解釋「EXPOSE 80」和「publish 8081:80」的差異。

## 清理

```zsh
container stop acp-client acp-server
container delete acp-client acp-server
container network delete acp-net
```
