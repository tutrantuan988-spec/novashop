/**
 * Dual-Write Adapter — Phase 4: Dual-Write Implementation
 *
 * Writes data to both PostgreSQL (primary) and Firestore (legacy) for
 * backward compatibility during the gradual migration from Firestore to PostgreSQL.
 *
 * Feature flags control which writes happen:
 *   USE_POSTGRES_PRODUCTS=true  → Write products to PostgreSQL
 *   USE_POSTGRES_CATEGORIES=true → Write categories to PostgreSQL
 *   USE_POSTGRES_READS=true      → Read from PostgreSQL first
 *
 * Firestore remains the fallback source of truth until Phase 5.
 * PostgreSQL writes are non-blocking — errors don't fail the request.
 */

const logger = require('../utils/logger');
const cacheService = require('./cacheService');

// Services
const catalogService = require('../../backend/src/services/catalogService');
const categoryService = require('../../backend/src/services/categoryService');
const attributeService = require('../../backend/src/services/attributeService');
const variantService = require('../../backend/src/services/variantService');
const inventoryService = require('../../backend/src/services/inventoryService');

// Feature flag helpers
const ff = {
  postgresProducts: () => process.env.USE_POSTGRES_PRODUCTS === 'true',
  postgresCategories: () => process.env.USE_POSTGRES_CATEGORIES === 'true',
  postgresReads: () => process.env.USE_POSTGRES_READS === 'true',
  postgresInventory: () => true // Always use PG for inventory (no Firestore inventory)
};

/**
 * Safely execute PostgreSQL write, logging errors without throwing
 */
async function pgWrite(fnName, fn, ...args) {
  try {
    return await fn(...args);
  } catch (error) {
    logger.error(`[DualWrite] PostgreSQL ${fnName} failed:`, {
      error: error.message,
      args: args.map(a => typeof a === 'object' ? '[object]' : a)
    });
    return null;
  }
}

/**
 * Safely execute Firestore write via adminDb
 */
async function firestoreWrite(adminDb, collection, docId, data, merge = false) {
  if (!adminDb) return null;
  try {
    if (docId) {
      await adminDb.collection(collection).doc(String(docId)).set(data, { merge });
    } else {
      const ref = await adminDb.collection(collection).add(data);
      return ref.id;
    }
    return docId || 'auto-generated';
  } catch (error) {
    logger.error(`[DualWrite] Firestore ${collection} write failed:`, {
      error: error.message,
      docId
    });
    return null;
  }
}

/**
 * Dual-Write for Products
 */
const productAdapter = {
  /**
   * Create a product in both PostgreSQL and Firestore
   */
  async create(productData, attributes = [], variants = [], adminDb = null) {
    let pgResult = null;
    let fsResult = null;

    // Write to PostgreSQL
    if (ff.postgresProducts()) {
      pgResult = await pgWrite('createProduct', catalogService.createProduct, productData, attributes, variants);
      if (pgResult) {
        // Invalidate cache
        await cacheService.invalidate('product', pgResult.id);
      }
    }

    // Write to Firestore (legacy format)
    if (adminDb) {
      const firestoreDoc = {
        id: Date.now(),
        name: productData.name_vi,
        description: productData.description_vi,
        price: productData.base_price,
        oldPrice: productData.sale_price || null,
        category: productData.category_id || null,
        badge: productData.badge_vi || null,
        image: productData.primary_image_url || null,
        featured: productData.is_featured || false,
        active: productData.status === 'active',
        stock: variants?.length > 0
          ? variants.reduce((s, v) => s + (v.stock_quantity || 0), 0)
          : 50, // Default fallback
        createdAt: new Date(),
        ...(productData.images ? { gallery: Array.isArray(productData.images) ? productData.images.map(i => i.url || i) : [] } : {}),
        _migratedToPostgres: true,
        _postgresId: pgResult?.id || null
      };
      fsResult = await firestoreWrite(adminDb, 'products', null, firestoreDoc);
      logger.info(`[DualWrite] Product created in Firestore: ${fsResult}, PG: ${pgResult?.id || 'skipped'}`);
    }

    return pgResult || { ...productData, _source: fsResult ? 'firestore' : 'none' };
  },

  /**
   * Update a product in both PostgreSQL and Firestore
   */
  async update(productId, updates, adminDb = null) {
    let pgResult = null;

    if (ff.postgresProducts()) {
      pgResult = await pgWrite('updateProduct', catalogService.updateProduct, productId, updates);
      if (pgResult) {
        await cacheService.invalidate('product', productId);
      }
    }

    // Update Firestore if we have adminDb
    if (adminDb) {
      const firestoreUpdates = {
        ...(updates.name_vi && { name: updates.name_vi }),
        ...(updates.description_vi && { description: updates.description_vi }),
        ...(updates.base_price !== undefined && { price: updates.base_price }),
        ...(updates.sale_price !== undefined && { oldPrice: updates.sale_price }),
        ...(updates.primary_image_url && { image: updates.primary_image_url }),
        ...(updates.status !== undefined && { active: updates.status === 'active' }),
        ...(updates.badge_vi && { badge: updates.badge_vi }),
        updatedAt: new Date()
      };
      await firestoreWrite(adminDb, 'products', productId, firestoreUpdates, true);
    }

    return pgResult || updates;
  },

  /**
   * Delete a product from both databases
   */
  async delete(productId, adminDb = null) {
    if (ff.postgresProducts()) {
      await pgWrite('deleteProduct', catalogService.deleteProduct, productId);
      await cacheService.invalidate('product', productId);
    }

    if (adminDb) {
      try {
        await adminDb.collection('products').doc(String(productId)).delete();
      } catch (e) {
        logger.warn(`[DualWrite] Could not delete from Firestore: ${e.message}`);
      }
    }
  }
};

