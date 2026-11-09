# 調代課查詢系統交接

## 2026-11-06｜活動課程調課限制

- 共用調課判定加入「學校活動」及「班級活動」，教師或班級課表任一處標示這些活動，皆排除於同週、跨日期及三角調課的原時段和交換時段。可辨識名稱中插入空白的情況。
- 命令列調課查詢改用伺服器共用的限制判定，與網頁採用一致規則。
- 驗證通過 `.venv/bin/python -m unittest -v test_schedule` 的 17 項測試。新增案例檢查三角調課三個位置、教師及班級兩種資料來源、同週／跨日期的原時段與交換時段、伺服器登記拒絕和命令列候選排除。`git diff --check` 通過。
- 正式 `databases/115-1.json` 中 58 個教師活動課格和 58 個班級活動課格均有調課限制。這次以程式及既有 HTTP 測試驗證，瀏覽器操作尚未重測。
- 環境沿用 `.venv` 與 `requirements.txt`。接續使用時執行 `./start.sh`，開啟 `http://127.0.0.1:8765`。若有舊服務執行，先用 `./stop.sh` 關閉再啟動並重新整理網頁。

## 2026-11-05｜兩台 Mac 同步與充實課代課

- `adjustments.json.age` 是 Git 保存的加密紀錄，初次匯出包含本機既有的 5 筆異動。網頁仍從本機 `adjustments.json` 讀寫。明文檔與其暫存檔由 Git 忽略。解密金鑰位於 `git rev-parse --path-format=absolute --git-path class-search-adjustments.agekey` 顯示的位置，另行安全備份及移轉。
- `python3 sync_adjustments.py` 用 age 合併拉取的快照與本機歷史。紀錄按 ID 合併，撤銷狀態優先，兩台新登記占用同一老師同一時段時中止。同步需要手動執行。換電腦前先關服務、拉取、執行同步，有更新加密檔時提交並推送，再啟動服務。完整指令見 README 的「MacBook 與 Mac mini 同步調代課」。
- 充實課開放代課，並從同週、跨日期、三角調課及命令列調課候選排除。年級充實課格無授課名單時保留班級原課格，異動顯示在教師課表與公告。

### 驗證

- `.venv/bin/python -m unittest -q test_schedule` 通過 15 項。涵蓋充實課代課投影、同週及跨日期調課拒絕、三角調課候選排除。
- `node --test test_semester.cjs` 通過。正式 115-1 資料驗證了 31 個教師充實課時段及 28 個班級充實時段。瀏覽器確認物理充實課格可以選代課老師、顯示登記按鈕，切換調課時顯示限制。
- 初次加密快照解密後與 5 筆正式原檔逐位元相同。兩份本機測試 checkout 已驗證還原、兩台各自新增與撤銷後合併、衝突拒絕和錯誤金鑰保護。測試用異動只寫入暫存資料。

### 另一台 Mac 接續

1. 拉取 Git 更新。同步工具需要 Python 3、Git 和 age。另一台可用 `brew install age`。本機 Apple Silicon 備用執行檔在 `local_backups/age/`。
2. 從原電腦安全複製既有金鑰到該台 Git 管理資料夾中同名的位置。先關服務，再執行 `python3 sync_adjustments.py`。實體 Mac mini 的金鑰移轉、解密和網頁操作尚待確認。
3. 新環境先建立 `.venv` 並安裝 `requirements.txt`。基準課表須另行匯入，可將正式 PDF 放進 `115-1課表/`，執行 `./extract.sh --semester 115-1`。用 `./start.sh` 啟動後開啟 `http://127.0.0.1:8765`。
