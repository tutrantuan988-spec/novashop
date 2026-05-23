-- Migration 002: Create Products and Variants Schema
-- Task 1.3: Product catalog with flexible variants and SKU management
-- Date: 2026-05-18

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
-- Generic product catalog supporting any category

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id VARCHAR(255),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sku VARCHAR(100) UNIQUE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name_vi VARCHAR(500) NOT NULL,
  name_en VARCHAR(500),
  description_vi TEXT,
  description_en TEXT,
  short_description_vi VARCHAR(1000),
  short_description_en VARCHAR(1000),
  
  -- Pricing (VND)
  base_price DECIMAL(15,2) NOT NULL,
  sale_price DECIMAL(15,2),
  cost_price DECIMAL(15,2),
  
  -- Media
  primary_image_url VARCHAR(1000),
  images JSONB,
  video_url VARCHAR(1000),
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  
  -- SEO
  meta_title_vi VARCHAR(255),
  meta_description_vi TEXT,
  meta_keywords_vi TEXT,
  
  -- Inventory
  track_inventory BOOLEAN DEFAULT true,
  allow_backorder BOOLEAN DEFAULT false,
  low_stock_threshold INTEGER DEFAULT 10,
  
  -- Vietnamese-specific
  badge_vi VARCHAR(100),
  badge_en VARCHAR(100),
  badge_color VARCHAR(20),
  
  -- Marketplace readiness
  vendor_id UUID,
  approval_status VARCHAR(50) DEFAULT 'approved',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  
  CONSTRAINT product_status_check CHECK (status IN ('draft', 'active', 'inactive', 'out_of_stock')),
  CONSTRAINT product_price_check CHECK (base_price >= 1000 AND (sale_price IS NULL OR sale_price >= 1000)),
  CONSTRAINT product_approval_check CHECK (approval_status IN ('draft', 'pending', 'approved', 'rejected')),
  CONSTRAINT product_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes for products
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_legacy ON products(legacy_id);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_category_status ON products(category_id, status) WHERE status = 'active';
CREATE INDEX idx_products_vendor ON products(vendor_id) WHERE vendor_id IS NOT NULL;

-- Full-text search index for Vietnamese
CREATE INDEX idx_products_search ON products 
  USING gin(to_tsvector('vietnamese', name_vi || ' ' || COALESCE(description_vi, '')));

COMMENT ON TABLE products IS 'Generic product catalog supporting any category';
COMMENT ON COLUMN products.legacy_id IS 'Original Firestore document ID for backward compatibility';
COMMENT ON COLUMN products.base_price IS 'Base price in VND (minimum 1000)';
COMMENT ON COLUMN products.images IS 'JSON array: [{url: "...", alt_vi: "...", alt_en: "...", order: 1}]';
COMMENT ON COLUMN products.vendor_id IS 'Future marketplace vendor ID (NULL for platform products)';
COMMENT ON COLUMN products.approval_status IS 'Product approval status for marketplace';

-- ============================================================================
-- PRODUCT ATTRIBUTES TABLE
-- ============================================================================
-- Stores attribute values for products

CREATE TABLE IF NOT EXISTS product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  attribute_id UUID REFERENCES attributes(id) ON DELETE CASCADE,
  value_text TEXT,
  value_number DECIMAL(15,4),
  value_boolean BOOLEAN,
  value_date DATE,
  value_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(product_id, attribute_id)
);

CREATE INDEX idx_product_attributes_product ON product_attributes(product_id);
CREATE INDEX idx_product_attributes_attribute ON product_attributes(attribute_id);
CREATE INDEX idx_product_attributes_text ON product_attributes(value_text) WHERE value_text IS NOT NULL;
CREATE INDEX idx_product_attributes_number ON product_attributes(value_number) WHERE value_number IS NOT NULL;

COMMENT ON TABLE product_attributes IS 'Flexible attribute values for products';
COMMENT ON COLUMN product_attributes.value_text IS 'Text attribute value';
COMMENT ON COLUMN product_attributes.value_number IS 'Numeric attribute value';
COMMENT ON COLUMN product_attributes.value_json IS 'Complex attribute value (arrays, objects)';

-- ============================================================================
-- PRODUCT VARIANTS TABLE
-- ============================================================================
-- Product variants with unique SKUs (e.g., Red-Large, 1kg-Chicken)

CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name_vi VARCHAR(255),
  name_en VARCHAR(255),
  
  -- Pricing (can override product price)
  price DECIMAL(15,2),
  sale_price DECIMAL(15,2),
  cost_price DECIMAL(15,2),
  
  -- Media
  image_url VARCHAR(1000),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Inventory
  stock_quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT variant_price_check CHECK (price IS NULL OR price >= 1000),
  CONSTRAINT variant_stock_check CHECK (stock_quantity >= 0 AND reserved_quantity >= 0)
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);
CREATE INDEX idx_variants_active ON product_variants(is_active);
CREATE INDEX idx_variants_product_active ON product_variants(product_id, is_active) WHERE is_active = true;
CREATE INDEX idx_variants_default ON product_variants(product_id, is_default) WHERE is_default = true;

COMMENT ON TABLE product_variants IS 'Product variants with unique SKUs';
COMMENT ON COLUMN product_variants.price IS 'Variant-specific price (overrides product base_price if set)';
COMMENT ON COLUMN product_variants.stock_quantity IS 'Available stock for this variant';
COMMENT ON COLUMN product_variants.reserved_quantity IS 'Stock reserved for pending orders';

-- ============================================================================
-- VARIANT ATTRIBUTES TABLE
-- ============================================================================
-- Stores attribute values that define variants (e.g., color=red, size=large)

CREATE TABLE IF NOT EXISTS variant_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  attribute_id UUID REFERENCES attributes(id) ON DELETE CASCADE,
  value_text TEXT,
  value_number DECIMAL(15,4),
  value_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(variant_id, attribute_id)
);

CREATE INDEX idx_variant_attributes_variant ON variant_attributes(variant_id);
CREATE INDEX idx_variant_attributes_attribute ON variant_attributes(attribute_id);

COMMENT ON TABLE variant_attributes IS 'Attribute values that define product variants';

-- ============================================================================
-- TRIGGERS: Update updated_at timestamp
-- ============================================================================

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_attributes_updated_at
  BEFORE UPDATE ON product_attributes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER: Ensure only one default variant per product
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_single_default_variant()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE product_variants 
    SET is_default = false 
    WHERE product_id = NEW.product_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_variant_trigger
  BEFORE INSERT OR UPDATE ON product_variants
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_variant();

-- ============================================================================
-- TRIGGER: Auto-update product status based on variants
-- ============================================================================

CREATE OR REPLACE FUNCTION update_product_status_from_variants()
RETURNS TRIGGER AS $$
DECLARE
  total_stock INTEGER;
BEGIN
  -- Calculate total available stock across all variants
  SELECT COALESCE(SUM(stock_quantity - reserved_quantity), 0)
  INTO total_stock
  FROM product_variants
  WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    AND is_active = true;
  
  -- Update product status if out of stock
  IF total_stock <= 0 THEN
    UPDATE products
    SET status = 'out_of_stock'
    WHERE id = COALESCE(NEW.product_id, OLD.product_id)
      AND status = 'active'
      AND track_inventory = true;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_status_from_variants();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT 'Products and Variants Schema Created' AS status;
SELECT COUNT(*) AS product_count FROM products;
SELECT COUNT(*) AS variant_count FROM product_variants;

