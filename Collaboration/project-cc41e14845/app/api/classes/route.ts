import { asc, eq } from "drizzle-orm";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { classes, memberships } from "../../../db/schema";
import { findCurrentUser } from "../../../lib/bulletin-access";
import { ApiError } from "../../../lib/bulletin-policy";

export async function GET() {
  try {
    const db = getDb();
    const identity = await getChatGPTUser();
    if (!identity) {
      throw new ApiError(401, "請先登入後再使用班級佈告板。");
    }

    const currentUser = await findCurrentUser(db, identity.email);
    // 僅從 memberships 取得班級，不能由用戶端任意指定可見班級。
    const accessibleClasses = await db
      .select({
        id: classes.id,
        schoolYear: classes.schoolYear,
        name: classes.name,
        role: memberships.role,
      })
      .from(memberships)
      .innerJoin(classes, eq(memberships.classId, classes.id))
      .where(eq(memberships.userId, currentUser.id))
      .orderBy(asc(classes.schoolYear), asc(classes.name), asc(classes.id));

    return Response.json({
      viewer: { displayName: currentUser.displayName },
      classes: accessibleClasses,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    console.error("Class list API failed", error);
    return Response.json({ error: "服務暫時無法使用，請稍後再試。" }, { status: 500 });
  }
}
