#!/bin/bash
# NovaShop Database Restore Script
# Usage: ./scripts/restore.sh <backup_file.sql.gz>

set -e

if [ -z "$1" ]; then
  echo "❌ Usage: ./scripts/restore.sh <backup_file.sql.gz>"
  echo ""
  echo "Available backups:"
  ls -1 ./backups/novashop_backup_*.sql.gz 2>/dev/null || echo "   No backups found"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
elif [ -f .env.production ]; then
  export $(cat .env.production | grep -v '^#' | xargs)
fi

# Database connection
PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
PG_DATABASE="${PG_DATABASE:-novashop_db}"
PG_USER="${PG_USER:-novashop_user}"
PG_PASSWORD="${PG_PASSWORD:-}"

echo "⚠️  WARNING: This will overwrite the database '$PG_DATABASE'"
echo "   Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure? Type 'yes' to continue: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Restore cancelled"
  exit 1
fi

echo "🔄 Starting database restore..."

# Export password for psql
export PGPASSWORD="$PG_PASSWORD"

# Drop and recreate database
echo "   Dropping existing database..."
psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres -c "DROP DATABASE IF EXISTS $PG_DATABASE;" || true
psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres -c "CREATE DATABASE $PG_DATABASE;"

# Restore backup
echo "   Restoring from backup..."
gunzip -c "$BACKUP_FILE" | psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DATABASE"

echo "✅ Database restore completed!"
echo "   Database: $PG_DATABASE"
echo "   Backup: $BACKUP_FILE"
