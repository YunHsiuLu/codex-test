# Message Board 交接紀錄

## 2026-11-11：恢復本機 HTTPS 留言板

### 現況與原因

- 目前專案是 Flask／SQLite／Socket.IO 版本；實際檔案中沒有 GAS 專案，這次處理的是本機留言板。
- 專案位於 `/Users/lvyunxiu/codex test/message board`。
- 舊紀錄顯示服務使用 `/Users/lvyunxiu/codex-test/message board/server.py`，該路徑目前不存在。首頁反覆發生 `sqlite3.OperationalError: unable to open database file`，service worker 回傳 404，符合資料夾搬移後舊服務仍持有舊路徑的情況。
- 開始檢查時，5001／5003 沒有監聽程序。現有 `data/messages.db` 通過 SQLite `PRAGMA quick_check`，共 22 筆留言，未更動原有留言。

### 已完成

- 從目前路徑啟動 HTTPS 留言板及憑證下載服務。
- `start.sh` 使用獨立程序工作階段啟動背景服務，修正這次工具工作階段結束後原本 nohup 子程序消失的現象。
- 啟動與重複啟動時檢查 `/health`、首頁、service worker，並驗證本機 CA，避免僅以 PID 存在判斷服務正常。
- `/health` 實際唯讀查詢留言資料表；資料庫不可用時回傳 503，不建立空白資料庫，並確保連線關閉。
- `.gitignore` 加入本交接文件的例外，避免上層忽略規則漏掉文件。

### 驗證

- `zsh -n start.sh stop.sh` 通過。
- 使用臨時目錄執行目前 server.py 及 Flask test client，通過首頁、健康檢查、service worker、留言寫入、重複留言去重、完成留言、空白驗證，以及資料庫消失回傳 503 的檢查。測試資料庫與正式資料庫隔離。
- 以 `curl --cacert data/https/public/teacher-messenger-ca.crt` 確認 HTTPS 首頁及 service worker 回傳 200，區域網路位址 `/health` 回傳 `{"status":"ok"}`。
- 憑證下載服務回傳 200。
- 重複執行 `./start.sh` 正確辨識同一服務，不額外開啟程序。
- 正式資料庫再次檢查仍為 22 筆，完整性正常。

### 執行環境與啟動

- macOS、zsh、OpenSSL、Python，依賴 `flask` 與 `flask-socketio`。
- 這台電腦使用 `/Users/lvyunxiu/.venv/flask/bin/python`；其他電腦可建立專案 `.venv`，或用 `PYTHON_BIN` 指定已安裝依賴的 Python。
- 在本專案資料夾執行 `./start.sh`，停止用 `./stop.sh`。
- 本機網址：`https://127.0.0.1:5001`。
- 本次區域網路網址：`https://10.240.61.196:5001`；IP 可能改變，以 `./start.sh` 最新輸出為準。
- 本次憑證網址：`http://10.240.61.196:5003/teacher-messenger-ca.crt`。
- iPhone 與 Mac 需在同一網路，憑證信任流程見 `IPHONE_SETUP.md`。
- 憑證私鑰在 `data/https/private`，不應加入版本控制。備份或搬移時保留留言資料庫與原有 CA；搬移前停止服務，搬移後重新啟動。
- 查錯：`tail -n 80 server.log`、`tail -n 40 cert-server.log`。

### 未驗證與下一步

- 瀏覽器控制工具回報 `The browser access host is unavailable`，未完成可見畫面與真實手機操作驗證。網路檢查來自 Mac，不能證明手機到 Mac 的連線。
- 正式服務沒有新增測試留言；寫入、去重及完成流程以隔離資料庫驗證。
- 未驗證電腦重新開機後自動啟動；目前仍需執行 `./start.sh`，Mac 休眠或關機時不能連線。
- 下一步：在手機重新整理目前 HTTPS 網址，確認顯示「已連線至老師的電腦」，再檢查實際留言及離線補送。
- 未執行 Git commit／push。
