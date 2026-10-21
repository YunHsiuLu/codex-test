# Rust Beginner Course — Test Cases

每題至少十項具名驗收。第一課沒有可變輸入，因此十項是輸出契約檢查，部分相關；不是十筆不同輸入，也不重複啟動十次。驗收器對相同輸入／參數共用一次執行結果。

第二～四課尚未教鍵盤輸入，所以驗收器只在 target 的暫存副本中更換題目設定：celsius、score、for 的範圍上限。學生檔案不修改，公式、條件與累加內容保留原作答；每份副本分別以不同測試參數執行。這是受控題型測試，不是任意 Rust 程式解析器，請保留原題變數與基本迴圈結構。此政策取代舊版僅檢查一次輸出的做法。

## 01：固定輸出，十項契約

兩行完整文字、恰好兩行、順序、無空白行、無行首空白、無行尾空白、無終端機控制碼、英文半形、中文字元數。精確名稱在 src/checks.rs；不把重複相同資料當成十種輸入。

## 02：攝氏換算，十筆數值

| 攝氏 | 預期華氏 |
| --- | --- |
| 0 | 32 |
| 25 | 77 |
| 100 | 212 |
| -40 | -40 |
| -273.15 | -459.67 |
| 37 | 98.6 |
| 12.5 | 54.5 |
| -10 | 14 |
| 20 | 68 |
| 50 | 122 |

## 03：判斷成績，十筆數值

0、10、30、58、59 → 再試一次；60、61、70、99、100 → 及格。明確檢驗及格邊界與兩種分支。

## 04：累加，十筆範圍

| 上限 | 預期總和 |
| --- | --- |
| 0 | 0 |
| 1 | 1 |
| 2 | 3 |
| 3 | 6 |
| 4 | 10 |
| 5 | 15 |
| 10 | 55 |
| 20 | 210 |
| 50 | 1275 |
| 100 | 5050 |

## 06：互動輸入，十四筆資料

25 → 77 F；0 → 32 F；100 → 212 F；-40 → -40 F；空白包住的 12.5 → 54.5 F；abc／空行 → 請輸入數字；-10 → 14 F；37 → 98.6 F；+20 → 68 F；1e2 → 212 F；25abc／1 2 → 請輸入數字；10 加 CRLF → 50 F。

其他函式題如下。每個函式名稱對應一個獨立 #[test]，不是只在單一測試內重複跑相同資料。原始 assertion 一併列出，方便確認輸入與答案。

## 05：10 項獨立測試

### standard

```rust
assert_speed(100.0, 20.0, 5.0);
```

### zero_distance

```rust
assert_speed(0.0, 1.0, 0.0);
```

### negative_distance

```rust
assert_speed(-30.0, 3.0, -10.0);
```

### fraction

```rust
assert_speed(5.0, 2.0, 2.5);
```

### half_second

```rust
assert_speed(1.0, 0.5, 2.0);
```

### quarter_speed

```rust
assert_speed(1.0, 4.0, 0.25);
```

### large_distance

```rust
assert_speed(1000.0, 1.0, 1000.0);
```

### long_time

```rust
assert_speed(2.0, 100.0, 0.02);
```

### reject_zero_time（預期 panic）

```rust
speed(1.0,0.0);
```

### reject_negative_time（預期 panic）

```rust
speed(1.0,-1.0);
```


## 07：11 項獨立測試

### empty

```rust
let original=String::from(""); assert_eq!(count(&original),0); assert_eq!(original,"");
```

### ascii

```rust
let original=String::from("Rust"); assert_eq!(count(&original),4); assert_eq!(original,"Rust");
```

### chinese

```rust
let original=String::from("物理"); assert_eq!(count(&original),2); assert_eq!(original,"物理");
```

### spaces

```rust
let original=String::from("a b"); assert_eq!(count(&original),3); assert_eq!(original,"a b");
```

### digits

```rust
let original=String::from("12345"); assert_eq!(count(&original),5); assert_eq!(original,"12345");
```

### newline

