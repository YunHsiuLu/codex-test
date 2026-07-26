import { and, eq } from "drizzle-orm";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { getDb } from "../../../../../db";
import { readReceipts } from "../../../../../db/schema";
import { findAnnouncementClassId, findCurrentUser, requireClassMembership } from "../../../../../lib/bulletin-access";
import { ApiError, canConfirmRead, parseAnnouncementId } from "../../../../../lib/bulletin-policy";

type RouteContext = { params: Promise<{ announcementId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const announcementId = parseAnnouncementId((await context.params).announcementId);
    const db = getDb();
    const identity = await getChatGPTUser();
    if (!identity) throw new ApiError(401, "請先登入後再使用班級佈告板。");

    const currentUser = await findCurrentUser(db, identity.email);
    const classId = await findAnnouncementClassId(db, announcementId);
    const membership = await requireClassMembership(db, currentUser.id, classId);
    if (!canConfirmRead(membership.role)) {
      throw new ApiError(403, "只有本班學生可以確認已讀。");
    }

    const readAt = new Date().toISOString();
    await db
      .insert(readReceipts)
      .values({ announcementId, userId: currentUser.id, readAt })
      .onConflictDoNothing({
        target: [readReceipts.announcementId, readReceipts.userId],
      });

    return Response.json({ announcementId, readAt, recorded: true });
  } catch (error) {
    return routeError(error);
  }
}

function routeError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error("Read receipt API failed", error);
  return Response.json({ error: "服務暫時無法使用，請稍後再試。" }, { status: 500 });
}
