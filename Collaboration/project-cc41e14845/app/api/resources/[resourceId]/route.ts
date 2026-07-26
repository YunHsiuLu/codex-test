import { eq } from "drizzle-orm";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { getDb } from "../../../../db";
import { classResources } from "../../../../db/schema";
import { findClassResourceClassId, findCurrentUser, requireClassMembership } from "../../../../lib/bulletin-access";
import { ApiError, canPublishAnnouncements, parseClassResourceId } from "../../../../lib/bulletin-policy";

type RouteContext = { params: Promise<{ resourceId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const resourceId = parseClassResourceId((await context.params).resourceId);
    const db = getDb();
    const identity = await getChatGPTUser();
    if (!identity) throw new ApiError(401, "請先登入後再刪除資源。");

    const currentUser = await findCurrentUser(db, identity.email);
    const classId = await findClassResourceClassId(db, resourceId);
    const membership = await requireClassMembership(db, currentUser.id, classId);
    if (!canPublishAnnouncements(membership.role)) {
      throw new ApiError(403, "只有本班教師可以刪除資源。");
    }

    await db.delete(classResources).where(eq(classResources.id, resourceId));
    return new Response(null, { status: 204 });
  } catch (error) {
    return routeError(error);
  }
}

function routeError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("Class resource delete API failed", error);
  return Response.json({ error: "資源刪除失敗，請稍後再試。" }, { status: 500 });
}
