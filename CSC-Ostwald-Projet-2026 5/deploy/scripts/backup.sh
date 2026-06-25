#!/usr/bin/env bash
# =====================================================================
# backup.sh — Daily mysqldump on the VPS.
#
# Cron entry (edit with `sudo crontab -e`):
#   30 3 * * * /srv/csc-ostwald/deploy/scripts/backup.sh >> /var/log/csc-backup.log 2>&1
#
# Output:
#   /srv/csc-ostwald/backups/csc-ostwald-YYYY-MM-DD-HHMM.sql.gz
#
# Last 14 backups are kept locally (older ones are deleted).
# If BACKUP_S3_* env vars are set in .env, the dump is also uploaded
# to OVH Object Storage (or any S3-compatible bucket) for off-VPS safety.
# =====================================================================

set -euo pipefail

cd "$(dirname "$0")/.."  # → /srv/csc-ostwald/deploy

# shellcheck disable=SC1091
source .env

STAMP="$(date +%Y-%m-%d-%H%M)"
OUT_DIR=/srv/csc-ostwald/backups
mkdir -p "$OUT_DIR"
OUT_FILE="$OUT_DIR/csc-ostwald-$STAMP.sql.gz"

echo "→ Dumping database $DB_NAME..."
# Use root for mysqldump because routines/triggers require SUPER. Pipe the
# password through MYSQL_PWD env var so the cleartext never appears in the
# container's process argv (visible via `ps`, `docker top`, etc.). Single
# quotes around $DB_NAME are no longer needed since we don't shell-quote
# the password.
docker exec -e MYSQL_PWD="$DB_ROOT_PASSWORD" csc-mysql \
  mysqldump --single-transaction --quick --routines --triggers \
    -uroot "$DB_NAME" \
  | gzip -9 > "$OUT_FILE"

SIZE="$(du -h "$OUT_FILE" | cut -f1)"
echo "✓ Local backup written: $OUT_FILE ($SIZE)"

# ── Optional off-VPS upload via S3-compatible storage (OVH/AWS/etc) ─
if [ -n "${BACKUP_S3_ENDPOINT:-}" ] && [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  if ! command -v aws >/dev/null 2>&1; then
    echo "⚠ AWS CLI not installed — skipping off-VPS upload."
    echo "  Install with: sudo apt install awscli"
  else
    echo "→ Uploading to s3://$BACKUP_S3_BUCKET/$(basename "$OUT_FILE")..."
    AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY" \
    AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_KEY" \
      aws --endpoint-url "$BACKUP_S3_ENDPOINT" \
      s3 cp "$OUT_FILE" "s3://$BACKUP_S3_BUCKET/$(basename "$OUT_FILE")"
    echo "✓ Uploaded to $BACKUP_S3_ENDPOINT"
  fi
fi

# ── Rotate: keep only the last 14 local backups ─────────────────────
echo "→ Rotating: keeping the 14 most recent local backups..."
ls -1t "$OUT_DIR"/csc-ostwald-*.sql.gz | tail -n +15 | xargs -r rm -f

echo "✓ Backup done."
