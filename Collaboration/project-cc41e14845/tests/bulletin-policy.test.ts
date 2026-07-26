import assert from "node:assert/strict";
import test from "node:test";
import {
  ApiError,
  buildClassResourceFileStorageKey,
  classResourceFileLimitErrorCode,
  buildAttachmentDownloadHeaders,
  canConfirmRead,
  canPublishAnnouncements,
  maxClassResourceFiles,
  maxAttachmentSizeBytes,
  isClassResourceFileLimitError,
  parseAttachmentId,
  parseAttachmentUpload,
  parseAnnouncementId,
  parseAnnouncementListView,
  parseClassId,
  parseClassEventId,
  parseClassResourceFileId,
  parseClassResourceId,
  parseCreateClassResourceFileInput,
  parseCreateClassEventInput,
  parseUpdateClassEventInput,
  parseCreateClassResourceInput,
  parseCreateAnnouncementInput,
  parseUpdateAnnouncementInput,
} from "../lib/bulletin-policy.ts";
import {
  deletePrivateFileWithMetadataRollback,
  PrivateFileMetadataDeleteError,
  type PrivateFileBucket,
} from "../lib/private-file-delete.ts";

test("只接受安全的正整數班級與公告編號", () => {
  assert.equal(parseClassId("23"), 23);
  assert.equal(parseAnnouncementId("8"), 8);
  assert.equal(parseAttachmentId("4"), 4);
  assert.equal(parseClassEventId("5"), 5);
  assert.equal(parseClassResourceId("6"), 6);
  assert.equal(parseClassResourceFileId("7"), 7);
  for (const value of ["0", "01", "3.1", "-2", "3 OR 1=1"]) {
    assert.throws(() => parseClassId(value), ApiError);
  }
});

