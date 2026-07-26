CREATE TABLE `class_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `class_id` integer NOT NULL,
  `author_id` integer NOT NULL,
  `title` text NOT NULL,
  `location` text NOT NULL,
  `starts_at` text NOT NULL,
  `ends_at` text,
  `description` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `class_events_class_starts_title_unique` ON `class_events` (`class_id`,`starts_at`,`title`);
