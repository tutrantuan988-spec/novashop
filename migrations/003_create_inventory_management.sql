-- Migration 003: Create Inventory Management Schema
-- Task 1.4: Multi-warehouse inventory tracking with Vietnamese locations
-- Date: 2026-05-18

-- ============================================================================
-- INVENTORY LOCATIONS TABLE
-- ============================================================================
-- Warehouses, stores, and fulfillment centers across Vietnam

CREATE TABLE IF NOT EXISTS inventory_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_vi VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  type VARCHAR(50) DEFAULT 'warehouse',
  
  -- Vietnamese address structure
  address_vi VARCHAR(500),
  province_code VARCHAR(10),
  province_name_vi VARCHAR(100),
  district_code VARCHAR(10),
  district_name_vi VARCHAR(100),
  ward_code VARCHAR(10),
  ward_name_vi VARCHAR(100),
  
  -- Contact information
  phone VARCHAR(20),
  email VARCHAR(255),
  manager_name VARCHAR(255),
  
  -- Status and priority
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT location_type_check CHECK (type IN ('warehouse', 'store', 'dropship', 'vendor')),
  CONSTRAINT location_code_format CHECK (code ~ '^[A-Z0-9-]+$')
);

CREATE INDEX idx_inventory_locations_code ON inventory_locations(code);
CREATE INDEX idx_inventory_locations_province ON inventory_locations(province_code);
CREATE INDEX idx_inventory_locations_active ON inventory_locations(is_active);
CREATE INDEX idx_inventory_locations_type ON inventory_locations(type);
CREATE INDEX idx_inventory_locations_default ON inventory_locations(is_default) WHERE is_default = true;

COMMENT ON TABLE inventory_locations IS 'Warehouses and fulfillment centers with Vietnamese address structure';
COMMENT ON COLUMN inventory_locations.code IS 'Unique location code (e.g., WH-HN-01, STORE-HCM-02)';
COMMENT ON COLUMN inventory_locations.type IS 'Location type: warehouse, store, dropship, vendor';
COMMENT ON COLUMN inventory_locations.province_code IS 'Vietnamese province code (01-96)';
COMMENT ON COLUMN inventory_locations.priority IS 'Fulfillment priority (higher = preferred)';

-- ============================================================================
-- INVENTORY TABLE
-- ============================================================================
-- Stock levels for each variant at each location

CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES inventory_locations(id) ON DELETE CASCADE,
  quantity_available INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_incoming INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 0,
  reorder_quantity INTEGER DEFAULT 0,
  last_restock_date TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(variant_id, location_id),
  CONSTRAINT inventory_quantity_check CHECK (
    quantity_available >= 0 AND 
    quantity_reserved >= 0 AND 
    quantity_incoming >= 0
  )
);

CREATE INDEX idx_inventory_variant ON inventory(variant_id);
CREATE INDEX idx_inventory_location ON inventory(location_id);
CREATE INDEX idx_inventory_low_stock ON inventory(variant_id, location_id) 
  WHERE quantity_available <= reorder_point;
CREATE INDEX idx_inventory_available ON inventory(quantity_available) 
  WHERE quantity_available > 0;

COMMENT ON TABLE inventory IS 'Stock levels for variants at each location';
COMMENT ON COLUMN inventory.quantity_available IS 'Stock available for sale';
COMMENT ON COLUMN inventory.quantity_reserved IS 'Stock reserved for pending orders';
COMMENT ON COLUMN inventory.quantity_incoming IS 'Stock expected from purchase orders';
COMMENT ON COLUMN inventory.reorder_point IS 'Minimum stock level before reordering';

-- ============================================================================
-- INVENTORY TRANSACTIONS TABLE
-- ============================================================================
-- Complete audit trail of all inventory movements

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  location_id UUID REFERENCES inventory_locations(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  reference_type VARCHAR(50),
  reference_id VARCHAR(255),
  note TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT transaction_type_check CHECK (type IN (
    'purchase', 'sale', 'adjustment', 'transfer_in', 'transfer_out', 
    'return', 'reservation', 'release', 'damage', 'loss'
  ))
);

