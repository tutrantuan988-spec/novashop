-- Seed 3 categories with their attributes (uses category_attributes mapping table)

-- Insert categories
INSERT INTO categories (slug, name_vi, is_featured, show_in_menu)
VALUES 
  ('thoi-trang', 'Thời trang', true, true),
  ('dien-tu', 'Điện tử', true, true),
  ('thu-cung', 'Thú cưng', true, true)
ON CONFLICT (slug) DO UPDATE SET name_vi = EXCLUDED.name_vi
RETURNING id AS category_id, slug, name_vi;

-- Insert attributes
INSERT INTO attributes (slug, name_vi, type, is_filterable)
VALUES 
  ('size', 'Kích thước', 'select', true),
  ('color', 'Màu sắc', 'text', true),
  ('material', 'Chất liệu', 'text', true),
  ('ram', 'RAM', 'text', true),
  ('cpu', 'CPU', 'text', true),
  ('storage', 'Bộ nhớ trong', 'text', true),
  ('breed', 'Giống loài', 'text', true),
  ('weight', 'Cân nặng', 'number', true),
  ('ingredients', 'Thành phần', 'text', false)
ON CONFLICT (slug) DO UPDATE SET name_vi = EXCLUDED.name_vi
RETURNING id AS attribute_id, slug, name_vi;

-- Map attributes to categories via category_attributes
WITH cat AS (SELECT id, slug FROM categories),
     attr AS (SELECT id, slug FROM attributes)
INSERT INTO category_attributes (category_id, attribute_id, is_required, display_order)
SELECT c.id, a.id, true, row_number() OVER (PARTITION BY c.id)
FROM cat c
JOIN attr a ON 
  (c.slug = 'thoi-trang' AND a.slug IN ('size', 'color', 'material'))
  OR (c.slug = 'dien-tu' AND a.slug IN ('ram', 'cpu', 'storage'))
  OR (c.slug = 'thu-cung' AND a.slug IN ('breed', 'weight', 'ingredients'))
ON CONFLICT (category_id, attribute_id) DO NOTHING
RETURNING category_id, attribute_id;
