# Codex CLI的練習區

此工作區收錄 Codex CLI 輔助工具、校務應用、程式競賽、遊戲、物理模擬，以及 ManimGL 原始碼。

## tmux 簡介

tmux 是一個終端機 multiplexer，可以在同一個 terminal 裡同時管理多個 session、window 與 pane。它的核心價值是把長時間執行的工作分開管理，讓你可以隨時 detach、attach，並在同一個畫面內切換不同工作內容。

這個工作區裡的 `tmux-guide/` 就是把這個概念延伸到實際使用情境：左側常駐 FILE TREE，右側開啟 `tmux-help` 速查，讓你在操作原本工作窗格時，仍能同步查看指令與檔案結構。

## 目錄結構

```text
.
├── README.md
├── run.py
├── class_searching/       # 全校課表查詢系統
├── competition/           # 程式競賽題目與解答
├── flask server/          # 物理老師留言呼叫器
├── games/                 # 小遊戲
├── manim/                 # ManimGL 原始碼
├── physics-simulations/   # 瀏覽器物理模擬
└── tmux-guide/            # tmux 中文指令速查工具
```

## 專案說明

### `run.py`：Codex 歷史對話工具

Codex CLI 歷史對話終端介面，可預覽最近對話內容、恢復、新建、搜尋、查看完整對話時間軸、封存及還原對話。

```bash
./run.py
```

也可以透過 Python 執行：

```bash
python3 run.py
```

操作按鍵：

| 按鍵 | 功能 |
| --- | --- |
| `↑`／`↓` 或 `k`／`j` | 選擇對話 |
| `Enter` | 恢復選取的對話 |
| `t` | 查看每次提問與回覆的本地時間 |
| `n` | 建立新對話 |
| `d` | 封存選取的對話 |
| `a` | 切換歷史紀錄／封存紀錄 |
| `u` | 在封存區還原選取的對話 |
| `/` | 依標題、目錄或工作階段 ID 搜尋 |
| `c` 或 `Backspace` | 清除搜尋 |
| `q` 或 `Esc` | 離開 |

時間軸讀取 Codex 工作階段原始紀錄，並將時間轉換為電腦目前的本地時區，精確到秒。時間資料會跟著對話紀錄保留；封存後仍然可以查看。

在歷史對話列表中移動選項時，畫面底部會自動顯示該工作階段最近幾則訊息的簡短預覽。

工具中的刪除功能使用 Codex CLI 的 `codex archive` 封存機制，因此仍可在封存區還原。

若要設為全域指令，可在 `~/.zshrc` 加入：

```bash
alias chistory='python3 "/path/to/codex-test/run.py"'
```

### `class_searching/`：全校課表查詢系統

提供教師與班級課表查詢、空堂查詢、代課人選篩選及調課建議，包含命令列與網頁介面。

主要內容：

- `114-1課表/`、`114-2課表/`：各學期原始課表 PDF。
- `databases/`：依學期保存的 JSON 資料庫。
- `class_search.py`：命令列查詢工具。
- `extract_schedule.py`：從 PDF 重建課表資料庫。
- `index.html`、`app.js`、`styles.css`：網頁查詢介面。
- `server.py`：本機靜態網頁伺服器。

啟動網頁介面：

```bash
cd class_searching
python3 server.py
```

接著開啟 `http://127.0.0.1:8765`。資料庫重建方式與完整查詢指令請參閱 [`class_searching/README.md`](class_searching/README.md)。

### `competition/`：程式競賽

競賽題目資料與 Python 程式：

- `Competition (zh_TW).pdf`：題目 PDF。
- `competition.py`：題目解答程式。
- `read_pdf.py`：讀取題目 PDF 文字，需要安裝 `pypdf`。
- `requirements.txt`：PDF 工具所需的 Python 套件。

```bash
python3 -m pip install -r competition/requirements.txt
python3 competition/competition.py < input.txt
python3 competition/read_pdf.py
```

### `flask server/`：物理老師留言呼叫器

使用 Flask、Flask-SocketIO 與 SQLite 製作的即時留言系統，可新增留言並標記為完成。資料儲存在 `flask server/data/messages.db`。

```bash
python3 -m pip install flask flask-socketio
cd "flask server"
python3 server.py
```

啟動後開啟 `http://127.0.0.1:5001`。

### `games/`：小遊戲

Tkinter 貪食蛇遊戲。

```bash
python3 games/snake.py
```

### `tmux-guide/`：tmux 中文指令速查工具

在 tmux 中以 `tmux-help` 或 `Prefix H` 於右側開啟完整高度的中文速查窗格。開啟時會保留同一個視窗左側的 FILE TREE 寬度，不會把樹狀窗格壓縮。每個 tmux 視窗最左側也會自動建立可捲動檔案樹，追蹤目前作用中 pane 的工作目錄。安裝程式也會啟用 tmux 滑鼠操作。

```bash
cd tmux-guide
./install.sh
```

完整說明請參閱 [`tmux-guide/README.md`](tmux-guide/README.md)。

### `physics-simulations/`：物理模擬

以 HTML、CSS 與 JavaScript 製作的互動式物理模擬：

- `double-pendulum-lagrangian/`：拉格朗日雙擺模擬。
- `pi-collision-blocks/`：以方塊彈性碰撞呈現圓周率。
- `wave-optics-interference-diffraction/`：雙狹縫干涉與單狹縫繞射模擬。

可用本機 HTTP 伺服器瀏覽：

```bash
cd physics-simulations
python3 -m http.server 8000
```

接著開啟 `http://127.0.0.1:8000`，再選擇要執行的模擬。

### `manim/`：ManimGL

此目錄為 3Blue1Brown 的 ManimGL 動畫引擎原始碼，包含函式庫、範例、文件、著色器與測試素材。它有自己的 `README.md`、套件設定及 Git 紀錄，可視為工作區內的獨立專案。

安裝並執行範例：

```bash
cd manim
python3 -m pip install -e .
manimgl example_scenes.py OpeningManimExample
```

ManimGL 另外需要 FFmpeg、OpenGL，使用 LaTeX 內容時也需要 LaTeX 環境；詳細安裝方式請參閱 [`manim/README.md`](manim/README.md)。
