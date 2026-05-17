/**
 * 🧠 Memory Agent — Quản lý bộ nhớ đa tầng cho toàn bộ hệ thống agent
 * 
 * 3-Tier Memory Architecture:
 * L1: In-Memory (short-term, ~30 phút) — contextCache
 * L2: Redis (medium-term, ~24h) — server-side cache
 * L3: Vector DB / Pinecone (long-term) — semantic search
 * 
 * Chức năng:
 * - Lưu trữ context cho AI Chat
 * - Lưu trạng thái agent
 * - Cung cấp semantic search qua vector embeddings
 * - Tự động pruning memory cũ
 * - Memory ranking theo relevance
 */

const { Agent, PERMISSION_SCOPES } = require('./agent-framework');
const logger = require('../server/utils/logger');

class MemoryAgent extends Agent {
  constructor() {
    super({
      name: 'Memory Agent',
      version: '1.0.0',
      responsibilities: [
        'Quản lý short-term memory (in-memory cache)',
        'Đồng bộ memory lên Redis (medium-term)',
        'Vector memory qua Pinecone (long-term)',
        'Semantic search và context retrieval',
        'Memory summarization và pruning',
        'Ranking memory theo relevance score'
      ],
      permissions: [
        PERMISSION_SCOPES.MANAGE_CACHE,
        PERMISSION_SCOPES.READ_PRODUCTS,
        PERMISSION_SCOPES.READ_ORDERS
      ],
      retryPolicy: { maxRetries: 3, baseDelay: 200 }
    });

    // L1: In-Memory Store
    this.memoryStore = new Map();
    this.MEMORY_TTL = 30 * 60 * 1000; // 30 phút

    // L2: Redis client (lazy init)
    this._redisClient = null;

    // L3: Pinecone client (lazy init)
    this._pineconeClient = null;

    // Memory stats
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
      misses: 0,
      totalRequests: 0
    };
  }

  // ─── Execute ─────────────────────────────────────────────────

  async execute(task) {
    const { action, key, data, ttl, query, namespace } = task.payload || {};

    switch (task.type) {
      case 'memory.save':
        return this.save(key, data, ttl);
      case 'memory.get':
        return this.get(key);
      case 'memory.delete':
        return this.delete(key);
      case 'memory.search':
        return this.semanticSearch(query, namespace);
      case 'memory.summarize':
        return this.summarizeMemory(namespace);
      case 'memory.stats':
        return this.getStats();
      case 'memory.clear':
        return this.clear(namespace);
      default:
        throw new Error(`Unknown memory action: ${task.type}`);
    }
  }

  async fallback(task, error) {
    // Fallback to basic in-memory cache
    logger.warn(`[MemoryAgent] Fallback to L1-only due to: ${error.message}`);
    return {
      success: true,
      fallback: true,
      message: 'Using L1 in-memory cache only',
      data: task.payload?.key ? this.memoryStore.get(task.payload.key) : null
    };
  }

  // ─── Core Memory Operations ──────────────────────────────────

  /**
   * Lưu dữ liệu vào memory (tự động sync lên L2, L3)
   */
  async save(key, data, ttl = null) {
    const entry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.MEMORY_TTL,
      accessCount: 0
    };

    // L1: In-Memory
    this.memoryStore.set(key, entry);
    this._scheduleEviction(key, entry.ttl);

    this.stats.totalRequests++;

    // L2: Redis (async, fire & forget)
    this._saveToRedis(key, data, ttl).catch(() => {});

    // L3: Pinecone nếu có vector (async)
    if (typeof data === 'object' && data.text) {
      this._saveToPinecone(key, data).catch(() => {});
    }

    return { success: true, key, tier: 'L1+L2' };
  }

  /**
   * Lấy dữ liệu từ memory (L1 → L2 → L3)
   */
  async get(key) {
    this.stats.totalRequests++;

    // L1: In-Memory
    const l1 = this.memoryStore.get(key);
    if (l1 && Date.now() - l1.timestamp < l1.ttl) {
      l1.accessCount++;
      this.stats.l1Hits++;
      return { data: l1.data, source: 'L1', key };
    }

    // L2: Redis
    try {
      const l2 = await this._getFromRedis(key);
      if (l2) {
        this.stats.l2Hits++;
        // Cache back to L1
        this.memoryStore.set(key, { data: l2, timestamp: Date.now(), ttl: this.MEMORY_TTL, accessCount: 0 });
        return { data: l2, source: 'L2', key };
      }
    } catch {}

    // L3: Pinecone (semantic search)
    try {
      const l3 = await this._searchPinecone(key);
      if (l3) {
        this.stats.l3Hits++;
        return { data: l3, source: 'L3', key };
      }
    } catch {}

    this.stats.misses++;
    return { data: null, source: null, key };
  }

  /**
   * Semantic search qua long-term memory
   */
  async semanticSearch(query, namespace = 'default') {
    try {
      const results = await this._searchPinecone(query, namespace);
      return { query, results: results || [], source: 'L3' };
    } catch (error) {
      logger.warn(`[MemoryAgent] Semantic search failed: ${error.message}`);
      return { query, results: [], source: null, error: error.message };
    }
  }

  /**
   * Xóa memory entry
   */
  async delete(key) {
    this.memoryStore.delete(key);
    this._deleteFromRedis(key).catch(() => {});
    return { success: true, key };
  }

  /**
   * Summarize memory để tiết kiệm dung lượng
   */
  async summarizeMemory(namespace = 'default') {
    const prefix = namespace ? `memory:${namespace}:` : 'memory:';
    const entries = [];
    
    for (const [key, value] of this.memoryStore.entries()) {
      if (key.startsWith(prefix)) {
        entries.push({ key, size: JSON.stringify(value.data).length, accessCount: value.accessCount });
      }
    }

    // Prune entries với access count thấp
    entries.sort((a, b) => a.accessCount - b.accessCount);
    const toPrune = entries.slice(0, Math.floor(entries.length * 0.3)); // Prune 30% ít dùng nhất
    
    for (const entry of toPrune) {
      this.memoryStore.delete(entry.key);
    }

    return {
      totalEntries: entries.length,
      pruned: toPrune.length,
      remaining: entries.length - toPrune.length,
      savedMemory: toPrune.reduce((sum, e) => sum + e.size, 0)
    };
  }

  /**
   * Xóa toàn bộ memory theo namespace
   */
  async clear(namespace = null) {
    if (namespace) {
      const prefix = `memory:${namespace}:`;
      for (const key of this.memoryStore.keys()) {
        if (key.startsWith(prefix)) {
          this.memoryStore.delete(key);
        }
      }
    } else {
      this.memoryStore.clear();
    }
    return { success: true, namespace: namespace || 'all' };
  }

  // ─── Redis Integration (L2) ──────────────────────────────────

  async _saveToRedis(key, data, ttl) {
    // Dynamic import để tránh circular dependency
    const redis = await this._getRedisClient();
    if (redis) {
      await redis.set(`memory:${key}`, JSON.stringify(data), 'EX', (ttl || this.MEMORY_TTL) / 1000);
    }
  }

  async _getFromRedis(key) {
    const redis = await this._getRedisClient();
    if (redis) {
      const data = await redis.get(`memory:${key}`);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  async _deleteFromRedis(key) {
    const redis = await this._getRedisClient();
    if (redis) {
      await redis.del(`memory:${key}`);
    }
  }

  async _getRedisClient() {
    if (!this._redisClient) {
      try {
        this._redisClient = { get: async () => null, set: async () => {}, del: async () => {} };
        // Try to import real redis
        const Redis = require('ioredis');
        if (process.env.REDIS_URL) {
          this._redisClient = new Redis(process.env.REDIS_URL, { lazyConnect: true });
          await this._redisClient.connect();
        }
      } catch {
        this._redisClient = null;
      }
    }
    return this._redisClient;
  }

  // ─── Pinecone Integration (L3) ───────────────────────────────

  async _saveToPinecone(key, data) {
    try {
      const { embedAndUpsert } = require('../server/services/embeddings');
      await embedAndUpsert(key, data.text, data.metadata || {});
    } catch (err) {
      logger.warn(`[MemoryAgent] Pinecone save failed: ${err.message}`);
    }
  }

  async _searchPinecone(query, namespace = 'default') {
    try {
      const { searchVector } = require('../server/services/pinecone');
      return await searchVector(query, namespace);
    } catch (err) {
      return null;
    }
  }

  // ─── Memory Maintenance ──────────────────────────────────────

  _scheduleEviction(key, ttl) {
    setTimeout(() => {
      const entry = this.memoryStore.get(key);
      if (entry && Date.now() - entry.timestamp >= entry.ttl) {
        this.memoryStore.delete(key);
        logger.debug(`[MemoryAgent] Evicted expired: ${key}`);
      }
    }, ttl);
  }

  // ─── Stats ───────────────────────────────────────────────────

  getStats() {
    const total = this.stats.totalRequests || 1;
    return {
      ...this.stats,
      hitRate: ((this.stats.l1Hits + this.stats.l2Hits + this.stats.l3Hits) / total * 100).toFixed(1) + '%',
      memorySize: this.memoryStore.size,
      memoryKeys: [...this.memoryStore.keys()],
      activeAgentTasks: this.taskHistory.length
    };
  }
}

module.exports = new MemoryAgent();
