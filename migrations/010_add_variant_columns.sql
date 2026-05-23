-- Migration 010: Add missing columns to existing product_variants table
-- The table was created by an earlier migration with a different schema

ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS attribute_values JSONB NOT NULL DEFAULT '{}';
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
