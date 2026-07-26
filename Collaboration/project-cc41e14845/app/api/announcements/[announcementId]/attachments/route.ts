import { count, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { getDb } from "../../../../../db";
import { attachments } from "../../../../../db/schema";
import { findAnnouncementClassId, findCurrentUser, requireClassMembership } from "../../../../../lib/bulletin-access";
import { ApiError, buildAttachmentStorageKey, canPublishAnnouncements, maxAttachmentsPerAnnouncement, parseAnnouncementId, parseAttachmentUpload } from "../../../../../lib/bulletin-policy";

type RouteContext = { params: Promise<{ announcementId: string }> };

type AttachmentBucket = {
  put(key: string, value: ArrayBuffer, options: { httpMetadata: { contentType: string } }): Promise<unknown>;
  delete(key: string): Promise<void>;
};

export async function POST(request: Request, context: RouteContext) {
  let bucket: AttachmentBucket | undefined;
  let storageKey: string | undefined;
  let objectStored = false;

  try {
    const announcementId = parseAnnouncementId((await context.params).announcementId);
    const form = await request.formData();
    const file = form.get("file");
    if (typeof file === "string" || file === null) {
      throw new ApiError(400, "請選擇一個附件檔案。");
    }
    const upload = parseAttachmentUpload(file);
    const db = getDb();
    const identity = await getChatGPTUser();
    if (!identity) throw new ApiError(401, "請先登入後再上傳附件。");

    const currentUser = await findCurrentUser(db, identity.email);
    const classId = await findAnnouncementClassId(db, announcementId);
    const membership = await requireClassMembership(db, currentUser.id, classId);
    if (!canPublishAnnouncements(membership.role)) {
      throw new ApiError(403, "只有本班教師可以上傳附件。 ");
    }

    const [attachmentCount] = await db
      .select({ total: count() })
      .from(attachments)
      .where(eq(attachments.announcementId, announcementId));
    if ((attachmentCount?.total ?? 0) >= maxAttachmentsPerAnnouncement) {
      throw new ApiError(400, `每則公告最多可附加 ${maxAttachmentsPerAnnouncement} 個檔案。`);
    }

    bucket = (env as { ATTACHMENTS?: AttachmentBucket }).ATTACHMENTS;
    if (!bucket) throw new ApiError(503, "附件服務暫時無法使用，請稍後再試。");
    storageKey = buildAttachmentStorageKey(classId, announcementId);
    await bucket.put(storageKey, await file.arrayBuffer(), {
      httpMetadata: { contentType: upload.contentType },
    });
    objectStored = true;

    const [attachment] = await db
      .insert(attachments)
      .values({
        announcementId,
        storageKey,
        originalName: upload.originalName,
        contentType: upload.contentType,
        sizeBytes: upload.sizeBytes,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return Response.json({ attachment }, { status: 201 });
  } catch (error) {
    if (objectStored && bucket && storageKey) {
      await bucket.delete(storageKey).catch((cleanupError: unknown) => {
        console.error("Attachment upload cleanup failed", cleanupError);
      });
    }
    return routeError(error);
  }
}

function routeError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error("Attachment upload API failed", error);
  return Response.json({ error: "附件上傳失敗，請稍後再試。" }, { status: 500 });
}
