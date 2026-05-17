/**
 * 🧠 Supervisor Agent — Điều phối toàn bộ hệ thống đa tác nhân
 * 
 * Trách nhiệm:
 * - Tiếp nhận & phân tích yêu cầu từ user
 * - Chọn agent phù hợp dựa trên năng lực
 * - Phân rã task lớn thành sub-task
 * - Theo dõi trạng thái các agent
 * - Escalate lỗi lên human
 * - Đảm bảo SLA cho mỗi task
 * - Audit toàn bộ hoạt động
 */

const { Agent, PERMISSION_SCOPES } = require('./agent-framework');
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const logger = require('../server/utils/logger');

class SupervisorAgent extends Agent {
  constructor() {
    super({
      name: 'Supervisor Agent',
      version: '2.0.0',
      responsibilities: [
        'Điều phối và phân công task cho các agent chuyên biệt',
        'Giám sát trạng thái và health của toàn bộ hệ thống agent',
        'Phân rã yêu cầu phức tạp thành các sub-task',
        'Đảm bảo SLA và retry khi agent gặp lỗi',
        'Audit và log toàn bộ hoạt động agent',
        'Human-in-the-loop cho các quyết định quan trọng',
        'Tự động scale agent pool khi tải cao'
      ],
      permissions: [
        PERMISSION_SCOPES.MANAGE_AGENTS,
        PERMISSION_SCOPES.READ_SYSTEM,
        PERMISSION_SCOPES.WRITE_SYSTEM,
        PERMISSION_SCOPES.READ_ANALYTICS,
        PERMISSION_SCOPES.READ_PRODUCTS,
        PERMISSION_SCOPES.READ_ORDERS,
        PERMISSION_SCOPES.READ_USERS
      ],
      retryPolicy: {
        maxRetries: 5,
        baseDelay: 500,
        maxDelay: 10000
      }
    });

    this.agentRegistry = new Map(); // agentId -> { instance, capabilities }
    this.taskTypeMap = new Map();    // taskType -> agentId (direct routing)
    this.taskQueue = [];
    this.activeTasks = new Map();
    this.approvalQueue = [];        // Tasks cần human approval

    // Đăng ký lắng nghe agent events
    this._setupEventListeners();
  }

  // ─── Agent Registry ──────────────────────────────────────────

  /**
   * Đăng ký một agent vào hệ thống
   * @param {Agent} agentInstance 
   */
  registerAgent(agentInstance) {
    const capabilities = agentInstance.responsibilities;
    this.agentRegistry.set(agentInstance.id, {
      instance: agentInstance,
      capabilities,
      registeredAt: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString()
    });

    logger.info(`[Supervisor] Agent registered: ${agentInstance.name} (${agentInstance.id})`);
    this._auditLog('agent.register', { agentId: agentInstance.id, name: agentInstance.name, capabilities });
    
    // Build task-type → agent-id mapping for direct routing
    const taskPrefix = agentInstance.id.replace('-agent', '');
    this.taskTypeMap.set(taskPrefix, agentInstance.id);
    
    // Gửi health check
    this._emit('supervisor:agent-registered', { agentId: agentInstance.id });
  }

  /**
   * Hủy đăng ký agent
   */
  unregisterAgent(agentId) {
    const agent = this.agentRegistry.get(agentId);
    if (agent) {
      agent.instance.onShutdown();
      this.agentRegistry.delete(agentId);
      logger.info(`[Supervisor] Agent unregistered: ${agentId}`);
    }
  }

  // ─── Task Routing ────────────────────────────────────────────

  /**
   * Phân tích yêu cầu và chọn agent phù hợp
   * @param {string} request - Yêu cầu từ user
   * @returns {Object} { agentId, confidence, reasoning }
   */
  analyzeRequest(request) {
    const requestLower = request.toLowerCase();
    const scores = [];

    for (const [agentId, info] of this.agentRegistry) {
      let score = 0;
      const reasons = [];

      for (const capability of info.capabilities) {
        const capKeywords = capability.toLowerCase().split(' ');
        const matchCount = capKeywords.filter(kw => requestLower.includes(kw)).length;
        if (matchCount > 0) {
          score += matchCount * 10;
          reasons.push(capability);
        }
      }

      if (score > 0) {
        scores.push({ agentId, agentName: info.instance.name, score, reasons });
      }
    }

    scores.sort((a, b) => b.score - a.score);
    return {
      primary: scores[0] || null,
      alternatives: scores.slice(1, 3),
      all: scores
    };
  }

  /**
   * Phân rã task phức tạp thành chuỗi sub-task
   * @param {Object} task 
   * @returns {Object[]} Mảng sub-task
   */
  decomposeTask(task) {
    const { type, payload } = task;
    const subTasks = [];

    // Logic phân rã dựa trên loại task
    switch (type) {
      case 'marketing.campaign':
        subTasks.push({ type: 'analytics.analyze', payload: { period: '30d' }, priority: 'high' });
        subTasks.push({ type: 'seo.optimize', payload: { campaignName: payload.name }, priority: 'high' });
        subTasks.push({ type: 'content.generate', payload: { template: 'promotion' }, priority: 'normal' });
        break;

      case 'product.import':
        subTasks.push({ type: 'datapipeline.validate', payload, priority: 'high' });
        subTasks.push({ type: 'seo.optimize', payload: { products: payload.items }, priority: 'normal' });
        subTasks.push({ type: 'content.generate', payload: { products: payload.items }, priority: 'normal' });
        break;

      case 'system.health':
        subTasks.push({ type: 'monitoring.check', payload: { all: true }, priority: 'high' });
        break;

      default:
        // Task đơn giản, gửi thẳng đến agent phù hợp
        const routing = this.analyzeRequest(type + ' ' + JSON.stringify(payload));
        if (routing.primary) {
          return [{ ...task, targetAgent: routing.primary.agentId }];
        }
        break;
    }

    return subTasks.map((st, i) => ({
      ...st,
      taskId: uuidv4(),
      parentTaskId: task.taskId,
      sequenceOrder: i,
      maxRetries: 2
    }));
  }

