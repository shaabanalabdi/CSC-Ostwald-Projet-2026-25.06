#!/usr/bin/env bash
# =====================================================================
# deploy.sh — Push a new version from your laptop to the OVH VPS.
#
# Workflow:
#   1. Build the React app locally (Vite).
#   2. rsync the API source + client build + nginx config + compose file
#      to the VPS (keeps secrets and DB volume untouched).
#   3. SSH to the VPS, rebuild the API image, restart with zero downtime.
#
# Run locally from the project root:
#   ./deploy/scripts/deploy.sh user@vps.example.com
# =====================================================================

set -euo pipefail

REMOTE="${1:-}"
REMOTE_PATH="${2:-/srv/csc-ostwald}"

if [ -z "$REMOTE" ]; then
  echo "Usage: $0 <user@host> [remote-path]"
  echo "Example: $0 ubuntu@vps-12345.ovh.net /srv/csc-ostwald"
  exit 1
fi

# Run from project root regardless of where this script was invoked.
cd "$(dirname "$0")/../.."
ROOT="$(pwd)"

echo "→ Building React app..."
(cd client && npm ci --no-audit --no-fund && npm run build)

echo "→ Syncing client build → $REMOTE:$REMOTE_PATH/deploy/client-build/..."
rsync -avz --delete client/dist/ "$REMOTE:$REMOTE_PATH/deploy/client-build/"

echo "→ Syncing API source → $REMOTE:$REMOTE_PATH/api/..."
rsync -avz --delete \
  --exclude='.env' \
  --exclude='node_modules' \
  --exclude='coverage' \
  --exclude='uploads' \
  --exclude='__tests__' \
  api/ "$REMOTE:$REMOTE_PATH/api/"

echo "→ Syncing deploy/ (compose, nginx, scripts) — excluding .env..."
rsync -avz \
  --exclude='.env' \
  --exclude='client-build' \
  --exclude='certbot' \
  deploy/ "$REMOTE:$REMOTE_PATH/deploy/"

echo "→ Rebuilding API image + restarting services on VPS..."
ssh "$REMOTE" bash <<'REMOTE_CMD'
set -euo pipefail
cd /srv/csc-ostwald/deploy
docker compose -f docker-compose.prod.yml build api
docker compose -f docker-compose.prod.yml up -d api nginx
echo "✓ Deploy complete. Services running:"
docker compose -f docker-compose.prod.yml ps
REMOTE_CMD

echo
echo "✓ Deploy finished."
