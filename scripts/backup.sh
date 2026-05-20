#!/bin/bash
# NovaShop Database Backup Script
# Usage: ./scripts/backup.sh [backup_dir]

set -e

BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/novashop_backup_$TIMESTAMP.sql.gz"

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

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."
echo "   Database: $PG_DATABASE"
echo "   Host: $PG_HOST:$PG_PORT"
echo "   File: $BACKUP_FILE"

# Export password for pg_dump
export PGPASSWORD="$PG_PASSWORD"

# Run backup
pg_dump -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DATABASE" --no-owner --no-privileges | gzip > "$BACKUP_FILE"

# Get file size
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo "✅ Backup completed successfully!"
echo "   File: $BACKUP_FILE"
echo "   Size: $FILE_SIZE"

# Cleanup old backups (keep last 30 days)
echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "novashop_backup_*.sql.gz" -mtime +30 -delete 2>/dev/null || true

echo "📦 Backup strategy: Keep last 30 days"
echo "   Total backups: $(ls -1 "$BACKUP_DIR"/novashop_backup_*.sql.gz 2>/dev/null | wc -l)"
