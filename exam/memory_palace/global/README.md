# 翰林高一物理 Ch1-Ch6 Memory Palace

這個資料夾是高一物理（全）出題前優先查詢的「基礎全域記憶宮殿」。原始 OCR 文字保留在 `memory_palace/ocr/Ch2` 到 `memory_palace/ocr/Ch6`，Ch1 的人工整理保留在 `memory_palace/Ch1`。

層級標籤：

```yaml
level: foundation
course: 高一物理
scope: Ch1-Ch6
exam_use:
  - high1
  - foundation_review
```

使用順序：

1. 先讀 `concept_map.md`，確認章節之間的概念連線。
2. 依題目範圍讀 `chunks/` 中的概念區塊。
3. 需要追溯講義頁面時查 `source_map.md`，再回原始 OCR 或 PNG。
4. 出卷時可用 `question_design_matrix.md` 快速決定題型、迷思概念與跨章節整合題。

核心原則：

- 章節只是教材順序，不是物理概念邊界。
- Ch2 的原子、基本交互作用，是 Ch3 力學、Ch4 電磁、Ch5 能量、Ch6 量子現象的共同基底。
- Ch3 的力與運動、Ch5 的功與能量，是分析所有宏觀現象的工具。
- Ch4 的光與電磁波，和 Ch6 的光電效應、波粒二象性必須一起理解。
- Ch6 的能階、光子能量與原子光譜，連回 Ch2 原子結構與 Ch5 能量守恆。

目前資料來源：

- Ch1：已由人工整理建立概念 chunk。
- Ch2-Ch6：PNG 逐頁 OCR，並根據 OCR 與物理知識整理成全域 chunk。

未來若加入高二、高三選修物理 I-V，請放入 `memory_palace/advanced/`，不要直接混入本資料夾。本資料夾可作為選修內容的前置基礎與銜接來源。
