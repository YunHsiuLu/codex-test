# 向量教室｜3D Physics Classroom MVP

Three.js ＋ Firebase Hosting ＋ Realtime Database。老師編輯同一教室的向量；學生只讀頁面即時更新，每個瀏覽器獨立使用 OrbitControls。未加入 Firestore、Cloud Functions 或 Authentication。

## 已完成

- `teacher.html`：新增、選取、重新命名、設定顏色、平移及刪除向量。
- `student.html`：訂閱同一教室的向量，只提供觀察與本機視角操作。
- 起點與分量分開設定，終點＝起點＋分量；顯示向量大小。
- 同一教室代碼共用資料，不同代碼分開；學生連結自動包含教室代碼。
- 零向量顯示起點與標籤；座標與分量範圍為 −１００～１００，每室最多５０支向量。
- 連線狀態、離線禁用寫入、錯誤提示、窄螢幕排版。

## 本機啟動

需求：Node.js ２２．１２以上，Java ２１。此工作目錄已有 Node，測試用 Java 放在 `work/jdk/Contents/Home`，啟動腳本自動使用它，不需要改系統 Java。

```sh
cd '/Users/lvyunxiu/codex test/physics-classroom-mvp'
npm ci --cache ./work/npm-cache
npm run build
npm run emulators
```

開啟 <http://127.0.0.1:5055/>，保留「本機模擬器」勾選。老師與學生用同一個教室代碼。

- 老師：<http://127.0.0.1:5055/teacher.html?room=PHYS01&emulator=1>
- 學生：<http://127.0.0.1:5055/student.html?room=PHYS01&emulator=1>

這是真正的 Firebase Database 與 Hosting 模擬器，不是 localStorage 假同步。本機模式必須在 loopback 網址且帶 `emulator=1` 才啟用，不會誤連正式資料庫。本機網址只供這台電腦測試；學校 iPad 使用部署後的 HTTPS 網址。

`work/` 是可重新產生的工具與快取，不納入版本控制。搬到另一台電腦時，安裝 Java ２１，或將官方 Temurin JDK 放入上述目錄。官方下載：<https://adoptium.net/temurin/releases/?version=21>。

開發即時更新可另開終端執行 `npm run dev`，使用 <http://127.0.0.1:5173/>；Database 模擬器仍需執行。

## 使用方式

１．老師輸入教室代碼後按「新增向量」。
２．在清單選擇向量，修改起點座標可平移，修改分量可改變方向與長度。
３．按「儲存並同步」，同教室的學生會收到更新。
４．老師複製學生網址分享給學生。學生拖曳旋轉、滾輪或雙指縮放，雙指拖曳平移。
５．「重設視角」只作用於目前瀏覽器。編輯向量不會重設任何人的相機。

## Firebase Console 設定與部署

可以直接使用網頁版 Firebase Console 管理專案與資料庫；CLI 用來上傳建置後的網站與規則。

１．在 <https://console.firebase.google.com/> 建立專案。無需啟用 Google Analytics、Gemini、Authentication 或付費升級。
２．建立 Realtime Database，選擇適合的區域（台灣教室可選新加坡，若介面提供）。先用鎖定模式建立，再部署本專案規則。
３．新增「網頁」應用程式，把 `firebaseConfig` 中的 `apiKey`、`projectId`、`databaseURL`、`appId` 填入 `public/firebase-config.json`。可複製 `public/firebase-config.example.json` 後修改。Database 建立後確認 `databaseURL` 完整包含資料庫名稱與區域。
４．登入 Firebase CLI，將本機專案對應到同一個 Firebase 專案：

```sh
npx firebase login
npx firebase use --add
```

５．部署：

```sh
npm run deploy
```

`npm run deploy` 會驗證正式設定、建置網頁，並部署 Hosting 與 Database 規則。`firebase.json` 的 Hosting predeploy 也會驗證設定並重新建置，避免直接執行部署時使用過期網頁。設定檔不含管理員金鑰，Firebase 網頁設定會隨網站公開。

部署前確認 CLI 的目標專案與 `firebase-config.json` 的 `projectId` 一致。初始 `.firebaserc` 使用 `demo-physics-classroom`，不會替你猜測正式專案。僅修改正式資料庫規則時可用 `npx firebase deploy --only database`；會取代該資料庫現行規則，因此本 MVP 建議使用獨立新專案。

部署後由 CLI 顯示 Hosting 網址，通常為 `https://PROJECT_ID.web.app/`。正式網址不加 `emulator=1`。老師與學生各自對 Firebase 連線，因此老師電腦更換校內 Wi-Fi IP 不影響分享網址；網路切換時會暫時斷線並重新連線。

## 無登入版本的權限限制

**學生端只讀是介面行為，不是經過身分驗證的老師／學生權限隔離。**

本版規則允許知道教室代碼的人讀取該室的向量並寫入有效格式的向量。任何人也能自行開老師頁面，或呼叫 Firebase API。不可將「教室代碼」視為密碼。Firebase API key 也不是老師密碼。

規則預設拒絕其他路徑、教室列表讀取、相機資料、未知欄位、不完整向量、超出範圍的數字及超過５０支向量。這些檢查防止資料格式破壞，不保證老師身分、不阻止公開端點被濫用。請僅使用非敏感教學示範資料。

需要真正限制只有老師可寫時，下一版必須引入可靠的身分驗證或受信任後端；本版遵守不加 Authentication／Functions 的需求。

## 測試

```sh
npm run build
npm run check
# 先停止已在執行的模擬器，再執行整合測試。
npm test
```

- 單元測試：教室代碼、防止路徑注入、向量大小、零向量、數值範圍。
- Firebase 規則整合測試：有效 CRUD、拒絕 camera 與未知欄位、拒絕非法座標與名稱、５０支上限。
- 瀏覽器驗證清單與本次結果見 `HANDOFF.md`。

## 架構

```text
teacher.html ─┐                       ┌─ student.html（相機 A）
              ├─ Realtime Database ──┼─ student.html（相機 B）
老師相機本機 ─┘  rooms/{room}/vectors └─ student.html（相機 C）
```

資料範例：

```json
{
  "rooms": {
    "PHYS01": {
      "vectors": {
        "v0": {
          "label": "F",
          "color": "#57dfc2",
          "origin": { "x": 0, "y": 0, "z": 0 },
          "components": { "x": 3, "y": 2, "z": 1 }
        }
      }
    }
  }
}
```

`src/scene.js` 管理 Three.js 與本機相機；`src/store.js` 只訂閱與寫入向量；`src/app.js` 管理兩端介面。向量使用 v0～v49 共５０個槽位，新增時以 Firebase transaction 取得空位，避免同時新增互相覆蓋。編輯只更新單支向量，不覆蓋整個教室。若多人同時編輯同一支向量，最後一次寫入生效。

## 第一版界線

以表單數值移動向量，尚無滑鼠拖曳控制把手、QR code、動畫或全息投影四面畫面。相機不傳雲端；重新整理頁面回到預設視角。固定網格範圍為２０，超出畫面時可縮放、平移。離線時禁用新增與儲存；送出途中斷線，Firebase 可能保留待送出操作直到重新連線，請勿在同步中關閉頁面。

## 官方文件

- [Three.js 安裝](https://threejs.org/manual/en/installation.html)
- [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html)
- [Firebase 讀寫與即時監聽](https://firebase.google.com/docs/database/web/read-and-write)
- [Database Security Rules](https://firebase.google.com/docs/database/security)
- [Firebase Hosting 部署](https://firebase.google.com/docs/hosting/quickstart)
