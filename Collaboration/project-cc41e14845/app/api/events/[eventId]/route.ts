import { eq } from "drizzle-orm";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { getDb } from "../../../../db";
import { classEvents } from "../../../../db/schema";
import { findCurrentUser, requireClassMembership } from "../../../../lib/bulletin-access";
import {
  ApiError,
  canPublishAnnouncements,
  parseClassEventId,
  parseUpdateClassEventInput,
} from "../../../../lib/bulletin-policy";

type RouteContext = { params: Promise<{ eventId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const eventId = parseClassEventId((await context.params).eventId);
    const input = parseUpdateClassEventInput(await request.json());
    const db = getDb();
    const identity = await getChatGPTUser();
    if (!identity) throw new ApiError(401, "請先登入後再更新行事。");

    const currentUser = await findCurrentUser(db, identity.email);
    const [event] = await db
      .select({ id: classEvents.id, classId: classEvents.classId })
      .from(classEvents)
      .where(eq(classEvents.id, eventId))
      .limit(1);
    if (!event) throw new ApiError(404, "找不到行事。");

    const membership = await requireClassMembership(db, currentUser.id, event.classId);
    if (!canPublishAnnouncements(membership.role)) {
      throw new ApiError(403, "只有本班教師可以更新行事。");
    }

    const [updatedEvent] = await db
      .update(classEvents)
      .set({ ...input, updatedAt: new Date().toISOString() })
      .where(eq(classEvents.id, event.id))
      .returning();
    return Response.json({ event: updatedEvent });
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const eventId = parseClassEventId((await context.params).eventId);
    const db = getDb();
    const identity = await getChatGPTUser();
    if (!identity) throw new ApiError(401, "請先登入後再刪除行事。");

    const currentUser = await findCurrentUser(db, identity.email);
    const [event] = await db
      .select({ id: classEvents.id, classId: classEvents.classId })
      .from(classEvents)
      .where(eq(classEvents.id, eventId))
      .limit(1);
    if (!event) throw new ApiError(404, "找不到行事。");

    const membership = await requireClassMembership(db, currentUser.id, event.classId);
    if (!canPublishAnnouncements(membership.role)) {
      throw new ApiError(403, "只有本班教師可以刪除行事。");
    }

    await db.delete(classEvents).where(eq(classEvents.id, event.id));
    return new Response(null, { status: 204 });
  } catch (error) {
    return routeError(error);
  }
}

function routeError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error("Class event API failed", error);
  return Response.json({ error: "行事操作失敗，請稍後再試。" }, { status: 500 });
}
