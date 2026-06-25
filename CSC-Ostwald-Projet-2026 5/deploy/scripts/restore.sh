#!/usr/bin/env bash
# =====================================================================
# restore.sh — Restore the MySQL database from a backup dump.
#
# Usage on the VPS:
#   sudo ./scripts/restore.sh /srv/csc-ostwald/backups/csc-ostwald-2026-05-19-0330.sql.gz
#
# DESTRUCTIVE: drops every existing table and re-creates them from the
# dump. The script prompts for confirmation before touching anything.
# =====================================================================

set -euo pipefail

DUMP_FILE="${1:-}"

if [ -z "$DUMP_FILE" ] || [ ! -f "$DUMP_FILE" ]; then
  echo "Usage: $0 <path-to-dump.sql.gz>"
  echo
  echo "Available backups:"
  ls -1 /srv/csc-ostwald/backups/*.sql.gz 2>/dev/null || echo "  (none)"
  exit 1
fi

cd "$(dirname "$0")/.."

# shellcheck disable=SC1091
source .env

echo "⚠  About to restore $DUMP_FILE into database '$DB_NAME'."
echo "   This DROPS every existing table — current data is LOST."
read -r -p "Type 'YES' to confirm: " confirm
if [ "$confirm" != "YES" ]; then
  echo "Aborted."
  exit 1
fi

echo "→ Restoring..."
gunzip -c "$DUMP_FILE" | docker exec -i csc-mysql \
  mysql -uroot -p"$DB_PASSWORD" "$DB_NAME"

echo "✓ Restore complete."
echo "  Verify with: docker exec csc-mysql mysql -uroot -p'****' $DB_NAME -e 'SHOW TABLES;'"
