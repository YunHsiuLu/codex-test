# WinMac Runtime

2026-10-09：**《洛克人 X4》已可遊玩。** 雙擊專案根目錄的 `Play-X4.command`。本版本使用專用 Wine backend，保留原 Rust runtime；使用者已確認可進關卡、正常操作與聲音。啟動、存檔與支援範圍見 [Task 012](docs/task-012-x4.md)。

以 Rust 建立的 Windows PE 檢視器與實驗性 runtime。目前已在 Apple Silicon macOS 上，使用 x86-64 指令直譯器跑通自製的最小 Windows 主控台 EXE。

這是有限功能的可執行原型，尚非一般 Windows 應用程式相容層。

2026-10-08 新增 Task 011：可執行使用 MessageBoxA 的 GUI 物理問答 EXE。以 `sh scripts/package-macos.sh /absolute/output/path` 打包後，雙擊 `Play-Quiz.command`。詳細用法與限制見 [Task 011](docs/task-011.md)。

## 快速執行

在此 workspace 目錄執行，需 Rust 1.99 或更新版本。

```sh
cargo run -p winmac-runtime --example make_demo -- samples/hello.exe
cargo run -p winmac-cli -- inspect samples/hello.exe
cargo run -p winmac-cli -- run samples/hello.exe
cargo run -p winmac-cli -- run samples/hello.exe --base 0x150000000
```

主控台輸出如下。

```text
Hello from WinMac on macOS!
```

stderr 另顯示執行摘要。

```text
WinMac: guest exited with code 0 (11 instructions, 3 API calls)
```

`winmac-cli <file.exe>` 保留原有檢視模式。執行必須明確指定 `run`，可用 `--max-instructions 100000` 控制步數。CLI 回傳 guest exit code 的低 8 bits，完整 32-bit 代碼顯示於摘要。範例由 Rust generator 重現，不依賴 Windows SDK；machine code 的人類可讀版本在 `samples/hello-x64.asm`。

## 架構與已完成階段

| 階段 | 實作 |
| --- | --- |
| Task 001–003 | PE／COFF、Optional Header、sections、RVA 轉換與非執行 image mapping，保留既有行為 |
| Task 004 | 安全 import table 解析與 CLI 顯示 |
| Task 005 | Base relocation table 解析，含 padding、HIGHADJ 雙 slot 與未知類型保留 |
| Task 006 | 對新的 Vec image 套用 HIGHLOW／DIR64，檢查重疊與邊界，支援正負基址差值 |
| Task 007 | Guest address space，區分 read／write／execute，檢查重疊、越界與容量 |
| Task 008 | 最小 kernel32 console API 模型與 IAT 綁定 |
| Task 009 | 受限 x64 指令直譯器與指令數上限 |
| Task 010 | Runtime／CLI 整合、可重現 PE 範例與端到端測試 |
| Task 011 | 最小 USER32 MessageBoxA 與 macOS 同步 UI 橋接、GUI 問答 EXE |

Task 005–010 是本次依「跑通最小 Windows 主控台程式」目標拆分的階段，不代表所有 Windows 相容性工作已完成。

`winmac-pe` 負責檔案格式，`winmac-loader` 負責匯入／重定位與映像建立，`winmac-memory` 提供有權限檢查的 guest memory，`winmac-win32` 提供純 Rust 主控台狀態，`winmac-runtime` 整合載入與直譯，CLI 提供 inspect／run。

## 現階段支援範圍

執行模式接受 AMD64、PE32+、console 或 GUI EXE；GUI API 暫限下述 MessageBoxA 子集。每個 guest address 都是數值，指令由 Rust 解碼與直譯，沒有 host executable memory、JIT、unsafe 或直接跳進 PE entry point。

匯入綁定接受 `user32.dll!MessageBoxA`，以及 `kernel32.dll` 的 `GetStdHandle`、`WriteFile`、`ExitProcess`、`GetLastError`、`SetLastError`。DLL 名稱不分大小寫，API 名稱區分大小寫。沒有載入 host DLL；IAT 寫入的是 runtime 專用 token。OFT 存在時不從 IAT 解析名稱。

`WriteFile` 只支援 stdout／stderr 的同步寫入，結果先保存在記憶體，成功結束後由 CLI 輸出。無檔案系統、網路、子程序、stdin、非同步 I/O 與一般 Win32 handle 支援。無效 handle 回報 Windows 錯誤碼，無效 guest pointer 則停止 runtime 並回報記憶體錯誤。

直譯器支援範例所需的指令形式及少量測試用指令：

- MOV：32／64-bit immediate 至暫存器、暫存器間搬移、C7 immediate 至有限的記憶體定址形式。
- LEA：RIP-relative、base register 與無 index 的 stack SIB。
- XOR：暫存器形式。
- ADD／SUB／CMP：81／83 immediate 至暫存器形式，只維護目前分支所需的 ZF。
- PUSH／POP、RET、relative CALL／JMP、FF indirect CALL／JMP、short JZ／JNZ、NOP。

其他指令或定址形式明確回報不支援。沒有完整 x86 flags、SIMD、浮點、CPU 特權功能、SEH unwind、TLS、CRT 初始化或多執行緒。TLS、load config、bound import、delay import、CLR 的非空目錄會在執行前拒絕。Exception metadata 不執行 unwind；guest 錯誤直接停止。

Guest image 上限 64 MiB，stack 為 1 MiB，預設 10 萬條指令、可設定上限 1000 萬條；stdout／stderr 各最多 1 MiB。單次 guest memory buffer 必須位於同一個 region。執行模式中的 IAT（含 sentinel）必須完整位於一個有檔案 backing 的 section。這些是目前的實作限制。

PE 檢視仍可解析 PE32 與 ARM64；執行 backend 目前僅限 AMD64。重定位套用支援 I386 HIGHLOW 及 AMD64／ARM64 DIR64，其他類型只解析，套用時明確拒絕。沒有 relocations 或 relocations stripped 的 image 不接受改變基址。

## 驗證

```sh
cargo fmt --all -- --check
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
```

2026-10-07：121 項測試通過，三道檢查通過。包含原有 Task 001–004 測試、重定位、guest memory 權限、API 錯誤、指令數限制、輸出由 PE 資料決定、不同載入基址、CLI 退出代碼、截斷／突變輸入等測試。

在 macOS arm64 上實際執行產出的 EXE，得到 11 條指令、3 次 API 呼叫與退出代碼 0。`file` 識別為 Windows x86-64 PE32+ console executable；系統 LLVM objdump 成功反組譯範例。尚未在真正 Windows 上執行驗證此範例。

本 repository 原本追蹤了 target 產物；此次驗證使用獨立 CARGO_TARGET_DIR，避免改寫它們。

## 後續方向

第一個可交付終點已達成。要擴展至一般編譯器產出的程式，下一步應建立外部編譯器產生的測試 corpus，再逐項擴充 decoder、memory addressing 與 flags；接著處理更多 Win32 API、TLS／CRT／SEH 與多模組載入。GUI 與大型應用程式仍屬後續範圍。

規格參考：[PE Format](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format)、[Windows x64 calling convention](https://learn.microsoft.com/en-us/cpp/build/x64-calling-convention)、[WriteFile](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-writefile)。

Task 011 驗證：124 項測試通過。MessageBoxA 僅支援 ASCII、無 owner、MB_OK／MB_YESNO；按鈕回傳後才繼續 guest 指令。詳見 docs/task-011.md。
