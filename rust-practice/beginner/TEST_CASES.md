# 自動驗收案例與完成條件

來源為 curriculum.json；由 scripts/build.py 重建，不改學生作答。每份實作至少十項具名驗收。函式測試與鍵盤輸入案例的意義不同；測試設計題則驗正確版與九個故障版。

函式題不要求 main 額外完成輸出；整合專案會檢查 stdout、stderr 和退出碼。通過程式驗收不代替設計報告與人工評量。

文字比對統一 CRLF／LF 並忽略末端換行，其他空白依契約；數值題容許絕對 1e-8 加相對 1e-9。

## 1-1：兩行自我介紹

作答：`examples/unit01_01.rs`。題目：[規格](exercises/1-1.md)。

本題固定輸出，以十項相關性質檢查同一次執行，並非十種不同輸入。
- **完整文字**：stdin `""`；參數 `[]`；stdout `"Hello, Rust!\n我正在學程式設計\n"`；stderr `""`；exit `0`。
- **第一行問候**：stdin `""`；參數 `[]`；stdout `"Hello, Rust!\n我正在學程式設計\n"`；stderr `""`；exit `0`。
- **第二行學習文字**：stdin `""`；參數 `[]`；stdout `"Hello, Rust!\n我正在學程式設計\n"`；stderr `""`；exit `0`。
- **恰好兩行**：stdin `""`；參數 `[]`；stdout `"Hello, Rust!\n我正在學程式設計\n"`；stderr `""`；exit `0`。
- **沒有空白行**：stdin `""`；參數 `[]`；stdout `"Hello, Rust!\n我正在學程式設計\n"`；stderr `""`；exit `0`。
- **行首無多餘空白**：stdin `""`；參數 `[]`；stdout `"Hello, Rust!\n我正在學程式設計\n"`；stderr `""`；exit `0`。
- **行尾無多餘空白**：stdin `""`；參數 `[]`；stdout `"Hello, Rust!\n我正在學程式設計\n"`；stderr `""`；exit `0`。
- **無控制字元**：stdin `""`；參數 `[]`；stdout `"Hello, Rust!\n我正在學程式設計\n"`；stderr `""`；exit `0`。
- **英文標點**：stdin `""`；參數 `[]`；stdout `"Hello, Rust!\n我正在學程式設計\n"`；stderr `""`；exit `0`。
- **中文內容與數量**：stdin `""`；參數 `[]`；stdout `"Hello, Rust!\n我正在學程式設計\n"`；stderr `""`；exit `0`。

## 2-1：攝氏換華氏

作答：`examples/unit02_01.rs`。題目：[規格](exercises/2-1.md)。

- **攝氏 -273.15**：stdin `"-273.15\n"`；參數 `[]`；stdout `"-459.66999999999996"`；stderr `""`；exit `0`。
- **攝氏 -40**：stdin `"-40\n"`；參數 `[]`；stdout `"-40.0"`；stderr `""`；exit `0`。
- **攝氏 -10**：stdin `"-10\n"`；參數 `[]`；stdout `"14.0"`；stderr `""`；exit `0`。
- **攝氏 0**：stdin `"0\n"`；參數 `[]`；stdout `"32.0"`；stderr `""`；exit `0`。
- **攝氏 1**：stdin `"1\n"`；參數 `[]`；stdout `"33.8"`；stderr `""`；exit `0`。
- **攝氏 12.5**：stdin `"12.5\n"`；參數 `[]`；stdout `"54.5"`；stderr `""`；exit `0`。
- **攝氏 25**：stdin `"25\n"`；參數 `[]`；stdout `"77.0"`；stderr `""`；exit `0`。
- **攝氏 37**：stdin `"37\n"`；參數 `[]`；stdout `"98.6"`；stderr `""`；exit `0`。
- **攝氏 50**：stdin `"50\n"`；參數 `[]`；stdout `"122.0"`；stderr `""`；exit `0`。
- **攝氏 100**：stdin `"100\n"`；參數 `[]`；stdout `"212.0"`；stderr `""`；exit `0`。

## 2-2：秒數拆成時分秒

作答：`examples/unit02_02.rs`。題目：[規格](exercises/2-2.md)。

- **0 秒**：stdin `"0\n"`；參數 `[]`；stdout `"0 0 0"`；stderr `""`；exit `0`。
- **1 秒**：stdin `"1\n"`；參數 `[]`；stdout `"0 0 1"`；stderr `""`；exit `0`。
- **59 秒**：stdin `"59\n"`；參數 `[]`；stdout `"0 0 59"`；stderr `""`；exit `0`。
- **60 秒**：stdin `"60\n"`；參數 `[]`；stdout `"0 1 0"`；stderr `""`；exit `0`。
- **61 秒**：stdin `"61\n"`；參數 `[]`；stdout `"0 1 1"`；stderr `""`；exit `0`。
- **3599 秒**：stdin `"3599\n"`；參數 `[]`；stdout `"0 59 59"`；stderr `""`；exit `0`。
- **3600 秒**：stdin `"3600\n"`；參數 `[]`；stdout `"1 0 0"`；stderr `""`；exit `0`。
- **3661 秒**：stdin `"3661\n"`；參數 `[]`；stdout `"1 1 1"`；stderr `""`；exit `0`。
- **86399 秒**：stdin `"86399\n"`；參數 `[]`；stdout `"23 59 59"`；stderr `""`；exit `0`。
- **100000 秒**：stdin `"100000\n"`；參數 `[]`；stdout `"27 46 40"`；stderr `""`；exit `0`。

## 2-3：加權成績

作答：`examples/unit02_03.rs`。題目：[規格](exercises/2-3.md)。

- **權重資料 1**：stdin `"0\n0\n0\n"`；參數 `[]`；stdout `"0.0"`；stderr `""`；exit `0`。
- **權重資料 2**：stdin `"100\n100\n100\n"`；參數 `[]`；stdout `"100.0"`；stderr `""`；exit `0`。
- **權重資料 3**：stdin `"60\n70\n80\n"`；參數 `[]`；stdout `"73.0"`；stderr `""`；exit `0`。
- **權重資料 4**：stdin `"100\n0\n0\n"`；參數 `[]`；stdout `"20.0"`；stderr `""`；exit `0`。
- **權重資料 5**：stdin `"0\n100\n0\n"`；參數 `[]`；stdout `"30.0"`；stderr `""`；exit `0`。
- **權重資料 6**：stdin `"0\n0\n100\n"`；參數 `[]`；stdout `"50.0"`；stderr `""`；exit `0`。
- **權重資料 7**：stdin `"59\n60\n61\n"`；參數 `[]`；stdout `"60.3"`；stderr `""`；exit `0`。
- **權重資料 8**：stdin `"90\n80\n70\n"`；參數 `[]`；stdout `"77.0"`；stderr `""`；exit `0`。
- **權重資料 9**：stdin `"12.5\n33.5\n77.5\n"`；參數 `[]`；stdout `"51.3"`；stderr `""`；exit `0`。
- **權重資料 10**：stdin `"80\n80\n20\n"`；參數 `[]`；stdout `"50.0"`；stderr `""`；exit `0`。

## 3-1：成績級距

作答：`examples/unit03_01.rs`。題目：[規格](exercises/3-1.md)。

