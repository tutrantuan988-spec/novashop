# Tasks 1.2, 1.3, 1.4: Database Schema Creation - COMPLETE ✅

**Status:** Schema files created, ready to run  
**Date:** May 18, 2026  
**Phase:** 1 - Foundation  

---

## Summary

Successfully created all PostgreSQL migration files for the Commerce Core Refactor. The schema includes 11 tables supporting dynamic categories, flexible attributes, product variants, and multi-warehouse inventory with Vietnamese localization.

---

## Migration Files Created

### 1. Migration 001: Categories and Attributes
**File:** `migrations/001_create_categories_and_attributes.sql`

**Tables Created:**
- `categories` - Hierarchical category structure with Vietnamese localization
- `attribute_groups` - Groups for organizing attributes
- `attributes` - Flexible attribute definitions (text, number, select, color, etc.)
- `category_attributes` - Junction table linking categories to attributes

**Features:**
- Unlimited category depth with parent-child relationships
- Vietnamese and English names for all entities
- URL-friendly slugs with validation
- Marketplace-ready (commission rates, approval flags)
- Seed data: Pet categories and common attributes

**Seed Data Included:**
- Root category: "Thú cưng" (Pets)
- Subcategories: Dog Food, Cat Food, Pet Accessories
- Future categories: Fashion, Beauty, Electronics (inactive)
- 4 attribute groups: Basic Info, Size & Weight, Technical Specs, Ingredients
- 11 common attributes: Brand, Origin, Color, Size, Weight, etc.

---

### 2. Migration 002: Products and Variants
**File:** `migrations/002_create_products_and_variants.sql`

**Tables Created:**
- `products` - Generic product catalog
- `product_attributes` - Attribute values for products
- `product_variants` - Product variants with unique SKUs
- `variant_attributes` - Attribute values defining variants

**Features:**
- Category-agnostic product system
- Vietnamese pricing (VND, minimum 1000)
- Flexible media (images array, video)
- Vietnamese SEO fields
- Legacy Firestore ID preservation
- Marketplace-ready (vendor_id, approval_status)
- Full-text search for Vietnamese
- Automatic triggers for default variants and stock status

**Constraints:**
- Base price minimum: 1,000 VND
- Slug format: lowercase, numbers, hyphens only
- Status: draft, active, inactive, out_of_stock
- Approval: draft, pending, approved, rejected

---

### 3. Migration 003: Inventory Management
**File:** `migrations/003_create_inventory_management.sql`

**Tables Created:**
- `inventory_locations` - Warehouses and stores with Vietnamese addresses
- `inventory` - Stock levels per variant per location
- `inventory_transactions` - Complete audit trail of movements

**Features:**
- Multi-warehouse support
- Vietnamese address structure (province, district, ward codes)
- Stock reservation and release functions
- Automatic variant stock synchronization
- Transaction types: purchase, sale, adjustment, transfer, return, reservation, release
- Low stock alerts
- Reorder point management

**Functions Created:**
- `reserve_stock()` - Reserve stock for orders with optimal location selection
- `release_stock()` - Release reserved stock back to available

**Seed Data:**
- Default warehouse: "Kho trung tâm Hà Nội" (WH-HN-01)

---

## Database Schema Overview

### Total Tables: 11

**Category System (4 tables):**
1. categories
2. attribute_groups
3. attributes
4. category_attributes

**Product System (4 tables):**
5. products
6. product_attributes
7. product_variants
8. variant_attributes

**Inventory System (3 tables):**
9. inventory_locations
10. inventory
11. inventory_transactions

---

## How to Run Migrations

### Step 1: Update .env.local

Add the correct DATABASE_URL to your `.env.local` file:

