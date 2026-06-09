# 程式練習工作區

此資料夾包含 Codex 歷史對話工具，以及依功能分類的程式練習。

## 目錄

### `run.py`

Codex CLI 歷史對話終端介面，可恢復、新建、搜尋、封存及還原對話。

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
| `n` | 建立新對話 |
| `d` | 封存選取的對話 |
| `a` | 切換歷史紀錄／封存紀錄 |
| `u` | 在封存區還原選取的對話 |
| `/` | 依標題、目錄或工作階段 ID 搜尋 |
| `c` 或 `Backspace` | 清除搜尋 |
| `q` 或 `Esc` | 離開 |

工具中的刪除功能使用 Codex CLI 的 `codex archive` 封存機制，因此仍可在封存區還原。

若要設為全域指令，可在 `~/.zshrc` 加入：

```bash
alias chistory='python3 "/path/to/codex-test/run.py"'
```

### `competition/`

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

### `games/`

Tkinter 貪食蛇遊戲。

```bash
python3 games/snake.py
```
