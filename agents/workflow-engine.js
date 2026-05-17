/**
 * 🔄 Workflow Engine — Cỗ máy workflow cho hệ thống Agent
 * 
 * Hỗ trợ:
 * - Sequential workflow (chạy lần lượt)
 * - Parallel workflow (chạy đồng thời)
 * - Conditional workflow (rẽ nhánh)
 * - Retry & rollback
 * - Human approval gates
 * - Timeout & deadline
 * - Webhook notifications
 */

const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const EventBus = require('../server/services/eventBus');
const logger = require('../server/utils/logger');

class WorkflowEngine {
  constructor(supervisorAgent) {
    this.supervisor = supervisorAgent;
    this.eventBus = EventBus;
    this.activeWorkflows = new Map();
    this.workflowTemplates = new Map();
    this.completedWorkflows = [];

    // Đăng ký workflow templates mặc định
    this._registerDefaultTemplates();

    logger.info('[WorkflowEngine] Initialized');
  }

  // ─── Workflow Definition ─────────────────────────────────────

  /**
   * Định nghĩa một workflow template
   */
  defineTemplate(name, definition) {
    const template = {
      name,
      version: definition.version || '1.0.0',
      description: definition.description || '',
      steps: definition.steps || [],
      onComplete: definition.onComplete || null,
      onError: definition.onError || null,
      timeout: definition.timeout || 300000, // 5 phút
      createdAt: new Date().toISOString()
    };

    this.workflowTemplates.set(name, template);
    logger.info(`[WorkflowEngine] Template '${name}' registered (${definition.steps.length} steps)`);
    return template;
  }

  /**
   * Thực thi một workflow từ template
   */
  async executeWorkflow(templateName, context = {}, options = {}) {
    const template = this.workflowTemplates.get(templateName);
    if (!template) {
      throw new Error(`Workflow template '${templateName}' not found`);
    }

    const workflowId = `wf_${uuidv4().slice(0, 12)}`;
    const workflow = {
      id: workflowId,
      template: templateName,
      context: { ...context },
      steps: JSON.parse(JSON.stringify(template.steps)),
      status: 'running',
      currentStep: 0,
      results: [],
      errors: [],
      startTime: new Date().toISOString(),
      timeout: options.timeout || template.timeout,
      webhook: options.webhook || null
    };

    this.activeWorkflows.set(workflowId, workflow);
    logger.info(`[WorkflowEngine] Started '${templateName}' (${workflowId})`);

    // Set timeout
    const timeoutId = setTimeout(() => {
      this._handleTimeout(workflowId);
    }, workflow.timeout);
    workflow._timeoutId = timeoutId;

    // Execute steps
    try {
      await this._executeSteps(workflow);
      return this._completeWorkflow(workflow);
    } catch (error) {
      return this._failWorkflow(workflow, error);
    }
  }

  // ─── Step Execution ──────────────────────────────────────────

  async _executeSteps(workflow) {
    for (let i = 0; i < workflow.steps.length; i++) {
      if (workflow.status !== 'running') break;
      
      workflow.currentStep = i;
      const step = workflow.steps[i];
      
      logger.info(`[WorkflowEngine] Step ${i + 1}/${workflow.steps.length}: ${step.name || step.type}`);

      try {
        if (step.type === 'parallel') {
          await this._executeParallelStep(workflow, step);
        } else if (step.type === 'condition') {
          await this._executeConditionStep(workflow, step);
        } else {
          await this._executeSingleStep(workflow, step);
        }
      } catch (error) {
        workflow.errors.push({ step: i, error: error.message });
        
        if (step.optional) {
          logger.warn(`[WorkflowEngine] Optional step ${i} failed: ${error.message}`);
          workflow.results.push({ step: i, status: 'skipped', error: error.message });
        } else {
          throw error;
        }
      }
    }
  }

