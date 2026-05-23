# PostgreSQL Setup Guide

This guide covers setting up PostgreSQL for the NovaShop Commerce Core Refactor.

## Quick Start

### 1. Start PostgreSQL with Docker

```bash
# Start PostgreSQL and Redis
docker-compose -f docker-compose.postgres.yml up -d

# Check if containers are running
docker ps

# View logs
docker-compose -f docker-compose.postgres.yml logs -f postgres
```

### 2. Configure Environment Variables

Copy the PostgreSQL configuration to your `.env.local`:

```bash
# Add to .env.local
DATABASE_URL=postgresql://novashop_user:novashop_password_dev@localhost:5432/novashop_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Feature flags (start with false, enable gradually)
USE_POSTGRES_PRODUCTS=false
USE_POSTGRES_READS=false
USE_POSTGRES_CATEGORIES=false

# Redis (for Phase 4)
REDIS_URL=redis://localhost:6379
REDIS_CACHE_TTL_PRODUCTS=3600
REDIS_CACHE_TTL_CATEGORIES=86400
REDIS_CACHE_TTL_INVENTORY=300
```

### 3. Test Connection

```bash
# Install pg package if not already installed
npm install pg

# Run connection test
node scripts/test-postgres-connection.js
```

Expected output:
```
✅ Successfully connected to PostgreSQL
📦 PostgreSQL Version: PostgreSQL 14.x
🗄️  Database: novashop_db
👤 User: novashop_user
🔌 Extensions: pg_trgm, uuid-ossp
🌏 Timezone: Asia/Ho_Chi_Minh
🇻🇳 Vietnamese text search: Configured
📊 Tables: 0

✅ PostgreSQL connection test passed!
🚀 Ready for schema creation (Task 1.2)
```

## Database Details

- **Database Name:** `novashop_db`
- **User:** `novashop_user`
- **Password:** `novashop_password_dev` (development only)
- **Port:** `5432`
- **Timezone:** `Asia/Ho_Chi_Minh`

## Installed Extensions

- **uuid-ossp:** For generating UUIDs
- **pg_trgm:** For fuzzy text search
- **vietnamese text search:** For Vietnamese full-text search

## Docker Commands

```bash
# Start services
docker-compose -f docker-compose.postgres.yml up -d

# Stop services
docker-compose -f docker-compose.postgres.yml down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose -f docker-compose.postgres.yml down -v

# View logs
docker-compose -f docker-compose.postgres.yml logs -f

# Access PostgreSQL CLI
docker exec -it novashop-postgres psql -U novashop_user -d novashop_db

# Access Redis CLI
docker exec -it novashop-redis redis-cli
```

## PostgreSQL CLI Commands

Once inside the PostgreSQL CLI:

```sql
-- List all databases
\l

-- Connect to novashop_db
\c novashop_db

-- List all tables
\dt

-- Describe a table
\d table_name

-- List all extensions
\dx

-- Show current timezone
SHOW timezone;

-- Exit
\q
```

## Troubleshooting

### Port 5432 already in use

```bash
# Check what's using port 5432
netstat -ano | findstr :5432  # Windows
lsof -i :5432                 # Mac/Linux

# Stop existing PostgreSQL service
# Windows: Services → PostgreSQL → Stop
# Mac: brew services stop postgresql
# Linux: sudo systemctl stop postgresql
```

### Connection refused

```bash
# Check if Docker is running
docker ps

# Restart PostgreSQL container
docker-compose -f docker-compose.postgres.yml restart postgres

# Check container logs
docker-compose -f docker-compose.postgres.yml logs postgres
```

### Authentication failed

- Verify DATABASE_URL in `.env.local` matches the credentials in `docker-compose.postgres.yml`
- Default credentials: `novashop_user` / `novashop_password_dev`

### Database does not exist

```bash
# Recreate the database
docker-compose -f docker-compose.postgres.yml down -v
docker-compose -f docker-compose.postgres.yml up -d
```

## Production Configuration

For production, use strong passwords and secure connection strings:

```bash
# Production .env
DATABASE_URL=postgresql://prod_user:STRONG_PASSWORD@prod-host:5432/novashop_prod
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
DATABASE_SSL=true
```

## Next Steps

After PostgreSQL is running and connection test passes:

1. ✅ Task 1.1: PostgreSQL setup (complete)
2. ⏭️ Task 1.2: Create database schema
3. ⏭️ Task 1.3: Implement service layer foundation

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/14/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [pg (node-postgres) Documentation](https://node-postgres.com/)
