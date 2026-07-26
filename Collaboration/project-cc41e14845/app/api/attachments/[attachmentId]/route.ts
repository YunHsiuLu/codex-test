import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { getDb } from "../../../../db";
import { announcements, attachments } from "../../../../db/schema";
import { findCurrentUser, requireClassMembership } from "../../../../lib/bulletin-access";
import { ApiError, canPublishAnnouncements, parseAttachmentId } from "../../../../lib/bulletin-policy";
import {
  deletePrivateFileWithMetadataRollback,
  PrivateFileMetadataDeleteError,
  type PrivateFileBucket,
} from "../../../../lib/private-file-delete";

type RouteContext = { params: Promise<{ attachmentId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const attachmentId = parseAttachmentId((await context.params).attachmentId);
    const db = getDb();
    const identity = await getChatGPTUser();
    if (!identity) throw new ApiError(401, "請先登入後再刪除附件。");

    const currentUser = await findCurrentUser(db, identity.email);
    const [attachment] = await db
      .select({
        id: attachments.id,
        classId: announcements.classId,
        storageKey: attachments.storageKey,
        contentType: attachments.contentType,
      })
      .from(attachments)
      .innerJoin(announcements, eq(attachments.announcementId, announcements.id))
      .where(eq(attachments.id, attachmentId))
      .limit(1);
    if (!attachment) throw new ApiError(404, "找不到附件。");

    const membership = await requireClassMembership(db, currentUser.id, attachment.classId);
    if (!canPublishAnnouncements(membership.role)) {
      throw new ApiError(403, "只有本班教師可以刪除附件。");
    }

    const bucket = (env as { ATTACHMENTS?: PrivateFileBucket }).ATTACHMENTS;
    if (!bucket) throw new ApiError(503, "附件服務暫時無法使用，請稍後再試。");

    try {
      await deletePrivateFileWithMetadataRollback({
        bucket,
        storageKey: attachment.storageKey,
        contentType: attachment.contentType,
        deleteMetadata: async () => {
          await db.delete(attachments).where(eq(attachments.id, attachment.id));
        },
      });
    } catch (error) {
      if (error instanceof PrivateFileMetadataDeleteError) {
        console.error("Attachment metadata cleanup failed after object deletion", error.metadataError);
        throw new ApiError(
          500,
          error.rollbackSucceeded
            ? "附件紀錄清理失敗，原檔案與紀錄已保留，請稍後再試。"
            : "附件紀錄已保留，但檔案還原失敗，請聯絡管理者。",
        );
      }
      throw error;
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    return routeError(error);
  }
}

function routeError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error("Attachment delete API failed", error);
  return Response.json({ error: "附件刪除失敗，請稍後再試。" }, { status: 500 });
}
