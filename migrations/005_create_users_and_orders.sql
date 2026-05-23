-- Migration 005: Create Users & Orders Schema
-- Phase: Auth + Orders Sync (Workstream D)
-- Date: 2026-05-18

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Bridging Firebase Auth with PostgreSQL user profiles
-- Supports both Firebase-authenticated and future native-auth users

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  firebase_uid VARCHAR(255) UNIQUE,
  firebase_email_verified BOOLEAN DEFAULT false,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  avatar_url VARCHAR(1000),
  address_line VARCHAR(500),
  ward VARCHAR(100),
  district VARCHAR(100),
  province VARCHAR(100),
  is_guest BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  role VARCHAR(50) DEFAULT 'customer',
  meta JSONB DEFAULT '{}',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT user_role_check CHECK (role IN ('customer', 'admin', 'staff', 'vendor'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

COMMENT ON TABLE users IS 'User profiles bridging Firebase Auth with PostgreSQL';
COMMENT ON COLUMN users.firebase_uid IS 'Firebase Auth user ID for authentication';
COMMENT ON COLUMN users.meta IS 'Flexible metadata: preferences, marketing_opt_in, etc.';

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
-- Complete order records migrated from Firestore

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code VARCHAR(50) UNIQUE NOT NULL,
  legacy_id VARCHAR(255),

  -- Customer Info
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),

  -- Addresses (denormalized for order history snapshot)
  shipping_address JSONB,
  billing_address JSONB,

  -- Financials
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  shipping_fee DECIMAL(15,2) DEFAULT 0,
  discount DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL DEFAULT 0,

  -- Payment
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_transaction_id VARCHAR(255),
  paid_at TIMESTAMP,

  -- Fulfillment
  order_status VARCHAR(50) DEFAULT 'pending',
  tracking_number VARCHAR(255),
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,

  -- Notes
  notes TEXT,
  admin_notes TEXT,

  -- Guest checkout (P4)
  guest_token VARCHAR(255),

  -- Audit
  source VARCHAR(50) DEFAULT 'web', -- web, mobile, admin, pos
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT order_status_check CHECK (order_status IN (
    'pending', 'confirmed', 'processing', 'shipped', 'delivered',
    'cancelled', 'returned', 'refunded'
  )),
  CONSTRAINT payment_status_check CHECK (payment_status IN (
    'pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'
  )),
  CONSTRAINT payment_method_check CHECK (payment_method IN (
    'cod', 'bank_transfer', 'stripe', 'vnpay', 'momo', 'zalopay', NULL
  )),
  CONSTRAINT order_financial_check CHECK (subtotal >= 0 AND total >= 0)
);

CREATE INDEX idx_orders_code ON orders(order_code);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_source ON orders(source);
CREATE INDEX idx_orders_guest_token ON orders(guest_token) WHERE guest_token IS NOT NULL;

COMMENT ON TABLE orders IS 'Complete order records migrated from Firestore';
COMMENT ON COLUMN orders.legacy_id IS 'Original Firestore document ID';
COMMENT ON COLUMN orders.order_code IS 'Human-readable order code (e.g., TDxxxx)';
COMMENT ON COLUMN orders.guest_token IS 'Token for guest order tracking';

-- ============================================================================
-- ORDER ITEMS TABLE
-- ============================================================================
-- Individual line items within orders

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,

  -- Product snapshot (denormalized)
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name VARCHAR(500) NOT NULL,
  product_slug VARCHAR(255),
  product_image VARCHAR(1000),
  variant_label VARCHAR(255),

  -- Pricing at time of order
  unit_price DECIMAL(15,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT item_quantity_check CHECK (quantity > 0),
  CONSTRAINT item_price_check CHECK (unit_price >= 0)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

COMMENT ON TABLE order_items IS 'Snapshot of products at time of purchase';

-- ============================================================================
-- TRIGGERS: Update updated_at timestamp
-- ============================================================================

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: Auto-generate order code
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS VARCHAR(50) AS $$
DECLARE
  v_code VARCHAR(50);
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := 'TD' || upper(substr(md5(random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_order_code IS 'Generate a unique human-readable order code';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Users & Orders Schema Created' AS status;
SELECT COUNT(*) AS user_count FROM users;
SELECT COUNT(*) AS order_count FROM orders;
SELECT COUNT(*) AS order_item_count FROM order_items;

