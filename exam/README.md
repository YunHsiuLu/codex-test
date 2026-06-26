# AI 輔助考卷專案使用說明

這個專案是一套給老師使用的「教材記憶＋LaTeX 出卷」工作流程。核心想法是先把講義、書籍、課本、考古題等知識內容整理成 `memory_palace`，之後出考卷時就優先查詢這些記憶點，不需要每次重新讀 PDF 或重新 OCR。

目前範例內容以高中物理為主，但資料夾結構與流程可以改成其他科目使用。

## 專案適合做什麼

- 根據指定範圍設計小考、複習卷、段考卷。
- 將既有 PDF 考卷轉成 LaTeX 版本。
- 建立教材知識庫，讓之後命題能穩定引用同一份教材脈絡。
- 整理考古題解題與出題風格，讓新考卷更接近指定學校或老師的命題習慣。
- 用共同的 LaTeX template 產出格式一致的考卷。

## 資料夾結構

```text
exam/
├── AGENTS.md
├── README.md
├── memory_palace/
├── 考卷template/
└── 高一範圍/
```

### `AGENTS.md`

AI 在此專案中必須遵守的工作規則。不同老師使用前，建議先依照自己的需求改寫這份檔案。

常見需要調整的項目：

- 老師的科目、年級、版本與課程範圍。
- 小考、段考、複習卷的固定題數與配分。
- 是否允許手寫題、計算題、圖形題。
- 多選題是否倒扣。
- 輸出 PDF 命名規則。
- 是否優先使用文字題，圖片是否由老師自行繪製。
- 教材正式來源資料夾路徑。

### `memory_palace/`

教材與考古題的知識庫。出卷前應優先讀取這裡，而不是重新讀 PDF。

建議依照課程層級切分，例如：

```text
memory_palace/
├── elementary/
│   ├── global/
│   ├── ocr/
│   └── past_exams/
└── advanced/
    ├── global/
    └── ocr/
```

老師可以依照自己的科目改名，例如：

```text
memory_palace/
├── junior/
├── senior_basic/
├── senior_advanced/
└── past_exams/
```

重點是：不同層級不要混成同一份摘要。基礎課程與進階課程可以互相參照，但應保留各自的知識深度。

### `考卷template/`

LaTeX 共用模板。

目前規則是：

- `preamble.tex`：放套件、字體、頁面設定。
- `commands.tex`：放題型指令、計數器、答案表格、圖片包裝等共用功能。
- `main.tex`：範例考卷程式碼，給老師參考寫法。

正式考卷資料夾不要再複製 `preamble.tex` 與 `commands.tex`，而是在各自的 `main.tex` 中用相對路徑引用。

範例：

```tex
\input{../../考卷template/preamble}
\input{../../考卷template/commands}
```

每份考卷不同的設定，例如 `\examheader`、單選配分 `\scscore`、複選配分 `\mcscore`，應該放在該份考卷自己的 `main.tex`。

### `高一範圍/`

目前專案中的正式考卷輸出資料夾。每份考卷各自一個資料夾。

範例：

```text
高一範圍/
├── 小考_第一次段考複習卷/
│   ├── main.tex
│   └── 小考_第一次段考複習卷.pdf
└── 段考_第三次段考4-5至6-4/
    ├── main.tex
    ├── q1.png
    └── 段考_第三次段考4-5至6-4.pdf
```

## 安裝 LaTeX 編譯環境

本專案的考卷使用 LaTeX 撰寫，編譯指令主要使用 `xelatex`。如果老師電腦尚未安裝 LaTeX，必須先完成安裝，否則只能閱讀或修改 `main.tex`，無法產生 PDF。

### Windows

建議安裝 MiKTeX 或 TeX Live，二擇一即可。

#### 方式一：MiKTeX

MiKTeX 適合第一次使用 LaTeX 的老師，安裝檔較小，缺少套件時可以自動補裝。

步驟：

1. 到 MiKTeX 官方網站下載 Windows 安裝檔。
2. 安裝時選擇「Install missing packages on-the-fly」或類似的自動安裝套件選項。
3. 安裝完成後，重新開啟命令提示字元或 PowerShell。
4. 輸入以下指令確認安裝成功：

