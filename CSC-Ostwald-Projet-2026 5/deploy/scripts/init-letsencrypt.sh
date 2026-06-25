#!/usr/bin/env bash
# =====================================================================
# init-letsencrypt.sh — One-shot bootstrap for the SSL cert.
#
# Run ONCE on the VPS after `docker compose up` works in HTTP mode.
# After this, certbot renews automatically every 12h (see the certbot
# service in docker-compose.prod.yml).
#
# Usage on the VPS:
#   cd /srv/csc-ostwald/deploy
#   sudo ./scripts/init-letsencrypt.sh csc-ostwald.fr admin@csc-ostwald.fr
# =====================================================================

set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: $0 <domain> <admin-email>"
  echo "Example: $0 csc-ostwald.fr admin@csc-ostwald.fr"
  exit 1
fi

cd "$(dirname "$0")/.."  # → /srv/csc-ostwald/deploy

# ── 1. Render the HTTP-only nginx config from the template ──────────
echo "→ Generating HTTP-only nginx config for $DOMAIN..."
sed "s/__DOMAIN__/$DOMAIN/g" nginx/conf.d/csc-ostwald-http.conf.template \
  > nginx/conf.d/csc-ostwald.conf
# Make sure the HTTPS template isn't loaded yet.
rm -f nginx/conf.d/csc-ostwald-https.conf

# ── 2. Start nginx + the bare minimum to serve ACME challenges ──────
echo "→ Starting nginx (HTTP-only)..."
docker compose -f docker-compose.prod.yml up -d nginx

# Give nginx a couple seconds to bind port 80.
sleep 3

# ── 3. Ask Let's Encrypt for the cert via the webroot plugin ────────
echo "→ Requesting Let's Encrypt cert for $DOMAIN + www.$DOMAIN..."
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --non-interactive \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

# ── 4. Swap the HTTP-only config for the real HTTPS config ──────────
echo "→ Activating production HTTPS config..."
sed "s/__DOMAIN__/$DOMAIN/g" nginx/conf.d/csc-ostwald.conf.template \
  > nginx/conf.d/csc-ostwald.conf
# .template file is no longer needed at runtime — kept on disk only as
# documentation. Nginx ignores it because its extension isn't .conf.

# ── 5. Reload nginx (no restart — keeps existing connections) ───────
echo "→ Reloading nginx..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo
echo "✓ SSL cert issued and HTTPS enabled."
echo "  Visit: https://$DOMAIN"
echo "  Cert renewal: automatic every 12h via the certbot service."
