# Memory Palace 層級與標籤規則

## 層級

目前與未來資料分成兩個主層級：

- `foundation`：高一物理（全），基礎物理範圍。現有 `global/`、`Ch1/` 到 `Ch6/`、`ocr/Ch2` 到 `ocr/Ch6` 都屬於此層級。
- `advanced`：高二、高三選修物理 I-V，進階物理範圍。尚未匯入講義，已預留資料夾。

出題時的預設規則：

- 若考卷指定「高一」、「高一物理」、「基礎」、「Ch1-Ch6」，只查 `foundation` 資料。
- 若考卷指定「選修物理」、「高二」、「高三」、「物理 I-V」，優先查 `advanced` 資料；需要補前置觀念時才查 `foundation`。
- 若題目要求銜接、複習、素養或跨冊整合，才同時查兩個層級。

## 目前資料夾對應

Foundation：

- `global/`：高一基礎全域概念索引。
- `Ch1/` 到 `Ch6/`：高一各章入口與整理。
- `ocr/Ch2/` 到 `ocr/Ch6/`：高一講義 OCR 原始文字。

Advanced：

- `advanced/README.md`：選修物理預留入口。
- 未來建議結構：`advanced/physics_I/`、`advanced/physics_II/`、`advanced/physics_III/`、`advanced/physics_IV/`、`advanced/physics_V/`。
- 未來 OCR 建議結構：`advanced/ocr/physics_I/` 等。

## 標籤格式

每個新增 chunk 建議在檔案開頭加入 metadata：

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

選修物理範例：

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

1. 查 `global/README.md`。
2. 查 `global/concept_map.md`。
3. 查相關 `global/chunks/`。
4. 需要來源時查 `global/source_map.md` 與 `ocr/`。

選修考卷：

1. 查 `advanced/README.md`。
2. 查選修冊別索引。
3. 查進階 chunk。
4. 若需要前置概念，再回查 `global/` 的高一基礎。

