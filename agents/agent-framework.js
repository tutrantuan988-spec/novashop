/**
 * 🧠 Agent Framework — Base class cho tất cả Agent trong hệ thống
 * 
 * Enterprise-grade agent runtime với:
 * - Responsibilities declaration
 * - Tools interface
 * - Permissions & scopes
 * - Communication via EventBus
 * - Memory access (3-tier)
 * - Retry policies with exponential backoff
 * - Fallback logic
 * - Escalation logic
 * - Observability hooks
 * - Audit logging
 */

const EventBus = require('../server/services/eventBus');
const logger = require('../server/utils/logger');

// Use Node.js built-in crypto.randomUUID() — no extra dependency needed
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();

// ─── Retry Policy ──────────────────────────────────────────────
const DEFAULT_RETRY_POLICY = {
  maxRetries: 3,
  baseDelay: 1000,       // 1 giây
  maxDelay: 30000,       // 30 giây
  exponentialFactor: 2,
  jitter: true
};

// ─── Permission Scopes ─────────────────────────────────────────
const PERMISSION_SCOPES = {
  READ_PRODUCTS: 'read:products',
  WRITE_PRODUCTS: 'write:products',
  READ_ORDERS: 'read:orders',
  WRITE_ORDERS: 'write:orders',
  READ_USERS: 'read:users',
  WRITE_USERS: 'write:users',
  READ_ANALYTICS: 'read:analytics',
  WRITE_ANALYTICS: 'write:analytics',
  READ_CONTENT: 'read:content',
  WRITE_CONTENT: 'write:content',
  READ_SETTINGS: 'read:settings',
  WRITE_SETTINGS: 'write:settings',
  READ_SYSTEM: 'read:system',
  WRITE_SYSTEM: 'write:system',
  MANAGE_AGENTS: 'manage:agents',
  SEND_EMAIL: 'send:email',
  MANAGE_CACHE: 'manage:cache',
  EXPORT_DATA: 'export:data',
  IMPORT_DATA: 'import:data',
  VIETNAM_DATA: 'vietnam:data'
};

class Agent {
  /**
   * @param {Object} config
   * @param {string} config.name - Tên agent
   * @param {string} config.version - Version
   * @param {string[]} config.responsibilities - Mảng các trách nhiệm
   * @param {string[]} config.permissions - Mảng permission scopes
   * @param {Object} [config.retryPolicy] - Chính sách retry tùy chỉnh
   */
  constructor(config) {
    // Deterministic ID: name-based, only add UUID for non-singleton agents
    const baseId = config.name.toLowerCase().replace(/\s+/g, '-');
    this.id = config.singleton !== false ? baseId : `${baseId}_${uuidv4().slice(0, 8)}`;
    this.name = config.name;
    this.version = config.version || '1.0.0';
    this.responsibilities = config.responsibilities || [];
    this.permissions = config.permissions || [];
    this.retryPolicy = { ...DEFAULT_RETRY_POLICY, ...config.retryPolicy };
    this.eventBus = EventBus;
    this.status = 'idle';       // idle | busy | error | paused
    this.taskHistory = [];
    this.metrics = {
      tasksProcessed: 0,
      tasksFailed: 0,
      avgExecutionTime: 0,
      lastActive: null
    };
    this._eventListeners = [];

    // Auto-register trên EventBus
    this._registerEventListeners();

    logger.info(`[Agent] ${this.name} (${this.id}) initialized v${this.version}`);
  }

  // ─── Core Lifecycle ──────────────────────────────────────────

  /**
   * Khởi tạo agent (override bởi subclass)
   */
  async onInit() {
    // Subclass implements
  }

  /**
   * Xử lý task chính (override bởi subclass)
   * @param {Object} task - Task cần xử lý
   * @returns {Promise<Object>} Kết quả
   */
  async execute(task) {
    throw new Error(`[Agent ${this.name}] execute() must be implemented by subclass`);
  }

  /**
   * Cleanup khi agent dừng
   */
  async onShutdown() {
    this._eventListeners.forEach(({ event, handler }) => {
      this.eventBus.off(event, handler);
    });
    this.status = 'paused';
    logger.info(`[Agent] ${this.name} shutdown`);
  }

  // ─── Task Execution with Retry ───────────────────────────────

