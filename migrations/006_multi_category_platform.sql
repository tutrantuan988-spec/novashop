-- ============================================================================
-- Migration 006: Multi-Category Commerce Platform
-- 
-- Removes pet-specific columns from products (if still present), 
-- normalizes to category-driven schema. Products become generic entities.
-- All metadata is stored via dynamic attributes.
-- ============================================================================

-- ============================================================================
-- Step 1: Remove pet-specific columns from `products` (safely)
-- ============================================================================

-- First check if columns exist and migrate their data, then drop
DO $$
DECLARE
  col_exists BOOLEAN;
  brand_attr_id UUID;
  badge_attr_id UUID;
BEGIN
  -- Check and handle 'brand' column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'brand'
  ) INTO col_exists;
  
  IF col_exists THEN
    -- Get or create generic attribute
    INSERT INTO attributes (slug, name_vi, name_en, type, is_filterable, is_searchable)
    VALUES ('brand', 'Thương hiệu', 'Brand', 'select', true, true)
    ON CONFLICT (slug) DO UPDATE SET name_vi = 'Thương hiệu'
    RETURNING id INTO brand_attr_id;
    
    -- Migrate brand data
    INSERT INTO product_attributes (product_id, attribute_id, value_text)
    SELECT p.id, brand_attr_id, p.brand
    FROM products p
    WHERE p.brand IS NOT NULL AND p.brand != ''
    ON CONFLICT (product_id, attribute_id) DO NOTHING;
    
    -- Drop column
    ALTER TABLE products DROP COLUMN brand;
    RAISE NOTICE '✅ Migrated brand column to product_attributes';
  ELSE
    RAISE NOTICE '→ brand column already removed';
  END IF;

  -- Check and handle 'badge_vi' column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'badge_vi'
  ) INTO col_exists;
  
  IF col_exists THEN
    INSERT INTO attributes (slug, name_vi, name_en, type, is_filterable, is_searchable)
    VALUES ('badge', 'Nhãn dán', 'Badge', 'select', true, false)
    ON CONFLICT (slug) DO UPDATE SET name_vi = 'Nhãn dán'
    RETURNING id INTO badge_attr_id;
    
    INSERT INTO product_attributes (product_id, attribute_id, value_text)
    SELECT p.id, badge_attr_id, p.badge_vi
    FROM products p
    WHERE p.badge_vi IS NOT NULL AND p.badge_vi != ''
    ON CONFLICT (product_id, attribute_id) DO NOTHING;
    
    ALTER TABLE products DROP COLUMN IF EXISTS badge_vi;
    RAISE NOTICE '✅ Migrated badge_vi column to product_attributes';
  ELSE
    RAISE NOTICE '→ badge_vi column already removed';
  END IF;

  -- Drop other badge columns if they exist
  ALTER TABLE products DROP COLUMN IF EXISTS badge_en;
  ALTER TABLE products DROP COLUMN IF EXISTS badge_color;
END $$;

-- ============================================================================
-- Step 2: Add Vietnamese full-text search (only if not already present)
-- ============================================================================

-- Add tsvector column if not exists
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN index if not exists
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN(search_vector);

