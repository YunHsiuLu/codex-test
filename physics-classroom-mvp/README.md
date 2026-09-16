# 向量教室｜3D Physics Classroom

更新：２０２６－０９－１６。Three.js ＋ Firebase Hosting ＋ Realtime Database ＋ Firebase Authentication。

## 網站

- 首頁：<https://physics-classroom-795b1.web.app/>
- 老師端：<https://physics-classroom-795b1.web.app/teacher.html?room=PHYS01>
- 學生端：<https://physics-classroom-795b1.web.app/student.html?room=PHYS01>

老師輸入自己設定的老師密碼，解鎖後修改同教室場景。學生不用登入。每個瀏覽器保有獨立相機；不需同一 Wi-Fi。

## 老師密碼與安全

介面只要求老師密碼。後台使用 Firebase Authentication 的 email/password，固定老師帳號由 Firebase Console 建立；不是把密碼藏在 JavaScript 裡。原本不加 Authentication 的 MVP 限制，已依使用者要求修正為真正的資料庫寫入權限。

規則只接受指定老師 UID 與 password 登入提供者。未登入、其他帳號、自行註冊或猜到老師網址，都不能新增、修改、刪除向量或模型，也無法自行取得老師權限。學生可讀取已知教室代碼的資料，不能列舉所有教室。

老師密碼由本人在 Firebase Console 設定；本程式未記錄密碼。登入使用分頁工作階段持續性，並提供「鎖定老師端」。關閉分頁或在共用設備上結束授課時，建議按鎖定。已分享出去的老師密碼具有同一老師權限。

修改密碼：由老師本人在 Firebase Console 的 Authentication 管理該帳號。不要刪除重建帳號，否則 UID 會變，需要同步更新 `scripts/build-rules.mjs` 的授權 UID、測試 fixture，再產生及部署規則。Firebase 管理員權限另由 Firebase Console 管理，與本網站老師密碼不同。

## 模式一：自由向量

新增／選取向量，設定名稱、色彩、起點與分量，再按「儲存並同步」。移動起點會平移向量；終點＝起點＋分量。每室５０個槽位、座標與分量 −１００～１００。

## 模式二：向量運算

先在自由向量模式新增所需向量，再切到向量運算，選取 A、B：

- A＋B：顯示首尾相接與合向量。
- A−B：顯示 A＋（−B）。
- A×B：顯示右手定則方向與叉積分量。

以兩向量的分量運算並移至共同原點；不使用原本起點決定結果。修改 A／B 後會重新計算。結果與公式同步到學生。

## 模式三：帶電粒子・電磁場

完整方程：

```text
F = q (E + v × B)
dv/dt = F / m
dr/dt = v
```

參數：電荷 q（C）、正質量 m（kg）、初速度 v₀（m/s）、電場 E（N/C）、磁場 B（T），皆支援三維分量。另可設定總時間、每秒播放的物理時間、顯示倍率。所有物理數值採 SI，顯示倍率只影響畫面，不改變計算結果。

模型假設：均勻且固定的電磁場，非相對論點粒子，初始位置為原點，忽略重力、輻射、碰撞及粒子間作用。以解析解計算任意時間，不以畫面幀數累積數值積分，因此背景分頁恢復後仍能對上教室時間。

支援：

- 螺旋運動、圓周運動、純電場加速、交叉電磁場漂移、電子微秒尺度範例。
- 範例先載入表單，再按「套用參數並歸零」才會全班更新。
- 播放、暫停、歸零、時間滑桿；學生保有自己的視角。
- E、B、v、v×B、電力、磁力、合力的箭頭，各瀏覽器可自行開關。
- 瞬時位置、速度、v×B、qE、q（v×B）、F、速率與動能；純磁場另外顯示迴旋半徑、週期、螺距。
- 淡線為預測軌跡、亮線為已走過軌跡。「看完整場景」只調整目前瀏覽器相機。