- **級距邊界 0**：stdin `"0\n"`；參數 `[]`；stdout `"F"`；stderr `""`；exit `0`。
- **級距邊界 59**：stdin `"59\n"`；參數 `[]`；stdout `"F"`；stderr `""`；exit `0`。
- **級距邊界 60**：stdin `"60\n"`；參數 `[]`；stdout `"D"`；stderr `""`；exit `0`。
- **級距邊界 69**：stdin `"69\n"`；參數 `[]`；stdout `"D"`；stderr `""`；exit `0`。
- **級距邊界 70**：stdin `"70\n"`；參數 `[]`；stdout `"C"`；stderr `""`；exit `0`。
- **級距邊界 79**：stdin `"79\n"`；參數 `[]`；stdout `"C"`；stderr `""`；exit `0`。
- **級距邊界 80**：stdin `"80\n"`；參數 `[]`；stdout `"B"`；stderr `""`；exit `0`。
- **級距邊界 89**：stdin `"89\n"`；參數 `[]`；stdout `"B"`；stderr `""`；exit `0`。
- **級距邊界 90**：stdin `"90\n"`；參數 `[]`；stdout `"A"`；stderr `""`；exit `0`。
- **級距邊界 100**：stdin `"100\n"`；參數 `[]`；stdout `"A"`；stderr `""`；exit `0`。

## 3-2：閏年規則

作答：`examples/unit03_02.rs`。題目：[規格](exercises/3-2.md)。

- **年份 1600**：stdin `"1600\n"`；參數 `[]`；stdout `"yes"`；stderr `""`；exit `0`。
- **年份 1700**：stdin `"1700\n"`；參數 `[]`；stdout `"no"`；stderr `""`；exit `0`。
- **年份 1800**：stdin `"1800\n"`；參數 `[]`；stdout `"no"`；stderr `""`；exit `0`。
- **年份 1900**：stdin `"1900\n"`；參數 `[]`；stdout `"no"`；stderr `""`；exit `0`。
- **年份 1996**：stdin `"1996\n"`；參數 `[]`；stdout `"yes"`；stderr `""`；exit `0`。
- **年份 1999**：stdin `"1999\n"`；參數 `[]`；stdout `"no"`；stderr `""`；exit `0`。
- **年份 2000**：stdin `"2000\n"`；參數 `[]`；stdout `"yes"`；stderr `""`；exit `0`。
- **年份 2001**：stdin `"2001\n"`；參數 `[]`；stdout `"no"`；stderr `""`；exit `0`。
- **年份 2024**：stdin `"2024\n"`；參數 `[]`；stdout `"yes"`；stderr `""`；exit `0`。
- **年份 2100**：stdin `"2100\n"`；參數 `[]`；stdout `"no"`；stderr `""`；exit `0`。

## 3-3：三角形有效性

作答：`examples/unit03_03.rs`。題目：[規格](exercises/3-3.md)。

- **三邊 3,4,5**：stdin `"3\n4\n5\n"`；參數 `[]`；stdout `"valid"`；stderr `""`；exit `0`。
- **三邊 1,1,1**：stdin `"1\n1\n1\n"`；參數 `[]`；stdout `"valid"`；stderr `""`；exit `0`。
- **三邊 1,2,3**：stdin `"1\n2\n3\n"`；參數 `[]`；stdout `"invalid"`；stderr `""`；exit `0`。
- **三邊 0,2,2**：stdin `"0\n2\n2\n"`；參數 `[]`；stdout `"invalid"`；stderr `""`；exit `0`。
- **三邊 -1,2,2**：stdin `"-1\n2\n2\n"`；參數 `[]`；stdout `"invalid"`；stderr `""`；exit `0`。
- **三邊 10,2,3**：stdin `"10\n2\n3\n"`；參數 `[]`；stdout `"invalid"`；stderr `""`；exit `0`。
- **三邊 2,10,3**：stdin `"2\n10\n3\n"`；參數 `[]`；stdout `"invalid"`；stderr `""`；exit `0`。
- **三邊 2,3,10**：stdin `"2\n3\n10\n"`；參數 `[]`；stdout `"invalid"`；stderr `""`；exit `0`。
- **三邊 2,2,3**：stdin `"2\n2\n3\n"`；參數 `[]`；stdout `"valid"`；stderr `""`；exit `0`。
- **三邊 999999,999999,1000000**：stdin `"999999\n999999\n1000000\n"`；參數 `[]`；stdout `"valid"`；stderr `""`；exit `0`。

## 4-1：範圍累加與空範圍

作答：`examples/unit04_01.rs`。題目：[規格](exercises/4-1.md)。

- **上限 0**：stdin `"0\n"`；參數 `[]`；stdout `"0"`；stderr `""`；exit `0`。
- **上限 1**：stdin `"1\n"`；參數 `[]`；stdout `"1"`；stderr `""`；exit `0`。
- **上限 2**：stdin `"2\n"`；參數 `[]`；stdout `"3"`；stderr `""`；exit `0`。
- **上限 3**：stdin `"3\n"`；參數 `[]`；stdout `"6"`；stderr `""`；exit `0`。
- **上限 5**：stdin `"5\n"`；參數 `[]`；stdout `"15"`；stderr `""`；exit `0`。
- **上限 10**：stdin `"10\n"`；參數 `[]`；stdout `"55"`；stderr `""`；exit `0`。
- **上限 20**：stdin `"20\n"`；參數 `[]`；stdout `"210"`；stderr `""`；exit `0`。
- **上限 50**：stdin `"50\n"`；參數 `[]`；stdout `"1275"`；stderr `""`；exit `0`。
- **上限 100**：stdin `"100\n"`；參數 `[]`；stdout `"5050"`；stderr `""`；exit `0`。
- **上限 1000**：stdin `"1000\n"`；參數 `[]`；stdout `"500500"`；stderr `""`；exit `0`。

## 4-2：篩選與計數

作答：`examples/unit04_02.rs`。題目：[規格](exercises/4-2.md)。

- **篩選上限 0**：stdin `"0\n"`；參數 `[]`；stdout `"0"`；stderr `""`；exit `0`。
- **篩選上限 1**：stdin `"1\n"`；參數 `[]`；stdout `"0"`；stderr `""`；exit `0`。
- **篩選上限 3**：stdin `"3\n"`；參數 `[]`；stdout `"1"`；stderr `""`；exit `0`。
- **篩選上限 5**：stdin `"5\n"`；參數 `[]`；stdout `"1"`；stderr `""`；exit `0`。
- **篩選上限 9**：stdin `"9\n"`；參數 `[]`；stdout `"3"`；stderr `""`；exit `0`。
- **篩選上限 10**：stdin `"10\n"`；參數 `[]`；stdout `"3"`；stderr `""`；exit `0`。
- **篩選上限 15**：stdin `"15\n"`；參數 `[]`；stdout `"4"`；stderr `""`；exit `0`。
- **篩選上限 30**：stdin `"30\n"`；參數 `[]`；stdout `"8"`；stderr `""`；exit `0`。
- **篩選上限 50**：stdin `"50\n"`；參數 `[]`；stdout `"13"`；stderr `""`；exit `0`。
- **篩選上限 100**：stdin `"100\n"`；參數 `[]`；stdout `"27"`；stderr `""`；exit `0`。

## 4-3：while 與十進位位數

作答：`examples/unit04_03.rs`。題目：[規格](exercises/4-3.md)。

- **位數 0**：stdin `"0\n"`；參數 `[]`；stdout `"1"`；stderr `""`；exit `0`。
- **位數 1**：stdin `"1\n"`；參數 `[]`；stdout `"1"`；stderr `""`；exit `0`。
- **位數 9**：stdin `"9\n"`；參數 `[]`；stdout `"1"`；stderr `""`；exit `0`。
- **位數 10**：stdin `"10\n"`；參數 `[]`；stdout `"2"`；stderr `""`；exit `0`。
- **位數 99**：stdin `"99\n"`；參數 `[]`；stdout `"2"`；stderr `""`；exit `0`。
- **位數 100**：stdin `"100\n"`；參數 `[]`；stdout `"3"`；stderr `""`；exit `0`。
- **位數 101**：stdin `"101\n"`；參數 `[]`；stdout `"3"`；stderr `""`；exit `0`。
- **位數 9999**：stdin `"9999\n"`；參數 `[]`；stdout `"4"`；stderr `""`；exit `0`。
- **位數 10000**：stdin `"10000\n"`；參數 `[]`；stdout `"5"`；stderr `""`；exit `0`。
- **位數 1000000000**：stdin `"1000000000\n"`；參數 `[]`；stdout `"10"`；stderr `""`；exit `0`。

