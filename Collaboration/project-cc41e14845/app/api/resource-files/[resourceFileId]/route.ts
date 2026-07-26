import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { getDb } from "../../../../db";
import { classResourceFiles } from "../../../../db/schema";
import { findCurrentUser, requireClassMembership } from "../../../../lib/bulletin-access";
import { ApiError, canPublishAnnouncements, parseClassResourceFileId } from "../../../../lib/bulletin-policy";
import {
  deletePrivateFileWithMetadataRollback,
  PrivateFileMetadataDeleteError,
  type PrivateFileBucket,
} from "../../../../lib/private-file-delete";

type RouteContext = { params: Promise<{ resourceFileId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const resourceFileId = parseClassResourceFileId((await context.params).resourceFileId);
    const db = getDb();
    const identity = await getChatGPTUser();
    if (!identity) throw new ApiError(401, "請先登入後再刪除班級資源檔案。");
    const currentUser = await findCurrentUser(db, identity.email);
    const [resourceFile] = await db
      .select({
        id: classResourceFiles.id,
        classId: classResourceFiles.classId,
        storageKey: classResourceFiles.storageKey,
        contentType: classResourceFiles.contentType,
      })
      .from(classResourceFiles)
      .where(eq(classResourceFiles.id, resourceFileId))
      .limit(1);
    if (!resourceFile) throw new ApiError(404, "找不到班級資源檔案。");

    const membership = await requireClassMembership(db, currentUser.id, resourceFile.classId);
    if (!canPublishAnnouncements(membership.role)) {
      throw new ApiError(403, "只有本班教師可以刪除班級資源檔案。");
    }
    const bucket = (env as { ATTACHMENTS?: PrivateFileBucket }).ATTACHMENTS;
    if (!bucket) throw new ApiError(503, "資源檔案服務暫時無法使用，請稍後再試。");

    try {
      await deletePrivateFileWithMetadataRollback({
        bucket,
        storageKey: resourceFile.storageKey,
        contentType: resourceFile.contentType,
        deleteMetadata: async () => {
          await db.delete(classResourceFiles).where(eq(classResourceFiles.id, resourceFile.id));
        },
      });
    } catch (error) {
      if (error instanceof PrivateFileMetadataDeleteError) {
        console.error("Class resource file metadata cleanup failed after object deletion", error.metadataError);
        throw new ApiError(
          500,
          error.rollbackSucceeded
            ? "資源檔案紀錄清理失敗，原檔案與紀錄已保留，請稍後再試。"
            : "資源檔案紀錄已保留，但檔案還原失敗，請聯絡管理者。",
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
  console.error("Class resource file delete API failed", error);
  return Response.json({ error: "班級資源檔案刪除失敗，請稍後再試。" }, { status: 500 });
}