```rust
let original=String::from("\n"); assert_eq!(count(&original),1); assert_eq!(original,"\n");
```

### emoji

```rust
let original=String::from("🦀"); assert_eq!(count(&original),1); assert_eq!(original,"🦀");
```

### combining

```rust
let original=String::from("e\u{301}"); assert_eq!(count(&original),2); assert_eq!(original,"e\u{301}");
```

### mixed

```rust
let original=String::from("Rust物理"); assert_eq!(count(&original),6); assert_eq!(original,"Rust物理");
```

### accent

```rust
let original=String::from("é"); assert_eq!(count(&original),1); assert_eq!(original,"é");
```

### retained_owner

```rust
let original=String::from("borrow"); assert_eq!(count(&original),6); assert_eq!(original,"borrow");
```


## 08：11 項獨立測試

### empty

```rust
assert_eq!(average(&[]),None);
```

### zero

```rust
assert_average(&[0],0.0);
```

### full

```rust
assert_average(&[100],100.0);
```

### fractional

```rust
assert_average(&[60, 61],60.5);
```

### three_scores

```rust
assert_average(&[60, 80, 100],80.0);
```

### all_zero

```rust
assert_average(&[0, 0, 0],0.0);
```

### all_full

```rust
assert_average(&[100, 100, 100],100.0);
```

### extremes

```rust
assert_average(&[0, 100],50.0);
```

### unsorted

```rust
assert_average(&[90, 30, 60],60.0);
```

### repeated

```rust
assert_average(&[75, 75, 75, 75],75.0);
```

### odd_length

```rust
assert_average(&[1, 2, 3, 4, 5],3.0);
```


## 09：10 項獨立測試

### standard

```rust
assert_motion(120.0,10.0,12.0);
```

### second_record

```rust
assert_motion(50.0,5.0,10.0);
```

### negative

```rust
assert_motion(-6.0,2.0,-3.0);
```

### stationary

```rust
assert_motion(0.0,1.0,0.0);
```

### fraction

```rust
assert_motion(5.0,2.0,2.5);
```

### short_time

```rust
assert_motion(1.0,0.5,2.0);
```

### long_time

```rust
assert_motion(2.0,100.0,0.02);
```

### large

```rust
assert_motion(1000.0,1.0,1000.0);
```

### reject_zero（預期 panic）

```rust
Motion {distance:1.0,time:0.0}.speed();
```

### reject_negative（預期 panic）

```rust
Motion {distance:1.0,time:-1.0}.speed();
```


## 10：15 項獨立測試

### decimal

```rust
assert!((parse_time("2.5").unwrap()-2.5).abs()<1e-9);
```

### trimmed

```rust
assert!((parse_time(" 3 ").unwrap()-3.0).abs()<1e-9);
```

### small

```rust
assert!((parse_time("0.001").unwrap()-0.001).abs()<1e-9);
```

### exponent

```rust
assert!((parse_time("1e2").unwrap()-100.0).abs()<1e-9);
```

### plus

```rust
assert!((parse_time("+2").unwrap()-2.0).abs()<1e-9);
```

### zero

```rust
assert!(parse_time("0").is_err(),"應拒絕輸入：0");
```

### negative_zero

```rust
assert!(parse_time("-0").is_err(),"應拒絕輸入：-0");
```

### negative

```rust
assert!(parse_time("-1").is_err(),"應拒絕輸入：-1");
```

### letters

```rust
assert!(parse_time("abc").is_err(),"應拒絕輸入：abc");
```

### nan

```rust
assert!(parse_time("NaN").is_err(),"應拒絕輸入：NaN");
```

### infinity

```rust
assert!(parse_time("inf").is_err(),"應拒絕輸入：inf");
```

### negative_infinity

```rust
assert!(parse_time("-inf").is_err(),"應拒絕輸入：-inf");
```

### empty

```rust
assert!(parse_time("").is_err(),"應拒絕輸入：");
```

### mixed

```rust
assert!(parse_time("12abc").is_err(),"應拒絕輸入：12abc");
```

### blank

```rust
assert!(parse_time("   ").is_err(),"應拒絕輸入：   ");
```


