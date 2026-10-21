# Rust 練習工作室

直接用瀏覽器開啟 index.html。完整課程在 [COURSE.md](COURSE.md)，第零步亦獨立放在 docs/00-install.md。

## 本機練習

安裝 Rust 後，在本資料夾開啟終端機：

```sh
cargo run --example step01
cargo test --example step11
```

修改 examples 中的起始程式；第十一課的測試預設失敗，這就是練習。參考答案獨立放在 solutions。

```sh
cargo run --example answer01
cargo test --example answer11
cargo test --example answer12
```

網頁編輯器的內容可以下載成 .rs，或開啟 Rust Playground 執行；第六課的互動輸入請用本機。網頁本身不含 Rust 編譯器。進度／筆記／程式碼保存於瀏覽器，請匯出 JSON 備份；不同瀏覽器或不同電腦不會自動同步。

## 維護

課程來源在 scripts/build.py，執行 `python3 scripts/build.py` 會重建 COURSE.md、lessons.js、安裝說明及所有起始／答案程式，會覆寫這些檔案；先備份學生作答再重建。index.html、style.css、app.js 為獨立網頁介面。

可直接雙擊 index.html；若瀏覽器限制本機儲存，可用 `python3 -m http.server 8765 --bind 127.0.0.1`，然後瀏覽 http://127.0.0.1:8765。Python 只用於維護或選用的預覽伺服器。
