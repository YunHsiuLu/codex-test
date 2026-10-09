# Task 012 — 洛克人 X4 可玩版本

2026-10-09：已達成在這台 Apple Silicon Mac 上啟動使用者提供的《洛克人 X4》，進入關卡、操作角色並播放聲音。

## 如何開啟

雙擊專案根目錄的 `Play-X4.command`，或交付資料夾內的 `WinMac X4.app`。首次自動準備 Wine 與遊戲資料，之後直接啟動。

這台機器已完成準備，現在雙擊即可。若使用 `.command`，macOS 可能顯示終端機視窗；這是啟動器的正常行為。

遊戲執行於 800×600 Wine 虛擬桌面。開始遊戲與角色操作依遊戲內設定。原封裝說明提供以下快捷鍵：

- F4：切換遊戲視窗模式。
- F5：切換遊戲解析度。
- F6：切換色彩模式。

Mac 鍵盤若把 F 鍵設定為系統功能，需配合 Fn。離開遊戲請優先使用遊戲選單，讓存檔正常寫入。

## 資料位置

- 原始遊戲封裝：`洛克人 X4.rar`，未修改。
- 解壓後遊戲／存檔：`work/x4/game/`。
- 遊戲存檔檔案：`work/x4/game/RMX4SV00.DAT`。
- 專用 Wine prefix：`work/x4/prefix/`。
- 遊戲紀錄：`work/x4/game.log`。
- 準備紀錄：`work/x4/setup.log`。
- Wine runtime：`work/wine-runtime/`。

不要刪除 `work/x4/game/` 或 `work/x4/prefix/`，它們包含目前使用中的遊戲資料與設定。這些大型及個人資料由 `.gitignore` 排除。備份存檔前先正常離開遊戲。

交付的 `.app` 是這台機器的捷徑，引用目前 repository 路徑。若移動專案，使用根目錄的 `Play-X4.command`，並重新執行 `python3 scripts/package-x4.py <output-directory>` 建立捷徑。若整個 work 目錄搬移，需先修正或重建 prefix 內的 `C:\Games\RMX4` 連結，再重新準備。

## 技術方案

X4 是 PE32／Intel 80386 GUI EXE，匯入 KERNEL32、USER32、GDI32、ADVAPI32、IMM32、DINPUT、DSOUND、DDRAW、WINMM 與 MSVFW32。

本次使用 Wine 11.0_1 作為遊戲相容引擎，加上已安裝的 Rosetta 與 GStreamer。原有 Rust PE parser、loader、自製 x64 直譯器及 Task 011 的 GUI 示範均保留。真正遊戲改走 Wine backend，並非宣稱目前自製直譯器已支援完整 DirectX 或 x86 遊戲。

Wine 下載自 [Gcenx macOS Wine builds 11.0_1 發行頁](https://github.com/Gcenx/macOS_Wine_builds/releases/tag/11.0_1)，SHA-256 已核對：

```text
b50dc50ec7f41d58b115a6b685d4d1315ba3c797bd3aa0f49213f2703cb82388
```

全部遊戲登錄設定寫入專用 Wine prefix。依原封裝的 `rmx4.reg` 設定，將資源、BGM、SE、影片路徑指向 `C:\Games\RMX4`，並使用該遊戲的 Windows XP 相容設定與 OpenGL renderer。未下載破解、替換遊戲 EXE、啟動修改器或更改 macOS 全域安全設定。

Wine prefix 是相容環境，不是安全沙箱。

## 驗證結果

- 原始封裝已成功解壓，遊戲 EXE 與各資源資料夾存在。
- Wine 發行檔 SHA-256 與發行 metadata 一致。
- Wine prefix 建立與遊戲登錄資料寫入成功。
- 實際啟動 `rmx4.exe`，程序持續執行。
- 使用者確認已看到遊戲標題／選單。
- 使用者進一步確認「能進關卡並正常操作，聲音也正常」。
- 自動操作工具無法連接 Wine 視窗，因此畫面、操作與聲音驗收採上述使用者實測回報；未冒稱自動驗證。
- 原專案 `cargo fmt --all -- --check`、`cargo test --workspace`、`cargo clippy --workspace --all-targets -- -D warnings` 全部通過，共 124 項測試。
- 新增 Python 腳本通過語法檢查，shell 啟動器通過 `sh -n`。

已驗證進入關卡與基本操作，尚未驗證全破、長時間遊玩、所有過場影片與手把。本次依使用者選擇只驗收 X4；X5 與 R7PlusTW 尚未配置。