  /**
   * Thực thi task với retry policy
   * @param {Object} task
   * @returns {Promise<Object>}
   */
  async executeWithRetry(task) {
    const taskId = task.taskId || uuidv4();
    let lastError = null;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= this.retryPolicy.maxRetries + 1; attempt++) {
      try {
        this.status = 'busy';
        this._auditLog('task.start', { taskId, attempt, task });

        const result = await this.execute(task);

        this.status = 'idle';
        this.metrics.tasksProcessed++;
        this.metrics.lastActive = new Date().toISOString();
        this._updateAvgExecutionTime(Date.now() - startTime);

        this._auditLog('task.complete', { taskId, attempt, result });
        this._emit('agent:task-complete', { agentId: this.id, taskId, result });

        return result;
      } catch (error) {
        lastError = error;
        this.metrics.tasksFailed++;
        this._auditLog('task.error', { taskId, attempt, error: error.message });

        if (attempt <= this.retryPolicy.maxRetries) {
          const delay = this._calculateBackoff(attempt);
          logger.warn(`[Agent ${this.name}] Task ${taskId} failed (attempt ${attempt}), retrying in ${delay}ms`);
          await this._sleep(delay);
        }
      }
    }

    // All retries exhausted — fallback
    this.status = 'error';
    logger.error(`[Agent ${this.name}] Task ${taskId} failed after ${this.retryPolicy.maxRetries + 1} attempts: ${lastError.message}`);

    // Escalate to supervisor
    this._emit('agent:task-failed', {
      agentId: this.id,
      taskId,
      error: lastError.message,
      final: true
    });

    return this.fallback(task, lastError);
  }

  /**
   * Fallback khi tất cả retry đều thất bại (override bởi subclass)
   * @param {Object} task
   * @param {Error} error
   * @returns {Promise<Object>}
   */
  async fallback(task, error) {
    logger.warn(`[Agent ${this.name}] Using default fallback for task ${task.taskId}`);
    return {
      success: false,
      error: error.message,
      fallback: true,
      taskId: task.taskId
    };
  }

  // ─── Communication ───────────────────────────────────────────

  /**
   * Gửi message đến agent khác qua EventBus
   */
  sendTo(targetAgentId, type, payload, priority = 'normal') {
    const message = {
      type: `agent:${type}`,
      from: this.id,
      to: targetAgentId,
      taskId: uuidv4(),
      payload,
      priority,
      timestamp: new Date().toISOString()
    };
    this.eventBus.emit('agent:message', message);
    return message.taskId;
  }

  /**
   * Gửi task đến supervisor
   */
  requestSupervisor(action, payload) {
    return this.sendTo('supervisor', 'request', { action, payload }, 'high');
  }

  /**
   * Query metadata từ MemoryAgent
   */
  async queryMemory(key) {
    return this.sendTo('memory-agent', 'query', { key });
  }

  /**
   * Lưu dữ liệu vào MemoryAgent
   */
  async saveToMemory(key, data, ttl = null) {
    return this.sendTo('memory-agent', 'save', { key, data, ttl });
  }

  // ─── Event Handling ──────────────────────────────────────────

  _registerEventListeners() {
    const taskHandler = async (message) => {
      if (message.to === this.id || message.to === 'all') {
        await this.executeWithRetry(message);
      }
    };

    this.eventBus.on('agent:message', taskHandler);
    this._eventListeners.push({ event: 'agent:message', handler: taskHandler });
  }

  _emit(event, data) {
    this.eventBus.emit(event, data);
  }

  // ─── Helpers ─────────────────────────────────────────────────

  _calculateBackoff(attempt) {
    const delay = Math.min(
      this.retryPolicy.baseDelay * Math.pow(this.retryPolicy.exponentialFactor, attempt - 1),
      this.retryPolicy.maxDelay
    );
    if (this.retryPolicy.jitter) {
      return delay * (0.5 + Math.random() * 0.5);
    }
    return delay;
  }

  _updateAvgExecutionTime(duration) {
    const total = this.metrics.tasksProcessed;
    this.metrics.avgExecutionTime = 
      (this.metrics.avgExecutionTime * (total - 1) + duration) / total;
  }

  _auditLog(action, details) {
    this.taskHistory.push({
      action,
      details,
      timestamp: new Date().toISOString()
    });
    // Keep only last 1000 entries
    if (this.taskHistory.length > 1000) {
      this.taskHistory.shift();
    }
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Kiểm tra agent có permission không
   */
  hasPermission(scope) {
    return this.permissions.includes(scope) || this.permissions.includes('*');
  }

  /**
   * Lấy trạng thái hiện tại
   */
  getStatus() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      status: this.status,
      responsibilities: this.responsibilities,
      permissions: this.permissions,
      metrics: this.metrics,
      lastActive: this.metrics.lastActive,
      taskHistoryCount: this.taskHistory.length
    };
  }
}

module.exports = { Agent, PERMISSION_SCOPES, DEFAULT_RETRY_POLICY };