  /**
   * Nhận và xử lý yêu cầu từ user/system
   * @param {Object} request 
   * @returns {Promise<Object>}
   */
  async handleRequest(request) {
    const taskId = uuidv4();
    const task = {
      taskId,
      ...request,
      status: 'received',
      createdAt: new Date().toISOString()
    };

    // Phân tích & phân rã
    const routing = this.analyzeRequest(request.type + ' ' + JSON.stringify(request.payload || {}));
    const subTasks = this.decomposeTask(task);

    logger.info(`[Supervisor] Request received: ${request.type} → ${subTasks.length} sub-tasks`);

    // Kiểm tra xem có cần human approval không
    if (this._requiresApproval(task)) {
      task.status = 'pending_approval';
      this.approvalQueue.push(task);
      this._emit('supervisor:approval-required', task);
      return { taskId, status: 'pending_approval', message: 'Cần xác nhận từ quản trị viên' };
    }

    // Execute sub-tasks
    task.status = 'executing';
    this.activeTasks.set(taskId, task);

    const results = [];
    for (const subTask of subTasks) {
      try {
        const agent = this.agentRegistry.get(subTask.targetAgent);
        if (!agent) {
          throw new Error(`Agent ${subTask.targetAgent} not found in registry`);
        }
        const result = await agent.instance.executeWithRetry(subTask);
        results.push({ subTask: subTask.type, result, status: 'completed' });
      } catch (error) {
        results.push({ subTask: subTask.type, error: error.message, status: 'failed' });
        
        // Escalate nếu critical
        if (subTask.priority === 'high') {
          this._escalateToHuman(task, subTask, error);
        }
      }
    }

    // Tổng hợp kết quả
    const finalResult = this._aggregateResults(results);
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.result = finalResult;

    this._emit('supervisor:task-complete', { taskId, result: finalResult });
    return { taskId, status: 'completed', result: finalResult, subTasks: results };
  }

  // ─── Health Check ────────────────────────────────────────────

  /**
   * Kiểm tra sức khỏe toàn bộ hệ thống
   */
  async healthCheck() {
    const results = [];
    for (const [agentId, info] of this.agentRegistry) {
      try {
        const status = info.instance.getStatus();
        results.push({ agentId, name: info.instance.name, status: status.status, healthy: true, metrics: status.metrics });
      } catch (err) {
        results.push({ agentId, name: info.instance.name, status: 'error', healthy: false, error: err.message });
      }
    }

    return {
      supervisor: this.getStatus(),
      agents: results,
      totalAgents: results.length,
      healthyAgents: results.filter(r => r.healthy).length,
      failedAgents: results.filter(r => !r.healthy).length,
      activeTasks: this.activeTasks.size,
      pendingApprovals: this.approvalQueue.length,
      timestamp: new Date().toISOString()
    };
  }

  // ─── Override execute ────────────────────────────────────────

  async execute(task) {
    return this.handleRequest(task);
  }

  async fallback(task, error) {
    return {
      success: false,
      error: `Supervisor không thể xử lý: ${error.message}`,
      taskId: task.taskId,
      recommendations: [
        'Kiểm tra lại kết nối các agent service',
        'Xem log chi tiết trong server/logs/',
        'Thử restart supervisor agent'
      ]
    };
  }

  // ─── Private ─────────────────────────────────────────────────

  _setupEventListeners() {
    this.eventBus.on('agent:task-failed', async (data) => {
      this._auditLog('agent.task-failed', data);
      // Auto-retry logic for failed tasks
      const task = this.activeTasks.get(data.taskId);
      if (task && !data.final) {
        logger.info(`[Supervisor] Re-routing failed task ${data.taskId}`);
        // Try alternative agent
        const altRouting = this.analyzeRequest(data.taskId);
        if (altRouting.alternatives.length > 0) {
          const altAgent = this.agentRegistry.get(altRouting.alternatives[0].agentId);
          if (altAgent) {
            altAgent.instance.executeWithRetry(task);
          }
        }
      }
    });

    this.eventBus.on('agent:heartbeat', ({ agentId }) => {
      const agent = this.agentRegistry.get(agentId);
      if (agent) {
        agent.lastHeartbeat = new Date().toISOString();
      }
    });
  }

  _requiresApproval(task) {
    const dangerousActions = ['system.reboot', 'data.delete', 'user.ban', 'price.mass-update', 'export.all'];
    return dangerousActions.includes(task.type);
  }

  _escalateToHuman(task, subTask, error) {
    this._emit('supervisor:escalation', {
      taskId: task.taskId,
      subTask: subTask.type,
      error: error.message,
      severity: 'high',
      requiresImmediateAttention: true
    });
    logger.error(`[Supervisor] ESCALATION: Task ${task.taskId} subtask ${subTask.type} failed: ${error.message}`);
  }

  _aggregateResults(results) {
    const total = results.length;
    const succeeded = results.filter(r => r.status === 'completed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    
    return {
      total,
      succeeded,
      failed,
      successRate: total > 0 ? (succeeded / total * 100).toFixed(1) + '%' : 'N/A',
      summary: failed === 0 
        ? 'Tất cả sub-task hoàn thành thành công'
        : `${failed}/${total} sub-task gặp lỗi, cần kiểm tra lại`,
      details: results
    };
  }
}

// Singleton instance
const supervisorInstance = new SupervisorAgent();
module.exports = supervisorInstance;