不同物理量單位不同，方向箭頭不共用長度比例。實際大小以數值表為準。為維持教學顯示品質，限制最多１００圈，限制顯示軌跡範圍，並拒絕明顯超出非相對論模型的速度。此版本不處理空間變化場、時間變化場或相對論。

## 同步與資料

```text
rooms/{room}/vectors/v0..v49
rooms/{room}/lab
rooms/{room}/teacherAccess  （規則限定老師能讀的授權檢查路徑，不儲存資料）
```

`lab` 包含模型、運算選擇、粒子參數、播放旗標、基準物理時間及伺服器時間戳。所有裝置使用 Firebase 伺服器時間偏移計算目前播放時間；不是每幀上傳座標。網路延遲會造成短暫的控制抵達差異，恢復後會依相同時間基準追上。相機不寫入任何雲端路徑。

向量新增以 transaction 分配空槽，同一支向量多人修改採最後寫入者生效。模型設定採整份寫入，主要使用情境是一位老師控制一堂課。離線禁用修改；傳送中斷線時仍可能留有 Firebase 待送出操作，請等待同步完成。

## 本機開發與測試

需求：Node.js ２２．１２以上及 Java ２１。此目錄已有開發依賴；`work/jdk/Contents/Home` 已安裝 Oracle JDK ２１．０．１２．１（Apple Silicon），測試腳本會自動使用，無需修改系統 PATH。

```sh
cd '/Users/yulu_blacky/codex test/physics-classroom-mvp'
npm ci --cache ./work/npm-cache
npm test
# 測試會自行啟動並關閉模擬器；不要與另一組模擬器同時執行。
npm run emulators
```

本機入口：<http://127.0.0.1:5055/>，勾選本機模擬器。Database ９０００、Authentication ９０９９、Hosting ５０５５，全部 loopback。模擬器使用 demo 專案，不連正式資料庫。啟動後的 Authentication 是空的，測試用老師帳號必須有規則允許的 UID；自動規則測試已使用 mock auth 測試上下文，無需正式老師密碼。

`npm run dev` 啟用５１７３開發伺服器，仍需模擬器。直接用正式 config 且不加 `emulator=1` 會連正式資料庫，請留意教室代碼。

測試包含：

- 模型與物理１１項測試：加減／叉積、右手定則、純磁場守恆、正負電荷、螺旋、純電場、漂移、一般 E／B 運動微分檢查、功與能關係、微小 B 數值穩定、播放時鐘與非法參數。
- 資料庫規則３８項驗證：老師可修改、訪客與其他帳號被拒、不能竄改權限、不能寫相機、格式與範圍限制。
- 瀏覽器手動驗證記錄見 `HANDOFF.md`。

## 部署

正式專案：`physics-classroom-795b1`；資料庫：新加坡 `asia-southeast1`。

```sh
npm run firebase -- login --no-localhost
npm run deploy
```

部署工具沿用一般 Firebase CLI 的登入狀態，執行過 `firebase login` 即可使用；模擬器仍使用獨立的 `work/config`。**不要分享 work 目錄或任何登入權杖。**

網頁設定在 `public/firebase-config.json`，含 projectId、appId、apiKey、authDomain、databaseURL，為一般公開的 Firebase Web 設定，並非管理員密鑰。範例在 `public/firebase-config.example.json`。

修改資料庫規則：先更新 `scripts/build-rules.mjs`，再執行 `node scripts/build-rules.mjs` 產生 `database.rules.json`，完成 `npm test` 後部署。`firebase.json` 的 Hosting predeploy 會檢查設定並建置。

## 檔案分工

- `src/app.js`：兩端介面、密碼登入與向量編輯。
- `src/store.js`：Firebase Auth／Realtime Database、授權與伺服器時鐘。
- `src/physics.js`：純函式物理計算、向量運算與參數驗證。
- `src/lab-ui.js`：模型表單、範例、播放控制與物理量數值。
- `src/scene.js`：Three.js、獨立相機、軌跡與箭頭。
- `database.rules.json`：真正執行的資料庫權限與結構檢查。

沒有新增 Firestore、Cloud Functions 或付費方案。
