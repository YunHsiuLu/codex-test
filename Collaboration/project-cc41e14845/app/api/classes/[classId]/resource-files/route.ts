import { count, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { getDb } from "../../../../../db";
import { classResourceFiles } from "../../../../../db/schema";
import { findCurrentUser, requireClassMembership } from "../../../../../lib/bulletin-access";
import {
  ApiError,
  buildClassResourceFileStorageKey,
  canPublishAnnouncements,
  isClassResourceFileLimitError,
  maxClassResourceFiles,
  parseClassId,
  parseCreateClassResourceFileInput,
} from "../../../../../lib/bulletin-policy";

type RouteContext = { params: Promise<{ classId: string }> };

type AttachmentBucket = {
  put(key: string, value: ArrayBuffer, options: { httpMetadata: { contentType: string } }): Promise<unknown>;
  delete(key: string): Promise<void>;
};

export async function POST(request: Request, context: RouteContext) {
  let bucket: AttachmentBucket | undefined;
  let storageKey: string | undefined;
  let objectStored = false;

  try {
    const classId = parseClassId((await context.params).classId);
    const form = await request.formData();
    const file = form.get("file");
    if (typeof file === "string" || file === null) {
      throw new ApiError(400, "請選擇一個班級資源檔案。");
    }
    const input = parseCreateClassResourceFileInput({
      title: form.get("title"),
      category: form.get("category"),
      file,
    });

    const db = getDb();
    const identity = await getChatGPTUser();
    if (!identity) throw new ApiError(401, "請先登入後再上傳班級資源檔案。");
    const currentUser = await findCurrentUser(db, identity.email);
    const membership = await requireClassMembership(db, currentUser.id, classId);
    if (!canPublishAnnouncements(membership.role)) {
      throw new ApiError(403, "只有本班教師可以上傳班級資源檔案。");
    }

    const [fileCount] = await db
      .select({ total: count() })
      .from(classResourceFiles)
      .where(eq(classResourceFiles.classId, classId));
    if ((fileCount?.total ?? 0) >= maxClassResourceFiles) {
      throw new ApiError(400, `每個班級最多可保存 ${maxClassResourceFiles} 個資源檔案。`);
    }

    bucket = (env as { ATTACHMENTS?: AttachmentBucket }).ATTACHMENTS;
    if (!bucket) throw new ApiError(503, "資源檔案服務暫時無法使用，請稍後再試。");
    storageKey = buildClassResourceFileStorageKey(classId);
    await bucket.put(storageKey, await file.arrayBuffer(), {
      httpMetadata: { contentType: input.upload.contentType },
    });
    objectStored = true;

    const [resourceFile] = await db
      .insert(classResourceFiles)
      .values({
        classId,
        authorId: currentUser.id,
        title: input.title,
        category: input.category,
        storageKey,
        originalName: input.upload.originalName,
        contentType: input.upload.contentType,
        sizeBytes: input.upload.sizeBytes,
        createdAt: new Date().toISOString(),
      })
      .returning();
    return Response.json({ resourceFile }, { status: 201 });
  } catch (error) {
    if (objectStored && bucket && storageKey) {
      await bucket.delete(storageKey).catch((cleanupError: unknown) => {
        console.error("Class resource file upload cleanup failed", cleanupError);
      });
    }
    return routeError(error);
  }
}

function routeError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (isClassResourceFileLimitError(error)) {
    return Response.json({ error: `每個班級最多可保存 ${maxClassResourceFiles} 個資源檔案。` }, { status: 400 });
  }
  console.error("Class resource file upload API failed", error);
  return Response.json({ error: "班級資源檔案上傳失敗，請稍後再試。" }, { status: 500 });
}
