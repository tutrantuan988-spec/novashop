-- Migration 008: Add attributes JSONB column for dynamic category-agnostic fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;

-- Add index on the attributes column for faster querying
CREATE INDEX IF NOT EXISTS idx_products_attributes ON products USING gin (attributes);

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'attributes';
