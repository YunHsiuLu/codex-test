# Collaboration Console

本機的 Codex 與 AGY 專案協作工作台。它不是一次性討論：Codex 會實作與驗證，AGY 會以唯讀方式檢查實際變更，再由 Codex 根據審查繼續修正。

## 啟動

在此資料夾執行：

```zsh
python3 server.py
```

接著在瀏覽器開啟：<http://127.0.0.1:8765>

## 協作流程

1. 輸入任務與專案資料夾名稱。
2. 程式會在 `Collaboration` 內建立專屬的專案子資料夾。
3. Codex 在該資料夾實作一個可驗證的項目並測試。
4. AGY 唯讀審查變更，標示是否仍需修正。
5. Codex 讀取審查意見進入下一個實作循環；只有 Codex 宣告完成且 AGY 批准時，任務才會結束。
6. 你可隨時按「停止」，或補充條件後按「送出下一輪」。

Codex 採用 `workspace-write` sandbox，但只能寫入任務的專屬子資料夾；AGY 採用 `plan` mode 並保持唯讀。任務與討論紀錄會儲存在 `.runs/tasks.json`，因此重新啟動程式後仍可繼續。

## 注意事項

- 每個協作循環會實際呼叫 Codex 與 AGY，會使用各自帳號的額度／配額。
- 這是一個本機程式，只綁定 `127.0.0.1`，不會對外公開。
- 專案實作不會自動 git commit、部署、連接正式資料庫，或寫到 `Collaboration` 以外的位置。
