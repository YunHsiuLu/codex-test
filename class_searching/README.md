# 全校課表查詢系統

## 115-1 正式課表匯入

在專案資料夾執行以下指令。不需要 Streamlit，也不需要使用其他專案的虛擬環境。

```bash
# 第一次使用才需要建立環境、安裝套件。
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt

# PDF 放入 115-1課表/ 後，只重建這一學期，保留其他學期。
./extract.sh --semester 115-1
./stop.sh
./start.sh
```

開啟 http://127.0.0.1:8765 ，選擇「115-1」。本批 PDF 註明實施日期為 2026-09-07 至 2027-01-20；網頁會自動切到可用日期，再到「調代課狀態」查看教師及班級課表。

PDF 檔名須以「教師課表.pdf」結尾，或符合「班級＋任意文字＋課表.pdf」，例如 `高中自然領域教師課表.pdf`、`校內文件高一班級正式課表.pdf`。必須同時放入教師及班級課表，檔名前面的編號不是必要條件。

115 學年度的文字型正式 PDF 使用 PyMuPDF 依表格邊界讀取，不需要 OCR。成功後檢查 `databases/115-1-import-report.json`：

- `metadata`：教師、班級及課堂數量；本批為 74 位教師、29 個班級。
- `import_warnings`：無法辨識的姓名字形以英文字母 `O` 代替，附原 PDF 與頁碼，等待人工確認，不套用舊學期編號猜測姓名。
- `missing_teacher_schedules`：只在班級課表出現、缺少個別教師課表的人員；保留班級姓名，不將未知時段視為空堂或列為可代課老師。
- `schedule_mismatches`：已知教師與班級課表的時段比對差異；正常應為空陣列。

合班、跨班及共同授課暫不開放直接調代課，以免只改一個班級造成衝突。普通課程仍支援代課、同週調課及跨日期調課。

重新匯入只更新基準課表，不刪除 `adjustments.json` 的申請或撤銷歷史。請先備份資料；姓名校正若涉及已登記的申請，也需同步核對，不要只直接改 JSON 的一處。

開發測試可執行 `.venv/bin/python -m unittest -v test_schedule`，使用暫存資料，不寫入正式紀錄。`local_backups/`、`.venv/`、匯入報告及課表資料均不納入 Git。

## 資料隱私與首次設定

這個專案的 Git 不保存課表 PDF、班級與教師資料、調代課紀錄，或 OCR 暫存檔。這些檔案都由 `.gitignore` 排除，必須以校內安全的方式在每台電腦各自保存與備份。

初次使用時，請在專案根目錄建立一個以「三碼學年度－學期」命名的資料夾，例如 `115-1課表/`。資料夾名稱必須符合 `115-1課表`、`115-2課表` 這種格式；抽取器會由名稱取得學年度與學期。

```text
115-1課表/
├── 01高中國文領域教師課表.pdf
├── 02高中英文領域教師課表.pdf
├── ...各領域教師課表.pdf
├── 高一班級課表.pdf
├── 高二班級課表.pdf
└── 高三班級課表.pdf
```

教師檔名須符合 `*教師課表.pdf`，班級檔名須符合 `*班級*課表.pdf`，因此「班級正式課表.pdf」也支援。可同時保留不同學期，例如 `114-1課表/`、`114-2課表/`、`115-1課表/`；空資料夾會被略過。

重建課表前，電腦需具備：

- Python 3 與 `requirements.txt` 中的套件，包括 `pymupdf`、`pypdf` 與 `Pillow`。
- Ghostscript 的 `gs` 指令與 Tesseract 的 `tesseract` 指令，供掃描型 PDF 的 OCR 使用。
- `tessdata/chi_tra.traineddata` 繁體中文辨識檔；此檔隨程式保留，不需要自行加入 Git。

Python 套件尚未安裝時，可執行：

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

## 新增或重新匯入學期

請在專案根目錄執行以下流程。正確的抽取腳本是 `extract_schedule.py`；專案中沒有 `extrac_pdf.py` 或 `extract_pdf.py`。

```bash
cd "/Users/lvyunxiu/codex test/class_searching"

# 先確認該學期已放入 PDF；數量為 0 代表還沒有可匯入的資料。
find "115-1課表" -maxdepth 1 -type f -name "*.pdf" | wc -l

# 只重建 115-1；省略 --semester 115-1 才會重建所有學期。
./extract.sh --semester 115-1

# 確認網頁選單資料已包含新學期。
cat semesters.json
```

