# 3D Physics Classroom：跨電腦交接

更新日期：２０２６－１０－０２。此文件取代９月１５日的舊交接狀態。

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
- 2D 視角目前是沿座標軸觀看的透視相機；不是正交相機。１０月２日已修正「看完整場景」保留所選平面方向並框住完整軌跡。
- 單一老師授課模型；多個授權分頁同時修改最後寫入生效。斷線待傳操作仍可能在恢復連線後提交。
- 電磁模型限均勻固定場、非相對論點粒子；拋體不含阻力／反彈；簡諧無阻尼。不可宣稱通用物理引擎。
- Three.js 主 bundle 有超過５００ kB 的建置提醒；目前不是錯誤，之後可按模型拆載入。


## ２０２６－０９－１８：瞬時速度箭頭

使用者要求拋體速度向量長度反映各時刻速度。`src/scene.js` 原本用固定箭長；現在拋體與簡諧的 v 使用 `src/velocity-arrow.js` 固定換算：箭頭分量＝瞬時速度分量×０．２５秒×顯示倍率，不逐幀正規化長度。短箭頭的箭頭尖端隨長度縮放，避免蓋過箭身。零速（含鉛直上拋最高點的浮點殘差）不顯示箭頭。合力與電磁場箭頭仍為方向示意，UI 明確標示比例與適用範圍。

驗證：build 與２０項單元測試通過。Chrome 學生端連本機 RTDB 模擬器，初速２０ m/s、６０度、同高度起落、倍率１，實際繪製資料為起點５格、最高點２．５格（水平）、落地前５格（向下）。已查看渲染畫面，場景時間由 RTDB 更新後學生立即改變箭頭。新增測試覆蓋水平分量不變、上下對稱、最高點長度比例、鉛直零速與倍率。資料庫格式與權限無更動，未重跑規則測試。

本次部署僅 Hosting；未修改正式教室場景。未重新驗證實體平板。本次未 commit／push。


## ２０２６－０９－１８：箭頭清晰度與自動網格

使用者要求所有箭頭更清楚、磁場軌跡不再超出固定網格。本次將 ArrowHelper 細線改為 cylinder＋cone 立體箭頭；文字改為粗體、深色底、同色框，按相機深度維持螢幕可读大小並嘗試避讓。方向示意箭頭拉遠時可增加顯示長度，數值型自由向量與力學速度箭頭長度不變。中文物理量標籤涵蓋 E／B／v／電力／磁力／合力。

新增 `src/scene-grid.js`：從完整已取樣軌跡／向量端點计算網格邊界，含原點與餘裕；共享１、２、５等級格距限制格線數量。XY 底面及兩個垂直參考面覆蓋軌跡范围。格距 DOM 顯示實際「座標單位」；力學速度比例尺與顯示倍率文案也改用座標單位，避免動態格距造成誤解。參數變更更新網格，不自動移動個人相機。「看完整場景」使用同一組完整取樣範圍。

驗證：build、２１項單元測試通過；新增大範圍／負座標／零範圍網格邊界與格線上限測試。Chrome 連接此次不可用，改用 Codex 內建瀏覽器實測：螺旋軌跡 Y＝０至４０，網格上界４４且格距２；自由向量顯示粗箭身與標籤；拋體最高點速度箭長仍２．５座標單位。檢查截圖與 console，無 JS error。未重測實體平板，未更動資料庫規則。標籤避讓是有限候選位置的盡力處理；極密集或極小視窗仍可能重疊。

本次發布既有專案的 Hosting，未修改正式教室資料。保留前次未提交的速度箭頭修改；未 commit／push。


## ２０２６－１０－０２：拋體水平／垂直速度分量

使用者要求斜拋的不同速度分量，並明確允許用本機 Firebase CLI 從 Terminal 發布。

- `src/velocity-arrow.js` 新增 projectileVelocityComponents，將瞬時速度分解為 X 與 Z 分量；合速度及分量使用同一 velocityArrowVector 比例。
- `src/scene.js` 在拋體模式加入橘色 v_x／藍色 v_z 箭頭，與綠色合速度共起點；兩條可更新虛線表示平行四邊形分解。零分量隱藏箭頭；關閉任一速度時隱藏分解虛線。切換模式清除幾何及診斷屬性，不改相機。
- `src/lab-ui.js` 增加右側公式與即時帶符號數值，以及水平／垂直速度的獨立顯示開關。其他模型不顯示這兩個開關。顯示偏好仍留在各瀏覽器，預設皆開啟；不寫入 RTDB，也不新增資料欄位／規則。
- `src/style.css` 新增分解資訊卡樣式。初速度仍由原有「初速率＋仰角」設定，未新增重複參數來源。

