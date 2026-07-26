import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");
const rootPath = fileURLToPath(root);

test("bulletin UI uses the authenticated API for teacher and student workflows", async () => {
  const [page, home] = await Promise.all([
    source("app/BulletinBoard.tsx"),
    source("app/page.tsx"),
  ]);
  for (const expected of ["發布公告", "確認已讀", "toggleArchive", "搜尋公告", "fetchAnnouncements", "setBulletinViewer"]) {
    assert.match(page, new RegExp(expected));
  }
  assert.doesNotMatch(page, /initialAnnouncements/);
  assert.doesNotMatch(page, /以教師管理|以學生檢視/);
  assert.match(page, /role === "teacher"/);
  assert.match(page, /role === "student"/);
  assert.match(page, /fetch\("\/api\/classes"/);
  assert.match(page, /aria-label="選擇班級"/);
  assert.doesNotMatch(page, /const CLASS_ID/);
  assert.doesNotMatch(page, /2 年 3 班/);
  assert.doesNotMatch(home, /2 年 3 班/);
});

test("class list API exposes only memberships held by the authenticated user", async () => {
  const classRoute = await source("app/api/classes/route.ts");

  assert.match(classRoute, /getChatGPTUser/);
  assert.match(classRoute, /findCurrentUser/);
  assert.match(classRoute, /from\(memberships\)/);
  assert.match(classRoute, /innerJoin\(classes, eq\(memberships\.classId, classes\.id\)\)/);
  assert.match(classRoute, /where\(eq\(memberships\.userId, currentUser\.id\)\)/);
  assert.match(classRoute, /請先登入後再使用班級佈告板/);
});

test("switching classes cannot reuse a previous class viewer role", async () => {
  const page = await source("app/BulletinBoard.tsx");

  assert.match(page, /type BulletinViewer = BulletinResponse\["viewer"\] & \{\s*classId: number;/);
  assert.match(page, /setBulletinViewer\(\{ \.\.\.data\.viewer, classId \}\)/);
  assert.match(page, /bulletinViewer\?\.classId === selectedClassId/);
  assert.match(page, /selectedClass\?\.role \?\? null/);
});

test("baseline migration preserves the core access and read-receipt records", async () => {
  const sql = await source("drizzle/0000_class_bulletin_baseline.sql");
  for (const table of ["users", "classes", "memberships", "announcements", "attachments", "read_receipts"]) {
    assert.match(sql, new RegExp(`CREATE TABLE \\\`${table}\\\``));
  }
  assert.match(sql, /read_receipts_announcement_user_unique/);
  assert.match(sql, /memberships_class_user_unique/);
});

test("班級行事使用獨立 migration，且本機種子資料可安全涵蓋此流程", async () => {
  const [migration, schema, seed, script] = await Promise.all([
    source("drizzle/0001_class_events.sql"),
    source("db/schema.ts"),
    source("scripts/local-synthetic-seed.sql"),
    source("scripts/create-local-synthetic-db.sh"),
  ]);
  assert.match(migration, /CREATE TABLE `class_events`/);
  assert.match(migration, /class_events_class_starts_title_unique/);
  assert.match(schema, /export const classEvents/);
  assert.match(seed, /INSERT INTO `class_events`/);
  assert.match(seed, /existing\.title = '【本機合成】物理實驗分組'/);
  assert.match(script, /for migration_path in drizzle\/\*\.sql/);
});

test("班級資源使用獨立 migration，且本機種子資料可安全涵蓋此流程", async () => {
  const [migration, schema, seed] = await Promise.all([
    source("drizzle/0002_class_resources.sql"),
    source("db/schema.ts"),
    source("scripts/local-synthetic-seed.sql"),
  ]);
  assert.match(migration, /CREATE TABLE `class_resources`/);
  assert.match(migration, /class_resources_class_url_unique/);
  assert.match(schema, /export const classResources/);
  assert.match(seed, /INSERT INTO `class_resources`/);
  assert.match(seed, /existing\.url = 'https:\/\/example\.invalid\/class-physics-files'/);
});

test("班級資源檔案使用獨立 migration，且本機種子資料可安全涵蓋此流程", async () => {
  const [migration, limitMigration, schema, seed] = await Promise.all([
    source("drizzle/0003_class_resource_files.sql"),
    source("drizzle/0004_class_resource_file_limit.sql"),
    source("db/schema.ts"),
    source("scripts/local-synthetic-seed.sql"),
  ]);
  assert.match(migration, /CREATE TABLE `class_resource_files`/);
  assert.match(migration, /class_resource_files_class_storage_key_unique/);
  assert.match(schema, /export const classResourceFiles/);
  assert.match(seed, /INSERT INTO `class_resource_files`/);
  assert.match(seed, /synthetic\/class-resource-files\/physics-preview\.pdf/);
  assert.match(limitMigration, /CREATE TRIGGER `class_resource_files_max_per_class`/);
  assert.match(limitMigration, /class_resource_files_limit_exceeded/);
});

test("班級行事 API 會依班級成員權限列出、新增、編輯與刪除資料", async () => {
  const [collectionRoute, deleteRoute, page, policy] = await Promise.all([
    source("app/api/classes/[classId]/events/route.ts"),
    source("app/api/events/[eventId]/route.ts"),
    source("app/BulletinBoard.tsx"),
    source("lib/bulletin-policy.ts"),
  ]);
  assert.match(collectionRoute, /requireClassMembership/);
  assert.match(collectionRoute, /eq\(classEvents\.classId, classId\)/);
  assert.match(collectionRoute, /gte\(classEvents\.startsAt/);
  assert.match(collectionRoute, /canPublishAnnouncements/);
  assert.match(deleteRoute, /requireClassMembership/);
  assert.match(deleteRoute, /canPublishAnnouncements/);
  assert.match(deleteRoute, /export async function PATCH/);
  assert.match(deleteRoute, /parseUpdateClassEventInput/);
  assert.match(deleteRoute, /updatedAt: new Date\(\)\.toISOString\(\)/);
  assert.match(deleteRoute, /\.update\(classEvents\)/);
  assert.match(deleteRoute, /db\.delete\(classEvents\)/);
  assert.match(policy, /parseCreateClassEventInput/);
  assert.match(policy, /parseUpdateClassEventInput/);
  assert.match(policy, /行事結束時間必須晚於開始時間/);
  assert.match(page, /\/api\/classes\/\$\{classId\}\/events/);
  assert.match(page, /\/api\/events\/\$\{item\.id\}/);
  assert.match(page, /新增行事/);
  assert.match(page, /updateEvent/);
  assert.match(page, /editEventTitle/);
});

test("班級資源 API 會依班級成員權限列出、新增與刪除安全連結", async () => {
  const [collectionRoute, deleteRoute, page, policy] = await Promise.all([
    source("app/api/classes/[classId]/resources/route.ts"),
    source("app/api/resources/[resourceId]/route.ts"),
    source("app/BulletinBoard.tsx"),
    source("lib/bulletin-policy.ts"),
  ]);
  assert.match(collectionRoute, /requireClassMembership/);
  assert.match(collectionRoute, /eq\(classResources\.classId, classId\)/);
  assert.match(collectionRoute, /canPublishAnnouncements/);
  assert.match(deleteRoute, /findClassResourceClassId/);
  assert.match(deleteRoute, /requireClassMembership/);
  assert.match(deleteRoute, /canPublishAnnouncements/);
  assert.match(deleteRoute, /db\.delete\(classResources\)/);
  assert.match(policy, /parseCreateClassResourceInput/);
  assert.match(policy, /資源網址必須是 HTTPS 網址/);
  assert.match(page, /\/api\/classes\/\$\{classId\}\/resources/);
  assert.match(page, /\/api\/resources\/\$\{item\.id\}/);
  assert.match(page, /rel="noopener noreferrer"/);
  assert.match(page, /新增連結/);
});

test("班級資源檔案 API 會以教師權限保護私有上傳、下載與可還原的刪除", async () => {
  const [collectionRoute, downloadRoute, deleteRoute, privateFileDelete, page, policy] = await Promise.all([
    source("app/api/classes/[classId]/resource-files/route.ts"),
    source("app/api/resource-files/[resourceFileId]/download/route.ts"),
    source("app/api/resource-files/[resourceFileId]/route.ts"),
    source("lib/private-file-delete.ts"),
    source("app/BulletinBoard.tsx"),
    source("lib/bulletin-policy.ts"),
  ]);
  assert.match(collectionRoute, /requireClassMembership/);
  assert.match(collectionRoute, /canPublishAnnouncements/);
  assert.match(collectionRoute, /maxClassResourceFiles/);
  assert.match(collectionRoute, /bucket\.put\(storageKey/);
  assert.match(collectionRoute, /bucket\.delete\(storageKey\)/);
  assert.match(collectionRoute, /isClassResourceFileLimitError/);
  assert.match(downloadRoute, /requireClassMembership/);
  assert.match(downloadRoute, /bucket\.get\(resourceFile\.storageKey\)/);
  assert.match(downloadRoute, /buildAttachmentDownloadHeaders/);
  assert.match(deleteRoute, /canPublishAnnouncements/);
  assert.match(deleteRoute, /deletePrivateFileWithMetadataRollback/);
  assert.match(deleteRoute, /db\.delete\(classResourceFiles\)/);
  assert.match(privateFileDelete, /await bucket\.delete\(storageKey\)/);
  assert.match(privateFileDelete, /await bucket\.put\(storageKey, backup/);
  assert.match(policy, /parseCreateClassResourceFileInput/);
  assert.match(policy, /parseClassResourceFileId/);
  assert.match(page, /\/api\/classes\/\$\{classId\}\/resource-files/);
  assert.match(page, /form\.get\("file"\)/);
  assert.match(page, /name="file" type="file" accept=\{acceptedAttachmentTypes\}/);
  assert.match(page, /\/api\/resource-files\/\$\{item\.id\}\/download/);
  assert.match(page, /上傳檔案/);
});

test("announcement API routes enforce membership-backed actions", async () => {
  const [collectionRoute, archiveRoute, readRoute, policy] = await Promise.all([
    source("app/api/classes/[classId]/announcements/route.ts"),
    source("app/api/announcements/[announcementId]/route.ts"),
    source("app/api/announcements/[announcementId]/read/route.ts"),
    source("lib/bulletin-policy.ts"),
  ]);

  assert.match(collectionRoute, /requireClassMembership/);
  assert.match(collectionRoute, /canPublishAnnouncements/);
  assert.match(archiveRoute, /requireClassMembership/);
  assert.match(archiveRoute, /canPublishAnnouncements/);
  assert.match(readRoute, /requireClassMembership/);
  assert.match(readRoute, /canConfirmRead/);
  assert.match(readRoute, /onConflictDoNothing/);
  assert.match(policy, /parseCreateAnnouncementInput/);
  assert.match(policy, /公告標題須為 1 至 120 個字元/);
});

test("教師可在原公告班級權限下編輯完整公告內容", async () => {
  const [route, page, policy] = await Promise.all([
    source("app/api/announcements/[announcementId]/route.ts"),
    source("app/BulletinBoard.tsx"),
    source("lib/bulletin-policy.ts"),
  ]);

  assert.match(route, /findAnnouncementClassId/);
  assert.match(route, /requireClassMembership/);
  assert.match(route, /canPublishAnnouncements/);
  assert.match(route, /parseUpdateAnnouncementInput/);
  assert.match(route, /updatedAt: now/);
  assert.match(page, /updateAnnouncement/);
  assert.match(page, /編輯/);
  assert.match(page, /儲存變更/);
  assert.match(policy, /parseUpdateAnnouncementInput/);
  assert.match(policy, /置頂與已讀設定必須是布林值/);
});

test("附件下載一律先驗證登入身分、公告所屬班級與儲存物件", async () => {
  const [downloadRoute, page, policy] = await Promise.all([
    source("app/api/attachments/[attachmentId]/download/route.ts"),
    source("app/BulletinBoard.tsx"),
    source("lib/bulletin-policy.ts"),
  ]);

  assert.match(downloadRoute, /getChatGPTUser/);
  assert.match(downloadRoute, /findCurrentUser/);
  assert.match(downloadRoute, /innerJoin\(announcements, eq\(attachments\.announcementId, announcements\.id\)\)/);
  assert.match(downloadRoute, /requireClassMembership\(db, currentUser\.id, attachment\.classId\)/);
  assert.match(downloadRoute, /bucket\.get\(attachment\.storageKey\)/);
  assert.match(downloadRoute, /buildAttachmentDownloadHeaders/);
  assert.match(policy, /parseAttachmentId/);
  assert.match(page, /\/api\/attachments\/\$\{attachment\.id\}\/download/);
});

test("教師附件上傳受公告班級、檔案限制與 R2 清理機制保護", async () => {
  const [uploadRoute, page, policy] = await Promise.all([
    source("app/api/announcements/[announcementId]/attachments/route.ts"),
    source("app/BulletinBoard.tsx"),
    source("lib/bulletin-policy.ts"),
  ]);

  assert.match(uploadRoute, /getChatGPTUser/);
  assert.match(uploadRoute, /findAnnouncementClassId/);
  assert.match(uploadRoute, /requireClassMembership/);
  assert.match(uploadRoute, /canPublishAnnouncements/);
  assert.match(uploadRoute, /maxAttachmentsPerAnnouncement/);
  assert.match(uploadRoute, /bucket\.put\(storageKey/);
  assert.match(uploadRoute, /bucket\.delete\(storageKey\)/);
  assert.match(uploadRoute, /httpMetadata: \{ contentType: upload\.contentType \}/);
  assert.match(policy, /parseAttachmentUpload/);
  assert.match(policy, /maxAttachmentSizeBytes/);
  assert.match(page, /\/api\/announcements\/\$\{announcementId\}\/attachments/);
  assert.match(page, /accept=\{acceptedAttachmentTypes\}/);
  assert.match(page, /新增附件/);
});

test("教師附件刪除會先驗證公告班級與教師身分，並在中繼資料失敗時還原私有物件", async () => {
  const [deleteRoute, privateFileDelete, page] = await Promise.all([
    source("app/api/attachments/[attachmentId]/route.ts"),
    source("lib/private-file-delete.ts"),
    source("app/BulletinBoard.tsx"),
  ]);

  assert.match(deleteRoute, /export async function DELETE/);
  assert.match(deleteRoute, /getChatGPTUser/);
  assert.match(deleteRoute, /innerJoin\(announcements, eq\(attachments\.announcementId, announcements\.id\)\)/);
  assert.match(deleteRoute, /requireClassMembership\(db, currentUser\.id, attachment\.classId\)/);
  assert.match(deleteRoute, /canPublishAnnouncements\(membership\.role\)/);
  assert.match(deleteRoute, /deletePrivateFileWithMetadataRollback/);
  assert.match(deleteRoute, /db\.delete\(attachments\)\.where\(eq\(attachments\.id, attachment\.id\)\)/);
  assert.match(privateFileDelete, /new Response\(storedFile\.body\)\.arrayBuffer\(\)/);
  assert.match(privateFileDelete, /PrivateFileMetadataDeleteError/);
  assert.match(page, /method: "DELETE"/);
  assert.match(page, /確定要刪除附件/);
});

test("所有 API route 的相對匯入都可解析至 app 內的實際模組", async () => {
  const routePaths = [
    "app/api/classes/route.ts",
    "app/api/classes/[classId]/announcements/route.ts",
    "app/api/announcements/[announcementId]/route.ts",
    "app/api/announcements/[announcementId]/read/route.ts",
    "app/api/announcements/[announcementId]/attachments/route.ts",
    "app/api/attachments/[attachmentId]/route.ts",
    "app/api/attachments/[attachmentId]/download/route.ts",
    "app/api/classes/[classId]/events/route.ts",
    "app/api/events/[eventId]/route.ts",
    "app/api/classes/[classId]/resources/route.ts",
    "app/api/resources/[resourceId]/route.ts",
    "app/api/classes/[classId]/resource-files/route.ts",
    "app/api/resource-files/[resourceFileId]/route.ts",
    "app/api/resource-files/[resourceFileId]/download/route.ts",
  ];

  for (const routePath of routePaths) {
    const routeSource = await source(routePath);
    for (const match of routeSource.matchAll(/from "(\.\.\/[^\"]+)"/g)) {
      const target = resolve(rootPath, dirname(routePath), match[1]);
      assert.equal(
        existsSync(`${target}.ts`) || existsSync(resolve(target, "index.ts")),
        true,
        `${routePath} 的 ${match[1]} 必須可解析`,
      );
    }
  }
});

test("announcement listing returns only safe, role-appropriate reading data", async () => {
  const collectionRoute = await source("app/api/classes/[classId]/announcements/route.ts");

  assert.match(collectionRoute, /leftJoin\(\s*readReceipts/);
  assert.match(collectionRoute, /eq\(readReceipts\.userId, currentUser\.id\)/);
  assert.match(collectionRoute, /or\(isNull\(announcements\.expiresAt\), gt\(announcements\.expiresAt, now\)\)/);
  assert.match(collectionRoute, /attachmentsByAnnouncement/);
  assert.match(collectionRoute, /membership\.role === "student" \? \{ hasRead: row\.readAt !== null \}/);
  assert.match(collectionRoute, /membership\.role === "teacher"[\s\S]*readReceiptCount/);
  assert.match(collectionRoute, /parseAnnouncementListView/);
  assert.match(collectionRoute, /只有本班教師可以查看封存公告/);
  assert.match(collectionRoute, /viewer: \{ role: membership\.role/);
});
