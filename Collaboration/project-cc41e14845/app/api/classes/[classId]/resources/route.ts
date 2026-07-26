import { asc, eq } from "drizzle-orm";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { getDb } from "../../../../../db";
import { classResourceFiles, classResources } from "../../../../../db/schema";
import { findCurrentUser, requireClassMembership } from "../../../../../lib/bulletin-access";
import { ApiError, canPublishAnnouncements, parseClassId, parseCreateClassResourceInput } from "../../../../../lib/bulletin-policy";

type RouteContext = { params: Promise<{ classId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const classId = parseClassId((await context.params).classId);
    const db = getDb();
    const currentUser = await requireSignedInUser(db);
    await requireClassMembership(db, currentUser.id, classId);

    const [resources, files] = await Promise.all([
      db
        .select({
          id: classResources.id,
          title: classResources.title,
          url: classResources.url,
          category: classResources.category,
        })
        .from(classResources)
        .where(eq(classResources.classId, classId))
        .orderBy(asc(classResources.category), asc(classResources.title), asc(classResources.id)),
      db
        .select({
          id: classResourceFiles.id,
          title: classResourceFiles.title,
          category: classResourceFiles.category,
          originalName: classResourceFiles.originalName,
          sizeBytes: classResourceFiles.sizeBytes,
        })
        .from(classResourceFiles)
        .where(eq(classResourceFiles.classId, classId))
        .orderBy(asc(classResourceFiles.category), asc(classResourceFiles.title), asc(classResourceFiles.id)),
    ]);

    return Response.json({ resources, files });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const classId = parseClassId((await context.params).classId);
    const input = parseCreateClassResourceInput(await request.json());
    const db = getDb();
    const currentUser = await requireSignedInUser(db);
    const membership = await requireClassMembership(db, currentUser.id, classId);
    if (!canPublishAnnouncements(membership.role)) {
      throw new ApiError(403, "只有本班教師可以新增資源。");
    }

    const now = new Date().toISOString();
    const [resource] = await db
      .insert(classResources)
      .values({ classId, authorId: currentUser.id, ...input, createdAt: now, updatedAt: now })
      .returning();
    return Response.json({ resource }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}

async function requireSignedInUser(db: ReturnType<typeof getDb>) {
  const identity = await getChatGPTUser();
  if (!identity) throw new ApiError(401, "請先登入後再使用班級資源。");
  return findCurrentUser(db, identity.email);
}

function routeError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("Class resources API failed", error);
  return Response.json({ error: "資源服務暫時無法使用，請稍後再試。" }, { status: 500 });
}
