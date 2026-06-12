# tmux-guide

在 tmux 工作視窗右側建立完整高度的中文指令速查窗格，並在最左側常駐互動式檔案瀏覽器。

## 功能

- `tmux-help` 只能在 tmux 工作階段內執行。
- 說明窗格約占右側 30％，並跨越完整視窗高度。
- 建立後焦點留在原窗格，可同時查看與操作。
- 同一個 tmux 視窗只能開啟一個小幫手，避免重複分割。
- 使用 `less` 顯示說明，可捲動、搜尋，並以 `q` 離開。
- 安裝後可用 `Prefix H` 開啟說明。
- 可用 `Prefix P` 開啟右上角懸浮 popup。
- 預設啟用 tmux 滑鼠控制。
- 啟用焦點事件與 bell 轉送，讓 Codex 核准通知可傳到外層終端機。
- 每個 tmux 視窗最左側自動建立互動式檔案瀏覽器，並追蹤作用中 pane 的目錄。

## 安裝

```bash
cd tmux-guide
./install.sh
```

若 `~/.local/bin` 尚未加入 `PATH`，請在 `~/.zshrc` 加入：

```bash
export PATH="$HOME/.local/bin:$PATH"
```

再重新載入 shell：

```bash
source ~/.zshrc
```

## 使用

先進入 tmux：

```bash
tmux
```

接著在任一窗格輸入：

```bash
tmux-help
```

也可以按 `Prefix H`。預設 `Prefix` 是 `Ctrl+b`，因此按鍵順序是先按 `Ctrl+b`，放開後再按大寫 `H`。

說明窗格會占用右側約 30％，並跨越完整視窗高度。開啟後鍵盤焦點仍在原本的工作窗格。

要關閉說明時，用滑鼠點選右側說明窗格，再按 `q`。

若目前視窗已經存在小幫手，再次執行 `tmux-help` 或按 `Prefix H` 時，只會在狀態列顯示提示，不會建立更多窗格。不同的 tmux 視窗仍可各自開啟小幫手。

說明頁由 `less` 顯示：

| 按鍵 | 功能 |
| --- | --- |
| `↑`／`↓`、`Page Up`／`Page Down` | 捲動 |
| `/文字` | 搜尋 |
| `n`／`N` | 下一個／上一個搜尋結果 |
| `g`／`G` | 跳至開頭／結尾 |
| `q` | 關閉說明視窗 |

## 顯示模式

```bash
tmux-help             # 右側完整高度的指令說明
tmux-help --popup     # 右上角懸浮視窗
tmux-help --window    # 獨立 tmux 視窗
```

`display-popup` 看起來最像懸浮小視窗，但這是 tmux 的模態介面：popup 開啟時，鍵盤輸入會交給 popup，底下的窗格也會暫停更新。因此本工具預設使用右側 pane，才能真正一邊看、一邊操作。

## 滑鼠控制

安裝程式會在 `~/.tmux.conf` 加入：

```tmux
set -g mouse on
```

啟用後可以：

- 點擊窗格以切換焦點。
- 拖曳窗格邊界以調整大小。
- 點擊底部狀態列切換視窗。
- 使用滾輪查看歷史輸出。

在 macOS 終端機中，若要略過 tmux、直接選取文字，通常可按住 `Option` 再拖曳滑鼠。

## tmux 檔案樹

安裝後，每個 tmux window 最左側會自動建立約 18％ 寬的互動式檔案瀏覽器。它不使用 NERDTree 或 yazi，而是由 `tmux-tree` 直接顯示目前目錄內容。

檔案瀏覽器採用單層導覽，所有資料夾起始都是收合狀態。資料夾以藍色顯示，清單第一項固定為 `..`，用來返回上一層。

它會每秒檢查目前作用中的非檔案樹 pane：

- 切換 split pane 時，根目錄跟著該 pane 切換。
- 在 pane 中執行 `cd` 後，檔案樹自動更新。
- 目前目錄新增、刪除或重新命名檔案時，檔案樹自動刷新。
- `Prefix c` 建立新 window 時，會自動建立新的檔案樹。
- 建立第一個 tmux session 或重新連接時，也會自動補建檔案樹。
- 同一個 window 只會存在一個檔案樹。
- 若手動關閉檔案樹，可按 `Prefix F` 重新建立。

點選檔案瀏覽器後可以操作：

| 按鍵 | 功能 |
| --- | --- |
| 滑鼠單擊、`↑`／`↓`、`j`／`k` | 選取項目 |
| 雙擊資料夾、`Enter`、`→`、`l` | 進入資料夾 |
| 雙擊 `..`、`←`、`Backspace`、`h` | 返回上一層 |
| `r` | 恢復追蹤目前 split pane 的工作目錄 |
| `Space` | 預覽目前選取檔案 |
| 滑鼠滾輪、`Page Up`／`Page Down` | 移動清單 |
| `g`／`G` | 跳至開頭／結尾 |
| `q` | 關閉檔案樹，可用 `Prefix F` 重建 |

為避免大型專案影響顯示效能，預設略過 `.git`、`node_modules`、`__pycache__`、`.venv` 與 `venv`。

手動進入資料夾後會鎖定目前瀏覽路徑，切換到其他 split pane 不會跳回該 pane 的工作目錄。按 `r` 可解除鎖定，重新追蹤目前 pane。

FILE TREE 的上下滾輪事件會由 tmux 轉換成方向鍵，不會切換到 tmux copy-mode、選取終端文字，或受到終端滑鼠編碼差異影響。

檔案瀏覽器只提供資料夾導覽，不會跨 pane 控制 Vim；雙擊一般檔案不會開啟檔案。Vim 中仍可用原本的 `\tt` 手動切換 NERDTree。

若要調整寬度，請修改 [`bin/tmux-tree`](bin/tmux-tree) 開頭的：

```sh
TREE_WIDTH_PERCENT=18
```

## Codex 核准通知

Codex TUI 預設只在未聚焦時發送通知。若 tmux 沒有啟用焦點事件，Codex 可能無法得知您已切到其他窗格。本工具會加入：

```tmux
set -g focus-events on
set -g visual-bell off
set -g bell-action any
setw -g monitor-bell on
```

這會將窗格焦點變化傳給 Codex，並讓通知 bell 傳到外層終端機。

若 Apple Terminal 仍未顯示通知，請檢查：

1. `Terminal → 設定 → 描述檔 → 進階` 中的 bell／提示選項。
2. `系統設定 → 通知 → 終端機` 是否允許通知。

Codex 也支援在 `~/.codex/config.toml` 的 `[tui]` 區段明確指定：

```toml
[tui]
notifications = ["agent-turn-complete", "approval-requested"]
notification_method = "bel"
notification_condition = "unfocused"
```

目前 Codex 預設已啟用 TUI 通知，因此通常只需要修正 tmux 的焦點事件。

## 不安裝直接測試

```bash
tmux
./bin/tmux-help
```

在 tmux 外執行時，程式會拒絕開啟並顯示提示。
