#!/bin/sh
set -e

echo "🚀 Starting Store API..."

# ============================================
# Wait for Database
# ============================================
if [ -n "$DATABASE_URL" ]; then
  echo "⏳ Waiting for database to be ready..."
  
  # Extract host and port from DATABASE_URL
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\1|p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):\([0-9]*\)/.*|\2|p')
  
  if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
    RETRIES=30
    until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null || [ $RETRIES -eq 0 ]; do
      echo "  Waiting for $DB_HOST:$DB_PORT... ($RETRIES retries left)"
      RETRIES=$((RETRIES - 1))
      sleep 2
    done
    
    if [ $RETRIES -eq 0 ]; then
      echo "❌ Database connection timeout!"
      exit 1
    fi
    
    echo "✅ Database is ready!"
  fi
fi

# ============================================
# Run Prisma Migrations (production only)
# ============================================
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "📦 Running database migrations..."
  node_modules/.bin/prisma migrate deploy
  echo "✅ Migrations complete!"
fi

# ============================================
# Start Application
# ============================================
echo "🟢 Starting application..."
exec "$@"