## 4-4：loop、更新狀態與 break

作答：`examples/unit04_04.rs`。題目：[規格](exercises/4-4.md)。

- **門檻 0**：stdin `"0\n"`；參數 `[]`；stdout `"1"`；stderr `""`；exit `0`。
- **門檻 1**：stdin `"1\n"`；參數 `[]`；stdout `"1"`；stderr `""`；exit `0`。
- **門檻 2**：stdin `"2\n"`；參數 `[]`；stdout `"2"`；stderr `""`；exit `0`。
- **門檻 3**：stdin `"3\n"`；參數 `[]`；stdout `"4"`；stderr `""`；exit `0`。
- **門檻 4**：stdin `"4\n"`；參數 `[]`；stdout `"4"`；stderr `""`；exit `0`。
- **門檻 5**：stdin `"5\n"`；參數 `[]`；stdout `"8"`；stderr `""`；exit `0`。
- **門檻 8**：stdin `"8\n"`；參數 `[]`；stdout `"8"`；stderr `""`；exit `0`。
- **門檻 9**：stdin `"9\n"`；參數 `[]`；stdout `"16"`；stderr `""`；exit `0`。
- **門檻 100**：stdin `"100\n"`；參數 `[]`；stdout `"128"`；stderr `""`；exit `0`。
- **門檻 1000000**：stdin `"1000000\n"`；參數 `[]`；stdout `"1048576"`；stderr `""`；exit `0`。

## 4-5：巢狀迴圈與輸出格式

作答：`examples/unit04_05.rs`。題目：[規格](exercises/4-5.md)。

- **表格 0x0**：stdin `"0\n"`；參數 `[]`；stdout `""`；stderr `""`；exit `0`。
- **表格 1x1**：stdin `"1\n"`；參數 `[]`；stdout `"1\n"`；stderr `""`；exit `0`。
- **表格 2x2**：stdin `"2\n"`；參數 `[]`；stdout `"1 2\n2 4\n"`；stderr `""`；exit `0`。
- **表格 3x3**：stdin `"3\n"`；參數 `[]`；stdout `"1 2 3\n2 4 6\n3 6 9\n"`；stderr `""`；exit `0`。
- **表格 4x4**：stdin `"4\n"`；參數 `[]`；stdout `"1 2 3 4\n2 4 6 8\n3 6 9 12\n4 8 12 16\n"`；stderr `""`；exit `0`。
- **表格 5x5**：stdin `"5\n"`；參數 `[]`；stdout `"1 2 3 4 5\n2 4 6 8 10\n3 6 9 12 15\n4 8 12 16 20\n5 10 15 20 25\n"`；stderr `""`；exit `0`。
- **表格 6x6**：stdin `"6\n"`；參數 `[]`；stdout `"1 2 3 4 5 6\n2 4 6 8 10 12\n3 6 9 12 15 18\n4 8 12 16 20 24\n5 10 15 20 25 30\n6 12 18 24 30 36\n"`；stderr `""`；exit `0`。
- **表格 7x7**：stdin `"7\n"`；參數 `[]`；stdout `"1 2 3 4 5 6 7\n2 4 6 8 10 12 14\n3 6 9 12 15 18 21\n4 8 12 16 20 24 28\n5 10 15 20 25 30 35\n6 12 18 24 30 36 42\n7 14 21 28 35 42 49\n"`；stderr `""`；exit `0`。
- **表格 8x8**：stdin `"8\n"`；參數 `[]`；stdout `"1 2 3 4 5 6 7 8\n2 4 6 8 10 12 14 16\n3 6 9 12 15 18 21 24\n4 8 12 16 20 24 28 32\n5 10 15 20 25 30 35 40\n6 12 18 24 30 36 42 48\n7 14 21 28 35 42 49 56\n8 16 24 32 40 48 56 64\n"`；stderr `""`；exit `0`。
- **表格 9x9**：stdin `"9\n"`；參數 `[]`；stdout `"1 2 3 4 5 6 7 8 9\n2 4 6 8 10 12 14 16 18\n3 6 9 12 15 18 21 24 27\n4 8 12 16 20 24 28 32 36\n5 10 15 20 25 30 35 40 45\n6 12 18 24 30 36 42 48 54\n7 14 21 28 35 42 49 56 63\n8 16 24 32 40 48 56 64 72\n9 18 27 36 45 54 63 72 81\n"`；stderr `""`；exit `0`。

## 5-1：設計布林函式

作答：`examples/unit05_01.rs`。題目：[規格](exercises/5-1.md)。

- `parity_1`：`assert_eq!(is_even(-100), true);`
- `parity_2`：`assert_eq!(is_even(-3), false);`
- `parity_3`：`assert_eq!(is_even(-2), true);`
- `parity_4`：`assert_eq!(is_even(-1), false);`
- `parity_5`：`assert_eq!(is_even(0), true);`
- `parity_6`：`assert_eq!(is_even(1), false);`
- `parity_7`：`assert_eq!(is_even(2), true);`
- `parity_8`：`assert_eq!(is_even(3), false);`
- `parity_9`：`assert_eq!(is_even(100), true);`
- `parity_10`：`assert_eq!(is_even(9223372036854775807), false);`

## 5-2：範圍限制與前置條件

作答：`examples/unit05_02.rs`。題目：[規格](exercises/5-2.md)。

- `clamp_1`：`assert_eq!(clamp(-1,0,10),0);`
- `clamp_2`：`assert_eq!(clamp(0,0,10),0);`
- `clamp_3`：`assert_eq!(clamp(5,0,10),5);`
- `clamp_4`：`assert_eq!(clamp(10,0,10),10);`
- `clamp_5`：`assert_eq!(clamp(11,0,10),10);`
- `clamp_6`：`assert_eq!(clamp(-20,-10,-5),-10);`
- `clamp_7`：`assert_eq!(clamp(-7,-10,-5),-7);`
- `clamp_8`：`assert_eq!(clamp(9,2,2),2);`
- `clamp_9`：`assert_eq!(clamp(0,2,2),2);`
- `clamp_10`：`assert!(std::panic::catch_unwind(|| clamp(3,5,4)).is_err());`

## 5-3：把問題拆成可重用函式

作答：`examples/unit05_03.rs`。題目：[規格](exercises/5-3.md)。

- `cost_1`：`assert_eq!(rectangle_area(0,5),0); assert_eq!(paint_cost(0,5,10),0);`
- `cost_2`：`assert_eq!(rectangle_area(5,0),0); assert_eq!(paint_cost(5,0,10),0);`
- `cost_3`：`assert_eq!(rectangle_area(1,1),1); assert_eq!(paint_cost(1,1,1),1);`
- `cost_4`：`assert_eq!(rectangle_area(2,3),6); assert_eq!(paint_cost(2,3,4),24);`
- `cost_5`：`assert_eq!(rectangle_area(3,2),6); assert_eq!(paint_cost(3,2,4),24);`
- `cost_6`：`assert_eq!(rectangle_area(10,20),200); assert_eq!(paint_cost(10,20,0),0);`
- `cost_7`：`assert_eq!(rectangle_area(10,20),200); assert_eq!(paint_cost(10,20,5),1000);`
- `cost_8`：`assert_eq!(rectangle_area(100,100),10000); assert_eq!(paint_cost(100,100,2),20000);`
- `cost_9`：`assert_eq!(rectangle_area(7,9),63); assert_eq!(paint_cost(7,9,13),819);`
- `cost_10`：`assert_eq!(rectangle_area(1000000,1000000),1000000000000); assert_eq!(paint_cost(1000000,1000000,1000000),1000000000000000000);`