CREATE INDEX idx_inventory_transactions_variant ON inventory_transactions(variant_id);
CREATE INDEX idx_inventory_transactions_location ON inventory_transactions(location_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(type);
CREATE INDEX idx_inventory_transactions_reference ON inventory_transactions(reference_type, reference_id);
CREATE INDEX idx_inventory_transactions_created ON inventory_transactions(created_at DESC);
CREATE INDEX idx_inventory_transactions_created_by ON inventory_transactions(created_by) 
  WHERE created_by IS NOT NULL;

COMMENT ON TABLE inventory_transactions IS 'Complete audit trail of inventory movements';
COMMENT ON COLUMN inventory_transactions.type IS 'Transaction type: purchase, sale, adjustment, transfer, return, reservation, release';
COMMENT ON COLUMN inventory_transactions.reference_type IS 'Related entity type: order, purchase_order, transfer, adjustment';
COMMENT ON COLUMN inventory_transactions.reference_id IS 'Related entity ID';
COMMENT ON COLUMN inventory_transactions.created_by IS 'User ID who created the transaction';

-- ============================================================================
-- TRIGGERS: Update updated_at timestamp
-- ============================================================================

CREATE TRIGGER update_inventory_locations_updated_at
  BEFORE UPDATE ON inventory_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER: Ensure only one default location
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_single_default_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE inventory_locations 
    SET is_default = false 
    WHERE id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_location_trigger
  BEFORE INSERT OR UPDATE ON inventory_locations
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_location();

-- ============================================================================
-- TRIGGER: Sync variant stock with inventory
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_variant_stock()
RETURNS TRIGGER AS $$
DECLARE
  total_available INTEGER;
  total_reserved INTEGER;
BEGIN
  -- Calculate totals across all locations
  SELECT 
    COALESCE(SUM(quantity_available), 0),
    COALESCE(SUM(quantity_reserved), 0)
  INTO total_available, total_reserved
  FROM inventory
  WHERE variant_id = COALESCE(NEW.variant_id, OLD.variant_id);
  
  -- Update variant stock
  UPDATE product_variants
  SET 
    stock_quantity = total_available,
    reserved_quantity = total_reserved
  WHERE id = COALESCE(NEW.variant_id, OLD.variant_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_variant_stock_trigger
  AFTER INSERT OR UPDATE OR DELETE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION sync_variant_stock();

-- ============================================================================
-- FUNCTION: Reserve stock for order
-- ============================================================================

CREATE OR REPLACE FUNCTION reserve_stock(
  p_variant_id UUID,
  p_quantity INTEGER,
  p_order_id VARCHAR,
  p_location_id UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT, location_id UUID) AS $$
DECLARE
  v_location_id UUID;
  v_available INTEGER;
BEGIN
  -- Find location with stock (prefer default or specified location)
  IF p_location_id IS NOT NULL THEN
    v_location_id := p_location_id;
  ELSE
    SELECT i.location_id INTO v_location_id
    FROM inventory i
    JOIN inventory_locations l ON l.id = i.location_id
    WHERE i.variant_id = p_variant_id
      AND i.quantity_available >= p_quantity
      AND l.is_active = true
    ORDER BY l.is_default DESC, l.priority DESC, i.quantity_available DESC
    LIMIT 1;
  END IF;
  
  IF v_location_id IS NULL THEN
    RETURN QUERY SELECT false, 'Insufficient stock'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Check available quantity
  SELECT quantity_available INTO v_available
  FROM inventory
  WHERE variant_id = p_variant_id AND location_id = v_location_id
  FOR UPDATE;
  
  IF v_available < p_quantity THEN
    RETURN QUERY SELECT false, 'Insufficient stock at location'::TEXT, v_location_id;
    RETURN;
  END IF;
  
  -- Reserve stock
  UPDATE inventory
  SET 
    quantity_available = quantity_available - p_quantity,
    quantity_reserved = quantity_reserved + p_quantity
  WHERE variant_id = p_variant_id AND location_id = v_location_id;
  
  -- Record transaction
  INSERT INTO inventory_transactions (
    variant_id, location_id, type, quantity, reference_type, reference_id
  ) VALUES (
    p_variant_id, v_location_id, 'reservation', -p_quantity, 'order', p_order_id
  );
  
  RETURN QUERY SELECT true, 'Stock reserved successfully'::TEXT, v_location_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reserve_stock IS 'Reserve stock for an order at optimal location';

-- ============================================================================
-- FUNCTION: Release reserved stock
-- ============================================================================

CREATE OR REPLACE FUNCTION release_stock(
  p_variant_id UUID,
  p_quantity INTEGER,
  p_order_id VARCHAR,
  p_location_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
  -- Release reserved stock
  UPDATE inventory
  SET 
    quantity_available = quantity_available + p_quantity,
    quantity_reserved = quantity_reserved - p_quantity
  WHERE variant_id = p_variant_id AND location_id = p_location_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Inventory record not found'::TEXT;
    RETURN;
  END IF;
  
  -- Record transaction
  INSERT INTO inventory_transactions (
    variant_id, location_id, type, quantity, reference_type, reference_id
  ) VALUES (
    p_variant_id, p_location_id, 'release', p_quantity, 'order', p_order_id
  );
  
  RETURN QUERY SELECT true, 'Stock released successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION release_stock IS 'Release reserved stock back to available';

-- ============================================================================
-- SEED DATA: Default inventory location
-- ============================================================================

INSERT INTO inventory_locations (
  code, name_vi, name_en, type, 
  address_vi, province_code, province_name_vi,
  is_active, is_default, priority
)
VALUES (
  'WH-HN-01',
  'Kho trung tâm Hà Nội',
  'Hanoi Central Warehouse',
  'warehouse',
  'Hà Nội, Việt Nam',
  '01',
  'Thành phố Hà Nội',
  true,
  true,
  100
)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT 'Inventory Management Schema Created' AS status;
SELECT COUNT(*) AS location_count FROM inventory_locations;
SELECT COUNT(*) AS inventory_count FROM inventory;
SELECT COUNT(*) AS transaction_count FROM inventory_transactions;

