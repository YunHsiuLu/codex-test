# Rust Advanced Course — Test Cases

本表列出每章外部驗收中的獨立具名測試；檔案內原有測試不列入最低十項計數。`cargo run -p rust-advanced-course -- run N` 自動執行該章檢查，來源為 `checks/labNN.rs`。第十二章另有四組終端機輸入輸出測試。

第四章的 `scope_trace()` 沒有參數，且規格固定為同一事件序列。因此該章是十項契約性質檢查（部分性質彼此相關），不是十種不同輸入；其中完整序列檢查已涵蓋多個局部性質。其他章節使用不同資料、邊界或型別實作。測試數量不代表完整證明，也不代替複雜度與設計評量。

## Chapter 01：10 項

| 測試名稱 | 輸入／契約與預期目的 | 精確驗收（Rust） |
|---|---|---|
| `zero` | n＝0，精確比較 u64 規格 | `let n: u32 = 0; let t = u64::from(n) * (u64::from(n) + 1) / 2; assert_eq!(triangular(n), u32::try_from(t).ok());` |
| `one` | n＝1，精確比較 u64 規格 | `let n: u32 = 1; let t = u64::from(n) * (u64::from(n) + 1) / 2; assert_eq!(triangular(n), u32::try_from(t).ok());` |
| `even_small` | n＝2，精確比較 u64 規格 | `let n: u32 = 2; let t = u64::from(n) * (u64::from(n) + 1) / 2; assert_eq!(triangular(n), u32::try_from(t).ok());` |
| `odd_small` | n＝3，精確比較 u64 規格 | `let n: u32 = 3; let t = u64::from(n) * (u64::from(n) + 1) / 2; assert_eq!(triangular(n), u32::try_from(t).ok());` |
| `ten` | n＝10，精確比較 u64 規格 | `let n: u32 = 10; let t = u64::from(n) * (u64::from(n) + 1) / 2; assert_eq!(triangular(n), u32::try_from(t).ok());` |
| `thousand` | n＝1000，精確比較 u64 規格 | `let n: u32 = 1000; let t = u64::from(n) * (u64::from(n) + 1) / 2; assert_eq!(triangular(n), u32::try_from(t).ok());` |
| `intermediate_overflow` | n＝65536，精確比較 u64 規格 | `let n: u32 = 65536; let t = u64::from(n) * (u64::from(n) + 1) / 2; assert_eq!(triangular(n), u32::try_from(t).ok());` |
| `largest_fitting` | n＝92681，精確比較 u64 規格 | `let n: u32 = 92681; let t = u64::from(n) * (u64::from(n) + 1) / 2; assert_eq!(triangular(n), u32::try_from(t).ok());` |
| `first_overflow` | n＝92682，精確比較 u64 規格 | `let n: u32 = 92682; let t = u64::from(n) * (u64::from(n) + 1) / 2; assert_eq!(triangular(n), u32::try_from(t).ok());` |
| `maximum` | n＝4294967295，精確比較 u64 規格 | `let n: u32 = 4294967295; let t = u64::from(n) * (u64::from(n) + 1) / 2; assert_eq!(triangular(n), u32::try_from(t).ok());` |

## Chapter 02：11 項

| 測試名稱 | 輸入／契約與預期目的 | 精確驗收（Rust） |
|---|---|---|
| `ordinary` | ２與４的中點３ | `assert_eq!(midpoint(2.0, 4.0), Some(3.0));` |
| `negative` | －６與－２的中點－４ | `assert_eq!(midpoint(-6.0, -2.0), Some(-4.0));` |
| `opposite` | 相反極值抵消 | `assert_eq!(midpoint(-f64::MAX, f64::MAX), Some(0.0));` |
| `largest` | 最大同號值不溢位 | `assert_eq!(midpoint(f64::MAX, f64::MAX), Some(f64::MAX));` |
| `small_normal` | 最小正常數相同 | `assert_eq!( midpoint(f64::MIN_POSITIVE, f64::MIN_POSITIVE), Some(f64::MIN_POSITIVE) );` |
| `subnormal` | 最小次正常數相同 | `assert_eq!( midpoint(f64::from_bits(1), f64::from_bits(1)), Some(f64::from_bits(1)) );` |
| `zero` | 零中點 | `assert_eq!(midpoint(0.0, 0.0), Some(0.0));` |
| `reversed` | 參數反向 | `assert_eq!(midpoint(8.0, 2.0), Some(5.0));` |
| `nan` | NaN拒絕 | `assert_eq!(midpoint(f64::NAN, 1.0), None);` |
| `positive_infinity` | 正無限拒絕 | `assert_eq!(midpoint(1.0, f64::INFINITY), None);` |
| `negative_infinity` | 負無限拒絕 | `assert_eq!(midpoint(f64::NEG_INFINITY, 0.0), None);` |