成功時，終端會出現類似以下訊息：

```text
Wrote .../databases/115-1.json - Teachers: ...
Wrote .../semesters.json
```

指定 `--semester` 時只重建該學期；省略時才掃描所有符合條件的資料夾。程式在本機產生或更新：

- `databases/<學期>.json`：各學期完整課表資料庫。
- `semesters.json`：網頁的學期選單。
- `schedule_database.json` 與 `teacher_course_stats.json`：最新學期的相容資料庫。
- `teacher_directory.json`、`teacher_name_directory.json`、`teacher_directory_review.json`：教師姓名校正與檢查資料。

這些都是本機私密資料，不會被 Git 上傳。

### 開啟或更新網頁

抽取完成後，重新啟動服務，再重新整理瀏覽器：

```bash
./stop.sh
./start.sh
```

開啟 `http://127.0.0.1:8765`，在「學期」選單選擇新增的學期。若網頁原本已開啟，請按 `Command + Shift + R` 強制重新整理，避免瀏覽器沿用舊的 `semesters.json`。

### 新學期檢查清單

1. 建立 `115-1課表/`，放入全校教師課表與高一至高三班級課表 PDF。
2. 若已有教師編號與姓名對照資料，安全地複製本機的 `teacher_directory.json` 至專案根目錄。
3. 執行 `./extract.sh --semester 115-1`，並確認畫面有 `Wrote .../databases/115-1.json`。
4. 開啟 `semesters.json`，確認有 `"id": "115-1"` 與 `"database": "databases/115-1.json"`。
5. 115 學年度查看 `databases/115-1-import-report.json` 的姓名缺字、缺少教師課表及時段差異；114 學年度另查看 `teacher_directory_review.json`。
6. 重新啟動網頁服務，強制重新整理頁面後，在「學期」選單選擇 `115-1`，抽查教師課表與班級課表是否正確。

### 學期沒有顯示在網頁選單

依序檢查以下項目：

1. 確認使用的是 `python3 extract_schedule.py`，不是不存在的 `extrac_pdf.py`。
2. 確認資料夾名稱是例如 `114-1課表/`，且其內至少有一個 `.pdf`。沒有 PDF 的資料夾會被略過。
3. 確認 PDF 檔名符合 `*教師課表.pdf` 與 `*班級*課表.pdf`，兩類都必須提供。
4. 執行後查看 `semesters.json`。只有出現在這個檔案的學期才會出現在網頁選單。
5. 執行 `./stop.sh`、`./start.sh`，並在瀏覽器按 `Command + Shift + R`。

只有已匯入的學期才會出現在選單；空資料夾不代表已建立課表。115-1 的正式檔案請依本文件最上方的流程匯入。

## 人名修正

115 學年度先以 `O` 標記缺字。確認正確姓名後，在本機 `name_overrides.json` 的 `overrides` 中加入「完整缺字姓名」對「正確姓名」，再執行 `./extract.sh --semester 115-1`。只做完整姓名比對，不用姓氏或部分字串猜測；教師課表、班級課表與導師姓名會一起重建。此校正檔不納入 Git。若已有使用舊姓名的調代課紀錄，必須先備份並同步核對，避免紀錄失去對應。

以下教師編號對照適用於 114 學年度舊版抽取器。115 學年度的舊編號可能已更換，不會自動沿用。

優先建議編輯 `teacher_directory.json`。格式如下：

```json
{
  "_說明": "教師編號對應姓名。抽取課表時若有抓到教師編號，會優先使用這裡的姓名。",
  "teachers": {
    "1404": "呂昀修"
  }
}
```

`teacher_name_directory.json` 會由 `teacher_directory.json` 自動產生，方便用姓名查編號；請不要把它當主要維護檔。

重建資料時，若系統抓到新的教師編號，會自動補進 `teacher_directory.json`，既有編號的姓名不會被覆蓋。若同一編號偵測到不同姓名，會寫入 `teacher_directory_review.json` 讓你人工確認。

如果 PDF/OCR 抓不到教師編號，才用 `name_overrides.json` 修正錯字：

編輯 `name_overrides.json`：

```json
{
  "_說明": "左邊放 PDF 抽出的不完整姓名，右邊放正確姓名。",
  "overrides": {
    "鄭": "鄭君"
  }
}
```

修改後重新執行：

```bash
/opt/homebrew/bin/python3 extract_schedule.py
```

