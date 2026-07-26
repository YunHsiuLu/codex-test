import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { announcements, classResourceFiles, classResources, memberships, users } from "../db/schema";
import { ApiError, type MembershipRole } from "./bulletin-policy";

type Database = ReturnType<typeof getDb>;

export type CurrentUser = {
  id: number;
  displayName: string;
  email: string;
};

export type ClassMembership = {
  classId: number;
  role: MembershipRole;
};

export async function findCurrentUser(db: Database, email: string): Promise<CurrentUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db
    .select({ id: users.id, displayName: users.displayName, email: users.email })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user) {
    throw new ApiError(403, "此帳號尚未加入班級佈告板。");
  }
  return user;
}

export async function requireClassMembership(
  db: Database,
  userId: number,
  classId: number,
): Promise<ClassMembership> {
  const [membership] = await db
    .select({ classId: memberships.classId, role: memberships.role })
    .from(memberships)
    .where(and(eq(memberships.classId, classId), eq(memberships.userId, userId)))
    .limit(1);

  if (!membership) {
    throw new ApiError(403, "你沒有此班級的存取權限。");
  }

  return membership as ClassMembership;
}

export async function findAnnouncementClassId(
  db: Database,
  announcementId: number,
): Promise<number> {
  const [announcement] = await db
    .select({ classId: announcements.classId })
    .from(announcements)
    .where(eq(announcements.id, announcementId))
    .limit(1);

  if (!announcement) {
    throw new ApiError(404, "找不到公告。");
  }
  return announcement.classId;
}

export async function findClassResourceClassId(
  db: Database,
  resourceId: number,
): Promise<number> {
  const [resource] = await db
    .select({ classId: classResources.classId })
    .from(classResources)
    .where(eq(classResources.id, resourceId))
    .limit(1);

  if (!resource) {
    throw new ApiError(404, "找不到班級資源。");
  }
  return resource.classId;
}

export async function findClassResourceFileClassId(
  db: Database,
  resourceFileId: number,
): Promise<number> {
  const [resourceFile] = await db
    .select({ classId: classResourceFiles.classId })
    .from(classResourceFiles)
    .where(eq(classResourceFiles.id, resourceFileId))
    .limit(1);

  if (!resourceFile) {
    throw new ApiError(404, "找不到班級資源檔案。");
  }
  return resourceFile.classId;
}