/**
 * Dual-Write for Categories
 */
const categoryAdapter = {
  async create(categoryData, adminDb = null) {
    let pgResult = null;

    if (ff.postgresCategories()) {
      pgResult = await pgWrite('createCategory', categoryService.createCategory, categoryData);
      if (pgResult) {
        await cacheService.invalidate('category', pgResult.id);
      }
    }

    return pgResult || categoryData;
  },

  async update(categoryId, updates, adminDb = null) {
    let pgResult = null;

    if (ff.postgresCategories()) {
      pgResult = await pgWrite('updateCategory', categoryService.updateCategory, categoryId, updates);
      if (pgResult) {
        await cacheService.invalidate('category', categoryId);
      }
    }

    return pgResult || updates;
  },

  async delete(categoryId, adminDb = null) {
    if (ff.postgresCategories()) {
      await pgWrite('deleteCategory', categoryService.deleteCategory, categoryId);
      await cacheService.invalidate('category');
    }
  }
};

/**
 * Read Strategy — PostgreSQL primary, Firestore fallback
 */
const readAdapter = {
  /**
   * Get a product with caching and fallback
   */
  async getProduct(productIdOrSlug, options = {}, adminDb = null) {
    const cacheKey = `catalog:product:${productIdOrSlug}`;

    // Try cache first (regardless of feature flags)
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    let product = null;

    // Try PostgreSQL if reads are enabled
    if (ff.postgresReads()) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdOrSlug);
        product = isUuid
          ? await catalogService.getProduct(productIdOrSlug, options)
          : await catalogService.getProductBySlug(productIdOrSlug, options);
      } catch (error) {
        logger.warn(`[ReadStrategy] PostgreSQL read failed, falling back to Firestore: ${error.message}`);
      }
    }

    // Fallback to Firestore
    if (!product && adminDb) {
      try {
        const snap = await adminDb.collection('products').doc(String(productIdOrSlug)).get();
        if (snap.exists) {
          product = { id: snap.id, ...snap.data() };
        }
      } catch (error) {
        logger.warn(`[ReadStrategy] Firestore fallback failed: ${error.message}`);
      }
    }

    // Cache the result
    if (product) {
      await cacheService.set(cacheKey, product, 300);
    }

    return product;
  },

  /**
   * List products with caching
   */
  async listProducts(filters = {}, pagination = {}, adminDb = null) {
    if (ff.postgresReads()) {
      try {
        return await catalogService.listProducts(filters, pagination);
      } catch (error) {
        logger.warn(`[ReadStrategy] PostgreSQL list failed, falling back: ${error.message}`);
      }
    }

    // Firestore fallback
    if (adminDb) {
      try {
        const snap = await adminDb.collection('products').orderBy('createdAt', 'desc').get();
        const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return {
          data: products,
          total: products.length,
          page: 1,
          limit: products.length,
          totalPages: 1
        };
      } catch (e) {
        logger.error(`[ReadStrategy] Firestore fallback failed: ${e.message}`);
      }
    }

    return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  },

  /**
   * Get a category with caching
   */
  async getCategory(categoryId, adminDb = null) {
    const cacheKey = `catalog:category:${categoryId}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    let category = null;

    if (ff.postgresReads() || ff.postgresCategories()) {
      try {
        category = await categoryService.getCategory(categoryId);
      } catch (error) {
        logger.warn(`[ReadStrategy] PostgreSQL category read failed: ${error.message}`);
      }
    }

    if (category) {
      await cacheService.set(cacheKey, category, 600);
    }

    return category;
  },

  /**
   * Get category tree with caching
   */
  async getCategoryTree(rootId = null) {
    const cacheKey = rootId
      ? `catalog:categories:tree:${rootId}`
      : 'catalog:categories:tree';

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    let tree = [];

    if (ff.postgresReads() || ff.postgresCategories()) {
      try {
        tree = await categoryService.getCategoryTree(rootId);
      } catch (error) {
        logger.warn(`[ReadStrategy] PostgreSQL category tree failed: ${error.message}`);
      }
    }

    await cacheService.set(cacheKey, tree, 600);
    return tree;
  },

  /**
   * Search products with caching
   */
  async searchProducts(query_str, filters = {}, pagination = {}, adminDb = null) {
    const cacheKey = `catalog:products:search:${query_str}:${JSON.stringify(filters)}`;

    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    let result = null;

    if (ff.postgresReads()) {
      try {
        result = await catalogService.searchProducts(query_str, filters, pagination);
      } catch (error) {
        logger.warn(`[ReadStrategy] PostgreSQL search failed: ${error.message}`);
      }
    }

    // Firestore fallback
    if (!result && adminDb) {
      try {
        const snap = await adminDb.collection('products').limit(200).get();
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const q = query_str.toLowerCase();
        const filtered = all.filter(p => {
          const haystack = `${p.name || ''} ${p.description || ''} ${p.badge || ''}`.toLowerCase();
          return haystack.includes(q);
        }).slice(0, pagination.limit || 20);

        result = {
          data: filtered,
          total: filtered.length,
          page: 1,
          limit: pagination.limit || 20,
          totalPages: 1
        };
      } catch (e) {
        logger.error(`[ReadStrategy] Firestore search fallback failed: ${e.message}`);
      }
    }

    if (result) {
      await cacheService.set(cacheKey, result, 300);
    }

    return result || { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  }
};

module.exports = {
  productAdapter,
  categoryAdapter,
  readAdapter,
  ff
};