## 6-1：從標準輸入取得文字

作答：`examples/unit06_01.rs`。題目：[規格](exercises/6-1.md)。

- **姓名案例 1**：stdin `"Amy\n"`；參數 `[]`；stdout `"Hello, Amy!"`；stderr `""`；exit `0`。
- **姓名案例 2**：stdin `"  Amy  \n"`；參數 `[]`；stdout `"Hello, Amy!"`；stderr `""`；exit `0`。
- **姓名案例 3**：stdin `"昀修\n"`；參數 `[]`；stdout `"Hello, 昀修!"`；stderr `""`；exit `0`。
- **姓名案例 4**：stdin `"\n"`；參數 `[]`；stdout `"empty"`；stderr `""`；exit `0`。
- **姓名案例 5**：stdin `" \t\n"`；參數 `[]`；stdout `"empty"`；stderr `""`；exit `0`。
- **姓名案例 6**：stdin `""`；參數 `[]`；stdout `"empty"`；stderr `""`；exit `0`。
- **姓名案例 7**：stdin `"Rust learner\n"`；參數 `[]`；stdout `"Hello, Rust learner!"`；stderr `""`；exit `0`。
- **姓名案例 8**：stdin `"A\r\n"`；參數 `[]`；stdout `"Hello, A!"`；stderr `""`；exit `0`。
- **姓名案例 9**：stdin `"42"`；參數 `[]`；stdout `"Hello, 42!"`；stderr `""`；exit `0`。
- **姓名案例 10**：stdin `"é\n"`；參數 `[]`；stdout `"Hello, é!"`；stderr `""`；exit `0`。

## 6-2：重試、quit 與 EOF

作答：`examples/unit06_02.rs`。題目：[規格](exercises/6-2.md)。

- **重試序列 1**：stdin `"1\n"`；參數 `[]`；stdout `"ok: 1"`；stderr `""`；exit `0`。
- **重試序列 2**：stdin `" 42 \n"`；參數 `[]`；stdout `"ok: 42"`；stderr `""`；exit `0`。
- **重試序列 3**：stdin `"0\n7\n"`；參數 `[]`；stdout `"retry\nok: 7"`；stderr `""`；exit `0`。
- **重試序列 4**：stdin `"-2\n3\n"`；參數 `[]`；stdout `"retry\nok: 3"`；stderr `""`；exit `0`。
- **重試序列 5**：stdin `"abc\n5\n"`；參數 `[]`；stdout `"retry\nok: 5"`；stderr `""`；exit `0`。
- **重試序列 6**：stdin `"\n9\n"`；參數 `[]`；stdout `"retry\nok: 9"`；stderr `""`；exit `0`。
- **重試序列 7**：stdin `"quit\n"`；參數 `[]`；stdout `"bye"`；stderr `""`；exit `0`。
- **重試序列 8**：stdin `""`；參數 `[]`；stdout `"bye"`；stderr `""`；exit `0`。
- **重試序列 9**：stdin `"bad\n"`；參數 `[]`；stdout `"retry\nbye"`；stderr `""`；exit `0`。
- **重試序列 10**：stdin `"1e2\n0\nquit\n"`；參數 `[]`；stdout `"retry\nretry\nbye"`；stderr `""`；exit `0`。
- **重試序列 11**：stdin `"2\r\n"`；參數 `[]`；stdout `"ok: 2"`；stderr `""`；exit `0`。
- **重試序列 12**：stdin `"9223372036854775808\n1\n"`；參數 `[]`；stdout `"retry\nok: 1"`；stderr `""`；exit `0`。

## 6-3：一行多個數值

作答：`examples/unit06_03.rs`。題目：[規格](exercises/6-3.md)。

- **多值案例 1**：stdin `"1 2 3\n"`；參數 `[]`；stdout `"sum: 6"`；stderr `""`；exit `0`。
- **多值案例 2**：stdin `"-1 1\n"`；參數 `[]`；stdout `"sum: 0"`；stderr `""`；exit `0`。
- **多值案例 3**：stdin `"0\n"`；參數 `[]`；stdout `"sum: 0"`；stderr `""`；exit `0`。
- **多值案例 4**：stdin `"  2\t3  \n"`；參數 `[]`；stdout `"sum: 5"`；stderr `""`；exit `0`。
- **多值案例 5**：stdin `"\n"`；參數 `[]`；stdout `"empty"`；stderr `""`；exit `0`。
- **多值案例 6**：stdin `""`；參數 `[]`；stdout `"empty"`；stderr `""`；exit `0`。
- **多值案例 7**：stdin `"1 x 3\n"`；參數 `[]`；stdout `"invalid"`；stderr `""`；exit `0`。
- **多值案例 8**：stdin `"1.5 2\n"`；參數 `[]`；stdout `"invalid"`；stderr `""`；exit `0`。
- **多值案例 9**：stdin `"1000000 -1000000 8\n"`；參數 `[]`；stdout `"sum: 8"`；stderr `""`；exit `0`。
- **多值案例 10**：stdin `"+2 -3\r\n"`；參數 `[]`；stdout `"sum: -1"`；stderr `""`；exit `0`。
- **多值案例 11**：stdin `"7 8 9 10\n"`；參數 `[]`；stdout `"sum: 34"`；stderr `""`；exit `0`。

## 6-4：多行資料到 EOF

作答：`examples/unit06_04.rs`。題目：[規格](exercises/6-4.md)。

- **多行資料 1**：stdin `""`；參數 `[]`；stdout `"count: 0\nsum: 0"`；stderr `""`；exit `0`。
- **多行資料 2**：stdin `"1\n"`；參數 `[]`；stdout `"count: 1\nsum: 1"`；stderr `""`；exit `0`。
- **多行資料 3**：stdin `"1\n2\n3\n"`；參數 `[]`；stdout `"count: 3\nsum: 6"`；stderr `""`；exit `0`。
- **多行資料 4**：stdin `"\n \n"`；參數 `[]`；stdout `"count: 0\nsum: 0"`；stderr `""`；exit `0`。
- **多行資料 5**：stdin `"-1\n1\n"`；參數 `[]`；stdout `"count: 2\nsum: 0"`；stderr `""`；exit `0`。
- **多行資料 6**：stdin `"x\n5\n"`；參數 `[]`；stdout `"invalid\ncount: 1\nsum: 5"`；stderr `""`；exit `0`。
- **多行資料 7**：stdin `"1 2\n3\n"`；參數 `[]`；stdout `"invalid\ncount: 1\nsum: 3"`；stderr `""`；exit `0`。
- **多行資料 8**：stdin `"4\r\n5\r\n"`；參數 `[]`；stdout `"count: 2\nsum: 9"`；stderr `""`；exit `0`。
- **多行資料 9**：stdin `"1\nx\n2\ny\n"`；參數 `[]`；stdout `"invalid\ninvalid\ncount: 2\nsum: 3"`；stderr `""`；exit `0`。
- **多行資料 10**：stdin `"1000000\n-1000000"`；參數 `[]`；stdout `"count: 2\nsum: 0"`；stderr `""`；exit `0`。

## 7-1：只讀借用與文字單位

作答：`examples/unit07_01.rs`。題目：[規格](exercises/7-1.md)。

