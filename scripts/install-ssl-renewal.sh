#!/bin/bash
# ============================================
# Install a host cron job that renews Let's Encrypt certs and reloads nginx.
# The compose "certbot" service is not kept running, so renewal lives in cron.
# Usage (on the server, from the project root): sudo ./scripts/install-ssl-renewal.sh
# ============================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CRON_FILE="/etc/cron.d/store-certbot-renew"

cat > "$CRON_FILE" <<EOF
# Renew Let's Encrypt certs and reload nginx (twice daily)
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
17 3,15 * * * root docker run --rm -v $PROJECT_DIR/certbot/conf:/etc/letsencrypt -v $PROJECT_DIR/certbot/www:/var/www/certbot certbot/certbot:latest renew --quiet && docker exec store-nginx nginx -s reload >> /var/log/store-certbot-renew.log 2>&1
EOF
chmod 644 "$CRON_FILE"

echo "✅ Installed $CRON_FILE"
echo "🔎 Dry-run renewal:"
docker run --rm -v "$PROJECT_DIR/certbot/conf:/etc/letsencrypt" -v "$PROJECT_DIR/certbot/www:/var/www/certbot" \
    certbot/certbot:latest renew --dry-run
