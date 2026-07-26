#!/usr/bin/env bash
set -euo pipefail

# This script intentionally creates a brand-new local database only. It never
# connects to a remote D1 instance and refuses to overwrite an existing file.
database_path="${1:-.local-data/class-bulletin-synthetic.db}"
seed_path="scripts/local-synthetic-seed.sql"

if [ -e "$database_path" ]; then
  printf 'Refusing to overwrite existing database: %s\n' "$database_path" >&2
  exit 1
fi

if ! command -v sqlite3 >/dev/null 2>&1; then
  printf 'sqlite3 is required to create the local synthetic database.\n' >&2
  exit 1
fi

mkdir -p "$(dirname "$database_path")"
{
  printf 'PRAGMA foreign_keys = ON;\n'
  for migration_path in drizzle/*.sql; do
    sed '/^--> statement-breakpoint$/d' "$migration_path"
    printf '\n'
  done
  sed '/^--> statement-breakpoint$/d' "$seed_path"
} | sqlite3 "$database_path"

printf 'Created isolated synthetic database: %s\n' "$database_path"
printf 'Synthetic accounts use the reserved example.invalid domain only.\n'