```powershell
xelatex --version
```

若能看到版本資訊，就代表可以編譯本專案考卷。

#### 方式二：TeX Live

TeX Live 套件完整，但安裝檔較大、安裝時間較長。若學校資訊組已經有統一安裝方式，也可以使用 TeX Live。

步驟：

1. 到 TeX Live 官方網站下載 Windows 安裝程式。
2. 執行完整安裝。
3. 安裝完成後，重新開啟命令提示字元或 PowerShell。
4. 輸入：

```powershell
xelatex --version
```

### macOS

macOS 建議安裝 MacTeX。MacTeX 是 TeX Live 的 macOS 發行版，套件完整，最適合直接編譯本專案。

步驟：

1. 到 MacTeX 官方網站下載 MacTeX 安裝檔。
2. 開啟 `.pkg` 並完成安裝。
3. 安裝完成後，重新開啟 Terminal。
4. 輸入以下指令確認安裝成功：

```zsh
xelatex --version
```

若出現版本資訊，就代表可以編譯。

若老師習慣使用 Homebrew，也可以安裝 BasicTeX，但 BasicTeX 預設套件較少，可能需要額外補裝套件。除非熟悉 LaTeX 套件管理，否則建議直接安裝 MacTeX。

### 編譯測試

安裝完成後，可以進入 `考卷template` 測試：

```zsh
cd 考卷template
xelatex -interaction=nonstopmode main.tex
xelatex -interaction=nonstopmode main.tex
```

若成功產生 `main.pdf`，表示 LaTeX 編譯環境可用。

常見問題：

- 找不到 `xelatex`：通常是 LaTeX 尚未安裝完成，或安裝後終端機尚未重新開啟。
- 缺少中文字體：本專案會依序嘗試 `Noto Sans CJK TC`、`PingFang TC`、`Songti TC`。若 Windows 顯示字體錯誤，建議安裝 Noto Sans CJK TC。
- 缺少 LaTeX 套件：MiKTeX 可開啟自動補裝；TeX Live 或 MacTeX 通常已包含本專案需要的套件。

## 第一次使用流程

### １．放入教材或文本資料

可以使用下列資料來源：

- 講義 PDF。
- 課本 PDF。
- 書籍章節文字。
- MinerU、OCR 或其他工具轉出的 Markdown。
- 老師自己整理的重點筆記。
- 過去考卷與詳解。

建議新增一個原始資料資料夾，例如：

```text
source_materials/
├── raw_pdf/
├── mineru_md/
└── past_exams/
```

若教材檔案很大，可以不放在 git 專案中，只在 `AGENTS.md` 或 `memory_palace/source_map.md` 記錄正式來源路徑。

### ２．建立 memory palace

請 AI 先讀取教材文字，整理成記憶宮殿。

建議產出內容：

- `README.md`：說明這個層級的教材範圍。
- `concept_map.md`：整理跨章節概念圖。
- `question_design_matrix.md`：整理適合出的題型、常見迷思、進階題方向。
- `chunks/`：依概念切分的知識區塊。
- `source_map.md`：記錄知識來源與原始檔案對應。
- `ocr/`：若有 OCR 或 MinerU 文字，可放在這裡。

重要原則：

- 第一次整理會比較花時間，但之後出題會快很多。
- 不同年級、不同難度、不同課程版本要分開整理。
- 重複知識可以互相連結，但不要把基礎與進階內容混成同一份。

### ３．整理考古題

若有過去考卷，建議放入：

```text
memory_palace/<層級>/past_exams/raw/
```

請 AI 進行：

- 解題。
- 對答案。
- 整理常見題型。
- 記錄命題老師或學校常考迷思。
- 補入 `memory_palace/<層級>/past_exams/solutions/` 或 learned chunks。

這會讓未來命題更貼近老師原本的風格。

## 出卷流程

### １．提出需求

範例：

```text
請出一份 ３－１ 對物體運動的描述小考。
使用小考格式：基礎題１０題，每題７分；進階題４題，每題５分；混合題共１０分。
```

