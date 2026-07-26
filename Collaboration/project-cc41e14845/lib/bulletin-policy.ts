export const announcementCategories = ["班務", "作業", "活動", "考試"] as const;
export const resourceCategories = ["課程", "表單", "相簿", "其他"] as const;

export type AnnouncementCategory = (typeof announcementCategories)[number];
export type ResourceCategory = (typeof resourceCategories)[number];
export type MembershipRole = "teacher" | "student" | "guardian";
export type AnnouncementListView = "active" | "archived";

export const maxAttachmentsPerAnnouncement = 5;
export const maxAttachmentSizeBytes = 10 * 1024 * 1024;
export const maxClassResourceFiles = 20;
export const classResourceFileLimitErrorCode = "class_resource_files_limit_exceeded";

const attachmentTypeRules = {
  "application/pdf": ["pdf"],
  "text/plain": ["txt"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["pptx"],
} as const;

export type AttachmentUpload = {
  originalName: string;
  contentType: keyof typeof attachmentTypeRules;
  sizeBytes: number;
};

export class ApiError extends Error {
  public readonly status: number;

  constructor(
    status: number,
    message: string,
  ) {
    super(message);
    this.status = status;
  }
}

export type CreateAnnouncementInput = {
  title: string;
  content: string;
  category: AnnouncementCategory;
  isPinned: boolean;
  requiresRead: boolean;
  expiresAt: string | null;
};

export type UpdateAnnouncementInput = CreateAnnouncementInput;

export type CreateClassEventInput = {
  title: string;
  location: string;
  startsAt: string;
  endsAt: string | null;
  description: string;
};

export type UpdateClassEventInput = CreateClassEventInput;

export type CreateClassResourceInput = {
  title: string;
  url: string;
  category: ResourceCategory;
};

export type CreateClassResourceFileInput = {
  title: string;
  category: ResourceCategory;
  upload: AttachmentUpload;
};

export function parseClassId(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new ApiError(400, "班級編號格式不正確。");
  }

  const classId = Number(value);
  if (!Number.isSafeInteger(classId)) {
    throw new ApiError(400, "班級編號格式不正確。");
  }
  return classId;
}

export function parseAnnouncementId(value: string): number {
  return parsePositiveId(value, "公告編號格式不正確。");
}

export function parseAttachmentId(value: string): number {
  return parsePositiveId(value, "附件編號格式不正確。");
}

export function parseClassEventId(value: string): number {
  return parsePositiveId(value, "行事編號格式不正確。");
}

export function parseClassResourceId(value: string): number {
  return parsePositiveId(value, "資源編號格式不正確。");
}

export function parseClassResourceFileId(value: string): number {
  return parsePositiveId(value, "資源檔案編號格式不正確。");
}

export function parseAttachmentUpload(value: { name: string; type: string; size: number }): AttachmentUpload {
  const originalName = value.name.trim();
  if (!originalName || originalName.length > 180 || /[\\/\r\n\0]/.test(originalName)) {
    throw new ApiError(400, "附件檔名不正確。");
  }
  if (!Number.isSafeInteger(value.size) || value.size <= 0 || value.size > maxAttachmentSizeBytes) {
    throw new ApiError(400, "附件大小須介於 1 B 至 10 MB。");
  }
  if (!isAllowedAttachmentType(value.type)) {
    throw new ApiError(400, "附件格式僅支援 PDF、TXT、JPG、PNG、WEBP、DOCX、XLSX 與 PPTX。");
  }

  const extension = originalName.slice(originalName.lastIndexOf(".") + 1).toLowerCase();
  if (!attachmentTypeRules[value.type].includes(extension as never)) {
    throw new ApiError(400, "附件副檔名與檔案格式不一致。");
  }

  return { originalName, contentType: value.type, sizeBytes: value.size };
}

export function buildAttachmentStorageKey(classId: number, announcementId: number): string {
  return `class-${classId}/announcement-${announcementId}/${crypto.randomUUID()}`;
}

export function buildClassResourceFileStorageKey(classId: number): string {
  return `class-${classId}/resource-files/${crypto.randomUUID()}`;
}

// Cloudflare D1 wraps SQLite errors, so inspect the complete error text rather
// than relying on one provider-specific error class.
export function isClassResourceFileLimitError(error: unknown): boolean {
  const message = error instanceof Error
    ? `${error.message} ${String(error.cause ?? "")}`
    : String(error);
  return message.includes(classResourceFileLimitErrorCode);
}

export function parseCreateAnnouncementInput(value: unknown): CreateAnnouncementInput {
  if (!isRecord(value)) {
    throw new ApiError(400, "公告內容格式不正確。");
  }

  const title = readText(value.title).trim();
  const content = readText(value.content).trim();
  const category = readText(value.category).trim();

  if (!title || title.length > 120) {
    throw new ApiError(400, "公告標題須為 1 至 120 個字元。");
  }
  if (!content || content.length > 5_000) {
    throw new ApiError(400, "公告內容須為 1 至 5000 個字元。");
  }
  if (!isAnnouncementCategory(category)) {
    throw new ApiError(400, "公告分類不正確。");
  }
  if (typeof value.isPinned !== "boolean" || typeof value.requiresRead !== "boolean") {
    throw new ApiError(400, "置頂與已讀設定必須是布林值。");
  }

  return {
    title,
    content,
    category,
    isPinned: value.isPinned,
    requiresRead: value.requiresRead,
    expiresAt: parseOptionalIsoDate(value.expiresAt),
  };
}

