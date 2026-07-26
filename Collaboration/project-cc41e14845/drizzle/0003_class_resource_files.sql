CREATE TABLE `class_resource_files` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `class_id` integer NOT NULL,
  `author_id` integer NOT NULL,
  `title` text NOT NULL,
  `category` text NOT NULL,
  `storage_key` text NOT NULL,
  `original_name` text NOT NULL,
  `content_type` text NOT NULL,
  `size_bytes` integer NOT NULL,
  `created_at` text NOT NULL,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `class_resource_files_class_storage_key_unique` ON `class_resource_files` (`class_id`,`storage_key`);
