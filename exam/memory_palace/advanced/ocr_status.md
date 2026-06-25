# 選修物理 OCR 狀態

處理日期：2026-06-25

## 範圍

- 選修物理 I-V 主來源：每章「課本」與「SUPER 教用」。
- 選修物理 II Ch03 功與能量沒有教用版，使用「SUPER 學用」補足。
- 選修物理 V 解答本獨立放入 `answer_reference`。

## 統計

- PDF 來源數：43
- 總頁數：1850
- OCR 文字檔數：1850
- 渲染影像：已於 2026-06-25 刪除以節省空間。
- OCR 文字：`memory_palace/advanced/ocr/`
- 來源 manifest：`memory_palace/advanced/source_manifest.json`

## 特記事項

- `physics_2/Ch03_功與能量_super_student_fallback/page-000001` 為空白頁，OCR 文字為空屬正常狀況。
- PDF 有複製限制，無法用 `pdftotext` 直接抽文字，因此曾採用 PDF 渲染成 PPM 後 OCR。
- PPM 與 PNG 渲染圖片已刪除；目前保留 OCR 文字、索引與概念 chunk。若未來需要重新視覺回查，需從原始 PDF 重新渲染。
