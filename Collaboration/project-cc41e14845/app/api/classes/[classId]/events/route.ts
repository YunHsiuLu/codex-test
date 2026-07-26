import { and, asc, eq, gte } from "drizzle-orm";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { getDb } from "../../../../../db";
import { classEvents } from "../../../../../db/schema";
import { findCurrentUser, requireClassMembership } from "../../../../../lib/bulletin-access";
import { ApiError, canPublishAnnouncements, parseClassId, parseCreateClassEventInput } from "../../../../../lib/bulletin-policy";

type RouteContext = { params: Promise<{ classId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const classId = parseClassId((await context.params).classId);
    const db = getDb();
    const currentUser = await requireSignedInUser(db);
    await requireClassMembership(db, currentUser.id, classId);

    const events = await db
      .select({
        id: classEvents.id,
        title: classEvents.title,
        location: classEvents.location,
        startsAt: classEvents.startsAt,
        endsAt: classEvents.endsAt,
        description: classEvents.description,
      })
      .from(classEvents)
      .where(and(
        eq(classEvents.classId, classId),
        gte(classEvents.startsAt, new Date().toISOString()),
      ))
      .orderBy(asc(classEvents.startsAt), asc(classEvents.id));

    return Response.json({ events });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const classId = parseClassId((await context.params).classId);
    const input = parseCreateClassEventInput(await request.json());
    const db = getDb();
    const currentUser = await requireSignedInUser(db);
    const membership = await requireClassMembership(db, currentUser.id, classId);
    if (!canPublishAnnouncements(membership.role)) {
      throw new ApiError(403, "只有本班教師可以新增行事。");
    }

    const now = new Date().toISOString();
    const [event] = await db
      .insert(classEvents)
      .values({ classId, authorId: currentUser.id, ...input, createdAt: now, updatedAt: now })
      .returning();

    return Response.json({ event }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}

async function requireSignedInUser(db: ReturnType<typeof getDb>) {
  const identity = await getChatGPTUser();
  if (!identity) throw new ApiError(401, "請先登入後再使用班級行事。");
  return findCurrentUser(db, identity.email);
}

function routeError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error("Class events API failed", error);
  return Response.json({ error: "行事服務暫時無法使用，請稍後再試。" }, { status: 500 });
}