export function parseUpdateAnnouncementInput(value: unknown): UpdateAnnouncementInput {
  return parseCreateAnnouncementInput(value);
}

export function parseArchiveInput(value: unknown): boolean {
  if (!isRecord(value) || typeof value.archived !== "boolean") {
    throw new ApiError(400, "archived 必須是布林值。");
  }
  return value.archived;
}

export function parseCreateClassEventInput(value: unknown): CreateClassEventInput {
  if (!isRecord(value)) {
    throw new ApiError(400, "行事內容格式不正確。");
  }

  const title = readText(value.title).trim();
  const location = readText(value.location).trim();
  const description = readText(value.description).trim();
  const startsAt = parseRequiredIsoDate(value.startsAt, "行事開始時間格式不正確。");
  const endsAt = parseOptionalIsoDate(value.endsAt);

  if (!title || title.length > 120) {
    throw new ApiError(400, "行事標題須為 1 至 120 個字元。");
  }
  if (location.length > 160) {
    throw new ApiError(400, "行事地點不得超過 160 個字元。");
  }
  if (description.length > 1_000) {
    throw new ApiError(400, "行事說明不得超過 1000 個字元。");
  }
  if (endsAt && endsAt <= startsAt) {
    throw new ApiError(400, "行事結束時間必須晚於開始時間。");
  }

  return { title, location, startsAt, endsAt, description };
}

// 行事編輯與建立使用同一份完整輸入規則，避免局部 PATCH 意外清空欄位。
export function parseUpdateClassEventInput(value: unknown): UpdateClassEventInput {
  return parseCreateClassEventInput(value);
}

export function parseCreateClassResourceInput(value: unknown): CreateClassResourceInput {
  if (!isRecord(value)) {
    throw new ApiError(400, "資源內容格式不正確。");
  }

  const title = readText(value.title).trim();
  const category = readText(value.category).trim();
  const url = parseHttpsUrl(value.url);
  if (!title || title.length > 120) {
    throw new ApiError(400, "資源標題須為 1 至 120 個字元。");
  }
  if (!isResourceCategory(category)) {
    throw new ApiError(400, "資源分類不正確。");
  }

  return { title, url, category };
}

export function parseCreateClassResourceFileInput(
  value: { title: unknown; category: unknown; file: { name: string; type: string; size: number } },
): CreateClassResourceFileInput {
  const title = readText(value.title).trim();
  const category = readText(value.category).trim();
  if (!title || title.length > 120) {
    throw new ApiError(400, "資源檔案標題須為 1 至 120 個字元。");
  }
  if (!isResourceCategory(category)) {
    throw new ApiError(400, "資源檔案分類不正確。");
  }
  return { title, category, upload: parseAttachmentUpload(value.file) };
}

export function canPublishAnnouncements(role: MembershipRole): boolean {
  return role === "teacher";
}

export function canConfirmRead(role: MembershipRole): boolean {
  return role === "student";
}

export function parseAnnouncementListView(value: string | null): AnnouncementListView {
  if (value === null || value === "" || value === "active") return "active";
  if (value === "archived") return "archived";
  throw new ApiError(400, "公告檢視模式不正確。");
}

export function buildAttachmentDownloadHeaders(
  originalName: string,
  contentType: string,
  sizeBytes: number,
): Headers {
  const fileName = safeAttachmentFileName(originalName);
  const asciiFileName = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/\\/g, "_");
  const headers = new Headers({
    "Cache-Control": "private, no-store, max-age=0",
    "Content-Disposition": `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    "Content-Type": safeContentType(contentType),
    "X-Content-Type-Options": "nosniff",
  });
  if (Number.isSafeInteger(sizeBytes) && sizeBytes >= 0) {
    headers.set("Content-Length", String(sizeBytes));
  }
  return headers;
}

function parsePositiveId(value: string, errorMessage: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new ApiError(400, errorMessage);
  }

  const id = Number(value);
  if (!Number.isSafeInteger(id)) {
    throw new ApiError(400, errorMessage);
  }
  return id;
}

function safeAttachmentFileName(value: string): string {
  const normalized = value.replace(/[\r\n"]/g, "_").trim();
  return (normalized || "attachment").slice(0, 180);
}

function safeContentType(value: string): string {
  return /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*(?:;\s*charset=(?:utf-8|us-ascii))?$/i.test(value)
    ? value
    : "application/octet-stream";
}

function parseOptionalIsoDate(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new ApiError(400, "公告截止時間格式不正確。");
  }
  return new Date(value).toISOString();
}

function parseRequiredIsoDate(value: unknown, errorMessage: string): string {
  if (typeof value !== "string" || value === "" || Number.isNaN(Date.parse(value))) {
    throw new ApiError(400, errorMessage);
  }
  return new Date(value).toISOString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isAnnouncementCategory(value: string): value is AnnouncementCategory {
  return (announcementCategories as readonly string[]).includes(value);
}

function isResourceCategory(value: string): value is ResourceCategory {
  return (resourceCategories as readonly string[]).includes(value);
}

function parseHttpsUrl(value: unknown): string {
  if (typeof value !== "string" || value.trim().length > 2_000) {
    throw new ApiError(400, "資源網址必須是 HTTPS 網址。");
  }
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) {
      throw new Error("unsafe URL");
    }
    return url.toString();
  } catch {
    throw new ApiError(400, "資源網址必須是 HTTPS 網址。");
  }
}

function isAllowedAttachmentType(value: string): value is keyof typeof attachmentTypeRules {
  return Object.hasOwn(attachmentTypeRules, value);
}