驗證：build、２２項單元測試通過；新增分量正交、向量和等於合速度、統一比例、上升／最高點／下降、平拋／鉛直拋／零速案例。Chrome 本機 teacher 使用 Auth 模擬器測試帳號解鎖，時間滑桿０→５００→７５０後 student 同步：初速２０、角６０、同高度起落，vₓ始終１０；最高點 v_z＝０且箭頭不可見；下降 v_z≈−８．６６０３，箭頭朝下、長２．１６５１座標單位。學生關閉水平箭頭不影響老師顯示。切換簡諧時分解卡與分量控制隱藏，console 無 error。截圖：`work/projectile-components-2026-10-02.jpg`（本機模擬器示範，work 不納入 Git）。未重測 iPad；規則未更動，未重跑規則測試。

發布：`npm run firebase -- deploy --only hosting`，既有 `physics-classroom-795b1`；未修改正式 PHYS01 資料。交接時未 commit／push。前面的歷史測試記錄以各日期為準。


## ２０２６－１０－０２：多物體拋體比較

完成２至４個物體的 XZ 拋體比較。六組教學範例：同初速不同角、互餘角、同射程３０公尺、同水平初速、同垂直初速、自由落下與平拋。每個物體可改名稱、初速、角度、高度、水平起點、延遲，共同重力／倍率／時間。範例先填草稿，按套用才同步並歸零；不持續鎖定範例的等值條件。

新增 comparison.js（解析物理與界限驗證）、comparison-ui.js（草稿、多物體表單及兩種比較表）。scene.js 繪製四色完整／已行進軌跡、球、瞬時速度與指定觀察物體分量；落地者停住速度０，等待者同樣不畫非零速度。修正平面相機與完整場景取景搭配，保留方向，按長寬視角框住全體軌跡。相機及顯示偏好不入資料庫。

physics.js 增加 comparison 模式和共同時鐘長度；snapshots.js 保留新欄位且相容舊 v1。規則產生器與 database.rules.json 加入固定 p0 至 p3、必須 p0／p1、完整欄位與數值界限；原老師 UID＋password provider 限制不變。所有改動保留前次尚未提交的單拋體速度分解。

驗證：npm test 通過２５項單元測試與７０項規則断言。新增預設物理關係、延遲／各自落地、零飛行時間、非法欄位、snapshot 相容性、未授權寫入及四物體上限。Chrome 本機 Auth／RTDB／Hosting 模擬器教師及學生端實測：同射程三體皆３０ m、最高點４．３３０１／７．５／１２．９９ m、飛行１．８７９１／２．４７３１／３．２５４８ s；四物體上限、延遲者待發射、負水平起點、共同播放及拖動時間、先落地者停止。學生單獨選Ｂ觀察、老師仍選Ａ；正視圖後 fit 保留 XZ 方向。console 無 error。截圖 work/multi-projectile-2026-10-02.jpg（本機測試場景）。

限制：未重測實體 iPad／Safari／校園網路。表格在窄側欄可水平捲動。預測／數值顯示由各學生自由選擇，無教師端強制隱藏答案。密集起點的標籤仍可能擁擠。無阻力、碰撞／反彈，尚未擴展到多個帶電粒子。

續作：依老師使用回饋再考慮自訂目標射程反解、指定時間對齊、跨模型多物體；先保留目前明確物理假設。啟動流程沿用上方，新設定需同步部署 Hosting＋Database：npm run deploy。不得只發布新版 Hosting 而漏掉比較模式規則。

發布完成：npm run deploy 成功發布既有 physics-classroom-795b1 的 Hosting 與 RTDB 規則。正式學生端重新開啟確認「已連線」、多物體選項存在、載入 app-D9OG5WaB.js，console 無 error；正式教室原有簡諧場景未改動。新版互動寫入在本機模擬器驗收，未用正式教師密碼重做多物體雲端寫入。本次未 commit／push。