- `scalar_1`：`let text=String::from(""); assert_eq!(scalar_count(&text),0); assert_eq!(text,"");`
- `scalar_2`：`let text=String::from("Rust"); assert_eq!(scalar_count(&text),4); assert_eq!(text,"Rust");`
- `scalar_3`：`let text=String::from("物理"); assert_eq!(scalar_count(&text),2); assert_eq!(text,"物理");`
- `scalar_4`：`let text=String::from("a b"); assert_eq!(scalar_count(&text),3); assert_eq!(text,"a b");`
- `scalar_5`：`let text=String::from("12345"); assert_eq!(scalar_count(&text),5); assert_eq!(text,"12345");`
- `scalar_6`：`let text=String::from("\n"); assert_eq!(scalar_count(&text),1); assert_eq!(text,"\n");`
- `scalar_7`：`let text=String::from("🦀"); assert_eq!(scalar_count(&text),1); assert_eq!(text,"🦀");`
- `scalar_8`：`let text=String::from("é"); assert_eq!(scalar_count(&text),2); assert_eq!(text,"é");`
- `scalar_9`：`let text=String::from("Rust物理"); assert_eq!(scalar_count(&text),6); assert_eq!(text,"Rust物理");`
- `scalar_10`：`let text=String::from("é"); assert_eq!(scalar_count(&text),1); assert_eq!(text,"é");`

## 7-2：透過可變借用更新資料

作答：`examples/unit07_02.rs`。題目：[規格](exercises/7-2.md)。

- `bonus_1`：`let mut score=0;add_bonus(&mut score,0);assert_eq!(score,0);`
- `bonus_2`：`let mut score=0;add_bonus(&mut score,10);assert_eq!(score,10);`
- `bonus_3`：`let mut score=100;add_bonus(&mut score,0);assert_eq!(score,100);`
- `bonus_4`：`let mut score=100;add_bonus(&mut score,1);assert_eq!(score,100);`
- `bonus_5`：`let mut score=50;add_bonus(&mut score,20);assert_eq!(score,70);`
- `bonus_6`：`let mut score=50;add_bonus(&mut score,-20);assert_eq!(score,30);`
- `bonus_7`：`let mut score=10;add_bonus(&mut score,-100);assert_eq!(score,0);`
- `bonus_8`：`let mut score=90;add_bonus(&mut score,100);assert_eq!(score,100);`
- `bonus_9`：`let mut score=0;add_bonus(&mut score,-1);assert_eq!(score,0);`
- `bonus_10`：`let mut score=100;add_bonus(&mut score,-100);assert_eq!(score,0);`

## 7-3：文字清理與建立新字串

作答：`examples/unit07_03.rs`。題目：[規格](exercises/7-3.md)。

- `spaces_1`：`assert_eq!(normalize_spaces(""),"");`
- `spaces_2`：`assert_eq!(normalize_spaces(" "),"");`
- `spaces_3`：`assert_eq!(normalize_spaces("Rust"),"Rust");`
- `spaces_4`：`assert_eq!(normalize_spaces("  Rust  "),"Rust");`
- `spaces_5`：`assert_eq!(normalize_spaces("a  b"),"a b");`
- `spaces_6`：`assert_eq!(normalize_spaces("a\tb\nc"),"a b c");`
- `spaces_7`：`assert_eq!(normalize_spaces("物理  課程"),"物理 課程");`
- `spaces_8`：`assert_eq!(normalize_spaces(" a　b "),"a b");`
- `spaces_9`：`assert_eq!(normalize_spaces("one two three"),"one two three");`
- `spaces_10`：`assert_eq!(normalize_spaces("\n\t"),"");`

## 8-1：線性搜尋與沒有答案

作答：`examples/unit08_01.rs`。題目：[規格](exercises/8-1.md)。

- `find_1`：`assert_eq!(first_index(&[],1),None);`
- `find_2`：`assert_eq!(first_index(&[1],1),Some(0));`
- `find_3`：`assert_eq!(first_index(&[1],0),None);`
- `find_4`：`assert_eq!(first_index(&[2, 1, 2],2),Some(0));`
- `find_5`：`assert_eq!(first_index(&[2, 1, 2],1),Some(1));`
- `find_6`：`assert_eq!(first_index(&[1, 2, 3],3),Some(2));`
- `find_7`：`assert_eq!(first_index(&[-3, 0, 3],-3),Some(0));`
- `find_8`：`assert_eq!(first_index(&[0, 0],0),Some(0));`
- `find_9`：`assert_eq!(first_index(&[1, 2, 3],9),None);`
- `find_10`：`assert_eq!(first_index(&[9, 8, 7, 6],7),Some(2));`

## 8-2：移除集合中的指定值

作答：`examples/unit08_02.rs`。題目：[規格](exercises/8-2.md)。

- `remove_1`：`let mut values=vec![];assert_eq!(remove_value(&mut values,0),0);assert_eq!(values,vec![]);`
- `remove_2`：`let mut values=vec![1];assert_eq!(remove_value(&mut values,1),1);assert_eq!(values,vec![]);`
- `remove_3`：`let mut values=vec![1];assert_eq!(remove_value(&mut values,2),0);assert_eq!(values,vec![1]);`
- `remove_4`：`let mut values=vec![2, 2, 2];assert_eq!(remove_value(&mut values,2),3);assert_eq!(values,vec![]);`
- `remove_5`：`let mut values=vec![1, 2, 1, 3];assert_eq!(remove_value(&mut values,1),2);assert_eq!(values,vec![2, 3]);`
- `remove_6`：`let mut values=vec![1, 2, 3];assert_eq!(remove_value(&mut values,2),1);assert_eq!(values,vec![1, 3]);`
- `remove_7`：`let mut values=vec![0, -1, 0];assert_eq!(remove_value(&mut values,0),2);assert_eq!(values,vec![-1]);`
- `remove_8`：`let mut values=vec![1, 2, 3];assert_eq!(remove_value(&mut values,9),0);assert_eq!(values,vec![1, 2, 3]);`
- `remove_9`：`let mut values=vec![5, 5, 1, 5];assert_eq!(remove_value(&mut values,5),3);assert_eq!(values,vec![1]);`
- `remove_10`：`let mut values=vec![1, 1, 2, 2];assert_eq!(remove_value(&mut values,2),2);assert_eq!(values,vec![1, 1]);`

## 8-3：集合統計與平均值

作答：`examples/unit08_03.rs`。題目：[規格](exercises/8-3.md)。

- `average_1`：`assert_eq!(average(&[]),None);`
- `average_2`：`let actual=average(&[0]).expect("非空應有平均");assert!(actual.is_finite());assert!((actual-(0.0_f64)).abs()<1e-9);`
- `average_3`：`let actual=average(&[60, 80, 100]).expect("非空應有平均");assert!(actual.is_finite());assert!((actual-(80.0_f64)).abs()<1e-9);`
- `average_4`：`let actual=average(&[60, 61]).expect("非空應有平均");assert!(actual.is_finite());assert!((actual-(60.5_f64)).abs()<1e-9);`
- `average_5`：`let actual=average(&[-1, 1]).expect("非空應有平均");assert!(actual.is_finite());assert!((actual-(0.0_f64)).abs()<1e-9);`
- `average_6`：`let actual=average(&[-3, -2]).expect("非空應有平均");assert!(actual.is_finite());assert!((actual-(-2.5_f64)).abs()<1e-9);`
- `average_7`：`let actual=average(&[1000000, -1000000]).expect("非空應有平均");assert!(actual.is_finite());assert!((actual-(0.0_f64)).abs()<1e-9);`
- `average_8`：`let actual=average(&[1, 2, 3, 4]).expect("非空應有平均");assert!(actual.is_finite());assert!((actual-(2.5_f64)).abs()<1e-9);`
- `average_9`：`let actual=average(&[100, 0, 0]).expect("非空應有平均");assert!(actual.is_finite());assert!((actual-(33.333333333333336_f64)).abs()<1e-9);`
- `average_10`：`let actual=average(&[7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7]).expect("非空應有平均");assert!(actual.is_finite());assert!((actual-(7.0_f64)).abs()<1e-9);`

## 8-4：排序、去重與來源不變

作答：`examples/unit08_04.rs`。題目：[規格](exercises/8-4.md)。