## Chapter 03：10 項

| 測試名稱 | 輸入／契約與預期目的 | 精確驗收（Rust） |
|---|---|---|
| `empty` | 空切片回傳０ | `assert_eq!(lower_bound(&[], 3), 0);` |
| `single_below` | 單筆目標較小 | `assert_eq!(lower_bound(&[5], 4), 0);` |
| `single_equal` | 單筆相等 | `assert_eq!(lower_bound(&[5], 5), 0);` |
| `single_above` | 單筆目標較大 | `assert_eq!(lower_bound(&[5], 6), 1);` |
| `duplicates` | 重複值取第一筆 | `assert_eq!(lower_bound(&[1, 3, 3, 7], 3), 1);` |
| `between` | 落在間隙 | `assert_eq!(lower_bound(&[1, 3, 7], 4), 2);` |
| `all_equal` | 全相同取首筆 | `assert_eq!(lower_bound(&[2, 2, 2], 2), 0);` |
| `negative` | 負數排序 | `assert_eq!(lower_bound(&[-9, -5, -1], -4), 2);` |
| `minimum` | 最小有號整數 | `assert_eq!(lower_bound(&[i32::MIN, 0, i32::MAX], i32::MIN), 0);` |
| `maximum` | 最大有號整數 | `assert_eq!(lower_bound(&[i32::MIN, 0, i32::MAX], i32::MAX), 2);` |

## Chapter 04：10 項

| 測試名稱 | 輸入／契約與預期目的 | 精確驗收（Rust） |
|---|---|---|
| `exact_trace` | 完整事件序列契約 | `assert_eq!( scope_trace(), vec!["enter", "inner dropped", "outer dropped"] );` |
| `three_events` | 僅三個事件 | `assert_eq!(scope_trace().len(), 3);` |
| `entry_first` | 進入事件先於釋放 | `assert_eq!(scope_trace().first(), Some(&"enter"));` |
| `inner_second` | 內層資源於第二事件釋放 | `assert_eq!(scope_trace().get(1), Some(&"inner dropped"));` |
| `outer_last` | 外層最後釋放 | `assert_eq!(scope_trace().last(), Some(&"outer dropped"));` |
| `entry_once` | 進入事件恰一次 | `assert_eq!(scope_trace().iter().filter(\|&&e\| e == "enter").count(), 1);` |
| `inner_once` | 移動不造成雙重釋放 | `assert_eq!( scope_trace() .iter() .filter(\|&&e\| e == "inner dropped") .count(), 1 );` |
| `outer_once` | 外層恰一次釋放 | `assert_eq!( scope_trace() .iter() .filter(\|&&e\| e == "outer dropped") .count(), 1 );` |
| `inner_before_outer` | 內外層釋放順序 | `let e = scope_trace(); assert!( e.iter().position(\|&x\| x == "inner dropped").unwrap() < e.iter().position(\|&x\| x == "outer dropped").unwrap() );` |
| `repeat_independent` | 兩次呼叫不累積舊事件 | `let first = scope_trace(); let second = scope_trace(); assert_eq!(first, second); assert_eq!(second.len(), 3);` |

## Chapter 05：10 項

| 測試名稱 | 輸入／契約與預期目的 | 精確驗收（Rust） |
|---|---|---|
| `forward` | 正序取得兩參照 | `let mut a = [10, 20, 30]; let mut want = a; want[0] = 40; want[2] = 50; let (x, y) = two_mut(&mut a, 0, 2).unwrap(); *x = 40; *y = 50; assert_eq!(a, want);` |
| `reverse` | 反序仍對應參數 | `let mut a = [10, 20, 30]; let mut want = a; want[2] = 40; want[0] = 50; let (x, y) = two_mut(&mut a, 2, 0).unwrap(); *x = 40; *y = 50; assert_eq!(a, want);` |
| `adjacent` | 相鄰參照互不干涉 | `let mut a = [1, 2, 3]; let mut want = a; want[1] = 40; want[2] = 50; let (x, y) = two_mut(&mut a, 1, 2).unwrap(); *x = 40; *y = 50; assert_eq!(a, want);` |
| `two_elements` | 最小合法二元素 | `let mut a = [7, 8]; let mut want = a; want[0] = 40; want[1] = 50; let (x, y) = two_mut(&mut a, 0, 1).unwrap(); *x = 40; *y = 50; assert_eq!(a, want);` |
| `same` | 相同索引拒絕 | `let mut a: [i32; 2] = [1, 2]; assert!(two_mut(&mut a, 1, 1).is_none());` |
| `left_out` | 第一索引越界 | `let mut a: [i32; 2] = [1, 2]; assert!(two_mut(&mut a, 2, 0).is_none());` |
| `right_out` | 第二索引越界 | `let mut a: [i32; 2] = [1, 2]; assert!(two_mut(&mut a, 0, 2).is_none());` |
| `both_out` | 兩索引越界 | `let mut a: [i32; 2] = [1, 2]; assert!(two_mut(&mut a, 3, 4).is_none());` |
| `empty` | 空切片拒絕 | `let mut a: [i32; 0] = []; assert!(two_mut(&mut a, 0, 1).is_none());` |
| `huge_index` | 最大索引不panic | `let mut a: [i32; 2] = [1, 2]; assert!(two_mut(&mut a, 0, usize::MAX).is_none());` |