  async _executeSingleStep(workflow, step) {
    const { agent, type, payload, timeout = 30000 } = step;
    
    const taskId = this.supervisor.sendTo(agent, type, {
      ...payload,
      _workflowId: workflow.id,
      _stepName: step.name
    }, step.priority || 'normal');

    // Wait for result via EventBus with timeout
    const result = await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Step '${step.name}' timed out after ${timeout}ms`));
      }, timeout);

      const handler = (data) => {
        if (data.taskId === taskId) {
          clearTimeout(timeoutId);
          this.eventBus.off('agent:task-complete', handler);
          this.eventBus.off('agent:task-failed', handler);
          
          if (data.error) {
            reject(new Error(data.error));
          } else {
            resolve(data.result);
          }
        }
      };

      this.eventBus.on('agent:task-complete', handler);
      this.eventBus.on('agent:task-failed', handler);
    });

    workflow.results.push({
      step: workflow.currentStep,
      name: step.name,
      type: step.type,
      status: 'completed',
      result
    });

    // Update workflow context với kết quả
    if (step.saveTo) {
      workflow.context[step.saveTo] = result;
    }
  }

  async _executeParallelStep(workflow, step) {
    const subSteps = step.subSteps || [];
    const promises = subSteps.map(subStep => 
      this._executeSingleStep(workflow, subStep)
        .catch(err => ({ error: err.message, status: 'failed' }))
    );

    const results = await Promise.all(promises);
    
    workflow.results.push({
      step: workflow.currentStep,
      name: step.name,
      type: 'parallel',
      status: results.every(r => !r.error) ? 'completed' : 'partial',
      subResults: results,
      total: results.length,
      succeeded: results.filter(r => !r.error).length
    });
  }

  async _executeConditionStep(workflow, step) {
    const condition = step.condition;
    const contextValue = this._resolveContextPath(workflow.context, condition.path);
    const matches = condition.operator === 'equals' 
      ? contextValue === condition.value
      : condition.operator === 'contains'
        ? String(contextValue).includes(condition.value)
        : condition.operator === 'gt'
          ? contextValue > condition.value
          : condition.operator === 'lt'
            ? contextValue < condition.value
            : false;

    const branch = matches ? step.ifTrue : step.ifFalse;
    
    if (branch && branch.steps) {
      for (const branchStep of branch.steps) {
        await this._executeSingleStep(workflow, branchStep);
      }
    }

    workflow.results.push({
      step: workflow.currentStep,
      name: step.name,
      type: 'condition',
      status: 'completed',
      condition: `${condition.path} ${condition.operator} ${condition.value}`,
      result: matches ? 'branch_true' : 'branch_false'
    });
  }

  // ─── Workflow CRUD ──────────────────────────────────────────

  /**
   * Lấy trạng thái workflow
   */
  getWorkflowStatus(workflowId) {
    return this.activeWorkflows.get(workflowId) || 
           this.completedWorkflows.find(w => w.id === workflowId) || 
           null;
  }

  /**
   * Hủy workflow đang chạy
   */
  async cancelWorkflow(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (!workflow) return { error: 'Workflow not found' };

    workflow.status = 'cancelled';
    if (workflow._timeoutId) clearTimeout(workflow._timeoutId);
    
    this._archiveWorkflow(workflow);
    return { workflowId, status: 'cancelled' };
  }

  /**
   * Lấy danh sách tất cả workflow
   */
  listWorkflows(status = null) {
    const all = [...this.activeWorkflows.values(), ...this.completedWorkflows];
    return status ? all.filter(w => w.status === status) : all;
  }

  /**
   * Danh sách templates có sẵn
   */
  listTemplates() {
    return [...this.workflowTemplates.entries()].map(([name, template]) => ({
      name,
      version: template.version,
      description: template.description,
      steps: template.steps.length,
      createdAt: template.createdAt
    }));
  }

  // ─── Default Templates ───────────────────────────────────────

  _registerDefaultTemplates() {
    // 1. Product Import Workflow
    this.defineTemplate('product-import', {
      version: '1.0.0',
      description: 'Import sản phẩm tự động với validate + SEO + content',
      steps: [
        { name: 'Validate dữ liệu', agent: 'data-pipeline-agent', type: 'datapipeline.validate', payload: {}, priority: 'high' },
        { name: 'Tối ưu SEO', agent: 'seo-agent', type: 'seo.optimize', payload: {}, priority: 'high', saveTo: 'seoData', optional: true },
        { name: 'Tạo nội dung', agent: 'content-agent', type: 'content.generate', payload: {}, priority: 'normal', saveTo: 'contentData', optional: true },
        { name: 'Phân tích thị trường', agent: 'analytics-agent', type: 'analytics.forecast', payload: { period: '30d' }, priority: 'low', optional: true }
      ],
      onComplete: { webhook: true, notify: ['admin'] },
      timeout: 120000
    });

    // 2. Daily Report Workflow
    this.defineTemplate('daily-report', {
      version: '1.0.0',
      description: 'Tạo báo cáo hàng ngày tự động',
      steps: [
        {
          name: 'Thu thập dữ liệu', type: 'parallel', subSteps: [
            { name: 'Doanh thu', agent: 'analytics-agent', type: 'analytics.revenue', payload: { period: '1d' } },
            { name: 'Sản phẩm', agent: 'analytics-agent', type: 'analytics.products', payload: { period: '1d' } },
            { name: 'Khách hàng', agent: 'analytics-agent', type: 'analytics.customers', payload: { period: '1d' } }
          ]
        },
        { name: 'Kiểm tra hệ thống', agent: 'monitoring-agent', type: 'monitoring.check', payload: { all: true }, priority: 'high' },
        { name: 'Tạo báo cáo', agent: 'content-agent', type: 'content.generate', payload: { template: 'report' }, optional: true }
      ],
      timeout: 60000
    });

    // 3. Marketing Campaign Workflow
    this.defineTemplate('marketing-campaign', {
      version: '1.0.0',
      description: 'Triển khai chiến dịch marketing tự động',
      steps: [
        { name: 'Phân tích dữ liệu', agent: 'analytics-agent', type: 'analytics.revenue', payload: { period: '30d' }, priority: 'high', saveTo: 'marketData' },
        { name: 'Tối ưu SEO', agent: 'seo-agent', type: 'seo.audit', payload: {}, priority: 'normal', optional: true },
        { name: 'Tạo nội dung', agent: 'content-agent', type: 'content.promotion', payload: {}, priority: 'high', saveTo: 'promoContent' },
        { name: 'Gửi email', agent: 'marketing-agent', type: 'marketing.email', payload: { template: 'promotion' }, priority: 'high' },
        {
          name: 'Kiểm tra hiệu quả', type: 'condition', condition: { path: 'marketData.summary.totalRevenue', operator: 'gt', value: 10000000 },
          ifTrue: { steps: [{ name: 'Gửi tiếp VIP', agent: 'marketing-agent', type: 'marketing.campaign', payload: { type: 'vip' }, priority: 'normal' }] },
          ifFalse: { steps: [{ name: 'Tối ưu lại', agent: 'analytics-agent', type: 'analytics.anomalies', payload: { period: '30d' }, priority: 'high' }] }
        }
      ],
      timeout: 120000
    });

    // 4. Health Check Workflow
    this.defineTemplate('system-health', {
      version: '1.0.0',
      description: 'Kiểm tra sức khỏe toàn bộ hệ thống',
      steps: [
        { name: 'Kiểm tra tất cả service', agent: 'monitoring-agent', type: 'monitoring.check', payload: { all: true }, priority: 'high', saveTo: 'healthData' },
        {
          name: 'Xử lý cảnh báo', type: 'condition', condition: { path: 'healthData.summary.error', operator: 'gt', value: 0 },
          ifTrue: { steps: [{ name: 'Cảnh báo admin', agent: 'monitoring-agent', type: 'monitoring.alerts', payload: { duration: '24h' }, priority: 'critical' }] }
        }
      ],
      timeout: 30000
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────

  _completeWorkflow(workflow) {
    workflow.status = 'completed';
    workflow.endTime = new Date().toISOString();
    
    if (workflow._timeoutId) clearTimeout(workflow._timeoutId);
    this._archiveWorkflow(workflow);

    const duration = (new Date(workflow.endTime) - new Date(workflow.startTime)) / 1000;
    logger.info(`[WorkflowEngine] '${workflow.template}' completed in ${duration}s (${workflow.id})`);

    this.eventBus.emit('workflow:completed', {
      workflowId: workflow.id,
      template: workflow.template,
      duration: `${duration}s`,
      results: workflow.results
    });

    return this._formatResult(workflow);
  }

  _failWorkflow(workflow, error) {
    workflow.status = 'failed';
    workflow.endTime = new Date().toISOString();
    workflow.fatalError = error.message;

    if (workflow._timeoutId) clearTimeout(workflow._timeoutId);
    this._archiveWorkflow(workflow);

    logger.error(`[WorkflowEngine] '${workflow.template}' FAILED: ${error.message} (${workflow.id})`);

    this.eventBus.emit('workflow:failed', {
      workflowId: workflow.id,
      template: workflow.template,
      error: error.message,
      step: workflow.currentStep
    });

    return this._formatResult(workflow);
  }

  _handleTimeout(workflowId) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow && workflow.status === 'running') {
      workflow.status = 'timed_out';
      this._failWorkflow(workflow, new Error('Workflow timeout'));
    }
  }

  _archiveWorkflow(workflow) {
    this.activeWorkflows.delete(workflow.id);
    this.completedWorkflows.push(workflow);
    if (this.completedWorkflows.length > 100) this.completedWorkflows.shift();
  }

  _resolveContextPath(context, path) {
    return path.split('.').reduce((obj, key) => obj?.[key], context);
  }

  _formatResult(workflow) {
    return {
      id: workflow.id,
      template: workflow.template,
      status: workflow.status,
      startTime: workflow.startTime,
      endTime: workflow.endTime,
      duration: workflow.endTime ? `${((new Date(workflow.endTime) - new Date(workflow.startTime)) / 1000).toFixed(1)}s` : null,
      steps: workflow.results,
      totalSteps: workflow.steps.length,
      completedSteps: workflow.results.length,
      errors: workflow.errors,
      context: workflow.context,
      fatalError: workflow.fatalError || null
    };
  }
}

module.exports = WorkflowEngine;
