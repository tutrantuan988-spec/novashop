/**
 * Cache Service — Enhanced catalog caching layer (Phase 4)
 *
 * Provides tiered caching: Redis → Memory → No-op fallback
 * Used by Dual-Write Adapter and Commerce Routes for read optimization.
 *
 * Cache key conventions:
 *   catalog:product:{id} - Single product with relations
 *   catalog:products:{filters_hash} - Product lists
 *   catalog:category:{id} - Category details
 *   catalog:categories:tree - Full category tree
 *   catalog:attribute:{id} - Attribute details
 *   catalog:variant:{id} - Variant with attributes
 *   catalog:inventory:{variant_id} - Stock info
 *
 * TTL defaults:
 *   Products: 300s (5 min)
 *   Categories: 600s (10 min)
 *   Attributes: 900s (15 min)
 *   Inventory: 60s (1 min)
 */

const logger = require('../utils/logger');

// In-memory cache (fallback when Redis is unavailable)
class MemoryCache {
  constructor() {
    this._store = new Map();
    this._maxEntries = 500;
    this._stats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
  }

  async get(key) {
    const val = this._store.get(key);
    if (!val) {
      this._stats.misses++;
      return null;
    }
    if (val.expiry && Date.now() > val.expiry) {
      this._store.delete(key);
      this._stats.misses++;
      return null;
    }
    this._stats.hits++;
    return val.data;
  }

  async set(key, value, ttlSeconds = 300) {
    // Evict oldest if over limit
    if (this._store.size >= this._maxEntries) {
      const oldest = this._store.keys().next().value;
      if (oldest) {
        this._store.delete(oldest);
        this._stats.evictions++;
      }
    }
    this._store.set(key, {
      data: value,
      expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
    });
    this._stats.sets++;
    return true;
  }

  async del(key) {
    return this._store.delete(key) ? 1 : 0;
  }

  async clearPattern(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    let count = 0;
    for (const key of this._store.keys()) {
      if (regex.test(key)) {
        this._store.delete(key);
        count++;
      }
    }
    return count;
  }

  getStats() {
    return {
      ...this._stats,
      size: this._store.size,
      maxEntries: this._maxEntries,
      hitRate: this._stats.hits + this._stats.misses > 0
        ? Math.round((this._stats.hits / (this._stats.hits + this._stats.misses)) * 100)
        : 0
    };
  }
}

let redisClient = null;
let memoryCache = null;
let useRedis = false;
let initializing = false;

/**
 * Initialize cache — tries Redis first, falls back to in-memory
 */
async function initCache() {
  if (initializing) return;
  initializing = true;

  // Try Redis from server/services/redis.js
  try {
    const redisService = require('./redis');
    const client = redisService.getClient();
    if (client) {
      redisClient = client;
      useRedis = true;
      logger.info('[CacheService] Using Redis backend');
      return;
    }
  } catch (err) {
    // Redis not available
  }

  // Fallback: in-memory
  memoryCache = new MemoryCache();
  logger.info('[CacheService] Using in-memory backend');
}

/**
 * Get cache backend
 */
function getBackend() {
  if (useRedis && redisClient) return 'redis';
  if (memoryCache) return 'memory';
  return null;
}

/**
 * Get a cached value
 */
async function get(key) {
  if (useRedis && redisClient) {
    try {
      const raw = await redisClient.get(`cache:${key}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (memoryCache) {
    return memoryCache.get(key);
  }
  return null;
}

/**
 * Set a cached value with TTL
 * @param {string} key - Cache key (without 'cache:' prefix)
 * @param {*} value - Value to cache
 * @param {number} ttlSeconds - TTL in seconds
 */
async function set(key, value, ttlSeconds = 300) {
  const payload = JSON.stringify(value);
  if (useRedis && redisClient) {
    try {
      await redisClient.set(`cache:${key}`, payload, { ex: ttlSeconds });
    } catch {
      // Silent fail
    }
    return true;
  }
  if (memoryCache) {
    return memoryCache.set(key, value, ttlSeconds);
  }
  return false;
}

/**
 * Delete a cached key
 */
async function del(key) {
  if (useRedis && redisClient) {
    try {
      await redisClient.del(`cache:${key}`);
    } catch {}
    return true;
  }
  if (memoryCache) {
    return memoryCache.del(key);
  }
  return false;
}

/**
 * Clear all cache entries matching a pattern
 * Pattern examples:
 *   catalog:product:* - All products
 *   catalog:category:* - All categories
 *   catalog:* - All catalog data
 */
async function clearPattern(pattern) {
  const fullPrefix = `cache:${pattern}`;
  const globPattern = pattern.includes('*') ? pattern : `${pattern}*`;

  if (useRedis && redisClient) {
    try {
      const keys = await redisClient.keys(`cache:${globPattern}`);
      if (keys.length > 0) {
        for (const key of keys) {
          await redisClient.del(key);
        }
      }
      return keys.length;
    } catch {
      return 0;
    }
  }
  if (memoryCache) {
    return memoryCache.clearPattern(globPattern);
  }
  return 0;
}

/**
 * Cache wrapper for async functions
 * Automatically caches the result and invalidates on write operations
 *
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data
 * @param {number} ttlSeconds - Cache TTL
 * @returns {Promise<*>} Cached or fresh data
 */
async function cacheWrapper(key, fetchFn, ttlSeconds = 300) {
  // Try cache first
  const cached = await get(key);
  if (cached !== null) {
    logger.debug(`[Cache] HIT: ${key}`);
    return cached;
  }

  logger.debug(`[Cache] MISS: ${key}`);
  const data = await fetchFn();

  // Don't cache null/undefined results
  if (data !== null && data !== undefined) {
    await set(key, data, ttlSeconds);
  }

  return data;
}

/**
 * Invalidate catalog caches when data changes
 * @param {string} entityType - 'product', 'category', 'attribute', 'variant', 'inventory'
 * @param {string} entityId - Entity ID (optional)
 */
async function invalidate(entityType, entityId = null) {
  const patterns = {
    product: ['catalog:product:*', 'catalog:products:*'],
    category: ['catalog:category:*', 'catalog:categories:*'],
    attribute: ['catalog:attribute:*', 'catalog:attributes:*'],
    variant: ['catalog:variant:*', 'catalog:variants:*', 'catalog:inventory:*'],
    inventory: ['catalog:inventory:*', 'catalog:variant:*'],
    all: ['catalog:*']
  };

  const toClear = patterns[entityType] || patterns.all;
  let cleared = 0;

  for (const pattern of toClear) {
    cleared += await clearPattern(pattern);
  }

  logger.info(`[Cache] Invalidated ${entityType} cache: ${cleared} entries`);
  return cleared;
}

/**
 * Get cache statistics
 */
async function getStats() {
  if (memoryCache) {
    return {
      backend: 'memory',
      ...memoryCache.getStats()
    };
  }
  if (useRedis) {
    return { backend: 'redis', status: 'connected' };
  }
  return { backend: 'none', status: 'disabled' };
}

// Initialize on module load
initCache();

module.exports = {
  initCache,
  get,
  set,
  del,
  clearPattern,
  cacheWrapper,
  invalidate,
  getStats,
  getBackend
};