## Chapter 06：10 項

| 測試名稱 | 輸入／契約與預期目的 | 精確驗收（Rust） |
|---|---|---|
| `unicode` | UTF－８中文字串 | `assert_eq!(field("name=物理", "name"), Some("物理"));` |
| `empty_value` | 有欄位但空值 | `assert_eq!(field("empty=", "empty"), Some(""));` |
| `missing` | 不存在的鍵 | `assert_eq!(field("x=1", "y"), None);` |
| `empty_line` | 空輸入 | `assert_eq!(field("", "x"), None);` |
| `whitespace` | 忽略鍵值兩端空白 | `assert_eq!(field(" unit = m/s ", "unit"), Some("m/s"));` |
| `duplicate_first` | 重複鍵取第一個 | `assert_eq!(field("x=1;x=2", "x"), Some("1"));` |
| `skip_malformed` | 略過沒有等號項目 | `assert_eq!(field("bad;x=3", "x"), Some("3"));` |
| `last_field` | 搜尋末尾欄位 | `assert_eq!(field("a=1;b=2;c=3", "c"), Some("3"));` |
| `embedded_equals` | 第一個等號分隔 | `assert_eq!(field("expr=a=b", "expr"), Some("a=b"));` |
| `short_key_lifetime` | 輸出不依賴key存活 | `let line = String::from("unit=m/s"); let value; { let key = String::from("unit"); value = field(&line, &key); } assert_eq!(value, Some("m/s"));` |

## Chapter 07：11 項

| 測試名稱 | 輸入／契約與預期目的 | 精確驗收（Rust） |
|---|---|---|
| `ordinary` | 一般正數 | `assert_eq!(Seconds::new(2.0).unwrap().get(), 2.0);` |
| `fraction` | 正小數 | `assert_eq!(Seconds::new(0.25).unwrap().get(), 0.25);` |
| `max_finite` | 最大有限正數 | `assert_eq!(Seconds::new(f64::MAX).unwrap().get(), f64::MAX);` |
| `min_normal` | 最小正常正數 | `assert_eq!( Seconds::new(f64::MIN_POSITIVE).unwrap().get(), f64::MIN_POSITIVE );` |
| `subnormal` | 最小次正常正數 | `assert_eq!( Seconds::new(f64::from_bits(1)).unwrap().get(), f64::from_bits(1) );` |
| `zero` | 正零拒絕 | `assert!(Seconds::new(0.0).is_err());` |
| `negative_zero` | 負零拒絕 | `assert!(Seconds::new(-0.0).is_err());` |
| `negative` | 負數拒絕 | `assert!(Seconds::new(-2.0).is_err());` |
| `nan` | NaN拒絕 | `assert!(Seconds::new(f64::NAN).is_err());` |
| `positive_infinity` | 正無限拒絕 | `assert!(Seconds::new(f64::INFINITY).is_err());` |
| `negative_infinity` | 負無限拒絕 | `assert!(Seconds::new(f64::NEG_INFINITY).is_err());` |

## Chapter 08：10 項

