# 從 Beginner 接到 Advanced

這份檢查對應新版十三單元主線。完成作業不代表一定已理解，請先不用看答案解釋下列問題，再決定需要複習哪裡。

| 能力檢查 | Beginner 複習位置 | Advanced 深化 |
| --- | --- | --- |
| 從需求寫出正常、邊界與錯誤行為，區分前置條件與可恢復錯誤 | [５](../beginner/units/05.md)、[１０](../beginner/units/10.md) | 第１章函式契約、第１０章錯誤邊界 |
| 說明整數範圍、浮點誤差與容許的限制 | [２](../beginner/units/02.md)、[１１](../beginner/units/11.md) | 第２章表示法與數值演算法 |
| 追蹤迴圈的狀態、停止原因與搜尋操作數 | [４](../beginner/units/04.md)、[８](../beginner/units/08.md) | 第３章不變量、終止性與成本 |
| 比較move／Copy／clone及&／&mut，指出最後使用與衝突 | [７](../beginner/units/07.md) | 第４～６章資源、別名與生命週期 |
| 選擇struct／enum與修改方法，知道公開欄位的限制 | [９](../beginner/units/09.md) | 第７章不變量與模組邊界、第８章抽象化 |
| 用Vec、切片、HashMap完成更新、排序與分組 | [８](../beginner/units/08.md) | 第９章惰性迭代器與配置成本 |
| 能寫出抓到錯誤的測試，且不把待測結果當預期 | [１１](../beginner/units/11.md) | 所有章節的契約證據與限制 |
| 自己安排stdin／檔案、解析、計算、輸出與錯誤政策 | [１２](../beginner/units/12.md)與[兩份專案](../beginner/SYLLABUS.md) | 第１０章純核心／副作用、第１２章整合設計 |

詳細生命週期、trait設計與並行不需要在進入本課前已會；它們正是本課要建立的新模型。若仍只會重抄既有解法，先完成Beginner兩個專案的DESIGN.md與獨立案例，再回來深化。

操作保持在advanced資料夾：lesson看單元、run／test自動驗收、manual手動執行、hint／answer按需查看。原生Cargo測試另使用cargo test --example labNN。有限自動案例不能替代推理、成本與設計評量。