```env
# PostgreSQL connection
DATABASE_URL=postgresql://novashop_user:novashop_password_dev@localhost:5432/novashop_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Feature flags (start disabled)
USE_POSTGRES_PRODUCTS=false
USE_POSTGRES_READS=false
USE_POSTGRES_CATEGORIES=false

# Redis cache
REDIS_URL=redis://localhost:6379
REDIS_CACHE_TTL_PRODUCTS=3600
REDIS_CACHE_TTL_CATEGORIES=86400
REDIS_CACHE_TTL_INVENTORY=300
```

**Important:** The credentials must match `docker-compose.postgres.yml`:
- User: `novashop_user`
- Password: `novashop_password_dev`
- Database: `novashop_db`

### Step 2: Ensure PostgreSQL is Running

```bash
# Check if containers are running
docker ps

# If not running, start them
docker-compose -f docker-compose.postgres.yml up -d

# Verify connection
node scripts/test-postgres-connection.js
```

### Step 3: Run Migrations

```bash
# Run all migrations
node scripts/run-migrations.js
```

Expected output:
```
🚀 Starting PostgreSQL migrations...

📁 Found 3 migration file(s):
   1. 001_create_categories_and_attributes.sql
   2. 002_create_products_and_variants.sql
   3. 003_create_inventory_management.sql

⏳ Running migration: 001_create_categories_and_attributes.sql...
✅ Completed 001_create_categories_and_attributes.sql (XXXms)

⏳ Running migration: 002_create_products_and_variants.sql...
✅ Completed 002_create_products_and_variants.sql (XXXms)

⏳ Running migration: 003_create_inventory_management.sql...
✅ Completed 003_create_inventory_management.sql (XXXms)

🔍 Verifying schema...

📊 Created 11 tables:
   - attribute_groups
   - attributes
   - categories
   - category_attributes
   - inventory
   - inventory_locations
   - inventory_transactions
   - product_attributes
   - product_variants
   - products
   - variant_attributes

📈 Row counts:
   - categories: 6 rows
   - attribute_groups: 4 rows
   - attributes: 11 rows
   - inventory_locations: 1 rows

✅ All migrations completed successfully!
🎉 Database schema is ready for use
```

---

## Schema Features

### Vietnamese-First Design

**Language Support:**
- All tables have `name_vi` and `name_en` columns
- Vietnamese text search configuration
- Vietnamese address structure (province/district/ward codes)
- VND currency with proper constraints

**Address Structure:**
```sql
province_code VARCHAR(10)    -- Vietnamese province code (01-96)
province_name_vi VARCHAR(100) -- Province name in Vietnamese
district_code VARCHAR(10)     -- District code
district_name_vi VARCHAR(100) -- District name in Vietnamese
ward_code VARCHAR(10)         -- Ward code
ward_name_vi VARCHAR(100)     -- Ward name in Vietnamese
```

### Flexible Attributes

**Supported Types:**
- `text` - Free text (e.g., description, ingredients)
- `number` - Numeric values with units (e.g., weight in kg)
- `select` - Single choice from options
- `multiselect` - Multiple choices
- `color` - Color picker
- `boolean` - Yes/No
- `date` - Date values

**Attribute Flags:**
- `is_required` - Must be filled
- `is_variant` - Can create variants (e.g., color, size)
- `is_filterable` - Show in product filters
- `is_searchable` - Include in search index

### Product Variants

**Example: Pet Food with Variants**
```
Product: Royal Canin Dog Food
├── Variant 1: 1kg - Chicken (SKU: RC-DOG-1KG-CHK)
├── Variant 2: 1kg - Beef (SKU: RC-DOG-1KG-BEF)
├── Variant 3: 5kg - Chicken (SKU: RC-DOG-5KG-CHK)
└── Variant 4: 5kg - Beef (SKU: RC-DOG-5KG-BEF)
```

Each variant has:
- Unique SKU
- Individual pricing (can override product price)
- Separate stock tracking
- Variant-specific attributes (weight, flavor)

### Inventory Management

