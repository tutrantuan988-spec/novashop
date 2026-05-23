# Commerce Core Refactor — Phase 3, 4 & 5 Complete

## ✅ Phase 3: Data Migration

### Seed Script
- **File:** `scripts/seedPostgres.js`
- **Usage:** `node scripts/seedPostgres.js`
- **Dry run:** `node scripts/seedPostgres.js --dry-run`
- Seeds 7 categories, 5 attribute groups, 15+ products with Vietnamese pet food data

### Static Data Included
| Data | Count | Details |
|------|-------|---------|
| Categories | 7 | Thức ăn chó, thức ăn mèo, phụ kiện, đồ chơi, vệ sinh, vitamin, snack |
| Attributes | 5 | brand, weight, badge, size, color (with full Vietnamese options) |
| Products | 15+ | Royal Canin, Pedigree, Whiskas, Me-O, Phụ kiện... |
| Inventory | Auto | Initializes stock counts for each product |

### Data Flow
```
Static data (scripts/seedPostgres.js)
  → CategoryService.createCategory()
  → AttributeService.createAttribute()
  → CatalogService.createProduct() (with attributes)
  → InventoryService.initializeInventoryForVariant()
```

---

## ✅ Phase 4: Dual-Write + Cache

### Dual-Write Adapter
- **File:** `server/services/dualWriteAdapter.js`
- Writes to **PostgreSQL** (primary) and **Firestore** (legacy) simultaneously
- Non-blocking: PostgreSQL write failures don't break the request
- Feature flags control gradual migration:
  - `USE_POSTGRES_PRODUCTS=true/false`
  - `USE_POSTGRES_CATEGORIES=true/false`
  - `USE_POSTGRES_READS=true/false`

### Read Strategy
Priority chain: **PostgreSQL → Firestore → Cache**
- When `USE_POSTGRES_READS=true`, reads come from PostgreSQL first
- Falls back to Firestore if PostgreSQL fails or data missing
- Results are cached automatically

### Cache Service
- **File:** `server/services/cacheService.js`
- **Tiered caching:** Redis → In-memory → No-op
- Auto-initializes: tries Redis first, falls back to in-memory Map
- Memory cache: max 500 entries, LRU eviction
- TTL defaults:
  - Products: 5 min
  - Categories: 10 min
  - Attributes: 15 min
  - Inventory: 1 min

### Cache Middleware
- **File:** `server/routes/postgres/cacheMiddleware.js`
- `cacheInvalidate(entityType)` — auto-invalidates cache after POST/PUT/DELETE
- `cacheResponse(ttl)` — caches GET responses

### API Endpoints Added
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v2/cache/status` | Cache service health & stats |
| POST | `/api/v2/cache/invalidate` | Manual cache invalidation |
| GET | `/api/v2/system/migration-status` | DB table counts & feature flags |

---

## ✅ Phase 5: Cleanup & Documentation

### Architecture Overview
```
┌──────────────────────────────────────────────────────────────┐
│                    Express.js API Layer                       │
│  ┌────────────┐  ┌────────────┐  ┌───────────────────────┐  │
│  │   /api/v1  │  │   /api/v2  │  │   Other (webhooks,    │  │
│  │ (Firestore)│  │ (Postgres)  │  │   payments, agents)   │  │
│  └────────────┘  └────────────┘  └───────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            │
┌──────────────────────────────────────────────────────────────┐
│                    Service Layer                              │
│  ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌────────┐ │
│  │ Catalog  ││ Category ││Attribute ││ Variant  ││Inventory│ │
│  └──────────┘└──────────┘└──────────┘└──────────┘└────────┘ │
└──────────────────────────────────────────────────────────────┘
                            │
┌──────────────────────────────────────────────────────────────┐
│                    Data Layer                                 │
│  ┌─────────────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │     PostgreSQL      │  │   Firestore  │  │   Redis    │  │
│  │     (Primary)       │  │   (Legacy)   │  │   (Cache)  │  │
│  └─────────────────────┘  └──────────────┘  └────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### File Inventory — All New Files

| File | Purpose | Phase |
|------|---------|-------|
| `migrations/001_create_categories_and_attributes.sql` | Categories, attributes, groups schema | 1 |
| `migrations/002_create_products_and_variants.sql` | Products, variants, variant_attributes | 1 |
| `migrations/003_create_inventory_management.sql` | Inventory locations, inventory, transactions | 1 |
| `server/db/postgres.js` | PostgreSQL connection pool, health checks | 1 |
| `server/db/test-connection.js` | Connection test script | 1 |
| `scripts/run-migrations.js` | Migration runner | 1 |
| `scripts/init-postgres.sql` | DB init script | 1 |
| `backend/src/services/catalogService.js` | Product CRUD, search, filter | 2 |
| `backend/src/services/categoryService.js` | Category hierarchy, tree, attributes | 2 |
| `backend/src/services/attributeService.js` | Attribute definitions, validation | 2 |
| `backend/src/services/variantService.js` | SKU, combinations, stock | 2 |
| `backend/src/services/inventoryService.js` | Multi-warehouse, reserve/release | 2 |
| `server/routes/postgres/commerceRoutes.js` | 50+ REST endpoints | 2 |
| `scripts/seedPostgres.js` | Static data seeding | 3 |
| `server/services/cacheService.js` | Redis + memory caching | 4 |
| `server/services/dualWriteAdapter.js` | Dual-write + read strategy | 4 |
| `server/routes/postgres/cacheMiddleware.js` | Auto cache invalidation | 4 |

### Feature Flag Reference

| Flag | Default | Effect |
|------|---------|--------|
| `USE_POSTGRES_PRODUCTS=false` | Enable PostgreSQL writes for products | 
| `USE_POSTGRES_CATEGORIES=false` | Enable PostgreSQL writes for categories |
| `USE_POSTGRES_READS=false` | Enable PostgreSQL reads (with Firestore fallback) |

**Gradual Rollout:**
```bash
# Step 1: Enable writes (products start flowing to PostgreSQL)
USE_POSTGRES_PRODUCTS=true

# Step 2: Enable category writes
USE_POSTGRES_CATEGORIES=true

# Step 3: Seed existing data
npm run seed:postgres

# Step 4: Switch reads to PostgreSQL
USE_POSTGRES_READS=true

# Future: Remove Firestore entirely (Phase 5 complete)
```

### NPM Scripts Reference

```bash
npm run seed:postgres        # Seed static data into PostgreSQL
npm run seed:postgres:dry    # Dry run (no changes)
npm run db:migrate           # Run database migrations
npm run db:init              # Full init: docker + migrate + seed
npm run postgres:check       # Test PostgreSQL connection
npm run cache:clear          # Clear all cache
npm run migration:check      # Verify dual-write adapter loads
```

### Cleanup Notes

The Firestore legacy code (`server/index.js` — products, categories, orders, reviews, addresses, returns endpoints) remains active for backward compatibility. When `USE_POSTGRES_READS=true` and all data is migrated, Firestore can be completely removed by:

1. Verifying all PostgreSQL queries match Firestore data
2. Removing `adminDb`-dependent route handlers
3. Deleting `src/services/firestore.js` and Firebase Admin init code
4. Cleaning up `server/index.js` product/category/order routes
