# 學生程式碼空間

供區域網路內的程式設計課程使用。學生登入後，只能瀏覽與管理自己的儲存空間，可新增或刪除資料夾、上傳檔案、上傳完整資料夾，以及下載檔案。

## 使用 Docker 啟動

先安裝並啟動 Docker Desktop，接著執行：

```bash
cd student-workspace
./docker-start.sh
```

第一次啟動會自動建立不提交到 Git 的 `.env`，並建置映像。啟動後，本機開啟 `http://127.0.0.1:5002`；同一區域網路內的學生可使用教師電腦的 IP，例如 `http://192.168.1.10:5002`。

## 建立 data 資料夾

基於帳號與學生檔案的隱私及安全考量，`data/` 已列入 `.gitignore`，不會包含在 Git 儲存庫中。第一次使用此專案時，請自行建立以下目錄：

```bash
cd student-workspace
mkdir -p data/storage
chmod 700 data data/storage
```

啟動程式後，`accounts.db` 會自動建立。新增學生帳號時，程式會在 `storage/` 內建立與帳號同名的資料夾。

`data/` 的結構如下：

```text
data/
├── accounts.db                 # 帳號資料庫，首次啟動後自動建立
├── student-accounts.csv        # 選用的教師帳密清單，需自行建立及妥善保管
└── storage/                    # 學生上傳檔案的根目錄
    ├── ProgramDesign01/        # ProgramDesign01 的私人儲存空間
    ├── ProgramDesign02/
    ├── ...
    └── ProgramDesign50/
```

新的空白安裝只需要先建立 `data/storage/`；其他檔案及學生資料夾會在啟動服務與建立帳號後出現。請勿將 `accounts.db`、`student-accounts.csv` 或 `storage/` 內的任何內容加入 Git。

## 封閉式有線教室網路

若教師電腦與學生設備只透過一台交換器連線，交換器本身通常不會分配 IP。可採用以下固定 IP：

```text
網段：192.168.50.0/24
子網路遮罩：255.255.255.0
教師 Mac：192.168.50.1
學生 01：192.168.50.101
學生 02：192.168.50.102
……
學生 50：192.168.50.150
路由器／閘道：留白
DNS：留白
```

將教師 Mac 的有線網卡手動設為 `192.168.50.1` 後，在 `.env` 設定：

```dotenv
STUDENT_WORKSPACE_BIND_IP=192.168.50.1
STUDENT_WORKSPACE_PORT=5002
```

重新執行 `./docker-start.sh`，學生統一開啟：

```text
http://192.168.50.1:5002
```

若不想替 50 台設備逐一設定固定 IP，應在交換器前加入一台不連外網的路由器，由路由器提供 DHCP。教師 Mac 可保留固定 IP `192.168.50.1`，學生設備則使用自動取得 IP。

macOS 第一次收到其他設備連線時，若出現防火牆提示，需允許 Docker 接受傳入連線。

查看狀態與紀錄：

```bash
docker compose ps
docker compose logs -f
```

停止服務：

```bash
./docker-stop.sh
```

容器以非 root 身分執行，根檔案系統唯讀，移除所有額外 Linux capabilities，並限制為 1 個 CPU、512 MB 記憶體與 128 個程序。容器唯一可寫入的主機範圍是本專案的 `data/`。

## 建立學生帳號

學生不能自行註冊，帳號由教師建立：

```bash
cd student-workspace
./manage.sh create-user s001 王小明 class2026
```

列出目前帳號：

```bash
./manage.sh list-users
```

密碼至少需要 8 個字元，資料庫只儲存密碼雜湊，不會儲存明文密碼。

## 從 Terminal 查看學生資料

每位學生的實際儲存資料夾直接使用帳號命名，因此不需要查詢 SQLite 或記住隨機識別碼。

```bash
cd student-workspace
cd data/storage/ProgramDesign01
```

查看學生檔案：

```bash
find data/storage/ProgramDesign01 -maxdepth 3 -print
```

使用 Tab 自動完成選擇帳號：

```bash
cd data/storage/ProgramDesign
```

輸入到一半後按 `Tab` 即可列出或補完學生帳號。

也可以透過命令取得絕對路徑：

```bash
./manage.sh student-path ProgramDesign01
```

舊版 UUID 資料夾可使用以下命令一次性遷移：

```bash
./manage.sh migrate-storage-names
```

網站仍會依目前登入者的資料庫紀錄鎖定根目錄，學生無法從網址切換到其他帳號的資料夾。

## 資料位置與隔離方式

- 帳號資料庫：`data/accounts.db`
- 學生檔案：`data/storage/<學生帳號>/`
- 網頁請求中的路徑永遠從目前登入學生的根目錄解析。
- `..`、絕對路徑與符號連結會被阻擋。
- 使用者無法從網址指定其他學生的帳號或儲存目錄。
- 所有修改操作都有 CSRF 驗證。

`data/` 不應提交到 Git，部署前請定期備份整個目錄。

## 執行測試

```bash
cd student-workspace
$HOME/.venv/flask/bin/python -m unittest discover -s tests -v
```

原本的 `./start.sh` 僅保留作為不使用 Docker 的本機開發模式；正式上課請使用 `./docker-start.sh`。

## Docker 資料與備份

既有帳號與學生檔案仍保留在主機的 `student-workspace/data/`，並掛載至容器的 `/data`。因此：

- 重新建置或刪除容器不會刪除學生資料。
- 可直接從 Terminal 查看 `data/storage/ProgramDesign01/`。
- 不要執行 `rm -rf data`。
- 備份時停止服務，再複製整個 `data/`。
- 不要把 Docker socket、家目錄、桌面或文件資料夾掛載進容器。

目前 Docker 容器只負責網站與檔案儲存，沒有執行學生程式碼。未來若加入「執行程式」功能，必須使用另一個一次性、無網路且有時間與資源限制的執行容器。

## 目前範圍

這是第一階段的本機版本，適合在教師管理的電腦與可信任的校內網路中執行。若要開放到網際網路，還需要反向代理、HTTPS、登入嘗試限制、備份排程與管理員介面。
