# 全校課表查詢系統

## 資料隱私與首次設定

這個專案的 Git 不保存課表 PDF、班級與教師資料、調代課紀錄，或 OCR 暫存檔。這些檔案都由 `.gitignore` 排除，必須以校內安全的方式在每台電腦各自保存與備份。

初次使用時，請在專案根目錄建立一個以學期命名的資料夾，例如：

```text
115-1課表/
├── 01高中國文領域教師課表.pdf
├── 02高中英文領域教師課表.pdf
├── ...各領域教師課表.pdf
├── 高一班級課表.pdf
├── 高二班級課表.pdf
└── 高三班級課表.pdf
```

檔名必須分別包含「教師課表」或「班級課表」，副檔名為 `.pdf`。抽取器會掃描所有名稱符合 `*課表/` 的資料夾，因此可同時保留不同學期，例如 `114-2課表/`、`115-1課表/`。

重建課表前，電腦需具備：

- Python 3、`pypdf` 與 `Pillow`。
- Ghostscript 的 `gs` 指令與 Tesseract 的 `tesseract` 指令，供掃描型 PDF 的 OCR 使用。
- `tessdata/chi_tra.traineddata` 繁體中文辨識檔；此檔隨程式保留，不需要自行加入 Git。

Python 套件尚未安裝時，可執行：

```bash
python3 -m pip install pypdf Pillow
```

## 重建資料庫

```bash
/opt/homebrew/bin/python3 extract_schedule.py
```

抽取器會自動掃描所有 `*課表/` 資料夾。每次重建會在本機產生或更新：

- `databases/<學期>.json`：各學期完整課表資料庫。
- `semesters.json`：網頁的學期選單。
- `schedule_database.json` 與 `teacher_course_stats.json`：最新學期的相容資料庫。
- `teacher_directory.json`、`teacher_name_directory.json`、`teacher_directory_review.json`：教師姓名校正與檢查資料。

這些都是本機私密資料，不會被 Git 上傳。

### 新學期操作流程

1. 建立 `115-1課表/`，放入全校教師課表與高一至高三班級課表 PDF。
2. 若已有教師編號與姓名對照資料，安全地複製本機的 `teacher_directory.json` 至專案根目錄。
3. 執行 `/opt/homebrew/bin/python3 extract_schedule.py`。
4. 查看 `teacher_directory_review.json`，確認是否有同一教師編號對應不同姓名，或未讀到編號的教師。
5. 開啟網頁後，在「學期」選單選擇 `115-1`，抽查教師課表與班級課表是否正確。

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
