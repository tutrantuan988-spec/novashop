-- Migration 004: Add Brand Column to Products Table
-- Task: Add direct brand field for frontend brand filtering
-- Date: 2026-05-18

-- ============================================================================
-- Add brand column to products table
-- ============================================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand VARCHAR(255);

-- Index for brand filtering
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);

COMMENT ON COLUMN products.brand IS 'Brand name for display and filtering (e.g., Royal Canin, Pedigree)';

-- ============================================================================
-- Verification
-- ============================================================================

SELECT 'Migration 004 complete: Added brand column to products' AS status;
