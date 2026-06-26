# Exam Project Workflow

本資料夾是物理考題專案。任何在此資料夾內的出卷、命題、複習卷、題庫或講義整理工作，都必須優先使用 `memory_palace`，不要重新讀取 PDF 或重新渲染圖片，除非使用者明確要求或 OCR／記憶點不足以確認內容。

## Scope

- 只處理目前 `exam` 資料夾內的檔案。
- 忽略 `exam` 外層資料夾的 git 狀態或無關檔案變更。
- 不主動還原、移動或刪除使用者放入的講義 PDF。
- `exam` 內的講義 PDF 視為備份檔，不是唯一正式來源。
- 若需要回查原始講義 PDF，正式來源優先使用：
  - 高一物理：`/Users/lvyunxiu/Documents/SchoolDocuments/高中物理相關/高一物理`
  - 選修物理：`/Users/lvyunxiu/Documents/SchoolDocuments/高中物理相關/選修物理教材`
- 若執行環境無法直接讀取上述外部資料夾，先向使用者說明並請求授權，不要改用整批重新 OCR。

## Default Exam Workflow

出考卷前先判斷考卷範圍：

- 高一、基礎物理、物理（全）、Ch1-Ch6：使用 `memory_palace/elementary/global/`。
- 高二、高三、選修物理、選修物理 I-V：使用 `memory_palace/advanced/global/`。
- 銜接、複習、素養、跨冊整合：先查指定層級，再視需要查另一層級。

查詢順序：

1. 讀 `memory_palace/taxonomy.md` 確認層級規則。
2. 高一考卷讀：
   - `memory_palace/elementary/global/README.md`
   - `memory_palace/elementary/global/concept_map.md`
   - `memory_palace/elementary/global/question_design_matrix.md`
   - 相關 `memory_palace/elementary/global/chunks/`
3. 選修考卷讀：
   - `memory_palace/advanced/global/README.md`
   - `memory_palace/advanced/global/concept_map.md`
   - `memory_palace/advanced/global/question_design_matrix.md`
   - 相關 `memory_palace/advanced/global/chunks/`
4. 需要追溯講義來源時，查：
   - 高一：`memory_palace/elementary/global/source_map.md` 與 `memory_palace/elementary/ocr/`
   - 選修：`memory_palace/advanced/source_map.md` 與 `memory_palace/advanced/ocr/`
5. 只有在 OCR 內容明顯不足、題目需要圖表版面、或使用者要求核對原講義時，才回到原始 PDF。
6. 回查 PDF 時，優先使用 Scope 中列出的正式講義來源；`exam` 內 PDF 只是備份，可不存在。

## Memory Palace Rules

- `elementary` 與 `advanced` 不可混成同一份概念摘要。
- 高一題避免使用選修物理才有的進階推導，除非使用者要求銜接或延伸。
- 選修題可以回查高一基礎作為前置概念，但題目本體應以 advanced chunk 為主。
- 若同一知識在高一與選修重複，保留高一基礎說法，選修只作深化。
- 出題時優先使用 memory palace 的 chunk、concept map、question design matrix，再用 OCR 補細節。

## LaTeX Exam Workflow

- 考卷版型優先參考 `考卷template/`。
- 新考卷要另建資料夾，不直接修改 `考卷template/`。
- `考卷template/preamble.tex` 與 `考卷template/commands.tex` 是全專案共用設定檔；新考卷資料夾不要再複製一份 `preamble.tex` 或 `commands.tex`。
- 每份考卷的 `main.tex` 必須用相對路徑引用共用設定檔，例如位於 `高一範圍/<考卷資料夾>/main.tex` 時使用：
  - `\input{../../考卷template/preamble}`
  - `\input{../../考卷template/commands}`
- `commands.tex` 不放固定的 `\examheader`、`\scscore`、`\mcscore`；每份考卷都必須在自己的 `main.tex` 中用 `\newcommand{\examheader}{...}` 定義抬頭，再於本文呼叫 `\examheader`。
- 若該份考卷以單選、複選作為大題並使用自動計分，必須在該份 `main.tex` 載入 `commands.tex` 後，用 `\newcommand{\scscore}{...}` 與 `\newcommand{\mcscore}{...}` 宣告該卷的單選、複選每題配分。
- 小考若使用者沒有指定，預設不放「命題範圍」、「命題老師」、「科目代碼」、「注意事項」。
- 小考的 `\examheader` 設定為「章節與章節名稱 小考」，章節編號與章節名稱之間不加空格，「小考」前加一個空格，例如 `3-1對物體運動的描述 小考`。
- 高一小考預設規則：基礎題 10 題，每題 7 分；進階題 4 題，每題 5 分；混合題共 10 分；總分 100 分。
- 高一小考的基礎題與進階題可包含單選與多選。多選採倒扣制：每錯一個選項扣該題分數的 2/5，扣至該題 0 分為止。
- 若段考或使用者指定「複選題不提示應選幾項」，使用 `\mchoicesblind`；此類複選題不倒扣，各選項獨立判定，配分平均分配到每個選項。
- 高一小考的混合題可以是單選、多選或手寫解釋題；若使用者未指定，依範圍選擇最能檢查觀念的形式。
- 設計選擇題時，正確解答的 A、B、C、D、E 各選項數量應儘量平均分配；多選題以每個正確選項字母分別計入統計。
- 配分必須加總到使用者指定總分；若未指定，合理設定並在 final 說明。
- 使用者若要求選擇題，避免加入手寫或長篇計算題。
- 出考卷時文字優先產出。預設不要主動生成、繪製或依賴圖片；需要圖形時，以可由老師手動畫出的文字描述為主。
- 圖片題只有在使用者主動提供圖片，或明確要求製作／使用圖片時才加入；若使用者提供圖片，依圖片內容產生對應考題。
- 若考卷中有題目需要圖片，必須在該考卷資料夾中另外建立一個文字檔，列出需要自行繪製圖片的題號，以及每張圖應包含的物件、標示、座標軸、方向、數值與必要文字。
- 編譯考卷時，LaTeX 原始檔檔名可以維持 `main.tex`；輸出的 PDF 不要維持 `main.pdf`，必須依該考卷資料夾的範圍名稱命名，例如 `小考_第一次段考複習卷.pdf` 或 `段考_第三次段考4-5至6-4.pdf`。
- 編譯考卷後，清除 LaTeX 中間檔，只保留必要的 `main.tex`、依範圍命名的 PDF、圖片素材與必要說明檔。

## Rendering And OCR

- 目前 memory palace 已保留 OCR 文字與概念 chunk。
- 渲染圖片中間檔已刪除以節省空間。
- 不要為一般出題重新渲染 PDF。
- 若必須重新視覺確認，可從原始 PDF 重新渲染必要頁面，不要整批重做。

## Useful Entry Points

- Project memory palace：`memory_palace/README.md`
- Layer taxonomy：`memory_palace/taxonomy.md`
- 高一基礎：`memory_palace/elementary/global/README.md`
- 選修進階：`memory_palace/advanced/global/README.md`
- 高一 OCR：`memory_palace/elementary/ocr/`
- 選修 OCR：`memory_palace/advanced/ocr/`
