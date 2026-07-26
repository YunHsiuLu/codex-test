import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { getDb } from "../../../../../db";
import { classResourceFiles } from "../../../../../db/schema";
import { findCurrentUser, requireClassMembership } from "../../../../../lib/bulletin-access";
import { ApiError, buildAttachmentDownloadHeaders, parseClassResourceFileId } from "../../../../../lib/bulletin-policy";

type RouteContext = { params: Promise<{ resourceFileId: string }> };

type StoredAttachment = { body: ReadableStream };

type AttachmentBucket = {
  get(key: string): Promise<StoredAttachment | null>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const resourceFileId = parseClassResourceFileId((await context.params).resourceFileId);
    const db = getDb();
    const identity = await getChatGPTUser();
    if (!identity) throw new ApiError(401, "請先登入後再下載班級資源檔案。");
    const currentUser = await findCurrentUser(db, identity.email);
    const [resourceFile] = await db
      .select({
        classId: classResourceFiles.classId,
        storageKey: classResourceFiles.storageKey,
        originalName: classResourceFiles.originalName,
        contentType: classResourceFiles.contentType,
        sizeBytes: classResourceFiles.sizeBytes,
      })
      .from(classResourceFiles)
      .where(eq(classResourceFiles.id, resourceFileId))
      .limit(1);
    if (!resourceFile) throw new ApiError(404, "找不到班級資源檔案。");

    await requireClassMembership(db, currentUser.id, resourceFile.classId);
    const bucket = (env as { ATTACHMENTS?: AttachmentBucket }).ATTACHMENTS;
    if (!bucket) throw new ApiError(503, "資源檔案服務暫時無法使用，請稍後再試。");
    const storedFile = await bucket.get(resourceFile.storageKey);
    if (!storedFile) throw new ApiError(404, "班級資源檔案不存在或已被移除。");

    return new Response(storedFile.body, {
      headers: buildAttachmentDownloadHeaders(resourceFile.originalName, resourceFile.contentType, resourceFile.sizeBytes),
    });
  } catch (error) {
    return routeError(error);
  }
}

function routeError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("Class resource file download API failed", error);
  return Response.json({ error: "資源檔案服務暫時無法使用，請稍後再試。" }, { status: 500 });
}
