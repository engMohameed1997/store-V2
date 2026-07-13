#!/bin/sh
set -euo pipefail

# ── Prisma Migrations ──
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "📦 Running Prisma migrations..."
  npx prisma migrate deploy
  echo "   ✅ Migrations complete"
fi

# ── MinIO Bucket Setup via mc ──
echo "🪣 Waiting for MinIO to be ready..."
until curl -sf http://minio:9000/minio/health/live 2>/dev/null; do
  echo "   ⏳ MinIO not ready yet, retrying in 3s..."
  sleep 3
done

echo "   Setting up bucket..."
mc alias set minio http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
mc mb --ignore-existing minio/"$MINIO_BUCKET"
mc anonymous set download minio/"$MINIO_BUCKET"
echo "   ✅ Bucket '$MINIO_BUCKET' ready (public read)"

exec "$@"
