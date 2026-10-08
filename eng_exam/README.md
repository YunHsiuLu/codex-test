# 高二英文命題系統

以現有 Unit 13、校內命題檢核表和大考中心詞彙表為材料，建立可累積的記憶宮殿，再由結構化試題產生學生卷與教師詳解。這是檔案式出題工作流程，目前沒有網站介面或自動評分平台。

## 目前成果

- `MEMORY_PALACE.md`：八站知識巡覽、２０詞的搭配與來源頁碼。
- `memory_palace/`：索引、層級、概念分塊、命題矩陣、來源文字及詞彙檢查。
- `exams/g11_midterm_v1.json`：３６題、答案、解析、考點、配分及評分規準的主資料。
- `output/pdf/g11_midterm_v1_student.pdf`：６頁學生試卷，１００分、７０分鐘。
- `output/pdf/g11_midterm_v1_teacher.pdf`：７頁教師詳解、配分藍圖、簡答／翻譯／作文規準。
- `output/tex/`：各自可獨立編譯的學生卷、教師詳解 LaTeX 原始檔。
- `output/markdown/`：方便全文檢索、比對和編輯內容的文字版。
- `output/validation.json`、`output/QA.md`：程式檢查和人工審查紀錄。
- `HANDOFF.md`：跨電腦續作、已知限制及啟動方式。

## 第一份試卷的範圍

| 題型 | 分數 |
|---|---|
| 詞彙與搭配 | ２０ |
| 綜合測驗 | １０ |
| 文意選填 | １０ |
| 閱讀測驗 | １６ |
| 混合題 | １４ |
| 中譯英 | １０ |
| 短文寫作 | ２０ |
| 合計 | １００ |

直接考查 Unit 13 的題目共３０分、１５個不同詞；未直接考的另外５詞也已建入知識庫。其他題目為高二綜合能力練習，不冒稱來自尚未提供的主課文。未包含聽力，也不是正式共同命題範圍已確認的段考。

## 修改及重建

先讀 `AGENTS.md`、`HANDOFF.md` 和 `memory_palace/README.md`，再修改試題。以 JSON 作為主資料，`scripts/build_exam.py` 共用同一份內容產生學生／教師兩種輸出，避免答案另抄而不同步。

若老師直接改了 `.tex` 或 Markdown，先保留並比對改稿，把內容修正整合回 JSON、排版修正整合回產生器，再重新建置；重建會覆寫 `output/tex/` 和 `output/markdown/` 同名檔案。不要在未整合教師修正前直接執行重建。

本機已有 XeLaTeX，可在專案根目錄執行：

```zsh
./build.sh
```

此指令會更新來源索引、產生 TeX／Markdown、各編譯兩遍、輸出 PDF，最後檢查分數、題號、詞數、字母分布、來源雜湊和 PDF 完整性。中間檔只留在已忽略的 `tmp/`。

單獨檢查現有產物：

```zsh
python3 scripts/verify_exam.py
```

在此電腦若系統 Python 缺套件，使用 Codex 已提供的 Python，或設定 `ENG_EXAM_PYTHON` 指向自己的環境。`build.sh` 會先找此次已確認的 bundled Python，其他電腦則回退 `python3`。

## 其他電腦需要什麼

閱讀既有 PDF 不需任何開發環境。重建需要 Python、`requirements.txt` 內套件，以及已備妥 `fontspec`、`xeCJK`、`geometry`、`enumitem`、`tabularx`、`array`、`fancyhdr`、`lastpage`、`needspace` 的 XeLaTeX。

繁體中文字型優先使用 Noto Serif CJK TC，其次 Songti TC。最後的 Fandol 備援並未涵蓋本卷所有繁體字；若落入該備援，檢查程式會因缺字而中止，不能直接交卷。不同字型可能改變分頁，須重新渲染檢查。

Windows 若沒有 zsh，可依序執行 Python 索引與產生器，再以 XeLaTeX 編譯 `output/tex/` 兩個檔案兩次，把同名 PDF 放進 `output/pdf/`，最後執行驗證。輸出目錄請指向專案內 `tmp/latex/`。

Codex 內建 LaTeX 編輯器已開啟學生卷，但本次內建編譯器無法存取 macOS 的 Songti 字型；交付 PDF 由現有本機 XeLaTeX 成功編譯並逐頁驗收。沒有安裝新的 TeX 套件或字型。

## 新增教材

１．保留原文件；記錄年級、教材版本、課次及來源。
２．將內容整理進對應概念分塊及來源索引，不必重做既有教材。
３．依本次教過的範圍建立新的命題藍圖，再設計原創題目。
４．確認每題唯一解、總分、評分規準與印刷版面；答案字母平衡不能凌駕有效度。
５．把教師改稿與施測資料寫入回饋紀錄，並更新交接。