-- Create/Replace function for search vector updates
CREATE OR REPLACE FUNCTION products_search_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('simple', COALESCE(NEW.name_vi, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.name_en, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.slug, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_vi, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(NEW.description_en, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector updates
DROP TRIGGER IF EXISTS trg_products_search_update ON products;
CREATE TRIGGER trg_products_search_update
  BEFORE INSERT OR UPDATE OF name_vi, name_en, slug, description_vi, description_en
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_search_update();

-- Update existing products that haven't been indexed yet
UPDATE products SET search_vector = 
    setweight(to_tsvector('simple', COALESCE(name_vi, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(name_en, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(slug, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(description_vi, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(description_en, '')), 'C')
WHERE search_vector IS NULL OR search_vector = ''::tsvector;

-- ============================================================================
-- Step 3: Add performance indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_category_status 
  ON products(category_id, status) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_products_featured 
  ON products(is_featured, created_at DESC) 
  WHERE is_featured = true AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_products_new 
  ON products(is_new, created_at DESC) 
  WHERE is_new = true AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_products_bestseller 
  ON products(is_bestseller, created_at DESC) 
  WHERE is_bestseller = true AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_categories_slug_active 
  ON categories(slug) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_product_attributes_lookup 
  ON product_attributes(product_id, attribute_id, value_text);

-- ============================================================================
-- Step 4: Add Vietnamese collation (safely)
-- ============================================================================

DO $$
BEGIN
  -- The ICU collation may not be available; skip silently
  BEGIN
    CREATE COLLATION IF NOT EXISTS vi_VN (locale = 'vi-VN');
    RAISE NOTICE '✅ Created vi_VN collation';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '→ vi_VN collation not available (ICU not configured), will use default';
  END;
END $$;

-- ============================================================================
-- Step 5: Ensure attribute_groups exist
-- ============================================================================

INSERT INTO attribute_groups (slug, name_vi, name_en, display_order, is_active)
VALUES 
  ('specifications', 'Thông số kỹ thuật', 'Specifications', 1, true),
  ('dimensions', 'Kích thước', 'Dimensions', 2, true),
  ('materials', 'Chất liệu', 'Materials', 3, true),
  ('home_living', 'Nhà cửa & Đời sống', 'Home & Living', 4, true),
  ('performance', 'Hiệu năng', 'Performance', 5, true)
ON CONFLICT (slug) DO UPDATE SET 
  display_order = EXCLUDED.display_order,
  is_active = true;

-- ============================================================================
-- Step 6: Ensure unique constraint on product_attributes
-- ============================================================================

ALTER TABLE product_attributes 
  DROP CONSTRAINT IF EXISTS unique_product_attribute;
ALTER TABLE product_attributes 
  ADD CONSTRAINT unique_product_attribute 
  UNIQUE (product_id, attribute_id);

-- ============================================================================
-- Step 7: Add multi-category attributes (generic — NOT pet-specific)
-- ============================================================================

-- Fashion & General: Color
INSERT INTO attributes (slug, name_vi, name_en, type, is_filterable, is_searchable, is_variant, display_order, options)
SELECT 'color', 'Màu sắc', 'Color', 'select', true, true, true, 1,
  '[{"value":"do","label_vi":"Đỏ","label_en":"Red"},{"value":"xanh","label_vi":"Xanh","label_en":"Blue"},{"value":"den","label_vi":"Đen","label_en":"Black"},{"value":"trang","label_vi":"Trắng","label_en":"White"},{"value":"vang","label_vi":"Vàng","label_en":"Yellow"},{"value":"tim","label_vi":"Tím","label_en":"Purple"},{"value":"cam","label_vi":"Cam","label_en":"Orange"},{"value":"xam","label_vi":"Xám","label_en":"Gray"}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM attributes WHERE slug = 'color');

-- Fashion & General: Size
INSERT INTO attributes (slug, name_vi, name_en, type, is_filterable, is_searchable, is_variant, display_order, options)
SELECT 'size', 'Kích thước', 'Size', 'select', true, true, true, 2,
  '[{"value":"xs","label_vi":"XS"},{"value":"s","label_vi":"S"},{"value":"m","label_vi":"M"},{"value":"l","label_vi":"L"},{"value":"xl","label_vi":"XL"},{"value":"xxl","label_vi":"XXL"}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM attributes WHERE slug = 'size');

-- General: Material
INSERT INTO attributes (slug, name_vi, name_en, type, is_filterable, is_searchable, display_order, options)
SELECT 'material', 'Chất liệu', 'Material', 'select', true, true, 3,
  '[{"value":"cotton","label_vi":"Cotton"},{"value":"polyester","label_vi":"Polyester"},{"value":"da","label_vi":"Da"},{"value":"cao-su","label_vi":"Cao su"},{"value":"kim-loai","label_vi":"Kim loại"},{"value":"go","label_vi":"Gỗ"},{"value":"nhua","label_vi":"Nhựa"},{"value":"thuong-tam","label_vi":"Tơ tằm"},{"value":"len","label_vi":"Len"}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM attributes WHERE slug = 'material');

-- Electronics: RAM
INSERT INTO attributes (slug, name_vi, name_en, type, is_filterable, is_searchable, display_order, options)
SELECT 'ram', 'RAM', 'RAM', 'select', true, true, 4,
  '[{"value":"2gb","label_vi":"2GB"},{"value":"4gb","label_vi":"4GB"},{"value":"8gb","label_vi":"8GB"},{"value":"16gb","label_vi":"16GB"},{"value":"32gb","label_vi":"32GB"},{"value":"64gb","label_vi":"64GB"}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM attributes WHERE slug = 'ram');

-- Electronics: Storage
INSERT INTO attributes (slug, name_vi, name_en, type, is_filterable, is_searchable, display_order, options)
SELECT 'storage', 'Bộ nhớ trong', 'Storage', 'select', true, true, 5,
  '[{"value":"32gb","label_vi":"32GB"},{"value":"64gb","label_vi":"64GB"},{"value":"128gb","label_vi":"128GB"},{"value":"256gb","label_vi":"256GB"},{"value":"512gb","label_vi":"512GB"},{"value":"1tb","label_vi":"1TB"},{"value":"2tb","label_vi":"2TB"}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM attributes WHERE slug = 'storage');

-- Electronics: CPU
INSERT INTO attributes (slug, name_vi, name_en, type, is_filterable, is_searchable, display_order, options)
SELECT 'cpu', 'CPU', 'CPU', 'select', true, true, 6,
  '[{"value":"intel-i3","label_vi":"Intel Core i3"},{"value":"intel-i5","label_vi":"Intel Core i5"},{"value":"intel-i7","label_vi":"Intel Core i7"},{"value":"intel-i9","label_vi":"Intel Core i9"},{"value":"amd-r5","label_vi":"AMD Ryzen 5"},{"value":"amd-r7","label_vi":"AMD Ryzen 7"},{"value":"amd-r9","label_vi":"AMD Ryzen 9"},{"value":"m1","label_vi":"Apple M1"},{"value":"m2","label_vi":"Apple M2"},{"value":"m3","label_vi":"Apple M3"}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM attributes WHERE slug = 'cpu');

-- Fashion: Style
INSERT INTO attributes (slug, name_vi, name_en, type, is_filterable, is_searchable, display_order, options)
SELECT 'style', 'Phong cách', 'Style', 'select', true, true, 7,
  '[{"value":"casual","label_vi":"Casual"},{"value":"formal","label_vi":"Công sở"},{"value":"streetwear","label_vi":"Streetwear"},{"value":"sporty","label_vi":"Thể thao"},{"value":"vintage","label_vi":"Cổ điển"},{"value":"minimalist","label_vi":"Tối giản"}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM attributes WHERE slug = 'style');

-- Home: Room Type
INSERT INTO attributes (slug, name_vi, name_en, type, is_filterable, is_searchable, display_order, options)
SELECT 'room-type', 'Phòng sử dụng', 'Room Type', 'select', true, true, 8,
  '[{"value":"phong-khach","label_vi":"Phòng khách"},{"value":"phong-ngu","label_vi":"Phòng ngủ"},{"value":"bep","label_vi":"Nhà bếp"},{"value":"phong-tam","label_vi":"Phòng tắm"},{"value":"phong-lam-viec","label_vi":"Phòng làm việc"}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM attributes WHERE slug = 'room-type');

-- Electronics: Screen Size
INSERT INTO attributes (slug, name_vi, name_en, type, is_filterable, is_searchable, display_order, options)
SELECT 'screen-size', 'Kích thước màn hình', 'Screen Size', 'select', true, true, 9,
  '[{"value":"5inch","label_vi":"Dưới 5 inch"},{"value":"6inch","label_vi":"5-6 inch"},{"value":"6.5inch","label_vi":"6-6.5 inch"},{"value":"7inch","label_vi":"Trên 7 inch"},{"value":"13inch","label_vi":"13 inch"},{"value":"15inch","label_vi":"15 inch"},{"value":"17inch","label_vi":"17 inch"}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM attributes WHERE slug = 'screen-size');

-- ============================================================================
-- Step 8: Associate attributes with categories via category_attributes
-- ============================================================================

-- Helper function to assign attributes to categories safely
DO $$
DECLARE
  cat RECORD;
  attr RECORD;
BEGIN
  -- Map: category_slug -> array of {attr_slug, is_required, display_order}
  -- Thời trang (thoi-trang)
  FOR attr IN 
    SELECT unnest(ARRAY[
      ROW('brand', true, 1),
      ROW('size', true, 2),
      ROW('color', true, 3),
      ROW('material', true, 4),
      ROW('style', false, 5)
    ]::record[]) AS t(slug TEXT, required BOOL, ord INT)
  LOOP
    INSERT INTO category_attributes (category_id, attribute_id, is_required, display_order)
    SELECT c.id, a.id, attr.required, attr.ord
    FROM categories c, attributes a
    WHERE c.slug = 'thoi-trang' AND a.slug = attr.slug
    ON CONFLICT (category_id, attribute_id) DO UPDATE SET is_required = EXCLUDED.is_required, display_order = EXCLUDED.display_order;
  END LOOP;

  -- Điện tử (dien-tu)
  FOR attr IN 
    SELECT unnest(ARRAY[
      ROW('brand', true, 1),
      ROW('ram', true, 2),
      ROW('storage', true, 3),
      ROW('cpu', true, 4),
      ROW('screen-size', false, 5),
      ROW('color', false, 6)
    ]::record[]) AS t(slug TEXT, required BOOL, ord INT)
  LOOP
    INSERT INTO category_attributes (category_id, attribute_id, is_required, display_order)
    SELECT c.id, a.id, attr.required, attr.ord
    FROM categories c, attributes a
    WHERE c.slug = 'dien-tu' AND a.slug = attr.slug
    ON CONFLICT (category_id, attribute_id) DO UPDATE SET is_required = EXCLUDED.is_required, display_order = EXCLUDED.display_order;
  END LOOP;

  -- Gia dụng (gia-dung)
  FOR attr IN 
    SELECT unnest(ARRAY[
      ROW('material', true, 1),
      ROW('room-type', true, 2),
      ROW('color', false, 3),
      ROW('brand', false, 4),
      ROW('dimensions', false, 5)
    ]::record[]) AS t(slug TEXT, required BOOL, ord INT)
  LOOP
    INSERT INTO category_attributes (category_id, attribute_id, is_required, display_order)
    SELECT c.id, a.id, attr.required, attr.ord
    FROM categories c, attributes a
    WHERE c.slug = 'gia-dung' AND a.slug = attr.slug
    ON CONFLICT (category_id, attribute_id) DO UPDATE SET is_required = EXCLUDED.is_required, display_order = EXCLUDED.display_order;
  END LOOP;

  -- Thời trang nam (thoi-trang-nam) — new generic category
  FOR attr IN 
    SELECT unnest(ARRAY[
      ROW('brand', true, 1),
      ROW('color', true, 2),
      ROW('size', true, 3),
      ROW('material', false, 4)
    ]::record[]) AS t(slug TEXT, required BOOL, ord INT)
  LOOP
    INSERT INTO category_attributes (category_id, attribute_id, is_required, display_order)
    SELECT c.id, a.id, attr.required, attr.ord
    FROM categories c, attributes a
    WHERE c.slug = 'thoi-trang-nam' AND a.slug = attr.slug
    ON CONFLICT (category_id, attribute_id) DO UPDATE SET is_required = EXCLUDED.is_required, display_order = EXCLUDED.display_order;
  END LOOP;

  -- Điện thoại (dien-thoai) — new generic category
  FOR attr IN 
    SELECT unnest(ARRAY[
      ROW('brand', true, 1),
      ROW('color', false, 2),
      ROW('storage', true, 3),
      ROW('screen-size', true, 4),
      ROW('ram', true, 5)
    ]::record[]) AS t(slug TEXT, required BOOL, ord INT)
  LOOP
    INSERT INTO category_attributes (category_id, attribute_id, is_required, display_order)
    SELECT c.id, a.id, attr.required, attr.ord
    FROM categories c, attributes a
    WHERE c.slug = 'dien-thoai' AND a.slug = attr.slug
    ON CONFLICT (category_id, attribute_id) DO UPDATE SET is_required = EXCLUDED.is_required, display_order = EXCLUDED.display_order;
  END LOOP;

  RAISE NOTICE '✅ Assigned attributes to all categories';
END $$;

-- Insert new categories (Fashion & Electronics) if not exists
INSERT INTO categories (slug, name_vi, name_en, is_featured, show_in_menu, show_in_homepage, display_order, description_vi)
VALUES 
  ('thoi-trang', 'Thời trang', 'Fashion', true, true, true, 4, 'Quần áo, phụ kiện thời trang cho mọi lứa tuổi'),
  ('dien-tu', 'Điện tử', 'Electronics', true, true, true, 5, 'Điện thoại, laptop, thiết bị thông minh')
ON CONFLICT (slug) DO UPDATE SET 
  name_vi = EXCLUDED.name_vi,
  name_en = EXCLUDED.name_en,
  is_featured = true,
  show_in_menu = true,
  show_in_homepage = true;

-- ============================================================================
-- Step 9: Create universal category attribute mapping view
-- ============================================================================

CREATE OR REPLACE VIEW v_category_attribute_schema AS
SELECT 
  c.id AS category_id,
  c.slug AS category_slug,
  c.name_vi AS category_name,
  c.name_en AS category_name_en,
  jsonb_agg(
    jsonb_build_object(
      'attribute_id', a.id,
      'slug', a.slug,
      'name_vi', a.name_vi,
      'name_en', a.name_en,
      'type', a.type,
      'is_required', ca.is_required,
      'is_variant', a.is_variant,
      'is_filterable', a.is_filterable,
      'display_order', ca.display_order,
      'options', a.options,
      'validation_rules', a.validation_rules,
      'group_name_vi', ag.name_vi,
      'group_slug', ag.slug
    ) ORDER BY ca.display_order ASC, a.display_order ASC
  ) FILTER (WHERE a.id IS NOT NULL) AS attributes
FROM categories c
LEFT JOIN category_attributes ca ON ca.category_id = c.id
LEFT JOIN attributes a ON a.id = ca.attribute_id
LEFT JOIN attribute_groups ag ON ag.id = a.group_id
GROUP BY c.id, c.slug, c.name_vi, c.name_en
ORDER BY c.display_order ASC;

-- ============================================================================
-- Step 10: Add trigger for updated_at on products
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Step 11: Add more category examples to demonstrate multi-category
-- ============================================================================

INSERT INTO categories (slug, name_vi, name_en, is_featured, show_in_menu, show_in_homepage, display_order, description_vi)
VALUES 
  ('nha-cua-doi-song', 'Nhà cửa & Đời sống', 'Home & Living', true, true, true, 6, 'Đồ dùng gia đình, nội thất, trang trí nhà cửa'),
  ('suc-khoe-lam-dep', 'Sức khỏe & Làm đẹp', 'Health & Beauty', true, true, true, 7, 'Mỹ phẩm, chăm sóc da, thực phẩm chức năng'),
  ('do-choi-tre-em', 'Đồ chơi trẻ em', 'Toys & Kids', true, true, true, 8, 'Đồ chơi, đồ dùng cho bé')
ON CONFLICT (slug) DO NOTHING;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '=========================================================';
  RAISE NOTICE '✅ Migration 006 complete: Multi-category commerce platform';
  RAISE NOTICE '=========================================================';
  RAISE NOTICE '✓ Removed pet-specific columns from products';
  RAISE NOTICE '✓ Added full-text search (simple config)';
  RAISE NOTICE '✓ Added performance indexes';
  RAISE NOTICE '✓ Added generic attributes: color, size, material';
  RAISE NOTICE '✓ Added electronics attributes: RAM, storage, CPU';
  RAISE NOTICE '✓ Added fashion attributes: style, brand';
  RAISE NOTICE '✓ Added home attributes: room-type, dimensions';
  RAISE NOTICE '✓ Assigned attribute schemas to all categories';
  RAISE NOTICE '✓ Added fashion, electronics, home, beauty, toys categories';
  RAISE NOTICE '✓ Created v_category_attribute_schema view';
  RAISE NOTICE '✓ Added updated_at trigger on products';
END $$;
