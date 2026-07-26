CREATE TABLE `users` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `display_name` text NOT NULL,
  `email` text NOT NULL,
  `role` text NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
--> statement-breakpoint
CREATE TABLE `classes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `school_year` text NOT NULL,
  `name` text NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `memberships` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `class_id` integer NOT NULL,
  `user_id` integer NOT NULL,
  `role` text NOT NULL,
  `created_at` text NOT NULL,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `memberships_class_user_unique` ON `memberships` (`class_id`,`user_id`);
--> statement-breakpoint
CREATE TABLE `announcements` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `class_id` integer NOT NULL,
  `author_id` integer NOT NULL,
  `title` text NOT NULL,
  `content` text NOT NULL,
  `category` text NOT NULL,
  `is_pinned` integer DEFAULT false NOT NULL,
  `requires_read` integer DEFAULT false NOT NULL,
  `published_at` text NOT NULL,
  `expires_at` text,
  `archived_at` text,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `attachments` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `announcement_id` integer NOT NULL,
  `storage_key` text NOT NULL,
  `original_name` text NOT NULL,
  `content_type` text NOT NULL,
  `size_bytes` integer NOT NULL,
  `created_at` text NOT NULL,
  FOREIGN KEY (`announcement_id`) REFERENCES `announcements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `read_receipts` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `announcement_id` integer NOT NULL,
  `user_id` integer NOT NULL,
  `read_at` text NOT NULL,
  FOREIGN KEY (`announcement_id`) REFERENCES `announcements`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `read_receipts_announcement_user_unique` ON `read_receipts` (`announcement_id`,`user_id`);
