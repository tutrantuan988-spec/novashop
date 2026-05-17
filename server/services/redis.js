const logger = console;

/**
 * Redis Service — Hỗ trợ cả local Redis và Upstash Redis (serverless)
 * Pattern inspired by upstash/context7 MCP server
 * 
 * Priority connection:
 *   1. UPSTASH_REDIS_REST_URL (serverless — khuyên dùng cho production)
 *   2. REDIS_URL (local Redis)
 *   3. In-memory fallback (không bền vững nhưng vẫn chạy được)
 */

/** @type {import('@upstash/redis').Redis|import('ioredis').Redis|null} */
let redisClient = null;
let useUpstash = false;
/** @type {MemoryStore|null} */
let memoryFallback = null;

// ===== In-memory fallback (khi không có Redis nào) =====
class MemoryStore {
  constructor() {
    this._store = new Map();
    logger.info('⚠️ Dùng in-memory store (không bền vững khi restart server)');
  }

  async get(key) {
    const val = this._store.get(key);
    if (!val) return null;
    if (val.expiry && Date.now() > val.expiry) {
      this._store.delete(key);
      return null;
    }
    return val.data;
  }

  async set(key, value, ttlSeconds) {
    this._store.set(key, {
      data: value,
      expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
    return 'OK';
  }

  async del(key) {
    return this._store.delete(key) ? 1 : 0;
  }

  async incr(key) {
    const val = (await this.get(key)) || 0;
    const newVal = parseInt(val, 10) + 1;
    await this.set(key, newVal);
    return newVal;
  }

  async exists(key) {
    return this._store.has(key) ? 1 : 0;
  }

  async keys(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this._store.keys()).filter((k) => regex.test(k));
  }

  async expire(_key, _seconds) {
    return 1; // Memory store: TTL handled during set
  }

  async lpush(key, value) {
    const arr = (await this.get(key)) || [];
    arr.unshift(value);
    await this.set(key, arr);
    return arr.length;
  }

  async rpop(key) {
    const arr = (await this.get(key)) || [];
    const val = arr.pop();
    await this.set(key, arr);
    return val || null;
  }

  async llen(key) {
    const arr = (await this.get(key)) || [];
    return arr.length;
  }

  async ping() {
    return 'PONG';
  }
}

// ===== Khởi tạo Redis =====
async function initRedis() {
  // Ưu tiên 1: Upstash Redis (REST API, serverless, không cần quản lý server)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = require('@upstash/redis');
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
        automaticDeserialization: false,
      });
      await redisClient.set('ping', 'pong');
      useUpstash = true;
      logger.info('✅ Kết nối Upstash Redis thành công');
      return redisClient;
    } catch (err) {
      logger.warn('⚠️ Không kết nối được Upstash Redis:', err.message);
    }
  }

  // Ưu tiên 2: Local Redis (ioredis)
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;
  if (redisUrl) {
    try {
      const Redis = require('ioredis');
      const host = process.env.REDIS_HOST || 'localhost';
      const port = parseInt(process.env.REDIS_PORT || '6379', 10);
      redisClient = new Redis(redisUrl || { host, port, maxRetriesPerRequest: 3 });
      redisClient.on('connect', () => logger.info('✅ Kết nối local Redis thành công'));
      redisClient.on('error', (err) => logger.warn('⚠️ Redis error:', err.message));
      await redisClient.ping();
      return redisClient;
    } catch (err) {
      logger.warn('⚠️ Không kết nối được local Redis:', err.message);
      redisClient = null;
    }
  }

  // Ưu tiên 3: In-memory fallback
  logger.warn('⚠️ Redis không khả dụng — dùng in-memory fallback');
  memoryFallback = new MemoryStore();
  return memoryFallback;
}

// ===== Client getter (LUÔN dùng hàm này, không truy cập biến trực tiếp) =====
function getClient() {
  return redisClient || memoryFallback;
}

// ===== Context7-style context persistence =====
const CONTEXT_PREFIX = 'ctx:';
const DEFAULT_TTL = 86400; // 24h

async function setContext(namespace, key, value, ttl = DEFAULT_TTL) {
  const client = getClient();
  const fullKey = `${CONTEXT_PREFIX}${namespace}:${key}`;
  const payload = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (useUpstash) await client.set(fullKey, payload, { ex: ttl });
  else await client.set(fullKey, payload, ttl);
  return true;
}

async function getContext(namespace, key) {
  const client = getClient();
  const raw = await client.get(`${CONTEXT_PREFIX}${namespace}:${key}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function delContext(namespace, key) {
  const client = getClient();
  return client.del(`${CONTEXT_PREFIX}${namespace}:${key}`);
}

async function clearNamespace(namespace) {
  const client = getClient();
  const pattern = `${CONTEXT_PREFIX}${namespace}:*`;
  const keys = await client.keys(pattern);
  if (keys.length > 0) {
    for (const key of keys) {
      await client.del(key);
    }
  }
  return keys.length;
}

// ===== Cache operations =====
async function cacheGet(key) {
  const client = getClient();
  const raw = await client.get(`cache:${key}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function cacheSet(key, value, ttl = 300) {
  const client = getClient();
  const payload = JSON.stringify(value);
  if (useUpstash) await client.set(`cache:${key}`, payload, { ex: ttl });
  else await client.set(`cache:${key}`, payload, ttl);
}

async function cacheDel(pattern) {
  const client = getClient();
  const fullPattern = `cache:${pattern}*`;
  const keys = await client.keys(fullPattern);
  if (keys.length > 0) {
    for (const key of keys) await client.del(key);
  }
  return keys.length;
}

// ===== Event Queue =====
async function pushEvent(channel, data) {
  const client = getClient();
  const payload = JSON.stringify({ data, timestamp: new Date().toISOString() });
  await client.lpush(`queue:${channel}`, payload);
  return true;
}

async function popEvent(channel) {
  const client = getClient();
  const raw = await client.rpop(`queue:${channel}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function queueLength(channel) {
  const client = getClient();
  return client.llen(`queue:${channel}`) || 0;
}

// ===== Rate limiting =====
async function checkRateLimit(key, maxAttempts, windowSeconds) {
  const client = getClient();
  const now = Date.now();
  const windowKey = `ratelimit:${key}:${Math.floor(now / (windowSeconds * 1000))}`;
  const current = await client.incr(windowKey);
  if (current === 1) {
    await client.expire(windowKey, windowSeconds);
  }
  return {
    allowed: current <= maxAttempts,
    remaining: Math.max(0, maxAttempts - current),
    resetIn: windowSeconds,
  };
}

// ===== Legacy getters (cho backward compatibility) =====
function getRedisClient() {
  return getClient();
}

// ===== Khởi tạo =====
let initPromise = null;

async function getRedis() {
  if (!initPromise) {
    initPromise = initRedis();
  }
  return initPromise;
}

module.exports = {
  getRedis,
  getClient,
  getRedisClient,
  setContext,
  getContext,
  delContext,
  clearNamespace,
  cacheGet,
  cacheSet,
  cacheDel,
  pushEvent,
  popEvent,
  queueLength,
  checkRateLimit,
};
