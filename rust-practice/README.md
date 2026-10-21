# Rust 終端機練習工作室

已經安裝 cargo 與 rustc，直接從第一課開始，不必重新安裝。

## 立刻開始

在終端機執行：

```sh
cd "/Users/lvyunxiu/codex test/rust-practice"
cargo run
cargo run -- lesson 1
```

`cargo run` 顯示課程目錄與操作方法。`lesson 1` 會在終端機印出第一課的觀念、起始程式、題目與驗收標準，不會提前顯示答案。

用你熟悉的編輯器開啟 `examples/step01.rs`。若想全程用終端機編輯，可使用已安裝的 nano 或 vim，例如：

```sh
nano examples/step01.rs
```

nano 中修改後按 Ctrl+O、Enter 儲存，再按 Ctrl+X 離開。接著執行：

```sh
cargo run -- run 1
```

也可以直接使用標準 Cargo 指令：

```sh
cargo run --example step01
```

修改、存檔、再執行，就是整套課程的練習方式。程式錯誤直接閱讀終端機中的編譯器訊息。

## 每課使用流程

```sh
cargo run -- lesson 2
cargo run -- run 2
cargo run -- hint 2
cargo run -- answer 2
```

依序是閱讀題目、執行自己的程式、需要時看提示、完成後比對答案。把課號換成 1 到 12。`cargo run -- lesson 0` 保留三種作業系統的安裝教材，供未來學生使用。

## 輸入與測試

第六課直接在終端機輸入資料：

```sh
cargo run -- run 6
```

第十一課練習測試：

```sh
cargo run -- test 11
```

第十一課的起始測試故意失敗；完成函式後再測一次。其他多數起始程式沒有自動測試，請依課程所列的輸入／輸出手動驗收；顯示「0 tests」不代表完成題目。

執行參考答案或測試答案：

```sh
cargo run --example answer01
cargo test --example answer11
cargo test --example answer12
```

## 教材與續作

完整文字在 COURSE.md，網頁 index.html 保留作為閱讀輔助。網頁筆記與終端機作答不會自動同步；終端機練習直接修改本機 examples 中的檔案，透過 GitHub 提交與同步原始檔即可搬移作答，不需製作壓縮包。換電腦時 clone 對應 repository，進入 rust-practice 後執行 `cargo run`。

本專案使用 Rust 2024 edition，最低需要 Rust 1.85，無第三方 Rust 套件。不需 Python、Node 或網頁服務就能練習。Windows／Linux 請先切換到自己放置此專案的位置，其餘 Cargo 指令相同；nano 是選用編輯器。

維護來源為 scripts/build.py；`python3 scripts/build.py` 會重建 COURSE.md、lessons.js、安裝說明、Cargo.toml 與所有起始／答案程式，會覆寫作答，執行前務必先備份。README.md 與 src/main.rs 獨立維護。交接記錄在 HANDOFF.md。
