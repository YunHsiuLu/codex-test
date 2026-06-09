# 全校課表查詢系統

## 資料

- `114-2課表/`: 本學期全校教師課表與班級課表 PDF
- `databases/114-2.json`: 依學期保存的資料庫
- `semesters.json`: 網頁學期選單來源
- `teacher_directory.json`: 教師編號對應姓名，抽取時優先用這份表校正老師姓名
- `name_overrides.json`: 手動修正 PDF 抽出的人名
- `schedule_database.json`: 新版資料庫，包含教師課表、班級課表、課程格資料
- `teacher_course_stats.json`: 舊檔名相容副本，內容同 `schedule_database.json`

目前資料量：

- 75 位老師
- 27 個班級
- 1219 筆教師課表課程
- 973 筆班級課表課程

## 重建資料庫

```bash
/opt/homebrew/bin/python3 extract_schedule.py
```

抽取器會自動掃描 `*課表` 資料夾。例如未來新增 `115-1課表/`，裡面放教師課表與班級課表 PDF 後，重新執行上方指令即可產生 `databases/115-1.json` 並更新 `semesters.json`。

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
python3 server.py
```

開啟 `http://127.0.0.1:8765`。
