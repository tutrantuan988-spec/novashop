/**
 * 🎯 Agent Orchestrator — Initializer cho toàn bộ hệ thống Agent
 * 
 * Khởi tạo, đăng ký và kết nối tất cả agents với Supervisor
 * Đây là entry point cho hệ thống multi-agent
 */

const logger = require('../server/utils/logger');
const EventBus = require('../server/services/eventBus');

// Agents
const supervisor = require('./supervisor-agent');
const memoryAgent = require('./memory-agent');
const analyticsAgent = require('./analytics-agent');
const seoAgent = require('./seo-agent');
const contentAgent = require('./content-agent');
const vietnamGeoAgent = require('./vietnam-geo-agent');
const recommendationAgent = require('./recommendation-agent');
const marketingAgent = require('./marketing-agent');
const dataPipelineAgent = require('./data-pipeline-agent');
const monitoringAgent = require('./monitoring-agent');
const WorkflowEngine = require('./workflow-engine');

class AgentOrchestrator {
  constructor() {
    this.initialized = false;
    this.agents = new Map();
    this.workflowEngine = null;
  }

  /**
   * Khởi tạo toàn bộ hệ thống Agent
   */
  async initialize() {
    if (this.initialized) {
      logger.info('[Orchestrator] System already initialized');
      return this.getStatus();
    }

    logger.info('╔══════════════════════════════════════════════════╗');
    logger.info('║   🧠 TRỌNG ĐỊNH STORE — AI AGENT SYSTEM         ║');
    logger.info('╚══════════════════════════════════════════════════╝');

    const startTime = Date.now();

    // 1. Đăng ký tất cả agents với Supervisor
    logger.info('[Orchestrator] Registering agents...');
    
    const agentList = [
      { name: 'Memory Agent', instance: memoryAgent },
      { name: 'Analytics Agent', instance: analyticsAgent },
      { name: 'SEO Agent', instance: seoAgent },
      { name: 'Content Agent', instance: contentAgent },
      { name: 'Vietnam Geo Agent', instance: vietnamGeoAgent },
      { name: 'Recommendation Agent', instance: recommendationAgent },
      { name: 'Marketing Agent', instance: marketingAgent },
      { name: 'Data Pipeline Agent', instance: dataPipelineAgent },
      { name: 'Monitoring Agent', instance: monitoringAgent }
    ];

    for (const agent of agentList) {
      supervisor.registerAgent(agent.instance);
      this.agents.set(agent.instance.id, agent.instance);
      
      try {
        await agent.instance.onInit();
      } catch (err) {
        logger.warn(`[Orchestrator] Agent ${agent.name} init warning: ${err.message}`);
      }
    }

    // 2. Khởi tạo Workflow Engine
    logger.info('[Orchestrator] Initializing Workflow Engine...');
    this.workflowEngine = new WorkflowEngine(supervisor);

    // 3. Setup EventBus listeners cho agent communication
    this._setupEventListeners();

    this.initialized = true;
    const duration = Date.now() - startTime;

    logger.info(`[Orchestrator] ✅ System initialized in ${duration}ms`);
    logger.info(`[Orchestrator] Agents: ${this.agents.size} registered`);
    logger.info(`[Orchestrator] Workflows: ${this.workflowEngine.listTemplates().length} templates`);

    return this.getStatus();
  }

  /**
   * Xử lý yêu cầu từ user — tự động chọn agent phù hợp
   */
  async handleRequest(request) {
    if (!this.initialized) {
      await this.initialize();
    }

    const { type, payload, workflow } = request;

    // Nếu là workflow, chạy workflow engine
    if (workflow) {
      return this.workflowEngine.executeWorkflow(workflow, payload);
    }

    // Nếu là request thông thường, gửi đến supervisor
    return supervisor.handleRequest({ type, payload });
  }

  /**
   * Lấy trạng thái toàn bộ hệ thống
   */
  getStatus() {
    const agentStatuses = [];
    for (const [id, agent] of this.agents) {
      agentStatuses.push(agent.getStatus());
    }

    return {
      initialized: this.initialized,
      supervisor: supervisor.getStatus(),
      agents: agentStatuses,
      workflows: this.workflowEngine ? {
        templates: this.workflowEngine.listTemplates(),
        active: this.workflowEngine.listWorkflows('running').length,
        completed: this.workflowEngine.listWorkflows('completed').length
      } : null,
      memory: memoryAgent.getStats(),
      monitoring: monitoringAgent.metrics
    };
  }

  /**
   * Shutdown toàn bộ hệ thống
   */
  async shutdown() {
    logger.info('[Orchestrator] Shutting down agent system...');
    
    monitoringAgent.stop();
    
    for (const [id, agent] of this.agents) {
      await agent.onShutdown();
    }
    
    this.initialized = false;
    logger.info('[Orchestrator] System shutdown complete');
  }

  _setupEventListeners() {
    // Lắng nghe health check requests
    EventBus.on('system:health-check', async () => {
      const status = this.getStatus();
      EventBus.emit('system:health-result', status);
    });

    // Lắng nghe agent failures và auto-recover
    EventBus.on('agent:task-failed', async (data) => {
      if (data.final) {
        logger.warn(`[Orchestrator] Agent task failed permanently: ${data.taskId}`);
      }
    });

    // Lắng nghe workflow events
    EventBus.on('workflow:completed', (data) => {
      logger.info(`[Orchestrator] Workflow ${data.workflowId} completed`);
    });

    EventBus.on('workflow:failed', (data) => {
      logger.warn(`[Orchestrator] Workflow ${data.workflowId} failed: ${data.error}`);
    });
  }
}

// Singleton
const orchestratorInstance = new AgentOrchestrator();

module.exports = orchestratorInstance;