- `sort_1`：`let input=vec![];assert_eq!(sorted_unique(&input),vec![]);assert_eq!(input,vec![]);`
- `sort_2`：`let input=vec![1];assert_eq!(sorted_unique(&input),vec![1]);assert_eq!(input,vec![1]);`
- `sort_3`：`let input=vec![2, 1];assert_eq!(sorted_unique(&input),vec![1, 2]);assert_eq!(input,vec![2, 1]);`
- `sort_4`：`let input=vec![1, 1];assert_eq!(sorted_unique(&input),vec![1]);assert_eq!(input,vec![1, 1]);`
- `sort_5`：`let input=vec![3, 1, 2, 1];assert_eq!(sorted_unique(&input),vec![1, 2, 3]);assert_eq!(input,vec![3, 1, 2, 1]);`
- `sort_6`：`let input=vec![-2, 0, -2, 3];assert_eq!(sorted_unique(&input),vec![-2, 0, 3]);assert_eq!(input,vec![-2, 0, -2, 3]);`
- `sort_7`：`let input=vec![5, 4, 3, 2, 1];assert_eq!(sorted_unique(&input),vec![1, 2, 3, 4, 5]);assert_eq!(input,vec![5, 4, 3, 2, 1]);`
- `sort_8`：`let input=vec![0, 0, 0];assert_eq!(sorted_unique(&input),vec![0]);assert_eq!(input,vec![0, 0, 0]);`
- `sort_9`：`let input=vec![9, -9, 9, -9];assert_eq!(sorted_unique(&input),vec![-9, 9]);assert_eq!(input,vec![9, -9, 9, -9]);`
- `sort_10`：`let input=vec![9223372036854775807, -9223372036854775808, 0];assert_eq!(sorted_unique(&input),vec![-9223372036854775808, 0, 9223372036854775807]);assert_eq!(input,vec![9223372036854775807, -9223372036854775808, 0]);`

## 8-5：單字頻率與對應表

作答：`examples/unit08_05.rs`。題目：[規格](exercises/8-5.md)。

- `words_1`：`let expected: HashMap<String,usize> = [].into_iter().collect();assert_eq!(word_counts(""),expected);`
- `words_2`：`let expected: HashMap<String,usize> = [(String::from("one"),1_usize)].into_iter().collect();assert_eq!(word_counts("one"),expected);`
- `words_3`：`let expected: HashMap<String,usize> = [(String::from("one"),2_usize)].into_iter().collect();assert_eq!(word_counts("one one"),expected);`
- `words_4`：`let expected: HashMap<String,usize> = [(String::from("a"),2_usize), (String::from("b"),1_usize)].into_iter().collect();assert_eq!(word_counts("a b a"),expected);`
- `words_5`：`let expected: HashMap<String,usize> = [(String::from("A"),2_usize), (String::from("a"),1_usize)].into_iter().collect();assert_eq!(word_counts("A a A"),expected);`
- `words_6`：`let expected: HashMap<String,usize> = [(String::from("物理"),2_usize), (String::from("Rust"),1_usize)].into_iter().collect();assert_eq!(word_counts("物理 物理 Rust"),expected);`
- `words_7`：`let expected: HashMap<String,usize> = [(String::from("a"),2_usize), (String::from("b"),1_usize)].into_iter().collect();assert_eq!(word_counts("a\tb\na"),expected);`
- `words_8`：`let expected: HashMap<String,usize> = [(String::from("word,"),1_usize), (String::from("word"),1_usize)].into_iter().collect();assert_eq!(word_counts("word, word"),expected);`
- `words_9`：`let expected: HashMap<String,usize> = [(String::from("x"),1_usize), (String::from("y"),1_usize), (String::from("z"),1_usize)].into_iter().collect();assert_eq!(word_counts("x y z"),expected);`
- `words_10`：`let expected: HashMap<String,usize> = [(String::from("a"),2_usize), (String::from("b"),1_usize)].into_iter().collect();assert_eq!(word_counts("  a　b a "),expected);`

## 9-1：帳戶狀態與修改方法

作答：`examples/unit09_01.rs`。題目：[規格](exercises/9-1.md)。

- `new_zero`：`assert_eq!(Account::new(0).balance,0);`
- `new_balance`：`assert_eq!(Account::new(100).balance,100);`
- `deposit`：`let mut a=Account::new(10);assert!(a.deposit(5));assert_eq!(a.balance,15);`
- `deposit_zero`：`let mut a=Account::new(10);assert!(!a.deposit(0));assert_eq!(a.balance,10);`
- `deposit_negative`：`let mut a=Account::new(10);assert!(!a.deposit(-1));assert_eq!(a.balance,10);`
- `withdraw`：`let mut a=Account::new(10);assert!(a.withdraw(3));assert_eq!(a.balance,7);`
- `withdraw_all`：`let mut a=Account::new(10);assert!(a.withdraw(10));assert_eq!(a.balance,0);`
- `insufficient`：`let mut a=Account::new(10);assert!(!a.withdraw(11));assert_eq!(a.balance,10);`
- `invalid_withdraw`：`let mut a=Account::new(10);assert!(!a.withdraw(0));assert!(!a.withdraw(-1));assert_eq!(a.balance,10);`
- `sequence`：`let mut a=Account::new(0);assert!(a.deposit(50));assert!(a.withdraw(20));assert!(!a.withdraw(40));assert_eq!(a.balance,30);`
- `reject_initial`：`assert!(std::panic::catch_unwind(|| Account::new(-1)).is_err());`

## 9-2：用 enum 表達指令

作答：`examples/unit09_02.rs`。題目：[規格](exercises/9-2.md)。

- `action_1`：`assert_eq!(apply(0,Action::Add(3)),3);`
- `action_2`：`assert_eq!(apply(5,Action::Add(-2)),3);`
- `action_3`：`assert_eq!(apply(-5,Action::Add(2)),-3);`
- `action_4`：`assert_eq!(apply(0,Action::Multiply(8)),0);`
- `action_5`：`assert_eq!(apply(5,Action::Multiply(0)),0);`
- `action_6`：`assert_eq!(apply(-3,Action::Multiply(-2)),6);`
- `action_7`：`assert_eq!(apply(7,Action::Reset),0);`
- `action_8`：`assert_eq!(apply(-7,Action::Reset),0);`
- `action_9`：`assert_eq!(apply(1000,Action::Multiply(1000)),1000000);`
- `action_10`：`assert_eq!(apply(-1000,Action::Add(-1000)),-2000);`

## 9-3：一筆學生資料的查詢與更新

作答：`examples/unit09_03.rs`。題目：[規格](exercises/9-3.md)。