| 測試名稱 | 輸入／契約與預期目的 | 精確驗收（Rust） |
|---|---|---|
| `static_empty` | 空靜態集合為零 | `assert_eq!(total_static::<Distance>(&[]), 0.0);` |
| `static_single` | 單筆靜態值 | `assert_eq!(total_static(&[Distance(7.0)]), 7.0);` |
| `static_pair` | 兩筆靜態加總 | `assert_eq!(total_static(&[Distance(2.0), Distance(3.0)]), 5.0);` |
| `static_fraction` | 二進位可精確表示小數 | `assert_eq!(total_static(&[Distance(0.25), Distance(0.5)]), 0.75);` |
| `static_other_type` | 另一個trait實作 | `assert_eq!(total_static(&[Time(1.0), Time(3.0)]), 4.0);` |
| `dynamic_empty` | 空動態集合為零 | `assert_eq!(total_dynamic(&[]), 0.0);` |
| `dynamic_single` | 單筆動態分派 | `assert_eq!(total_dynamic(&[&Distance(9.0)]), 9.0);` |
| `dynamic_heterogeneous` | 異質型別方法分派 | `assert_eq!(total_dynamic(&[&Distance(2.0), &Time(4.0)]), 6.0);` |
| `custom_behavior` | 使用trait回傳行為而非猜欄位 | `assert_eq!(total_static(&[Doubled(3.0)]), 6.0); assert_eq!(total_dynamic(&[&Doubled(4.0)]), 8.0);` |
| `large_collection` | 一千筆靜態集合 | `let a: Vec<_> = (0..1000).map(\|_\| Distance(1.0)).collect(); assert_eq!(total_static(&a), 1000.0);` |

## Chapter 09：10 項

| 測試名稱 | 輸入／契約與預期目的 | 精確驗收（Rust） |
|---|---|---|
| `empty` | 空輸入 | `assert_eq!(first_positive_squares(&[], 3), Vec::<i64>::new());` |
| `zero_limit` | 需求零筆 | `assert_eq!(first_positive_squares(&[1, 2], 0), Vec::<i64>::new());` |
| `negative_only` | 全負數 | `assert_eq!(first_positive_squares(&[-1, -2], 3), Vec::<i64>::new());` |
| `zeros_only` | 零不算正數 | `assert_eq!(first_positive_squares(&[0, 0], 2), Vec::<i64>::new());` |
| `single` | 單筆平方 | `assert_eq!(first_positive_squares(&[3], 1), vec![9]);` |
| `filter_before_take` | 先篩選再限筆數 | `assert_eq!(first_positive_squares(&[-2, 3, 0, 4, 5], 2), vec![9, 16]);` |
| `preserve_order` | 保留原順序 | `assert_eq!(first_positive_squares(&[4, 2, 3], 3), vec![16, 4, 9]);` |
| `large_limit` | 需求超過資料 | `assert_eq!(first_positive_squares(&[-1, 2, -3], 99), vec![4]);` |
| `widen_before_square` | 平方先提升型別 | `assert_eq!( first_positive_squares(&[i32::MAX], 1), vec![4611686014132420609] );` |
| `mixed_extremes` | 最小整數被排除 | `assert_eq!( first_positive_squares(&[i32::MIN, 1, i32::MAX], 2), vec![1, 4611686014132420609] );` |

## Chapter 10：11 項

| 測試名稱 | 輸入／契約與預期目的 | 精確驗收（Rust） |
|---|---|---|
| `ordinary` | 一般資料 | `assert_eq!(parse_record("100,20"), Ok((100.0, 20.0)));` |
| `negative_displacement` | 負位移合法 | `assert_eq!(parse_record(" -3, 2 "), Ok((-3.0, 2.0)));` |
| `zero_displacement` | 零位移合法 | `assert_eq!(parse_record("0,1"), Ok((0.0, 1.0)));` |
| `missing_column` | 缺欄位 | `assert_eq!(parse_record("1"), Err(ParseError::Columns));` |
| `extra_column` | 多欄位 | `assert_eq!(parse_record("1,2,3"), Err(ParseError::Columns));` |
| `bad_displacement` | 位移無法解析 | `assert_eq!(parse_record("abc,2"), Err(ParseError::Number));` |
| `bad_time` | 時間無法解析 | `assert_eq!(parse_record("1,abc"), Err(ParseError::Number));` |
| `nan` | 非有限位移 | `assert_eq!(parse_record("NaN,2"), Err(ParseError::NonFinite));` |
| `infinite_time` | 非有限時間 | `assert_eq!(parse_record("1,inf"), Err(ParseError::NonFinite));` |
| `zero_time` | 零時間拒絕 | `assert_eq!(parse_record("1,0"), Err(ParseError::NonPositiveTime));` |
| `negative_time` | 負時間拒絕 | `assert_eq!(parse_record("1,-2"), Err(ParseError::NonPositiveTime));` |

## Chapter 11：11 項

