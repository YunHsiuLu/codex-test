# 高一物理段考考卷學習區

此資料夾用來存放高一物理三次段考考卷，以及解題後萃取出的出題風格、常考觀念與迷思選項。

## 資料夾

- `raw/`：使用者提供的原始考卷檔案，例如 PDF、圖片、Markdown、Word 匯出文字等。
- `solutions/`：逐題解題、答案核對、題目分類與必要的勘誤。
- `learned_chunks/`：從段考題中整理出的可重用記憶點，之後可併入 `../global/chunks/` 或 `../global/question_design_matrix.md`。

## 使用流程

1. 使用者把段考考卷放入 `raw/`，或直接在對話中上傳。
2. 先解題與對答案，產生對應 `solutions/` 檔案。
3. 依題目整理：
   - 考查章節與概念。
   - 題型與常見陷阱。
   - 迷思選項設計。
   - 和講義 memory palace 的對應位置。
4. 將有價值的出題知識整理到 `learned_chunks/`。
5. 若確認可長期使用，再更新 `../global/` 的概念 chunk 或出題矩陣。

## 原則

- 段考題的學習結果只放在 `elementary`，不混入 `advanced`。
- 若考卷有圖片題，先解讀題意；圖片本身不必重畫，必要時用文字描述圖形結構。
- 若使用者提供答案，必須先對照答案；若未提供答案，先自行解題並標記「待核對」。

## 已處理內容

- 第一次段考：`solutions/第一次段考題_完整版v2_solution.md`
- 第二次段考：`solutions/第二次段考題_solution.md`
- 第三次段考：`solutions/高一第三次114b_solution.md`
- 114-2 補考卷：`solutions/114-2補考卷0624_solution.md`
- 題庫型補充來源：`solutions/supplemental_question_sources.md`
- 段考出題風格與迷思整理：`learned_chunks/past_exam_patterns_114_115.md`

目前保留 OCR 文字於 `ocr/`，不保留渲染圖片中間檔。