或：

```text
請設計第一次段考範圍 １－１～３－１ 的複習卷，以小考格式出題。
```

### ２．AI 查詢 memory palace

AI 應先讀：

```text
memory_palace/taxonomy.md
memory_palace/<指定層級>/global/README.md
memory_palace/<指定層級>/global/concept_map.md
memory_palace/<指定層級>/global/question_design_matrix.md
memory_palace/<指定層級>/global/chunks/
```

只有在記憶點不足、需要核對原講義、或使用者明確要求時，才回去讀原始 PDF 或重新 OCR。

### ３．建立考卷資料夾

每份考卷獨立一個資料夾。

命名建議：

```text
小考_章節範圍/
段考_段考名稱與範圍/
複習卷_章節範圍/
```

### ４．撰寫 `main.tex`

正式考卷資料夾內保留 `main.tex`，並引用共用 template。

小考通常題數與配分固定，不需要額外用 `\scscore`、`\mcscore` 算分。

段考題數與配分常變，建議在 `main.tex` 中設定：

```tex
\newcommand{\scscore}{3}
\newcommand{\mcscore}{4}
```

### ５．編譯 PDF

進入考卷資料夾後執行：

```zsh
xelatex -interaction=nonstopmode main.tex
xelatex -interaction=nonstopmode main.tex
```

第二次編譯是為了讓總題數、總分、頁碼等交叉參照正確。

PDF 輸出規則：

- `tex` 檔可以維持 `main.tex`。
- PDF 必須改成與資料夾範圍同名。

範例：

```text
小考_第一次段考複習卷/main.tex
小考_第一次段考複習卷/小考_第一次段考複習卷.pdf
```

### ６．清除編譯暫存檔

編譯後刪除 LaTeX 中間檔，只保留必要檔案。

常見可刪除檔：

```text
*.aux
*.log
*.fls
*.fdb_latexmk
*.xdv
*.out
*.toc
*.synctex.gz
```

保留：

- `main.tex`
- 依範圍命名的 PDF
- 題目需要的圖片
- 手繪圖片說明檔
- 其他必要素材

## 圖片題規則

本專案預設文字優先。

若題目需要圖形：

- 優先用文字描述讓老師手動畫圖。
- 或由老師先提供圖片，再依圖片出題。
- 若考卷中需要圖片，必須在該考卷資料夾中建立說明檔，例如 `需手繪圖片.md`。

說明檔應列出：

- 題號。
- 需要畫什麼。
- 物件與標示。
- 座標軸。
- 方向。
- 數值。
- 必要文字。

## 老師自訂 `AGENTS.md` 建議

若要把此專案改成自己的課程，建議先改：

### 個人與課程資訊

- 老師姓名。
- 科目。
- 年級。
- 教材版本。
- 課程範圍。

### 出題規則

- 小考題數與配分。
- 段考題型比例。
- 單選、多選、混合題、手寫題規則。
- 多選題倒扣或不倒扣。
- 是否提供答案。
- 是否產生解析。

### 教材規則

- 哪些資料夾是正式教材來源。
- 哪些資料夾只是備份。
- 是否允許重新 OCR。
- 是否允許讀取外部教材資料夾。

### LaTeX 規則

- 是否使用 `考卷template/`。
- PDF 命名方式。
- 編譯後保留哪些檔案。
- 圖片題的處理方式。

## 建議工作習慣

- 不要把大型教材 PDF 全部放進 git，除非確定需要版本控管。
- 建立好 `memory_palace` 後，優先使用記憶點出題。
- 每次大幅修改 template 後，至少編譯一份既有考卷確認沒有壞掉。
- 若多人共用專案，請先 `git pull` 再修改，完成後再上傳。
- 考卷資料夾內不要放多餘編譯暫存檔。

## 目前專案狀態

目前此 repo 已經有：

- 高一物理基礎範圍的 `memory_palace`。
- 選修物理進階範圍的 `memory_palace`。
- 高一小考、複習卷與段考卷範例。
- 可重複使用的 LaTeX template。

其他老師使用時，可以保留架構，替換成自己的教材、考古題與出題規則。
