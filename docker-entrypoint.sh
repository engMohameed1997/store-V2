#!/bin/sh
set -e

echo "🚀 Starting Store..."

# ============================================
# Wait for Database
# ============================================
if [ -n "$DATABASE_URL" ]; then
  echo "⏳ Waiting for database..."

  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\1|p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\2|p')

  if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
    RETRIES=30
    until nc -z -w2 "$DB_HOST" "$DB_PORT" 2>/dev/null || [ "$RETRIES" -eq 0 ]; do
      echo "  Waiting for $DB_HOST:$DB_PORT... ($RETRIES left)"
      RETRIES=$((RETRIES - 1))
      sleep 2
    done

    if [ "$RETRIES" -eq 0 ]; then
      echo "❌ Database connection timeout — exiting."
      exit 1
    fi

    echo "✅ Database ready!"
  fi
fi

# ============================================
# Run Prisma Migrations or DB Push
# ============================================
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "📦 Running database schema update..."
  # Use db push for production (safer when migration history is out of sync)
  npx prisma db push --accept-data-loss || { echo "❌ Database update failed — exiting."; exit 1; }
  echo "✅ Database schema updated!"
fi

# ============================================
# Start Application
# ============================================
echo "🟢 Starting application..."
exec "$@"
