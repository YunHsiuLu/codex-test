# 選修物理 Memory Palace

此區用於高二、高三選修物理 I-V，定位為進階物理層級。

規則：

- 不把選修物理內容直接混入高一 `elementary/global/`。
- 選修內容可引用高一基礎概念，但要用 `depends_on` 或銜接段落標明。
- 若同一概念在高一與選修都出現，選修區只補進階深度，不改寫高一基礎版本。

優先入口：

- 跨冊索引：`global/README.md`
- 跨冊概念圖：`global/concept_map.md`
- 來源對照：`source_map.md`
- 出題設計矩陣：`global/question_design_matrix.md`

資料層：

- OCR 文字：`ocr/physics_1/` 到 `ocr/physics_5/`
- 渲染影像：`ppm/physics_1/` 到 `ppm/physics_5/`
- 每冊索引：`physics_1/index.md` 到 `physics_5/index.md`
- 答案參考：`answer_reference/index.md`

來源策略：

- 每章納入「課本」與「SUPER 教用」。
- 若該章沒有教用版，使用學用版補足。
- 解答本只作答案參考，不混入概念主索引。
