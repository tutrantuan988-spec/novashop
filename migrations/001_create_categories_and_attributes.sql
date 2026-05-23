-- Migration 001: Create Categories and Attributes Schema
-- Task 1.2: Core database schema for dynamic category hierarchy and flexible attributes
-- Date: 2026-05-18

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
-- Supports unlimited depth hierarchy with Vietnamese localization

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name_vi VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  description_vi TEXT,
  description_en TEXT,
  image_url VARCHAR(1000),
  icon VARCHAR(100),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  meta_title_vi VARCHAR(255),
  meta_description_vi TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Vietnamese-specific fields
  is_featured BOOLEAN DEFAULT false,
  show_in_menu BOOLEAN DEFAULT true,
  show_in_homepage BOOLEAN DEFAULT false,
  
  -- Marketplace readiness
  requires_approval BOOLEAN DEFAULT false,
  commission_rate DECIMAL(5,2) DEFAULT 0.00,
  
  CONSTRAINT category_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT commission_rate_range CHECK (commission_rate >= 0 AND commission_rate <= 100)
);

-- Indexes for categories
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(is_active);
CREATE INDEX idx_categories_featured ON categories(is_featured) WHERE is_featured = true;
CREATE INDEX idx_categories_parent_active ON categories(parent_id, is_active) WHERE is_active = true;

-- Comments for documentation
COMMENT ON TABLE categories IS 'Product category hierarchy with Vietnamese localization';
COMMENT ON COLUMN categories.parent_id IS 'Parent category ID for hierarchical structure (NULL for root categories)';
COMMENT ON COLUMN categories.slug IS 'URL-friendly identifier (lowercase, numbers, hyphens only)';
COMMENT ON COLUMN categories.commission_rate IS 'Marketplace commission rate percentage (0-100)';

-- ============================================================================
-- ATTRIBUTE GROUPS TABLE
-- ============================================================================
-- Groups related attributes together (e.g., "Physical Dimensions", "Technical Specs")

CREATE TABLE IF NOT EXISTS attribute_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_vi VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  slug VARCHAR(255) UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT attribute_group_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_attribute_groups_slug ON attribute_groups(slug);
CREATE INDEX idx_attribute_groups_active ON attribute_groups(is_active);

COMMENT ON TABLE attribute_groups IS 'Groups for organizing related product attributes';

-- ============================================================================
-- ATTRIBUTES TABLE
-- ============================================================================
-- Flexible attribute definitions that can be assigned to categories

CREATE TABLE IF NOT EXISTS attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES attribute_groups(id) ON DELETE CASCADE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name_vi VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  type VARCHAR(50) NOT NULL,
  unit_vi VARCHAR(50),
  unit_en VARCHAR(50),
  is_required BOOLEAN DEFAULT false,
  is_variant BOOLEAN DEFAULT false,
  is_filterable BOOLEAN DEFAULT true,
  is_searchable BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  validation_rules JSONB,
  options JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT attribute_type_check CHECK (type IN ('text', 'number', 'select', 'multiselect', 'color', 'boolean', 'date')),
  CONSTRAINT attribute_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes for attributes
CREATE INDEX idx_attributes_group ON attributes(group_id);
CREATE INDEX idx_attributes_slug ON attributes(slug);
CREATE INDEX idx_attributes_variant ON attributes(is_variant);
CREATE INDEX idx_attributes_type ON attributes(type);
CREATE INDEX idx_attributes_filterable ON attributes(is_filterable) WHERE is_filterable = true;

COMMENT ON TABLE attributes IS 'Flexible attribute definitions for products';
COMMENT ON COLUMN attributes.type IS 'Attribute data type: text, number, select, multiselect, color, boolean, date';
COMMENT ON COLUMN attributes.is_variant IS 'Can this attribute be used to create product variants (e.g., color, size)';
COMMENT ON COLUMN attributes.is_filterable IS 'Should this attribute appear in product filters';
COMMENT ON COLUMN attributes.validation_rules IS 'JSON validation rules: {min: 0, max: 100, pattern: "regex"}';
COMMENT ON COLUMN attributes.options IS 'JSON options for select/multiselect: [{value: "red", label_vi: "Đỏ", label_en: "Red"}]';

-- ============================================================================
-- CATEGORY ATTRIBUTES TABLE
-- ============================================================================
-- Junction table linking categories to their applicable attributes

CREATE TABLE IF NOT EXISTS category_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  attribute_id UUID REFERENCES attributes(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(category_id, attribute_id)
);

CREATE INDEX idx_category_attributes_category ON category_attributes(category_id);
CREATE INDEX idx_category_attributes_attribute ON category_attributes(attribute_id);

COMMENT ON TABLE category_attributes IS 'Links categories to their applicable attributes';
COMMENT ON COLUMN category_attributes.is_required IS 'Override attribute is_required for this specific category';

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attribute_groups_updated_at
  BEFORE UPDATE ON attribute_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attributes_updated_at
  BEFORE UPDATE ON attributes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: Initial Categories for NovaShop
-- ============================================================================

-- Root category: Multi-Category Marketplace
INSERT INTO categories (slug, name_vi, name_en, description_vi, is_active, is_featured, show_in_menu, show_in_homepage)
VALUES 
  ('san-pham', 'Sản phẩm', 'Products', 'Danh mục sản phẩm đa ngành hàng', true, true, true, true)