**Multi-Location Support:**
```
Variant: RC-DOG-1KG-CHK
├── WH-HN-01 (Hanoi): 100 available, 10 reserved
├── WH-HCM-01 (Ho Chi Minh): 50 available, 5 reserved
└── STORE-DN-01 (Da Nang): 20 available, 2 reserved
Total: 170 available, 17 reserved
```

**Stock Operations:**
- Reserve stock for orders (automatic location selection)
- Release stock on order cancellation
- Transfer between locations
- Adjust stock (damage, loss, found)
- Complete audit trail

---

## Triggers and Automation

### Automatic Triggers

1. **update_updated_at_column()** - Auto-update `updated_at` on all tables
2. **ensure_single_default_variant()** - Only one default variant per product
3. **update_product_status_from_variants()** - Auto-set product to out_of_stock
4. **ensure_single_default_location()** - Only one default warehouse
5. **sync_variant_stock()** - Sync variant stock with inventory totals

### Stored Functions

1. **reserve_stock()** - Reserve stock for orders
   - Finds optimal location (default > priority > availability)
   - Atomic reservation
   - Records transaction
   
2. **release_stock()** - Release reserved stock
   - Returns stock to available
   - Records transaction

---

## Requirements Satisfied

These tasks satisfy the following requirements from `requirements.md`:

**Requirement 2: Dynamic Category Hierarchy**
- ✅ Unlimited depth category hierarchies
- ✅ Vietnamese localization (name_vi, name_en)
- ✅ URL-friendly slugs
- ✅ Cascade delete for child categories
- ✅ Category metadata (featured, menu, homepage)

**Requirement 3: Flexible Attributes System**
- ✅ Multiple attribute types (text, number, select, color, boolean, date)
- ✅ Vietnamese names and units
- ✅ Attribute grouping
- ✅ Validation rules (JSONB)
- ✅ Options for select types
- ✅ Attribute flags (required, variant, filterable, searchable)

**Requirement 4: Product Variants and SKU Management**
- ✅ Unique SKUs for variants
- ✅ Variant-specific pricing
- ✅ Variant attributes
- ✅ Default variant support
- ✅ Stock tracking per variant

**Requirement 5: Multi-Warehouse Inventory Management**
- ✅ Multiple inventory locations
- ✅ Vietnamese address structure
- ✅ Stock tracking (available, reserved, incoming)
- ✅ Atomic reservation operations
- ✅ Complete transaction audit trail
- ✅ Reorder point management

**Requirement 8: Vietnamese Commerce Support**
- ✅ VND pricing (minimum 1000)
- ✅ Vietnamese address codes
- ✅ Vietnamese text search
- ✅ Vietnamese localization throughout

---

## Next Steps

✅ **Task 1.1:** PostgreSQL setup (COMPLETE)  
✅ **Task 1.2:** Categories and attributes schema (COMPLETE)  
✅ **Task 1.3:** Products and variants schema (COMPLETE)  
✅ **Task 1.4:** Inventory management schema (COMPLETE)  
⏭️ **Task 1.5:** Service layer foundation  
⏭️ **Task 1.6:** Database connection pooling and health checks  

---

## Troubleshooting

### Migration fails with "password authentication failed"

**Solution:** Update DATABASE_URL in `.env.local`:
```env
DATABASE_URL=postgresql://novashop_user:novashop_password_dev@localhost:5432/novashop_db
```

### Migration fails with "relation already exists"

**Solution:** Drop and recreate the database:
```bash
docker-compose -f docker-compose.postgres.yml down -v
docker-compose -f docker-compose.postgres.yml up -d
node scripts/run-migrations.js
```

### Want to reset the database

```bash
# Stop and remove all data
docker-compose -f docker-compose.postgres.yml down -v

# Start fresh
docker-compose -f docker-compose.postgres.yml up -d

# Run migrations again
node scripts/run-migrations.js
```

---

**Tasks Completed By:** Kiro AI  
**Reviewed By:** Pending  
**Approved By:** Pending  