- `student_1`：`let mut s=Student{name:String::from("A"),scores:vec![]};assert_eq!(s.add_score(0),true);assert_eq!(s.scores,vec![0]);assert!((s.average().unwrap()-(0.0_f64)).abs()<1e-9);assert_eq!(s.name,"A");`
- `student_2`：`let mut s=Student{name:String::from("A"),scores:vec![]};assert_eq!(s.add_score(100),true);assert_eq!(s.scores,vec![100]);assert!((s.average().unwrap()-(100.0_f64)).abs()<1e-9);assert_eq!(s.name,"A");`
- `student_3`：`let mut s=Student{name:String::from("A"),scores:vec![]};assert_eq!(s.add_score(50),true);assert_eq!(s.scores,vec![50]);assert!((s.average().unwrap()-(50.0_f64)).abs()<1e-9);assert_eq!(s.name,"A");`
- `student_4`：`let mut s=Student{name:String::from("A"),scores:vec![60]};assert_eq!(s.add_score(80),true);assert_eq!(s.scores,vec![60, 80]);assert!((s.average().unwrap()-(70.0_f64)).abs()<1e-9);assert_eq!(s.name,"A");`
- `student_5`：`let mut s=Student{name:String::from("A"),scores:vec![0, 100]};assert_eq!(s.add_score(50),true);assert_eq!(s.scores,vec![0, 100, 50]);assert!((s.average().unwrap()-(50.0_f64)).abs()<1e-9);assert_eq!(s.name,"A");`
- `student_6`：`let mut s=Student{name:String::from("A"),scores:vec![60, 61]};assert_eq!(s.add_score(70),true);assert_eq!(s.scores,vec![60, 61, 70]);assert!((s.average().unwrap()-(63.666666666666664_f64)).abs()<1e-9);assert_eq!(s.name,"A");`
- `student_7`：`let mut s=Student{name:String::from("A"),scores:vec![80]};assert_eq!(s.add_score(-1),false);assert_eq!(s.scores,vec![80]);assert!((s.average().unwrap()-(80.0_f64)).abs()<1e-9);assert_eq!(s.name,"A");`
- `student_8`：`let mut s=Student{name:String::from("A"),scores:vec![80]};assert_eq!(s.add_score(101),false);assert_eq!(s.scores,vec![80]);assert!((s.average().unwrap()-(80.0_f64)).abs()<1e-9);assert_eq!(s.name,"A");`
- `student_9`：`let mut s=Student{name:String::from("A"),scores:vec![]};assert_eq!(s.add_score(999),false);assert_eq!(s.scores,vec![]);assert_eq!(s.average(),None);assert_eq!(s.name,"A");`
- `student_10`：`let mut s=Student{name:String::from("A"),scores:vec![1, 2, 3]};assert_eq!(s.add_score(4),true);assert_eq!(s.scores,vec![1, 2, 3, 4]);assert!((s.average().unwrap()-(2.5_f64)).abs()<1e-9);assert_eq!(s.name,"A");`
- `empty_average`：`let s=Student{name:String::from("A"),scores:vec![]};assert_eq!(s.average(),None);`

## 10-1：可恢復的解析錯誤

作答：`examples/unit10_01.rs`。題目：[規格](exercises/10-1.md)。

- `positive_1`：`let actual=parse_positive("1").expect("應成功");assert!(actual.is_finite() && actual>0.0);assert!((actual-(1.0_f64)).abs()<=f64::EPSILON*(1.0_f64).abs().max(f64::MIN_POSITIVE));`
- `positive_2`：`let actual=parse_positive(" 2.5 ").expect("應成功");assert!(actual.is_finite() && actual>0.0);assert!((actual-(2.5_f64)).abs()<=f64::EPSILON*(2.5_f64).abs().max(f64::MIN_POSITIVE));`
- `positive_3`：`assert!(parse_positive("0").is_err());`
- `positive_4`：`assert!(parse_positive("-1").is_err());`
- `positive_5`：`assert!(parse_positive("abc").is_err());`
- `positive_6`：`assert!(parse_positive("").is_err());`
- `positive_7`：`assert!(parse_positive("NaN").is_err());`
- `positive_8`：`assert!(parse_positive("inf").is_err());`
- `positive_9`：`assert!(parse_positive("-inf").is_err());`
- `positive_10`：`let actual=parse_positive("1e2").expect("應成功");assert!(actual.is_finite() && actual>0.0);assert!((actual-(100.0_f64)).abs()<=f64::EPSILON*(100.0_f64).abs().max(f64::MIN_POSITIVE));`
- `positive_11`：`let actual=parse_positive("5e-324").expect("應成功");assert!(actual.is_finite() && actual>0.0);assert!((actual-(5e-324_f64)).abs()<=f64::EPSILON*(5e-324_f64).abs().max(f64::MIN_POSITIVE));`
- `positive_12`：`assert!(parse_positive("1e309").is_err());`

## 10-2：錯誤種類也用型別表示

作答：`examples/unit10_02.rs`。題目：[規格](exercises/10-2.md)。

- `score_error_1`：`assert_eq!(parse_score(""),Err(ParseError::Empty));`
- `score_error_2`：`assert_eq!(parse_score(" \t"),Err(ParseError::Empty));`
- `score_error_3`：`assert_eq!(parse_score("abc"),Err(ParseError::NotInteger));`
- `score_error_4`：`assert_eq!(parse_score("1.5"),Err(ParseError::NotInteger));`
- `score_error_5`：`assert_eq!(parse_score("9223372036854775808"),Err(ParseError::NotInteger));`
- `score_error_6`：`assert_eq!(parse_score("-1"),Err(ParseError::OutOfRange));`
- `score_error_7`：`assert_eq!(parse_score("101"),Err(ParseError::OutOfRange));`
- `score_error_8`：`assert_eq!(parse_score("0"),Ok(0));`
- `score_error_9`：`assert_eq!(parse_score("100"),Ok(100));`
- `score_error_10`：`assert_eq!(parse_score(" 75 "),Ok(75));`
- `score_error_11`：`assert_eq!(parse_score("+60"),Ok(60));`
- `score_error_12`：`assert_eq!(parse_score("1 2"),Err(ParseError::NotInteger));`

## 10-3：組合解析與錯誤傳遞

作答：`examples/unit10_03.rs`。題目：[規格](exercises/10-3.md)。

- `pair_1`：`assert_eq!(parse_pair("1,2"),Ok((1.0_f64,2.0_f64)));`
- `pair_2`：`assert_eq!(parse_pair(" -3 , 4 "),Ok((-3.0_f64,4.0_f64)));`
- `pair_3`：`assert_eq!(parse_pair("0,0.5"),Ok((0.0_f64,0.5_f64)));`
- `pair_4`：`assert!(parse_pair("").is_err());`
- `pair_5`：`assert!(parse_pair("1").is_err());`
- `pair_6`：`assert!(parse_pair("1,2,3").is_err());`
- `pair_7`：`assert!(parse_pair(",2").is_err());`
- `pair_8`：`assert!(parse_pair("1,").is_err());`
- `pair_9`：`assert!(parse_pair("abc,2").is_err());`
- `pair_10`：`assert!(parse_pair("1,0").is_err());`
- `pair_11`：`assert!(parse_pair("1,-2").is_err());`
- `pair_12`：`assert!(parse_pair("NaN,2").is_err());`
- `pair_13`：`assert!(parse_pair("1,inf").is_err());`
- `pair_14`：`assert_eq!(parse_pair("1e2,2e1"),Ok((100.0_f64,20.0_f64)));`

## 11-1：測試能抓出邊界錯誤

作答：`exercises/code/11-1.rs`。題目：[規格](exercises/11-1.md)。

- 正確版本：必須通過學生測試，且測試數不得為零。
- 故障版本「六歲邊界」：必須被 assertion／測試失敗抓到，編譯失敗與逾時不計。
- 故障版本「十八歲邊界」：必須被 assertion／測試失敗抓到，編譯失敗與逾時不計。
- 故障版本「六十五歲邊界」：必須被 assertion／測試失敗抓到，編譯失敗與逾時不計。
- 故障版本「五歲被收費」：必須被 assertion／測試失敗抓到，編譯失敗與逾時不計。
- 故障版本「十七歲提早成人」：必須被 assertion／測試失敗抓到，編譯失敗與逾時不計。
- 故障版本「六十四歲提早敬老」：必須被 assertion／測試失敗抓到，編譯失敗與逾時不計。
- 故障版本「學生價格錯誤」：必須被 assertion／測試失敗抓到，編譯失敗與逾時不計。
- 故障版本「成人價格錯誤」：必須被 assertion／測試失敗抓到，編譯失敗與逾時不計。
- 故障版本「敬老價格錯誤」：必須被 assertion／測試失敗抓到，編譯失敗與逾時不計。

## 11-2：浮點測試與測試品質

作答：`exercises/code/11-2.rs`。題目：[規格](exercises/11-2.md)。