test("附件下載回應使用安全檔名、私有快取與保守的內容類型", () => {
  const headers = buildAttachmentDownloadHeaders("  實驗\r\n說明\".pdf  ", "application/pdf", 24576);
  assert.match(headers.get("Content-Disposition") ?? "", /filename="_______.pdf"/);
  assert.match(headers.get("Content-Disposition") ?? "", /filename\*=UTF-8''/);
  assert.equal(headers.get("Content-Type"), "application/pdf");
  assert.equal(headers.get("Content-Length"), "24576");
  assert.equal(headers.get("Cache-Control"), "private, no-store, max-age=0");
  assert.equal(headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(buildAttachmentDownloadHeaders("a.txt", "text/plain\r\nX-Test: bad", -1).get("Content-Type"), "application/octet-stream");
  assert.equal(buildAttachmentDownloadHeaders("a.txt", "text/plain", -1).has("Content-Length"), false);
});

test("附件上傳限制安全檔名、格式、大小與副檔名", () => {
  assert.deepEqual(
    parseAttachmentUpload({ name: "  物理實驗說明.PDF  ", type: "application/pdf", size: 1024 }),
    { originalName: "物理實驗說明.PDF", contentType: "application/pdf", sizeBytes: 1024 },
  );
  for (const value of [
    { name: "../secret.pdf", type: "application/pdf", size: 1 },
    { name: "講義.exe", type: "application/pdf", size: 1 },
    { name: "講義.pdf", type: "text/html", size: 1 },
    { name: "講義.pdf", type: "application/pdf", size: 0 },
    { name: "講義.pdf", type: "application/pdf", size: maxAttachmentSizeBytes + 1 },
  ]) {
    assert.throws(() => parseAttachmentUpload(value), ApiError);
  }
});

test("發布公告資料會驗證內容、分類與截止時間", () => {
  const input = parseCreateAnnouncementInput({
    title: "  物理實驗提醒  ",
    content: "  請於週一繳交實驗紀錄。  ",
    category: "作業",
    isPinned: true,
    requiresRead: true,
    expiresAt: "2026-08-01T14:00:00+08:00",
  });
  assert.deepEqual(input, {
    title: "物理實驗提醒",
    content: "請於週一繳交實驗紀錄。",
    category: "作業",
    isPinned: true,
    requiresRead: true,
    expiresAt: "2026-08-01T06:00:00.000Z",
  });
  assert.throws(
    () => parseCreateAnnouncementInput({ title: "x", content: "內容", category: "其他" }),
    ApiError,
  );
});

test("更新公告沿用完整欄位與截止時間驗證", () => {
  assert.deepEqual(
    parseUpdateAnnouncementInput({
      title: "  修正後標題  ", content: "  修正後內容  ", category: "班務",
      isPinned: false, requiresRead: true, expiresAt: null,
    }),
    { title: "修正後標題", content: "修正後內容", category: "班務", isPinned: false, requiresRead: true, expiresAt: null },
  );
  assert.throws(
    () => parseUpdateAnnouncementInput({ title: "標題", content: "內容", category: "班務" }),
    ApiError,
  );
});

test("權限矩陣限定教師發布、學生確認已讀", () => {
  assert.equal(canPublishAnnouncements("teacher"), true);
  assert.equal(canPublishAnnouncements("student"), false);
  assert.equal(canPublishAnnouncements("guardian"), false);
  assert.equal(canConfirmRead("student"), true);
  assert.equal(canConfirmRead("teacher"), false);
  assert.equal(canConfirmRead("guardian"), false);
});

test("公告清單只接受已定義的檢視模式", () => {
  assert.equal(parseAnnouncementListView(null), "active");
  assert.equal(parseAnnouncementListView("active"), "active");
  assert.equal(parseAnnouncementListView("archived"), "archived");
  assert.throws(() => parseAnnouncementListView("all"), ApiError);
});

test("班級行事會驗證內容與正確的起訖時間", () => {
  assert.deepEqual(
    parseCreateClassEventInput({
      title: "  物理實驗分組  ",
      location: "  自然科實驗室  ",
      startsAt: "2026-08-03T08:00:00+08:00",
      endsAt: "2026-08-03T08:50:00+08:00",
      description: "  攜帶實驗紀錄本。  ",
    }),
    {
      title: "物理實驗分組",
      location: "自然科實驗室",
      startsAt: "2026-08-03T00:00:00.000Z",
      endsAt: "2026-08-03T00:50:00.000Z",
      description: "攜帶實驗紀錄本。",
    },
  );
  for (const value of [
    { title: "", location: "", startsAt: "2026-08-03T08:00:00Z", endsAt: null, description: "" },
    { title: "行事", location: "", startsAt: "invalid", endsAt: null, description: "" },
    { title: "行事", location: "", startsAt: "2026-08-03T08:00:00Z", endsAt: "2026-08-03T07:00:00Z", description: "" },
  ]) {
    assert.throws(() => parseCreateClassEventInput(value), ApiError);
  }
});

test("班級行事編輯沿用完整欄位與起訖時間驗證", () => {
  assert.deepEqual(
    parseUpdateClassEventInput({
      title: "  改期的實驗分組  ", location: "  物理實驗室  ",
      startsAt: "2026-08-04T08:00:00+08:00", endsAt: null, description: "  請攜帶護目鏡。  ",
    }),
    {
      title: "改期的實驗分組", location: "物理實驗室",
      startsAt: "2026-08-04T00:00:00.000Z", endsAt: null, description: "請攜帶護目鏡。",
    },
  );
  assert.throws(
    () => parseUpdateClassEventInput({ title: "行事", location: "", startsAt: "2026-08-04T08:00:00Z", endsAt: "2026-08-04T08:00:00Z", description: "" }),
    ApiError,
  );
});

test("班級資源只接受分類正確且不含帳密的 HTTPS 網址", () => {
  assert.deepEqual(
    parseCreateClassResourceInput({
      title: "  課表與輪值表  ",
      url: "https://example.invalid/schedule",
      category: "課程",
    }),
    { title: "課表與輪值表", url: "https://example.invalid/schedule", category: "課程" },
  );
  for (const value of [
    { title: "資源", url: "http://example.invalid/file", category: "課程" },
    { title: "資源", url: "javascript:alert(1)", category: "課程" },
    { title: "資源", url: "https://user:pass@example.invalid/file", category: "課程" },
    { title: "資源", url: "https://example.invalid/file", category: "未分類" },
  ]) {
    assert.throws(() => parseCreateClassResourceInput(value), ApiError);
  }
});

test("班級資源檔案會驗證標題、分類與附件安全規則", () => {
  assert.deepEqual(
    parseCreateClassResourceFileInput({
      title: "  第一章預習講義  ",
      category: "課程",
      file: { name: "預習講義.pdf", type: "application/pdf", size: 2048 },
    }),
    {
      title: "第一章預習講義",
      category: "課程",
      upload: { originalName: "預習講義.pdf", contentType: "application/pdf", sizeBytes: 2048 },
    },
  );
  for (const value of [
    { title: "", category: "課程", file: { name: "講義.pdf", type: "application/pdf", size: 1 } },
    { title: "講義", category: "未分類", file: { name: "講義.pdf", type: "application/pdf", size: 1 } },
    { title: "講義", category: "課程", file: { name: "講義.exe", type: "application/pdf", size: 1 } },
  ]) {
    assert.throws(() => parseCreateClassResourceFileInput(value), ApiError);
  }
  assert.equal(maxClassResourceFiles, 20);
  assert.match(buildClassResourceFileStorageKey(23), /^class-23\/resource-files\//);
});

test("資源檔案數量上限的資料庫錯誤會被辨識為可回覆的輸入錯誤", () => {
  assert.equal(isClassResourceFileLimitError(new Error(`D1_ERROR: ${classResourceFileLimitErrorCode}`)), true);
  assert.equal(isClassResourceFileLimitError(new Error("database is unavailable")), false);
});

test("私有檔案刪除若資料庫清理失敗，會還原物件以保留可下載的紀錄", async () => {
  const objects = new Map<string, Uint8Array>([["class-23/file", new TextEncoder().encode("physics notes")]]);
  const bucket: PrivateFileBucket = {
    async get(key) {
      const value = objects.get(key);
      if (!value) return null;
      return {
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(value);
            controller.close();
          },
        }),
      };
    },
    async put(key, value) {
      objects.set(key, new Uint8Array(value));
    },
    async delete(key) {
      objects.delete(key);
    },
  };

  await assert.rejects(
    deletePrivateFileWithMetadataRollback({
      bucket,
      storageKey: "class-23/file",
      contentType: "application/pdf",
      deleteMetadata: async () => { throw new Error("D1 unavailable"); },
    }),
    (error: unknown) => error instanceof PrivateFileMetadataDeleteError && error.rollbackSucceeded,
  );
  assert.deepEqual(objects.get("class-23/file"), new TextEncoder().encode("physics notes"));
});

test("私有檔案刪除成功時，會一併移除物件與資料庫紀錄", async () => {
  const objects = new Map<string, Uint8Array>([["class-23/file", new Uint8Array([1, 2, 3])]]);
  let metadataDeleted = false;
  const bucket: PrivateFileBucket = {
    async get(key) {
      const value = objects.get(key);
      return value ? { body: new ReadableStream({ start(controller) { controller.enqueue(value); controller.close(); } }) } : null;
    },
    async put(key, value) { objects.set(key, new Uint8Array(value)); },
    async delete(key) { objects.delete(key); },
  };

  await deletePrivateFileWithMetadataRollback({
    bucket,
    storageKey: "class-23/file",
    contentType: "application/pdf",
    deleteMetadata: async () => { metadataDeleted = true; },
  });
  assert.equal(metadataDeleted, true);
  assert.equal(objects.has("class-23/file"), false);
});
