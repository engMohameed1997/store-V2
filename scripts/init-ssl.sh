#!/bin/bash
# ============================================
# First-time SSL certificate setup
# Usage: ./scripts/init-ssl.sh <domain> <email>
# Example: ./scripts/init-ssl.sh mystore.com admin@mystore.com
# ============================================
set -euo pipefail

DOMAIN="${1:?Usage: $0 <domain> <email>}"
EMAIL="${2:?Usage: $0 <domain> <email>}"

CERT_PATH="./certbot/conf"
WWW_PATH="./certbot/www"

echo ""
echo "🔐 Setting up SSL for: $DOMAIN"
echo "📧 Let's Encrypt email: $EMAIL"
echo ""

# ── Step 0: Replace placeholder domain in nginx config ─────────────────────
if grep -q "yourdomain.com" ./nginx/nginx.conf; then
    echo "📝 Updating nginx.conf with your domain..."
    sed -i "s/yourdomain.com/$DOMAIN/g" ./nginx/nginx.conf
    echo "   ✅ nginx.conf updated"
fi

# ── Step 1: Create directories ──────────────────────────────────────────────
mkdir -p "$CERT_PATH/live/$DOMAIN"
mkdir -p "$WWW_PATH"

# ── Step 2: Generate temporary self-signed cert (so nginx can start) ────────
echo "📜 Generating temporary self-signed certificate..."
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$CERT_PATH/live/$DOMAIN/privkey.pem" \
    -out    "$CERT_PATH/live/$DOMAIN/fullchain.pem" \
    -subj   "/CN=$DOMAIN" 2>/dev/null

cp "$CERT_PATH/live/$DOMAIN/fullchain.pem" "$CERT_PATH/live/$DOMAIN/chain.pem"
echo "   ✅ Temporary certificate created"

# ── Step 3: Start nginx with the temp cert ──────────────────────────────────
echo "🚀 Starting nginx..."
docker compose up -d nginx
echo "   ⏳ Waiting for nginx to be ready..."
sleep 5

# ── Step 4: Request real certificate from Let's Encrypt ─────────────────────
echo "🔑 Requesting Let's Encrypt certificate..."
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d "$DOMAIN"

echo "   ✅ Let's Encrypt certificate obtained"

# ── Step 5: Reload nginx with the real certificate ──────────────────────────
echo "🔄 Reloading nginx..."
docker compose exec nginx nginx -s reload
echo "   ✅ nginx reloaded"

echo ""
echo "✅ SSL setup complete!"
echo "   Your site: https://$DOMAIN"
echo ""
echo "Next: start all services with:"
echo "   docker compose up -d"
echo ""