- 正確版本：必須通過學生測試，且測試數不得為零。
- 故障版本「少了偏移」：必須被 assertion／測試失敗抓到，編譯失敗與逾時不計。
- 故障版本「錯誤倍率」：必須被 assertion／測試失敗抓到，編譯失敗與逾時不計。
- 故障版本「整數倍率」：必須被 assertion／測試失敗抓到，編譯失敗與逾時不計。
- 故障版本「固定冰點」：必須被 assertion／測試失敗抓到，編譯失敗與逾時不計。
- 故障版本「負號遺失」：必須被 assertion／測試失敗抓到，編譯失敗與逾時不計。
- 故障版本「輸出先取整」：必須被 assertion／測試失敗抓到，編譯失敗與逾時不計。
- 故障版本「偏移錯一度」：必須被 assertion／測試失敗抓到，編譯失敗與逾時不計。
- 故障版本「乘除次序錯誤」：必須被 assertion／測試失敗抓到，編譯失敗與逾時不計。
- 故障版本「漏掉小數輸入」：必須被 assertion／測試失敗抓到，編譯失敗與逾時不計。

## 12-1：運動紀錄分析器

作答：`projects/motion/src/main.rs`。題目：[規格](exercises/12-1.md)。

- **兩段不同時間**：stdin `"100,10\n-40,20\n"`；參數 `[]`；stdout `"records: 2\nvelocity: 2.000"`；stderr `""`；exit `0`。
- **靜止**：stdin `"0,2\n"`；參數 `[]`；stdout `"records: 1\nvelocity: 0.000"`；stderr `""`；exit `0`。
- **負速度**：stdin `"-12,3\n"`；參數 `[]`；stdout `"records: 1\nvelocity: -4.000"`；stderr `""`；exit `0`。
- **往返**：stdin `"10,2\n-10,3\n"`；參數 `[]`；stdout `"records: 2\nvelocity: 0.000"`；stderr `""`；exit `0`。
- **空白列與CRLF**：stdin `"\r\n 6 , 2 \r\n\r\n"`；參數 `[]`；stdout `"records: 1\nvelocity: 3.000"`；stderr `""`；exit `0`。
- **無資料**：stdin `""`；參數 `[]`；stdout `""`；stderr `"error: no data"`；exit `1`。
- **錯誤欄數**：stdin `"1,2,3\n"`；參數 `[]`；stdout `""`；stderr `"error: line 1"`；exit `1`。
- **時間零**：stdin `"1,2\n3,0\n"`；參數 `[]`；stdout `""`；stderr `"error: line 2"`；exit `1`。
- **非有限位移**：stdin `"NaN,2\n"`；參數 `[]`；stdout `""`；stderr `"error: line 1"`；exit `1`。
- **累加溢位**：stdin `"1e308,1\n1e308,1\n"`；參數 `[]`；stdout `""`；stderr `"error: numeric range"`；exit `1`。
- **相除溢位**：stdin `"1,5e-324\n"`；參數 `[]`；stdout `""`；stderr `"error: numeric range"`；exit `1`。
- **資料檔案**：stdin `""`；參數 `["data/motion.csv"]`；stdout `"records: 2\nvelocity: 2.000"`；stderr `""`；exit `0`。
- **缺少檔案**：stdin `""`；參數 `["data/does-not-exist.csv"]`；stdout `""`；stderr `"error: cannot read"`；exit `1`。
- **多餘參數**：stdin `""`；參數 `["a", "b"]`；stdout `""`；stderr `"usage: motion [path]"`；exit `2`。
- **小數顯示**：stdin `"1,3\n"`；參數 `[]`；stdout `"records: 1\nvelocity: 0.333"`；stderr `""`；exit `0`。
- **原始行號含空白**：stdin `"\n1,2\n\nx,4\n"`；參數 `[]`；stdout `""`；stderr `"error: line 4"`；exit `1`。
- **負時間**：stdin `"1,-2\n"`；參數 `[]`；stdout `""`；stderr `"error: line 1"`；exit `1`。
- **總時間溢位**：stdin `"1,1e308\n2,1e308\n"`；參數 `[]`；stdout `""`；stderr `"error: numeric range"`；exit `1`。
- **非UTF8檔案**：stdin `""`；參數 `["data/invalid-utf8.bin"]`；stdout `""`；stderr `"error: cannot read"`；exit `1`。
- **只有空白資料**：stdin `"\n \t\n"`；參數 `[]`；stdout `""`；stderr `"error: no data"`；exit `1`。

## 12-2：成績彙整與跨情境遷移

作答：`projects/gradebook/src/main.rs`。題目：[規格](exercises/12-2.md)。

- **多人成績**：stdin `"Amy,60\nBo,90\nAmy,100\n"`；參數 `[]`；stdout `"name,average\nAmy,80.00\nBo,90.00"`；stderr `""`；exit `0`。
- **排序**：stdin `"Zoe,70\nAmy,90\n"`；參數 `[]`；stdout `"name,average\nAmy,90.00\nZoe,70.00"`；stderr `""`；exit `0`。
- **零分**：stdin `"A,0\n"`；參數 `[]`；stdout `"name,average\nA,0.00"`；stderr `""`；exit `0`。
- **滿分**：stdin `"A,100\n"`；參數 `[]`；stdout `"name,average\nA,100.00"`；stderr `""`；exit `0`。
- **空白與CRLF**：stdin `"\r\n A , 80 \r\nA,81\r\n"`；參數 `[]`；stdout `"name,average\nA,80.50"`；stderr `""`；exit `0`。
- **無資料**：stdin `""`；參數 `[]`；stdout `""`；stderr `"error: no data"`；exit `1`。
- **空姓名**：stdin `",80\n"`；參數 `[]`；stdout `""`；stderr `"error: line 1"`；exit `1`。
- **負分**：stdin `"A,-1\n"`；參數 `[]`；stdout `""`；stderr `"error: line 1"`；exit `1`。
- **超過滿分**：stdin `"A,101\n"`；參數 `[]`；stdout `""`；stderr `"error: line 1"`；exit `1`。
- **非數字**：stdin `"A,abc\n"`；參數 `[]`；stdout `""`；stderr `"error: line 1"`；exit `1`。
- **非有限**：stdin `"A,NaN\n"`；參數 `[]`；stdout `""`；stderr `"error: line 1"`；exit `1`。
- **欄位過多**：stdin `"A,80,90\n"`；參數 `[]`；stdout `""`；stderr `"error: line 1"`；exit `1`。
- **同名分組**：stdin `"Amy,10\nAmy,20\nAmy,30\n"`；參數 `[]`；stdout `"name,average\nAmy,20.00"`；stderr `""`；exit `0`。
- **資料檔案**：stdin `""`；參數 `["data/grades.csv"]`；stdout `"name,average\nAmy,80.00\nBo,90.00"`；stderr `""`；exit `0`。
- **缺少檔案**：stdin `""`；參數 `["data/does-not-exist.csv"]`；stdout `""`；stderr `"error: cannot read"`；exit `1`。
- **多餘參數**：stdin `""`；參數 `["a", "b"]`；stdout `""`；stderr `"usage: gradebook [path]"`；exit `2`。
- **原始行號**：stdin `"\nA,80\n\nB,101\n"`；參數 `[]`；stdout `""`；stderr `"error: line 4"`；exit `1`。
- **Unicode姓名**：stdin `"物理,60\n化學,80\n物理,100\n"`；參數 `[]`；stdout `"name,average\n化學,80.00\n物理,80.00"`；stderr `""`；exit `0`。
- **非UTF8檔案**：stdin `""`；參數 `["data/invalid-utf8.bin"]`；stdout `""`；stderr `"error: cannot read"`；exit `1`。
- **只有空白資料**：stdin `"\n \t\n"`；參數 `[]`；stdout `""`；stderr `"error: no data"`；exit `1`。