ON CONFLICT (slug) DO NOTHING;

-- Multi-category subcategories
DO $$
DECLARE
  parent_category_id UUID;
BEGIN
  SELECT id INTO parent_category_id FROM categories WHERE slug = 'san-pham';
  
  INSERT INTO categories (parent_id, slug, name_vi, name_en, description_vi, is_active, show_in_menu)
  VALUES 
    (parent_category_id, 'thoi-trang-nam', 'Thời trang nam', 'Men Fashion', 'Quần áo, phụ kiện thời trang nam', true, true),
    (parent_category_id, 'thoi-trang-nu', 'Thời trang nữ', 'Women Fashion', 'Quần áo, phụ kiện thời trang nữ', true, true),
    (parent_category_id, 'dien-thoai', 'Điện thoại', 'Mobile Phones', 'Điện thoại thông minh và phụ kiện', true, true),
    (parent_category_id, 'laptop', 'Laptop', 'Laptops', 'Máy tính xách tay các loại', true, true),
    (parent_category_id, 'gia-dung-nha-bep', 'Gia dụng nhà bếp', 'Kitchen Appliances', 'Đồ dùng và thiết bị nhà bếp', true, true),
    (parent_category_id, 'noi-that', 'Nội thất', 'Furniture', 'Đồ nội thất gia đình và văn phòng', true, true)
  ON CONFLICT (slug) DO NOTHING;
END $$;

-- Future categories (inactive for now)
INSERT INTO categories (slug, name_vi, name_en, description_vi, is_active, is_featured, show_in_menu)
VALUES 
  ('lam-dep', 'Làm đẹp', 'Beauty', 'Mỹ phẩm và chăm sóc sắc đẹp', false, false, false),
  ('do-choi', 'Đồ chơi', 'Toys', 'Đồ chơi trẻ em và giải trí', false, false, false),
  ('the-thao', 'Thể thao', 'Sports', 'Dụng cụ và trang phục thể thao', false, false, false)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SEED DATA: Common Attribute Groups
-- ============================================================================

INSERT INTO attribute_groups (slug, name_vi, name_en, display_order)
VALUES 
  ('thong-tin-co-ban', 'Thông tin cơ bản', 'Basic Information', 1),
  ('kich-thuoc-trong-luong', 'Kích thước & Trọng lượng', 'Size & Weight', 2),
  ('thong-so-ky-thuat', 'Thông số kỹ thuật', 'Technical Specifications', 3),
  ('chat-lieu', 'Chất liệu', 'Materials', 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SEED DATA: Common Attributes
-- ============================================================================

-- Get attribute group IDs
DO $$
DECLARE
  basic_group_id UUID;
  size_group_id UUID;
  material_group_id UUID;
BEGIN
  SELECT id INTO basic_group_id FROM attribute_groups WHERE slug = 'thong-tin-co-ban';
  SELECT id INTO size_group_id FROM attribute_groups WHERE slug = 'kich-thuoc-trong-luong';
  SELECT id INTO material_group_id FROM attribute_groups WHERE slug = 'chat-lieu';

  -- Basic attributes
  INSERT INTO attributes (group_id, slug, name_vi, name_en, type, is_variant, is_filterable)
  VALUES 
    (basic_group_id, 'thuong-hieu', 'Thương hiệu', 'Brand', 'select', false, true),
    (basic_group_id, 'xuat-xu', 'Xuất xứ', 'Origin', 'select', false, true),
    (basic_group_id, 'mau-sac', 'Màu sắc', 'Color', 'color', true, true),
    (basic_group_id, 'kich-thuoc', 'Kích thước', 'Size', 'select', true, true)
  ON CONFLICT (slug) DO NOTHING;

  -- Size & Weight attributes
  INSERT INTO attributes (group_id, slug, name_vi, name_en, type, unit_vi, unit_en, is_filterable)
  VALUES 
    (size_group_id, 'trong-luong', 'Trọng lượng', 'Weight', 'number', 'kg', 'kg', true),
    (size_group_id, 'chieu-dai', 'Chiều dài', 'Length', 'number', 'cm', 'cm', false),
    (size_group_id, 'chieu-rong', 'Chiều rộng', 'Width', 'number', 'cm', 'cm', false),
    (size_group_id, 'chieu-cao', 'Chiều cao', 'Height', 'number', 'cm', 'cm', false)
  ON CONFLICT (slug) DO NOTHING;

  -- Material attributes (for general products)
  INSERT INTO attributes (group_id, slug, name_vi, name_en, type, is_searchable)
  VALUES 
    (material_group_id, 'chat-lieu-chinh', 'Chất liệu chính', 'Main Material', 'text', true),
    (material_group_id, 'bao-hanh', 'Thời gian bảo hành', 'Warranty Period', 'text', false),
    (material_group_id, 'han-su-dung', 'Hạn sử dụng', 'Expiry Date', 'date', false)
  ON CONFLICT (slug) DO NOTHING;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count tables created
SELECT 'Categories and Attributes Schema Created' AS status;
SELECT COUNT(*) AS category_count FROM categories;
SELECT COUNT(*) AS attribute_group_count FROM attribute_groups;
SELECT COUNT(*) AS attribute_count FROM attributes;
