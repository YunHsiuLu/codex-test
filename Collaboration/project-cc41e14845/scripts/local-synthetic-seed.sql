-- Local synthetic data only. These accounts use the RFC 2606-reserved
-- example.invalid domain and must never be replaced with school accounts.
-- The statements are idempotent for this exact synthetic class namespace.
BEGIN;

INSERT OR IGNORE INTO `users` (`display_name`, `email`, `role`, `created_at`) VALUES
  ('測試教師', 'teacher.bulletin@example.invalid', 'teacher', '2026-07-24T00:00:00.000Z'),
  ('測試學生甲', 'student-a.bulletin@example.invalid', 'student', '2026-07-24T00:00:00.000Z'),
  ('測試學生乙', 'student-b.bulletin@example.invalid', 'student', '2026-07-24T00:00:00.000Z');

INSERT INTO `classes` (`school_year`, `name`, `created_at`)
SELECT '115', '【本機合成】2 年 3 班', '2026-07-24T00:00:00.000Z'
WHERE NOT EXISTS (
  SELECT 1 FROM `classes`
  WHERE `school_year` = '115' AND `name` = '【本機合成】2 年 3 班'
);

INSERT OR IGNORE INTO `memberships` (`class_id`, `user_id`, `role`, `created_at`)
SELECT classes.id, users.id,
  CASE users.email
    WHEN 'teacher.bulletin@example.invalid' THEN 'teacher'
    ELSE 'student'
  END,
  '2026-07-24T00:00:00.000Z'
FROM `classes`
JOIN `users` ON users.email IN (
  'teacher.bulletin@example.invalid',
  'student-a.bulletin@example.invalid',
  'student-b.bulletin@example.invalid'
)
WHERE classes.school_year = '115' AND classes.name = '【本機合成】2 年 3 班';

INSERT INTO `announcements` (
  `class_id`, `author_id`, `title`, `content`, `category`, `is_pinned`,
  `requires_read`, `published_at`, `expires_at`, `archived_at`, `updated_at`
)
SELECT classes.id, users.id, '【本機合成】明日物理實驗分組提醒',
  '請攜帶實驗紀錄本，第一節課前完成分組。', '作業', 1, 1,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+90 days'), NULL,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM `classes`
JOIN `users` ON users.email = 'teacher.bulletin@example.invalid'
WHERE classes.school_year = '115' AND classes.name = '【本機合成】2 年 3 班'
  AND NOT EXISTS (
    SELECT 1 FROM `announcements` AS existing
    WHERE existing.class_id = classes.id
      AND existing.title = '【本機合成】明日物理實驗分組提醒'
  );

INSERT INTO `announcements` (
  `class_id`, `author_id`, `title`, `content`, `category`, `is_pinned`,
  `requires_read`, `published_at`, `expires_at`, `archived_at`, `updated_at`
)
SELECT classes.id, users.id, '【本機合成】已封存：上週班務通知',
  '此公告用於驗證教師封存檢視，不應出現在學生的有效公告清單。', '班務', 0, 0,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-14 days'), NULL,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 days'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 days')
FROM `classes`
JOIN `users` ON users.email = 'teacher.bulletin@example.invalid'
WHERE classes.school_year = '115' AND classes.name = '【本機合成】2 年 3 班'
  AND NOT EXISTS (
    SELECT 1 FROM `announcements` AS existing
    WHERE existing.class_id = classes.id
      AND existing.title = '【本機合成】已封存：上週班務通知'
  );

INSERT INTO `announcements` (
  `class_id`, `author_id`, `title`, `content`, `category`, `is_pinned`,
  `requires_read`, `published_at`, `expires_at`, `archived_at`, `updated_at`
)
SELECT classes.id, users.id, '【本機合成】已過期：報名截止提醒',
  '此公告用於驗證到期公告不會出現在有效公告清單。', '活動', 0, 1,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-14 days'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day'), NULL,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')
FROM `classes`
JOIN `users` ON users.email = 'teacher.bulletin@example.invalid'
WHERE classes.school_year = '115' AND classes.name = '【本機合成】2 年 3 班'
  AND NOT EXISTS (
    SELECT 1 FROM `announcements` AS existing
    WHERE existing.class_id = classes.id
      AND existing.title = '【本機合成】已過期：報名截止提醒'
  );

INSERT INTO `attachments` (`announcement_id`, `storage_key`, `original_name`, `content_type`, `size_bytes`, `created_at`)
SELECT announcements.id, 'synthetic/physics-grouping.pdf', '實驗分組說明.pdf', 'application/pdf', 24576,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM `announcements`
WHERE announcements.title = '【本機合成】明日物理實驗分組提醒'
  AND NOT EXISTS (
    SELECT 1 FROM `attachments` AS existing
    WHERE existing.announcement_id = announcements.id
      AND existing.storage_key = 'synthetic/physics-grouping.pdf'
  );

INSERT OR IGNORE INTO `read_receipts` (`announcement_id`, `user_id`, `read_at`)
SELECT announcements.id, users.id, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM `announcements`
JOIN `users` ON users.email = 'student-a.bulletin@example.invalid'
WHERE announcements.title = '【本機合成】明日物理實驗分組提醒';

INSERT INTO `class_events` (
  `class_id`, `author_id`, `title`, `location`, `starts_at`, `ends_at`,
  `description`, `created_at`, `updated_at`
)
SELECT classes.id, users.id, '【本機合成】物理實驗分組', '自然科實驗室',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+7 days'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+7 days', '+50 minutes'),
  '攜帶實驗紀錄本，依公告完成分組。',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM `classes`
JOIN `users` ON users.email = 'teacher.bulletin@example.invalid'
WHERE classes.school_year = '115' AND classes.name = '【本機合成】2 年 3 班'
  AND NOT EXISTS (
    SELECT 1 FROM `class_events` AS existing
    WHERE existing.class_id = classes.id
      AND existing.title = '【本機合成】物理實驗分組'
  );

INSERT INTO `class_resources` (
  `class_id`, `author_id`, `title`, `url`, `category`, `created_at`, `updated_at`
)
SELECT classes.id, users.id, '【本機合成】物理實驗課程資料夾',
  'https://example.invalid/class-physics-files', '課程',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM `classes`
JOIN `users` ON users.email = 'teacher.bulletin@example.invalid'
WHERE classes.school_year = '115' AND classes.name = '【本機合成】2 年 3 班'
  AND NOT EXISTS (
    SELECT 1 FROM `class_resources` AS existing
    WHERE existing.class_id = classes.id
      AND existing.url = 'https://example.invalid/class-physics-files'
  );

INSERT INTO `class_resource_files` (
  `class_id`, `author_id`, `title`, `category`, `storage_key`, `original_name`,
  `content_type`, `size_bytes`, `created_at`
)
SELECT classes.id, users.id, '【本機合成】實驗預習講義', '課程',
  'synthetic/class-resource-files/physics-preview.pdf', '實驗預習講義.pdf',
  'application/pdf', 32768, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM `classes`
JOIN `users` ON users.email = 'teacher.bulletin@example.invalid'
WHERE classes.school_year = '115' AND classes.name = '【本機合成】2 年 3 班'
  AND NOT EXISTS (
    SELECT 1 FROM `class_resource_files` AS existing
    WHERE existing.class_id = classes.id
      AND existing.storage_key = 'synthetic/class-resource-files/physics-preview.pdf'
  );

COMMIT;