| 測試名稱 | 輸入／契約與預期目的 | 精確驗收（Rust） |
|---|---|---|
| `empty` | 空集合 | `let a: Vec<i32> = vec![]; assert_eq!( parallel_sum(&a), a.iter().map(\|&x\| i64::from(x)).sum::<i64>() );` |
| `single_positive` | 單筆正數 | `let a: Vec<i32> = vec![1]; assert_eq!( parallel_sum(&a), a.iter().map(\|&x\| i64::from(x)).sum::<i64>() );` |
| `single_negative` | 單筆負數 | `let a: Vec<i32> = vec![-7]; assert_eq!( parallel_sum(&a), a.iter().map(\|&x\| i64::from(x)).sum::<i64>() );` |
| `two_values` | 偶數長度 | `let a: Vec<i32> = vec![3, 9]; assert_eq!( parallel_sum(&a), a.iter().map(\|&x\| i64::from(x)).sum::<i64>() );` |
| `odd_length` | 奇數長度切分 | `let a: Vec<i32> = vec![-3, 2, 7]; assert_eq!( parallel_sum(&a), a.iter().map(\|&x\| i64::from(x)).sum::<i64>() );` |
| `all_zero` | 全零 | `let a: Vec<i32> = vec![0; 8]; assert_eq!( parallel_sum(&a), a.iter().map(\|&x\| i64::from(x)).sum::<i64>() );` |
| `all_negative` | 全負數 | `let a: Vec<i32> = vec![-1, -2, -3, -4]; assert_eq!( parallel_sum(&a), a.iter().map(\|&x\| i64::from(x)).sum::<i64>() );` |
| `wide_sum` | 提升型別避免i32加總溢位 | `let a: Vec<i32> = vec![i32::MAX, i32::MAX]; assert_eq!( parallel_sum(&a), a.iter().map(\|&x\| i64::from(x)).sum::<i64>() );` |
| `minimum_values` | 最小整數加總 | `let a: Vec<i32> = vec![i32::MIN, i32::MIN]; assert_eq!( parallel_sum(&a), a.iter().map(\|&x\| i64::from(x)).sum::<i64>() );` |
| `mixed_cancellation` | 極值抵消 | `let a: Vec<i32> = vec![i32::MIN, i32::MAX, 1]; assert_eq!( parallel_sum(&a), a.iter().map(\|&x\| i64::from(x)).sum::<i64>() );` |
| `larger_collection` | 一千筆串行規格比較 | `let a: Vec<i32> = (0..1000).collect(); assert_eq!( parallel_sum(&a), a.iter().map(\|&x\| i64::from(x)).sum::<i64>() );` |

## Chapter 12：13 項

| 測試名稱 | 輸入／契約與預期目的 | 精確驗收（Rust） |
|---|---|---|
| `weighted_velocity` | 不同時間採總位移除總時間 | `assert_eq!(analyze("100,10\n-40,20\n").unwrap().velocity(), 2.0);` |
| `return_to_origin` | 往返平均速度為零 | `assert_eq!(analyze("10,2\n-10,3").unwrap().velocity(), 0.0);` |
| `crlf` | 接受CRLF | `let s = analyze("-4,2\r\n").unwrap(); assert_eq!( (s.count, s.displacement, s.seconds, s.velocity()), (1, -4.0, 2.0, -2.0) );` |
| `empty` | 空檔分類 | `assert_eq!(analyze(""), Err(AnalysisError::Empty));` |
| `blank_line` | 第二行空白保留行號 | `assert!(matches!( analyze("1,1\n \n"), Err(AnalysisError::Line { number: 2, .. }) ));` |
| `bad_number` | 第三行數字錯誤保留行號 | `assert!(matches!( analyze("1,1\n2,2\nx,3"), Err(AnalysisError::Line { number: 3, .. }) ));` |
| `extra_column` | 欄位過多拒絕 | `assert!(matches!( analyze("1,2,3"), Err(AnalysisError::Line { number: 1, .. }) ));` |
| `nonfinite` | NaN拒絕 | `assert!(matches!( analyze("NaN,1"), Err(AnalysisError::Line { number: 1, .. }) ));` |
| `zero_time` | 零時間拒絕 | `assert!(matches!( analyze("1,0"), Err(AnalysisError::Line { number: 1, .. }) ));` |
| `negative_time` | 負時間拒絕 | `assert!(matches!( analyze("1,-1"), Err(AnalysisError::Line { number: 1, .. }) ));` |
| `sum_overflow` | 累加位移非有限 | `assert_eq!(analyze("1e308,1\n1e308,1"), Err(AnalysisError::Overflow));` |
| `ratio_overflow` | 最終比值非有限 | `assert_eq!(analyze("1,5e-324"), Err(AnalysisError::Overflow));` |
| `time_overflow` | 累加時間非有限 | `assert_eq!(analyze("1,1e308\n1,1e308"), Err(AnalysisError::Overflow));` |
