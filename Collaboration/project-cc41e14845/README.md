# 建功班務｜班級佈告板

可操作原型，包含依登入身分呈現的公告搜尋與篩選、教師發布／編輯／封存、學生已讀確認、附件管理、班級行事，以及受班級權限保護的資源連結與私有資源檔案。

首頁會讀取公告 API，不再以畫面上的角色切換或示範資料決定權限。API 以登入信箱對應本機 `users` 與 `memberships` 測試資料，所有讀寫都先驗證班級成員關係。不會連線到正式帳號、學生名冊或校務資料。

## 第一輪驗證

- `node --test tests/source-contract.test.mjs`：檢查教師／學生流程與資料模型基線。
- `sqlite3 ':memory:' ".read drizzle/0000_class_bulletin_baseline.sql"`：以記憶體資料庫驗證 migration 可套用。
- `npm run test:logic`：驗證公告輸入、教師／學生權限與 API 授權契約，不需要正式帳號或資料庫。

## 本機合成資料

`scripts/create-local-synthetic-db.sh` 會依序套用所有 migration，並建立一個新的 SQLite 資料庫，放入下列**不可用於真實帳號**的測試資料：一名教師、兩名學生、一則有效公告、一則封存公告、一則過期公告、一筆近期班級行事與一筆班級資源。所有帳號均使用保留的 `example.invalid` 網域；資料庫會放在已忽略的 `.local-data/`，且目標檔案已存在時腳本會拒絕覆寫。

```bash
npm run db:seed:local
```

若要指定另一個新的隔離資料庫路徑，可直接執行：

```bash
bash scripts/create-local-synthetic-db.sh /tmp/class-bulletin-synthetic.db
```

資料種子可安全重複套用，且測試會驗證其不重複建立班級、公告、附件或已讀紀錄。這是資料與授權情境的本機驗證；完整瀏覽器端到端測試仍須以本機 Cloudflare D1 模擬環境，並只注入上述合成身分。

## 安全界線

首頁先呼叫 `GET /api/classes` 取得目前登入者在 `memberships` 中的班級，再由使用者選擇班級載入公告、近期行事與資源；前端不再內建班級 ID，也不會因切換班級而暫時顯示上一班的資料。API 只回傳已授權班級，公告清單、發布、編輯、封存、已讀、行事與資源管理仍各自以伺服器端身分驗證與班級成員授權保護。公告編輯一律送出完整內容，並重用發布時的欄位、截止時間與布林值驗證，避免不完整請求意外清空設定。學生只會收到自己的已讀狀態；教師只會收到每則公告的已讀人數彙總，不會取得個別學生閱讀時間。`?view=archived` 的封存檢視僅限本班教師。班級行事只列出未來項目，新增與刪除均限所屬班教師。班級資源連結由教師建立或刪除、班級成員可讀取，且只接受不含帳密的 HTTPS 網址；前端另開分頁時會使用 `noopener noreferrer`。教師也可上傳私有班級資源檔案，每班最多 20 個、每個最多 10 MB；下載與刪除都會先確認班級成員身分，上傳與刪除限本班教師。資源檔案與公告附件均從私有 R2 `ATTACHMENTS` 讀取，採強制下載、私有不快取與保守的內容類型。

教師可在發布公告時或既有公告上傳附件，每則最多 5 個、每個最多 10 MB，接受 PDF、TXT、JPG、PNG、WEBP、DOCX、XLSX 與 PPTX。上傳 API 會先驗證登入者是該公告所屬班級的教師，再以不可預測的 R2 物件鍵保存；若資料庫寫入失敗，會盡力刪除剛寫入的 R2 物件，避免留下孤立附件。教師也可刪除附件與班級資源檔案：端點先確認登入、班級教師身分與所屬班級，再移除私有 R2 物件及其資料庫中繼資料。因 R2 與 D1 無法共用交易，刪除前會暫存最多 10 MB 的私有物件；若資料庫清理失敗，會立即還原物件與保留紀錄，避免形成失效下載連結。若還原本身也失敗，API 會明確回報管理者介入需求。檔案的 MIME 資訊與副檔名都必須符合允許清單，且下載一律強制下載，降低瀏覽器直接執行內容的風險。仍須在本機 D1／R2 模擬環境做實際的上傳、拒絕與失敗清理驗證。

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This prototype does not use `wrangler.jsonc`.

## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/schema.ts` 定義公告板的 D1 資料模型
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build the starter and verify its rendered loading skeleton
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
