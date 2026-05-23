-- NovaShop PostgreSQL Initialization Script
-- This script runs automatically when the PostgreSQL container is first created

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create Vietnamese text search configuration
-- This will be used for full-text search on Vietnamese product names and descriptions
CREATE TEXT SEARCH CONFIGURATION vietnamese (COPY = simple);

-- Set timezone to Vietnam
SET timezone = 'Asia/Ho_Chi_Minh';

-- Create initial database user permissions
GRANT ALL PRIVILEGES ON DATABASE novashop_db TO novashop_user;

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE 'NovaShop PostgreSQL database initialized successfully';
  RAISE NOTICE 'Database: novashop_db';
  RAISE NOTICE 'User: novashop_user';
  RAISE NOTICE 'Extensions: uuid-ossp, pg_trgm';
  RAISE NOTICE 'Text search: vietnamese configuration created';
  RAISE NOTICE 'Timezone: Asia/Ho_Chi_Minh';
END $$;
