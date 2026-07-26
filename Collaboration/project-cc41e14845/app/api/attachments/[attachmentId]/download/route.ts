import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { getDb } from "../../../../../db";
import { announcements, attachments } from "../../../../../db/schema";
import { findCurrentUser, requireClassMembership } from "../../../../../lib/bulletin-access";
import { ApiError, buildAttachmentDownloadHeaders, parseAttachmentId } from "../../../../../lib/bulletin-policy";

type RouteContext = { params: Promise<{ attachmentId: string }> };

type StoredAttachment = {
  body: ReadableStream;
};

type AttachmentBucket = {
  get(key: string): Promise<StoredAttachment | null>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const attachmentId = parseAttachmentId((await context.params).attachmentId);
    const db = getDb();
    const identity = await getChatGPTUser();
    if (!identity) throw new ApiError(401, "請先登入後再下載附件。");

    const currentUser = await findCurrentUser(db, identity.email);
    const [attachment] = await db
      .select({
        id: attachments.id,
        classId: announcements.classId,
        storageKey: attachments.storageKey,
        originalName: attachments.originalName,
        contentType: attachments.contentType,
        sizeBytes: attachments.sizeBytes,
      })
      .from(attachments)
      .innerJoin(announcements, eq(attachments.announcementId, announcements.id))
      .where(eq(attachments.id, attachmentId))
      .limit(1);
    if (!attachment) throw new ApiError(404, "找不到附件。");

    await requireClassMembership(db, currentUser.id, attachment.classId);
    const bucket = (env as { ATTACHMENTS?: AttachmentBucket }).ATTACHMENTS;
    if (!bucket) throw new ApiError(503, "附件服務暫時無法使用，請稍後再試。");

    const storedAttachment = await bucket.get(attachment.storageKey);
    if (!storedAttachment) throw new ApiError(404, "附件檔案不存在或已被移除。");

    return new Response(
      storedAttachment.body,
      { headers: buildAttachmentDownloadHeaders(attachment.originalName, attachment.contentType, attachment.sizeBytes) },
    );
  } catch (error) {
    return routeError(error);
  }
}

function routeError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error("Attachment download API failed", error);
  return Response.json({ error: "服務暫時無法使用，請稍後再試。" }, { status: 500 });
}
