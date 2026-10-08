# Task 004 — PE Import Table Parsing

狀態：實作、測試、Clippy 全部通過。驗證日期：2026-10-07。

## 變更與既有功能保留

以 Task 003 通過時的 commit `71a292f` 為比較基準，`winmac-pe`、既有 RVA 轉換、image mapping 和原有測試均未改動。loader 的原始 `lib.rs` 只增加新模組匯出與 `LoaderError::Import`。

- `crates/loader/src/imports.rs`：新增 `parse_import_table`、`ImportTable`、`ImportModule`、`ImportSymbol` 與具型別的 `ImportError`。
- `crates/loader/src/imports/tests.rs`：24 項 synthetic 測試。
- `app/cli/src/main.rs`：保留原有 PE／section 輸出，增加 DLL、名稱、hint、ordinal 和無匯入提示；跳脫名稱中的控制字元。
- `app/cli/tests/imports.rs`：4 項實際啟動 CLI 的整合測試。
- `app/cli/Cargo.toml`、`Cargo.lock`：CLI 新增 workspace 內的 loader 依賴，未增加第三方依賴。

## 解析行為

Import Directory 使用 index 1。缺少目錄或 RVA 為零時回傳空結果。以目錄 Size 限制 20-byte descriptor 遍歷，只有五個欄位全部為零才結束。目錄以外的 DLL 字串、thunk、hint/name 另行驗證。

PE32 使用 4-byte thunk，PE32+ 使用 8-byte thunk；支援名稱與 ordinal，保留 hint。OriginalFirstThunk 為零時，唯讀使用 FirstThunk 作為 lookup table。非零 OriginalFirstThunk 優先，不讀取 IAT 內容。64-bit 名稱 thunk 不得截斷為 u32，保留位元必須為零。

每個讀取位元組均透過既有 RVA helper 轉換，並驗證 SizeOfImage 與實際檔案邊界。因此不能跨入未映射 RVA、zero-fill 或檔案尾端附加資料；相鄰 RVA 位於不同 section 時，允許其檔案位置不連續。位址遞增使用 checked arithmetic。

實作參考：[Microsoft PE Format](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format#import-directory-table)。

## 安全限制與目前範圍

這些是目前 inspector 的資源政策，不是 PE 格式限制。

| 項目 | 上限 |
| --- | --- |
| 單一字串 | 4096 bytes，包含 NUL |
| DLL descriptor | 4096 個 |
| 全表 imported symbols | 65536 個 |
| 累積讀取 | 16 MiB，重複引用亦計入 |

空名稱視為格式錯誤，非 UTF-8 名稱採有損轉換。字串缺少終止符或任何結構越界均回傳錯誤。

只檢視一般 import directory，未實作 delay imports、bound import 復原、DLL 載入、符號解析、IAT patch、relocation 或程式執行。OFT 為零的 fallback 假設 FirstThunk 仍保有 lookup entries；本 API 不偵測 binding，也不還原已被覆寫的 lookup table。

## 實際驗證

工具鏈為 Rust／Cargo 1.99.0。下列三項均已實際執行並成功：

```sh
cargo fmt --all -- --check
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
```

合計 89 項測試通過：PE 31 項、loader 54 項、CLI 4 項。其中新增 28 項，原有 61 項保留。測試涵蓋兩種 PE 格式、fallback、名稱／ordinal、hint、多 DLL、完整終止條件、各結構截斷、無效 RVA、overflow、保留位元、字串與全域資源上限、跨 section 讀取、唯讀性、CLI 成功／失敗輸出。

額外以所有檔案截斷長度、固定種子的資料突變及手動修改的 PeImage metadata 測試，未發生 panic。這是 deterministic robustness coverage，並非任意輸入的形式證明。

建置使用獨立 CARGO_TARGET_DIR，避免改寫 repository 內已追蹤的 target 產物。`git diff --check` 亦通過。

## 下一階段計畫（尚未實作）

建議 Task 005 聚焦 Base Relocation Table 的唯讀解析，沿用現有 `winmac-loader` 放置方式，讓檢視器先列出重定位需求。

1. 在 loader 增加獨立 relocation 模組，解析 Data Directory index 5、block header 與 type／offset entries，提供具型別的結果與錯誤。
2. 驗證 block 大小、目錄邊界、entry 寬度、page RVA 加 offset 的 overflow 與目標 image 邊界。明確區分可識別與不支援的 machine／relocation type，避免把架構相關類型一律當成 x86。
3. CLI 先提供摘要；加入 synthetic block、多 block、padding、截斷、惡意大小與不支援類型測試，再跑相同三道檢查。

此階段只解析 metadata，不調整 LoadedImage 內容。真正套用 relocation 應另立後續任務，先設計新基址差值、支援類型，以及失敗時不留下半套修改的行為。memory、runtime、win32 目前仍為 placeholder，暫不擴充執行功能。
