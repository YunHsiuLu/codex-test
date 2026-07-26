import { eq } from "drizzle-orm";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { getDb } from "../../../../db";
import { announcements } from "../../../../db/schema";
import { findAnnouncementClassId, findCurrentUser, requireClassMembership } from "../../../../lib/bulletin-access";
import {
  ApiError,
  canPublishAnnouncements,
  parseAnnouncementId,
  parseArchiveInput,
  parseUpdateAnnouncementInput,
} from "../../../../lib/bulletin-policy";

type RouteContext = { params: Promise<{ announcementId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const announcementId = parseAnnouncementId((await context.params).announcementId);
    const body = await request.json();
    const db = getDb();
    const identity = await getChatGPTUser();
    if (!identity) throw new ApiError(401, "請先登入後再使用班級佈告板。");

    const currentUser = await findCurrentUser(db, identity.email);
    const classId = await findAnnouncementClassId(db, announcementId);
    const membership = await requireClassMembership(db, currentUser.id, classId);
    if (!canPublishAnnouncements(membership.role)) {
      throw new ApiError(403, "只有本班教師可以更新公告。");
    }

    const now = new Date().toISOString();
    const update = isArchiveRequest(body)
      ? { archivedAt: parseArchiveInput(body) ? now : null, updatedAt: now }
      : { ...parseUpdateAnnouncementInput(body), updatedAt: now };
    const [announcement] = await db
      .update(announcements)
      .set(update)
      .where(eq(announcements.id, announcementId))
      .returning();

    return Response.json({ announcement });
  } catch (error) {
    return routeError(error);
  }
}

function isArchiveRequest(value: unknown): value is { archived: boolean } {
  return typeof value === "object" && value !== null && "archived" in value;
}

function routeError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error("Update announcement API failed", error);
  return Response.json({ error: "服務暫時無法使用，請稍後再試。" }, { status: 500 });
}
