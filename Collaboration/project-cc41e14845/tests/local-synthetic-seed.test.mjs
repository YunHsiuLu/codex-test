import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

function query(dbPath, sql) {
  return execFileSync("sqlite3", ["-noheader", "-batch", dbPath, sql], {
    encoding: "utf8",
  }).trim();
}

test("本機合成資料可重複套用，並涵蓋教師、學生與公告狀態", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "class-bulletin-seed-"));
  const databasePath = join(directory, "synthetic.db");
  t.after(() => rm(directory, { recursive: true, force: true }));

  const [baselineMigration, eventMigration, resourceMigration, resourceFileMigration, resourceFileLimitMigration, seed] = await Promise.all([
    source("drizzle/0000_class_bulletin_baseline.sql"),
    source("drizzle/0001_class_events.sql"),
    source("drizzle/0002_class_resources.sql"),
    source("drizzle/0003_class_resource_files.sql"),
    source("drizzle/0004_class_resource_file_limit.sql"),
    source("scripts/local-synthetic-seed.sql"),
  ]);
  const sql = `${baselineMigration.replaceAll("--> statement-breakpoint", "")}\n${eventMigration.replaceAll("--> statement-breakpoint", "")}\n${resourceMigration.replaceAll("--> statement-breakpoint", "")}\n${resourceFileMigration.replaceAll("--> statement-breakpoint", "")}\n${resourceFileLimitMigration.replaceAll("--> statement-breakpoint", "")}\n${seed}`;
  execFileSync("sqlite3", [databasePath], { input: sql, encoding: "utf8" });
  execFileSync("sqlite3", [databasePath], { input: seed, encoding: "utf8" });

  assert.equal(query(databasePath, "SELECT count(*) FROM users;"), "3");
  assert.equal(query(databasePath, "SELECT count(*) FROM users WHERE email LIKE '%@example.invalid';"), "3");
  assert.equal(query(databasePath, "SELECT count(*) FROM classes WHERE name = '【本機合成】2 年 3 班';"), "1");
  assert.equal(query(databasePath, "SELECT group_concat(role || ':' || total, ',') FROM (SELECT role, count(*) AS total FROM memberships GROUP BY role ORDER BY role);"), "student:2,teacher:1");
  assert.equal(query(databasePath, "SELECT count(*) FROM announcements;"), "3");
  assert.equal(query(databasePath, "SELECT count(*) FROM announcements WHERE archived_at IS NULL AND (expires_at IS NULL OR expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));"), "1");
  assert.equal(query(databasePath, "SELECT count(*) FROM announcements WHERE archived_at IS NOT NULL;"), "1");
  assert.equal(query(databasePath, "SELECT count(*) FROM announcements WHERE archived_at IS NULL AND expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now');"), "1");
  assert.equal(query(databasePath, "SELECT count(*) FROM attachments;"), "1");
  assert.equal(query(databasePath, "SELECT count(*) FROM read_receipts;"), "1");
  assert.equal(query(databasePath, "SELECT count(*) FROM class_events;"), "1");
  assert.equal(query(databasePath, "SELECT count(*) FROM class_resources;"), "1");
  assert.equal(query(databasePath, "SELECT count(*) FROM class_resource_files;"), "1");
  const fillToLimit = Array.from({ length: 19 }, (_, index) => (
    `INSERT INTO class_resource_files (class_id, author_id, title, category, storage_key, original_name, content_type, size_bytes, created_at) VALUES (1, 1, '合成檔案 ${index + 2}', '課程', 'synthetic/limit-${index + 2}.pdf', 'limit-${index + 2}.pdf', 'application/pdf', 1, '2026-07-24T00:00:00.000Z');`
  )).join("\n");
  execFileSync("sqlite3", [databasePath], { input: fillToLimit, encoding: "utf8" });
  assert.equal(query(databasePath, "SELECT count(*) FROM class_resource_files WHERE class_id = 1;"), "20");
  assert.throws(
    () => execFileSync("sqlite3", [databasePath], {
      input: "INSERT INTO class_resource_files (class_id, author_id, title, category, storage_key, original_name, content_type, size_bytes, created_at) VALUES (1, 1, '超出上限', '課程', 'synthetic/limit-21.pdf', 'limit-21.pdf', 'application/pdf', 1, '2026-07-24T00:00:00.000Z');",
      encoding: "utf8",
      stdio: "pipe",
    }),
    /class_resource_files_limit_exceeded/,
  );
  assert.equal(query(databasePath, "SELECT count(*) FROM class_resource_files WHERE class_id = 1;"), "20");
  assert.equal(query(databasePath, "SELECT users.email FROM read_receipts JOIN users ON users.id = read_receipts.user_id;"), "student-a.bulletin@example.invalid");
});

test("建立本機資料庫腳本拒絕覆寫既有資料庫", async () => {
  const script = await source("scripts/create-local-synthetic-db.sh");
  assert.match(script, /if \[ -e "\$database_path" \]/);
  assert.match(script, /Refusing to overwrite existing database/);
  assert.match(script, /example\.invalid/);
});
