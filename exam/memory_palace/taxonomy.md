# Memory Palace 層級與標籤規則

## 層級

目前資料分成兩個主層級：

- `elementary`：高一物理（全），基礎物理範圍。對應概念層級標籤為 `foundation`。
- `advanced`：高二、高三選修物理 I-V，進階物理範圍。對應概念層級標籤為 `advanced`。

出題時的預設規則：

- 若考卷指定「高一」、「高一物理」、「基礎」、「物理（全）」、「Ch1-Ch6」，只查 `elementary`。
- 若考卷指定「選修物理」、「高二」、「高三」、「物理 I-V」，優先查 `advanced`；需要補前置觀念時才查 `elementary`。
- 若題目要求銜接、複習、素養或跨冊整合，才同時查兩個層級。

## 目前資料夾對應

Elementary：

- `elementary/global/`：高一基礎全域概念索引。
- `elementary/Ch1/` 到 `elementary/Ch6/`：高一各章入口與整理。
- `elementary/ocr/Ch2/` 到 `elementary/ocr/Ch6/`：高一講義 OCR 原始文字。

Advanced：

- `advanced/README.md`：選修物理入口。
- `advanced/global/`：選修物理 I-V 跨冊概念索引。
- `advanced/physics_1/` 到 `advanced/physics_5/`：選修各冊索引。
- `advanced/ocr/physics_1/` 到 `advanced/ocr/physics_5/`：選修 OCR 原始文字。
- `advanced/answer_reference/`：解答本參考，不混入概念主索引。

## 標籤格式

高一 chunk 建議 metadata：

```yaml
---
level: foundation
course: 高一物理
scope: Ch1-Ch6
tags:
  - mechanics
  - energy
exam_use:
  - high1
  - review
---
```

選修物理 chunk 建議 metadata：

```yaml
---
level: advanced
course: 選修物理 I
scope: 待填
depends_on:
  - foundation:mechanics
  - foundation:energy
tags:
  - mechanics
  - calculus_based
exam_use:
  - elective
  - high2_high3
---
```

## 建議標籤

共同主題標籤：

- `scientific_method`
- `units_dimensions`
- `measurement`
- `matter_atomic_structure`
- `interactions`
- `mechanics`
- `kinematics`
- `dynamics`
- `gravity`
- `energy`
- `thermal`
- `electricity_magnetism`
- `waves`
- `optics`
- `modern_physics`
- `quantum`
- `nuclear`

難度與課程標籤：

- `foundation_only`：高一即可處理，不需要選修知識。
- `advanced_extension`：高一觀念的進階延伸。
- `bridge_foundation_to_advanced`：適合做銜接題。
- `avoid_for_foundation_exam`：若出高一考卷，除非老師指定，否則不使用。

## 重複知識的處理規則

同一概念若在高一與選修物理都出現，不覆蓋原本高一內容，而是分層描述：

- 高一層：保留定性、基礎公式、典型判斷與常見迷思。
- 選修層：加入更深數學、推導、模型限制、向量或微積分處理。
- 兩者用 `depends_on` 或「銜接」段落連結，不合併成單一 chunk。

例：

- 高一的力學：`F = ma`、等加速度、功與能量。
- 選修的力學：向量形式、非等加速度、動量、轉動、簡諧運動或微積分推導。

## 出題查詢流程

高一考卷：

1. 查 `elementary/global/README.md`。
2. 查 `elementary/global/concept_map.md`。
3. 查相關 `elementary/global/chunks/`。
4. 需要來源時查 `elementary/global/source_map.md` 與 `elementary/ocr/`。

選修考卷：

1. 查 `advanced/global/README.md`。
2. 查 `advanced/global/concept_map.md`。
3. 查相關 `advanced/global/chunks/`。
4. 需要來源時查 `advanced/source_map.md` 與 `advanced/ocr/`。
5. 若需要前置概念，再回查 `elementary/global/` 的高一基礎。