## 11：11 項獨立測試

### freezing

```rust
assert!((c_to_f(0.0)-(32.0)).abs()<1e-9,"攝氏=0，預期華氏=32");
```

### room

```rust
assert!((c_to_f(25.0)-(77.0)).abs()<1e-9,"攝氏=25，預期華氏=77");
```

### boiling

```rust
assert!((c_to_f(100.0)-(212.0)).abs()<1e-9,"攝氏=100，預期華氏=212");
```

### equal_scales

```rust
assert!((c_to_f(-40.0)-(-40.0)).abs()<1e-9,"攝氏=-40，預期華氏=-40");
```

### negative

```rust
assert!((c_to_f(-10.0)-(14.0)).abs()<1e-9,"攝氏=-10，預期華氏=14");
```

### body

```rust
assert!((c_to_f(37.0)-(98.6)).abs()<1e-9,"攝氏=37，預期華氏=98.6");
```

### fraction

```rust
assert!((c_to_f(12.5)-(54.5)).abs()<1e-9,"攝氏=12.5，預期華氏=54.5");
```

### twenty

```rust
assert!((c_to_f(20.0)-(68.0)).abs()<1e-9,"攝氏=20，預期華氏=68");
```

### absolute_zero

```rust
assert!((c_to_f(-273.15)-(-459.67)).abs()<1e-9,"攝氏=-273.15，預期華氏=-459.67");
```

### fifty

```rust
assert!((c_to_f(50.0)-(122.0)).abs()<1e-9,"攝氏=50，預期華氏=122");
```

### linear_difference

```rust
assert!((c_to_f(35.0)-c_to_f(25.0)-18.0).abs()<1e-9);
```


## 12：15 項獨立測試

### stationary

```rust
assert!((average_velocity(&[Record {displacement:0.0,seconds:1.0}]).unwrap()-(0.0)).abs()<1e-9);
```

### forward

```rust
assert!((average_velocity(&[Record {displacement:12.0,seconds:2.0}]).unwrap()-(6.0)).abs()<1e-9);
```

### backward

```rust
assert!((average_velocity(&[Record {displacement:-12.0,seconds:2.0}]).unwrap()-(-6.0)).abs()<1e-9);
```

### weighted

```rust
assert!((average_velocity(&[Record {displacement:100.0,seconds:10.0},Record {displacement:-40.0,seconds:20.0}]).unwrap()-(2.0)).abs()<1e-9);
```

### round_trip

```rust
assert!((average_velocity(&[Record {displacement:10.0,seconds:2.0},Record {displacement:-10.0,seconds:3.0}]).unwrap()-(0.0)).abs()<1e-9);
```

### empty

```rust
assert!(average_velocity(&[]).is_err());
```

### zero_time

```rust
assert!(average_velocity(&[Record {displacement:1.0,seconds:0.0}]).is_err());
```

### negative_time

```rust
assert!(average_velocity(&[Record {displacement:1.0,seconds:-1.0}]).is_err());
```

### nan_displacement

```rust
assert!(average_velocity(&[Record {displacement:f64::NAN,seconds:1.0}]).is_err());
```

### nan_time

```rust
assert!(average_velocity(&[Record {displacement:1.0,seconds:f64::NAN}]).is_err());
```

### infinite_displacement

```rust
assert!(average_velocity(&[Record {displacement:f64::INFINITY,seconds:1.0}]).is_err());
```

### infinite_time

```rust
assert!(average_velocity(&[Record {displacement:1.0,seconds:f64::INFINITY}]).is_err());
```

### displacement_overflow

```rust
assert!(average_velocity(&[Record {displacement:1e308,seconds:1.0},Record {displacement:1e308,seconds:1.0}]).is_err());
```

### time_overflow

```rust
assert!(average_velocity(&[Record {displacement:1.0,seconds:1e308},Record {displacement:1.0,seconds:1e308}]).is_err());
```

### division_overflow

```rust
assert!(average_velocity(&[Record {displacement:1.0,seconds:5e-324}]).is_err());
```

