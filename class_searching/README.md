# 全校課表查詢系統

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

檔名必須分別包含「教師課表」或「班級課表」，副檔名為 `.pdf`。抽取器會掃描所有名稱符合 `*課表/` 且內有 PDF 的資料夾，因此可同時保留不同學期，例如 `114-1課表/`、`114-2課表/`、`115-1課表/`。空資料夾，例如尚未放入 PDF 的 `115-1課表/`，會被自動略過，這是正常行為。

重建課表前，電腦需具備：

- Python 3、`pypdf` 與 `Pillow`。
- Ghostscript 的 `gs` 指令與 Tesseract 的 `tesseract` 指令，供掃描型 PDF 的 OCR 使用。
- `tessdata/chi_tra.traineddata` 繁體中文辨識檔；此檔隨程式保留，不需要自行加入 Git。

Python 套件尚未安裝時，可執行：

```bash
python3 -m pip install pypdf Pillow
```

## 新增或重新匯入學期

請在專案根目錄執行以下流程。正確的抽取腳本是 `extract_schedule.py`；專案中沒有 `extrac_pdf.py` 或 `extract_pdf.py`。

```bash
cd "/Users/lvyunxiu/codex test/class_searching"

# 先確認該學期已放入 PDF；數量為 0 代表還沒有可匯入的資料。
find "115-1課表" -maxdepth 1 -type f -name "*.pdf" | wc -l

# 一次重建所有含 PDF 的學期。
/opt/homebrew/bin/python3 extract_schedule.py

# 確認網頁選單資料已包含新學期。
cat semesters.json
```

成功時，終端會出現類似以下訊息：

```text
Wrote .../databases/115-1.json - Teachers: ...
Wrote .../semesters.json
```

抽取器會重新掃描所有符合條件的資料夾，並在本機產生或更新：

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
3. 執行 `/opt/homebrew/bin/python3 extract_schedule.py`，並確認畫面有 `Wrote .../databases/115-1.json`。
4. 開啟 `semesters.json`，確認有 `"id": "115-1"` 與 `"database": "databases/115-1.json"`。
5. 查看 `teacher_directory_review.json`，確認是否有同一教師編號對應不同姓名，或未讀到編號的教師。
6. 重新啟動網頁服務，強制重新整理頁面後，在「學期」選單選擇 `115-1`，抽查教師課表與班級課表是否正確。

### 學期沒有顯示在網頁選單

依序檢查以下項目：

1. 確認使用的是 `python3 extract_schedule.py`，不是不存在的 `extrac_pdf.py`。
2. 確認資料夾名稱是例如 `114-1課表/`，且其內至少有一個 `.pdf`。沒有 PDF 的資料夾會被略過。
3. 確認 PDF 檔名包含「教師課表」或「班級課表」。若兩種檔案都缺少，抽出的學期不會有可用課表。
4. 執行後查看 `semesters.json`。只有出現在這個檔案的學期才會出現在網頁選單。
5. 執行 `./stop.sh`、`./start.sh`，並在瀏覽器按 `Command + Shift + R`。

目前 `114-1課表/` 已有 12 份 PDF，而且本機 `semesters.json` 已包含 `114-1`。重新啟動服務後，網頁選單應可選擇 `114-1`；`115-1課表/`、`115-2課表/` 仍是空資料夾，所以尚未出現是預期行為。

## 人名修正

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

網頁介面現在會保存整學期的調代課紀錄，紀錄檔是 `adjustments.json`。原始 PDF 抽出的課表資料不會被覆蓋；系統會依查詢週的實際日期，把已登記的調代課即時套用到畫面與查詢結果。

操作流程：

1. 選擇「學期」與「查詢日期」。課表會顯示該日期所在星期一到星期五的週課表。
2. 選擇申請老師，點選要調代課的課堂。
3. 若是代課，停在「代課」模式，選代課老師後按「登記代課」。
4. 若是調課，切到「調課」模式：
   - 「同週調課」會列出目前這一週內同班級的可交換課堂。
   - 「跨日期調課」可指定未來日期與節次；系統會在兩個實際日期分別檢查同一班級的課程，以及兩位老師是否互相空堂。
5. 下方「調代課公告」會列出今天以後的有效紀錄，也可以按「撤銷」取消紀錄。

跨日期調課登記後，原日期只會套用「對方到原課堂授課」這一段；互換日期才套用「申請人到對方原課堂授課」這一段。因此查詢兩個不同週次時，各自只會看到當週實際發生的課表異動。系統目前以週一到週五的學期課表為基準，國定假日、停課日等特殊行事曆仍需由管理者另行處理。

`adjustments.json` 建議要保留並備份，因為它是人工登記的整學期異動資料。重新執行 `extract_schedule.py` 只會重建基準課表，不會清掉已登記的調代課。
