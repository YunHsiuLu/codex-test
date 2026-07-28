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
- 高二、選修物理 1、選修物理 2：使用 `memory_palace/advanced/physics_1/`、`memory_palace/advanced/physics_2/`，考卷資料夾放在 `高二範圍/`。
- 高三、選修物理 3、選修物理 4、選修物理 5：使用 `memory_palace/advanced/physics_3/`、`memory_palace/advanced/physics_4/`、`memory_palace/advanced/physics_5/`，考卷資料夾放在 `高三範圍/`。
- 未指定冊別但指定選修物理或分科測驗時，先查 `memory_palace/advanced/global/`，再依使用者指定範圍縮小到對應冊別與章節。
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
   - 相關 `memory_palace/advanced/physics_*/index.md` 與指定章節 `memory_palace/advanced/physics_*/Ch*/index.md`
   - 需要跨冊整合時，再查 `memory_palace/advanced/global/chunks/`
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
- 出段考或小考前，必須先確認年級與冊別範圍：高二只可使用選修物理 1、2 的指定章節；高三只可使用選修物理 3、4、5 的指定章節；高一不可使用 advanced 內容。
- 每次新增考卷後，要把本次出題使用到的知識點、題型策略、常見迷思選項與跨章連結，視需要整理回 `memory_palace` 對應層級中，使記憶宮殿隨著出卷逐步豐富。
- 若使用者看過考卷並修改 `main.tex`、答案、配分、題型、圖片需求或文字敘述，下一次處理該範圍時必須重新讀取修正後版本，並與原先版本比較。
- 讀取使用者修正時，重點不是只接受最後文字，而是要理解修正原因：包含物理概念更正、難度調整、措辭精準度、學生易誤解處、課內範圍邊界、LaTeX 排版習慣與教師個人出題風格。
- 確認修正原因後，將可重用的原則更新到 `memory_palace` 的對應資料夾。例如高一卷更新到 `memory_palace/elementary/`，選修卷更新到 `memory_palace/advanced/`；若是通用出題習慣，更新到該層級的 `global/question_design_matrix.md` 或另建 `teacher_feedback.md`。
- 不要把單一考題的全部文字無差別堆進記憶宮殿；應抽取可重用的概念、迷思、命題模式、修正規則與範圍邊界。

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
- 同一範圍若製作多份版本，`a` 卷與 `b` 卷預設為中等難度，目的為一般複習；`c` 卷預設為較難版本，目的為提供想要更進階練習的學生挑戰。
- 高一小考預設規則：基礎題 10 題，每題 7 分；進階題 4 題，每題 5 分；混合題共 10 分；總分 100 分。
- 一份考卷只能採用一種複選題制度，不可在同一份考卷中混用學測型與分科型複選題。
- 高一、基礎物理、物理（全）、Ch1-Ch6 的考卷，預設採學測型複選題：使用 `\mchoices`，題目會顯示「應選 x 項」，每錯一個選項扣該題分數的 2/5，扣至該題 0 分為止。
- 選修物理、高二、高三、分科測驗取向的考卷，預設採分科型複選題：使用 `\mchoicesblind`，不顯示「應選 x 項」，不倒扣，各選項獨立判定；五個選項平均配分，每個選項占該題分數的 1/5。
- 使用會顯示「應選 x 項」的 `\mchoices` 時，正確答案數只能是 2 項或 3 項；不可出現應選 1、4、5 項。若答案只有 1 項應改為單選題；若答案有 4 或 5 項，應調整選項使正確答案數變為 2 或 3。
- 採分科型考卷時，該份 `main.tex` 的複選題說明必須寫成「不提示應選幾項、不倒扣、每個選項占該題分數 1/5」，不可沿用學測型倒扣文字。
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
