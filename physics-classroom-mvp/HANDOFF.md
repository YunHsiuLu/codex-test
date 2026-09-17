# 3D Physics Classroom：跨電腦交接

更新日期：２０２６－０９－１７。此文件取代９月１５日的舊交接狀態。

## 現況

專案位於 `/Users/lvyunxiu/codex test/physics-classroom-mvp`，屬於上層 Git repository。已有正式 Firebase 專案與部署，並非等待建立專案。此次修改未 commit／push。

- 正式網站：https://physics-classroom-795b1.web.app/
- Firebase project：`physics-classroom-795b1`
- Realtime Database：`https://physics-classroom-795b1-default-rtdb.asia-southeast1.firebasedatabase.app`
- Hosting、Realtime Database、Authentication email/password。沒有 Firestore／Cloud Functions／Google 登入。
- 老師帳號由本人設定密碼。指定 UID：`sjOawvV1pKTvH9xcwKfpQg0Vc2C3`。規則要求該 UID 與 password provider。學生匿名讀取已知教室，不能寫入或列舉所有教室。
- 老師介面只輸入密碼；Firebase 使用 `public/firebase-config.json` 的 teacherEmail 或程式預設老師 email。不要索取、記錄或硬編碼老師密碼。

## 已存在且保留的功能

自由向量建立／修改／刪除與三軸拖曳；５０個固定槽位。向量加減、叉積、投影與夾角。均勻固定電磁場的解析解，完整 F＝q（E＋v×B），同步播放／暫停／時間。Z 軸向上的拋體、X 軸簡諧運動。QR code 學生連結、本機場景儲存與 JSON 匯出／匯入。相機留在各瀏覽器，不寫入資料庫。

## 本次完成

１．修正首頁將老師密碼放進 `pwd` 網址參數的問題。首頁直接呼叫 Firebase Auth，再讀取受規則保護的 teacherAccess，成功才導向乾淨的老師網址。
２．新增 `src/firebase-client.js` 共用初始化與登入。依正式／模擬器分開快取 Firebase app，使用 browserSessionPersistence。直接進老師頁同樣使用共用登入驗證。
３．移除老師頁的網址密碼自動登入；三個 HTML 在載入模組前移除舊 pwd，並加 no-referrer。密碼保留原始空白，不 trim；送出後清除輸入欄位。未自行儲存密碼。
４．依 package-lock 重裝缺漏的 QR code 依賴；第一次 npm ci 網路中斷，改用專案 work/npm-cache 重試成功。
５．已於本日成功執行 `npm run deploy`，Hosting 與 Database 規則均發布至既有正式專案。

舊版本曾把密碼放進網址；此修正無法撤回既有瀏覽紀錄、已分享網址或伺服器紀錄。若曾透過舊首頁登入，建議老師本人更換密碼。不要刪除重建 Firebase 帳號，否則 UID 會改變。

## 本次驗證證據

- 正式 build 成功。１９項單元測試通過（model、physics、features、login-url）。
- Database 模擬器５６項規則 assertions 通過，包括匿名／錯誤 UID／錯誤 provider 拒絕、老師寫入與資料格式。
- Chrome 本機：錯誤密碼留在首頁並顯示錯誤；正確模擬器密碼跳轉到 teacher.html?room=PHYS01&emulator=1，無 pwd，工作階段恢復且可新增向量。
- 新學生分頁取得新增向量，只讀。切換 Lorentz 並播放，學生 mode 與時間更新；學生已切換 XZ 視角，camera 僅有約 1e-11 浮點漂移，未被老師視角取代。
- 拋體、簡諧模式均切換成功並同步；簡諧畫面顯示 x＝3、a＝−12、總能量＝18、週期≈3.1416（預設值）。
- 鎖定老師端後模型選擇、參數、播放停用。
- 正式站瀏覽器未登入老師頁可載入；未授權編輯停用。正式 RTDB 匿名讀取 HTTP 200；向隔離測試教室的匿名寫入 HTTP 401，無資料寫入。
- 正式首頁 HTML 已確認新版 JS 與 no-referrer。

未使用本人正式密碼進行本次登入測試；成功登入流程在本機 Auth 模擬器驗證。未在實體 iPad／Safari／校園 Wi-Fi 執行本次驗收。拖曳與 JSON 匯入／匯出本次沒有完整重測，僅保留既有功能並跑 snapshot 單元與規則測試。

## 新電腦啟動／部署

```sh
cd '/Users/lvyunxiu/codex test/physics-classroom-mvp'
npm ci --cache ./work/npm-cache
npm test
npm run build
npm run emulators
```

本機首頁 `http://127.0.0.1:5055/`，勾本機模擬器；teacher／student 直連需 `?room=PHYS01&emulator=1`。資料庫９０００、Auth ９０９９、Hosting ５０５５，皆 loopback。Auth 模擬器帳號不會自動建立；需建立與規則指定 UID 相同的測試帳號，使用獨立測試密碼，不用正式密碼。模擬器重啟資料不持久化。

需要 Java ２１。腳本優先使用 `work/jdk/Contents/Home/bin`，不存在時使用 PATH 的 Java。`work/` 為忽略的本機工具／快取／CLI 登入狀態，不搬移或發布裡面的憑證。

正式設定 `public/firebase-config.json` 被 Git 忽略；新電腦依範例與 Firebase Console 網頁應用程式設定填入，不需要 service account 私鑰。`.firebaserc` 已指向正式專案。執行 `npm run firebase -- login` 登入後，以 `npm run deploy` 發布 Hosting 與規則。修改授權 UID 時同步更新規則產生器與測試，重新產生規則。

## 後續與已知限制

- 優先讓老師在正式站重新登入，並用實體 iPad／校園網路驗證 QR code、操作同步與畫面效能。
- 場景庫存在本機瀏覽器；換電腦須先匯出 JSON。
- 2D 視角目前是沿座標軸觀看的透視相機；不是正交相機。「看完整場景」與 2D 視角搭配的行為可再整理。
- 單一老師授課模型；多個授權分頁同時修改最後寫入生效。斷線待傳操作仍可能在恢復連線後提交。
- 電磁模型限均勻固定場、非相對論點粒子；拋體不含阻力／反彈；簡諧無阻尼。不可宣稱通用物理引擎。
- Three.js 主 bundle 有超過５００ kB 的建置提醒；目前不是錯誤，之後可按模型拆載入。
