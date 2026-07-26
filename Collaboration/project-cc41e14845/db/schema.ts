import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  role: text("role", { enum: ["admin", "teacher", "student", "guardian"] }).notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("users_email_unique").on(table.email)]);

export const classes = sqliteTable("classes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schoolYear: text("school_year").notNull(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
});

export const memberships = sqliteTable("memberships", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  classId: integer("class_id").notNull().references(() => classes.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role", { enum: ["teacher", "student", "guardian"] }).notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("memberships_class_user_unique").on(table.classId, table.userId)]);

export const announcements = sqliteTable("announcements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  classId: integer("class_id").notNull().references(() => classes.id),
  authorId: integer("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
  requiresRead: integer("requires_read", { mode: "boolean" }).notNull().default(false),
  publishedAt: text("published_at").notNull(),
  expiresAt: text("expires_at"),
  archivedAt: text("archived_at"),
  updatedAt: text("updated_at").notNull(),
});

export const attachments = sqliteTable("attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  announcementId: integer("announcement_id").notNull().references(() => announcements.id),
  storageKey: text("storage_key").notNull(),
  originalName: text("original_name").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: text("created_at").notNull(),
});

export const readReceipts = sqliteTable("read_receipts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  announcementId: integer("announcement_id").notNull().references(() => announcements.id),
  userId: integer("user_id").notNull().references(() => users.id),
  readAt: text("read_at").notNull(),
}, (table) => [uniqueIndex("read_receipts_announcement_user_unique").on(table.announcementId, table.userId)]);

export const classEvents = sqliteTable("class_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  classId: integer("class_id").notNull().references(() => classes.id),
  authorId: integer("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  location: text("location").notNull(),
  startsAt: text("starts_at").notNull(),
  endsAt: text("ends_at"),
  description: text("description").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("class_events_class_starts_title_unique").on(table.classId, table.startsAt, table.title),
]);

export const classResources = sqliteTable("class_resources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  classId: integer("class_id").notNull().references(() => classes.id),
  authorId: integer("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  url: text("url").notNull(),
  category: text("category", { enum: ["課程", "表單", "相簿", "其他"] }).notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("class_resources_class_url_unique").on(table.classId, table.url),
]);

export const classResourceFiles = sqliteTable("class_resource_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  classId: integer("class_id").notNull().references(() => classes.id),
  authorId: integer("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  category: text("category", { enum: ["課程", "表單", "相簿", "其他"] }).notNull(),
  storageKey: text("storage_key").notNull(),
  originalName: text("original_name").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("class_resource_files_class_storage_key_unique").on(table.classId, table.storageKey),
]);