## 本機資料備份與移轉

更換電腦或重灌前，請以校內核准的加密儲存空間備份下列本機資料；不要透過公開 Git、公開雲端連結或公開訊息傳送：

- 所有 `*課表/` PDF 資料夾。
- `databases/`、`semesters.json`、`schedule_database.json`、`teacher_course_stats.json`。
- `teacher_directory.json`、`teacher_name_directory.json`、`teacher_directory_review.json`、`name_overrides.json`。
- `adjustments.json`，其中包含整學期調代課與撤銷歷史。

還原時，把這些檔案放回專案根目錄的相同位置；若只還原 PDF，也可以重新執行抽取器重建課表 JSON。請保留 `adjustments.json`，否則已登記的調代課與歷史紀錄不會自動重建。

## 命令列查詢

```bash
python3 class_search.py teachers
python3 class_search.py classes
python3 class_search.py free --teacher 呂昀修
python3 class_search.py substitute --day 三 --period 4 --exclude 呂昀修
python3 class_search.py substitute --day 三 --period 4 --exclude 呂昀修 --domain 自然
python3 class_search.py swaps --teacher 呂昀修 --day 三 --period 3 --limit 20
```

調課查詢會以班級課表為準，只找同一班級內可交換的課程，並檢查兩位老師在交換時段是否互相空堂。第八節不可作為調課原時段或交換時段。

## 網頁介面

```bash
./start.sh
```

開啟 `http://127.0.0.1:8765`。

停止服務：

```bash
./stop.sh
```

`start.sh` 會把背景服務的 PID 記在 `.class-search.pid`，log 記在 `.class-search.log`。如果要改連接埠：

```bash
PORT=8766 ./start.sh
```

這個網頁介面是用 Python 標準函式庫提供靜態檔案，不需要 Streamlit。若要手動啟動，也可以執行：

```bash
python3 server.py
```

首次啟動前，請先完成「重建資料庫」。若畫面顯示無法載入課表，通常表示尚未放入 PDF 並執行抽取器，或 `semesters.json`／`databases/<學期>.json` 尚未在本機建立。

## 調代課登記

開啟網頁時依本機日期選擇當學期：八月至隔年一月為第一學期，二月至七月為第二學期。即使提前匯入未來課表，也不會優先選取未來學期；當學期尚未匯入時，改選最近的過去學期，仍可手動切換。

黃色「不可調整」課格包含領域／共同時間、自主學習、充實課程及會議時段（含行政、主管、處室、導師等會議），禁止代課與調課。探究與實作課（包含「物理-探究A」等名稱）及第八節則標示「可代課，不可調課」，禁止同週／跨日期調課與互換目標，但可登記代課。探究課的共同授課只替換申請人，其他授課老師保留；其他合班／跨班／共同授課限制維持。若同時屬於領域時間、充實等全面禁止的類別，仍以全面禁止為準。限制由伺服器依模式判定；舊紀錄不會自動刪除。

網頁介面現在會保存整學期的調代課紀錄，紀錄檔是 `adjustments.json`。原始 PDF 抽出的課表資料不會被覆蓋；系統會依查詢週的實際日期，把已登記的調代課即時套用到畫面與查詢結果。

操作流程：

1. 選擇「學期」與「查詢日期」。課表會顯示該日期所在星期一到星期五的週課表。
2. 選擇申請老師，點選要調代課的課堂。
3. 若是代課，停在「代課」模式，選代課老師後按「登記代課」。
4. 若是調課，切到「調課」模式：
   - 「同週調課」會列出目前這一週內同班級的可交換課堂。
   - 「跨日期調課」可指定未來日期與節次；系統會在兩個實際日期分別檢查同一班級的課程，以及兩位老師是否互相空堂。
5. 切換第一個「調代課公告」標籤頁，可查看今天以後的有效紀錄，也可以按「撤銷」取消紀錄。撤銷會恢復課表，但保留歷史紀錄。

跨日期調課登記後，原日期只會套用「對方到原課堂授課」這一段；互換日期才套用「申請人到對方原課堂授課」這一段。因此查詢兩個不同週次時，各自只會看到當週實際發生的課表異動。系統目前以週一到週五的學期課表為基準，國定假日、停課日等特殊行事曆仍需由管理者另行處理。

`adjustments.json` 建議要保留並備份，因為它是人工登記的整學期異動資料。重新執行 `extract_schedule.py` 只會重建基準課表，不會清掉已登記的調代課。
