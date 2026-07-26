-- The application performs a friendly pre-flight count, but the database is
-- the final authority when two uploads arrive concurrently.
CREATE TRIGGER `class_resource_files_max_per_class`
BEFORE INSERT ON `class_resource_files`
FOR EACH ROW
WHEN (
  SELECT COUNT(*)
  FROM `class_resource_files`
  WHERE `class_id` = NEW.`class_id`
) >= 20
BEGIN
  SELECT RAISE(ABORT, 'class_resource_files_limit_exceeded');
END;
