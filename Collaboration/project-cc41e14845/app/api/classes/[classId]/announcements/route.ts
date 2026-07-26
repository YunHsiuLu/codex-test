import { and, count, desc, eq, gt, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { getDb } from "../../../../../db";
import { announcements, attachments, readReceipts, users } from "../../../../../db/schema";
import { findCurrentUser, requireClassMembership } from "../../../../../lib/bulletin-access";
import { ApiError, canPublishAnnouncements, parseAnnouncementListView, parseClassId, parseCreateAnnouncementInput } from "../../../../../lib/bulletin-policy";

type RouteContext = { params: Promise<{ classId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const classId = parseClassId((await context.params).classId);
    const view = parseAnnouncementListView(new URL(request.url).searchParams.get("view"));
    const db = getDb();
    const currentUser = await requireSignedInUser(db);
    const membership = await requireClassMembership(db, currentUser.id, classId);
    if (view === "archived" && !canPublishAnnouncements(membership.role)) {
      throw new ApiError(403, "只有本班教師可以查看封存公告。");
    }
    const now = new Date().toISOString();
    const visibilityFilter = view === "archived"
      ? isNotNull(announcements.archivedAt)
      : and(
        isNull(announcements.archivedAt),
        or(isNull(announcements.expiresAt), gt(announcements.expiresAt, now)),
      );

    const rows = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        category: announcements.category,
        isPinned: announcements.isPinned,
        requiresRead: announcements.requiresRead,
        publishedAt: announcements.publishedAt,
        expiresAt: announcements.expiresAt,
        updatedAt: announcements.updatedAt,
        authorName: users.displayName,
        readAt: readReceipts.readAt,
      })
      .from(announcements)
      .innerJoin(users, eq(announcements.authorId, users.id))
      .leftJoin(
        readReceipts,
        and(
          eq(readReceipts.announcementId, announcements.id),
          eq(readReceipts.userId, currentUser.id),
        ),
      )
      .where(and(
        eq(announcements.classId, classId),
        visibilityFilter,
      ))
      .orderBy(desc(announcements.isPinned), desc(announcements.publishedAt), desc(announcements.id));

    const announcementIds = rows.map((row) => row.id);
    const attachmentRows = announcementIds.length
      ? await db
        .select({
          id: attachments.id,
          announcementId: attachments.announcementId,
          originalName: attachments.originalName,
          contentType: attachments.contentType,
          sizeBytes: attachments.sizeBytes,
        })
        .from(attachments)
        .where(inArray(attachments.announcementId, announcementIds))
      : [];
    const attachmentsByAnnouncement = new Map<number, typeof attachmentRows>();
    for (const attachment of attachmentRows) {
      const existing = attachmentsByAnnouncement.get(attachment.announcementId) ?? [];
      existing.push(attachment);
      attachmentsByAnnouncement.set(attachment.announcementId, existing);
    }

    // 已讀明細只回傳給本人；教師則僅取得全班的彙總數，避免暴露學生閱讀時間。
    const receiptCounts = membership.role === "teacher" && announcementIds.length
      ? await db
        .select({ announcementId: readReceipts.announcementId, total: count() })
        .from(readReceipts)
        .where(inArray(readReceipts.announcementId, announcementIds))
        .groupBy(readReceipts.announcementId)
      : [];
    const receiptCountByAnnouncement = new Map(
      receiptCounts.map((receipt) => [receipt.announcementId, receipt.total]),
    );

    return Response.json({
      viewer: { role: membership.role, displayName: currentUser.displayName },
      announcements: rows.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        category: row.category,
        isPinned: row.isPinned,
        requiresRead: row.requiresRead,
        publishedAt: row.publishedAt,
        expiresAt: row.expiresAt,
        updatedAt: row.updatedAt,
        authorName: row.authorName,
        attachments: attachmentsByAnnouncement.get(row.id) ?? [],
        ...(membership.role === "student" ? { hasRead: row.readAt !== null } : {}),
        ...(membership.role === "teacher"
          ? { readReceiptCount: receiptCountByAnnouncement.get(row.id) ?? 0 }
          : {}),
      })),
    });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const classId = parseClassId((await context.params).classId);
    const input = parseCreateAnnouncementInput(await request.json());
    const db = getDb();
    const currentUser = await requireSignedInUser(db);
    const membership = await requireClassMembership(db, currentUser.id, classId);
    if (!canPublishAnnouncements(membership.role)) {
      throw new ApiError(403, "只有本班教師可以發布公告。");
    }

    const now = new Date().toISOString();
    const [announcement] = await db
      .insert(announcements)
      .values({
        classId,
        authorId: currentUser.id,
        ...input,
        publishedAt: now,
        updatedAt: now,
      })
      .returning();

    return Response.json({ announcement }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}

async function requireSignedInUser(db: ReturnType<typeof getDb>) {
  const identity = await getChatGPTUser();
  if (!identity) {
    throw new ApiError(401, "請先登入後再使用班級佈告板。");
  }
  return findCurrentUser(db, identity.email);
}

function routeError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  console.error("Class announcement API failed", error);
  return Response.json({ error: "服務暫時無法使用，請稍後再試。" }, { status: 500 });
}
