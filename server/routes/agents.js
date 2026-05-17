/**
 * 🌐 Agent API Routes — REST API cho hệ thống Agent
 * 
 * Các endpoint:
 * POST   /api/agents/request      — Gửi yêu cầu đến agent
 * GET    /api/agents/status       — Lấy trạng thái tất cả agents
 * GET    /api/agents/:id/status   — Lấy trạng thái 1 agent
 * POST   /api/workflows/execute   — Chạy workflow
 * GET    /api/workflows/:id       — Lấy trạng thái workflow
 * GET    /api/workflows/templates — Danh sách workflow templates
 * POST   /api/vietnam/shipping    — Tính phí ship theo tỉnh
 * GET    /api/vietnam/provinces   — Danh sách 63 tỉnh thành
 * GET    /api/vietnam/:id         — Chi tiết 1 tỉnh
 */

const express = require('express');
const router = express.Router();
const orchestrator = require('../../agents/orchestrator');
const vietnamGeoAgent = require('../../agents/vietnam-geo-agent');
const monitoringAgent = require('../../agents/monitoring-agent');
const analyticsAgent = require('../../agents/analytics-agent');
const contentAgent = require('../../agents/content-agent');
const seoAgent = require('../../agents/seo-agent');
const marketingAgent = require('../../agents/marketing-agent');
const recommendationAgent = require('../../agents/recommendation-agent');
const dataPipelineAgent = require('../../agents/data-pipeline-agent');
const memoryAgent = require('../../agents/memory-agent');
const logger = require('../utils/logger');

// Middleware: kiểm tra system đã init chưa
router.use(async (req, res, next) => {
  try {
    const status = orchestrator.getStatus();
    if (!status.initialized) {
      await orchestrator.initialize();
    }
    next();
  } catch (err) {
    logger.error('[AgentAPI] Init error:', err.message);
    next();
  }
});

// ─── Agent Endpoints ──────────────────────────────────────────

/**
 * POST /api/agents/request
 * Gửi yêu cầu đến hệ thống agent
 */
router.post('/request', async (req, res) => {
  try {
    const { type, payload, workflow } = req.body;
    
    if (!type && !workflow) {
      return res.status(400).json({ error: 'Cần cung cấp "type" hoặc "workflow"' });
    }

    logger.info(`[AgentAPI] Request received: ${type || workflow}`);
    
    const result = await orchestrator.handleRequest({ type, payload, workflow });
    res.json(result);
  } catch (err) {
    logger.error('[AgentAPI] Request error:', err.message);
    res.status(500).json({ error: err.message, status: 'failed' });
  }
});

/**
 * GET /api/agents/status
 * Lấy trạng thái toàn bộ hệ thống agent
 */
router.get('/status', (req, res) => {
  try {
    const status = orchestrator.getStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/agents/:id/status
 * Lấy trạng thái một agent cụ thể
 */
router.get('/:id/status', (req, res) => {
  try {
    const agents = orchestrator.agents;
    const agent = agents.get(req.params.id);
    
    if (!agent) {
      // Tìm trong agent list của supervisor
      const allAgents = orchestrator.getStatus().agents;
      const found = allAgents.find(a => a.id === req.params.id || a.name === req.params.id);
      if (!found) {
        return res.status(404).json({ error: `Agent '${req.params.id}' not found` });
      }
      return res.json(found);
    }

    res.json(agent.getStatus());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Workflow Endpoints ───────────────────────────────────────

/**
 * POST /api/workflows/execute
 * Thực thi một workflow template
 */
router.post('/workflows/execute', async (req, res) => {
  try {
    const { template, context, options } = req.body;
    
    if (!template) {
      return res.status(400).json({ error: 'Cần cung cấp "template" (workflow name)' });
    }

    const result = await orchestrator.workflowEngine.executeWorkflow(template, context, options);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/workflows/:id
 * Lấy trạng thái workflow
 */
router.get('/workflows/:id', (req, res) => {
  try {
    const workflow = orchestrator.workflowEngine.getWorkflowStatus(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/workflows/templates
 * Danh sách workflow templates có sẵn
 */
router.get('/workflows/templates', (req, res) => {
  try {
    const templates = orchestrator.workflowEngine.listTemplates();
    res.json({ templates, total: templates.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Vietnam Geo Endpoints ────────────────────────────────────

/**
 * GET /api/vietnam/provinces
 * Danh sách 63 tỉnh thành
 */
router.get('/vietnam/provinces', async (req, res) => {
  try {
    const result = await vietnamGeoAgent.execute({
      type: 'vietnam.provinces',
      payload: {}
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/vietnam/:id
 * Chi tiết một tỉnh (kèm quận huyện)
 */
router.get('/vietnam/:id', async (req, res) => {
  try {
    const province = await vietnamGeoAgent.execute({
      type: 'vietnam.province',
      payload: { provinceId: req.params.id }
    });
    
    const districts = await vietnamGeoAgent.execute({
      type: 'vietnam.districts',
      payload: { provinceId: req.params.id }
    });

    res.json({ ...province, districts: districts.districts || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/vietnam/shipping
 * Tính phí vận chuyển
 */
router.post('/vietnam/shipping', async (req, res) => {
  try {
    const { address, weight, destinationId } = req.body;
    const result = await vietnamGeoAgent.execute({
      type: 'vietnam.shipping',
      payload: { address, weight, destinationId }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Monitoring Endpoints ─────────────────────────────────────

/**
 * GET /api/monitoring/health
 * Health check toàn bộ hệ thống
 */
router.get('/monitoring/health', async (req, res) => {
  try {
    const result = await monitoringAgent.execute({
      type: 'monitoring.check',
      payload: { all: true }
    });
    res.json(result);
  } catch (err) {
    res.status(503).json({ status: 'error', error: err.message });
  }
});

/**
 * GET /api/monitoring/metrics
 * System metrics
 */
router.get('/monitoring/metrics', async (req, res) => {
  try {
    const result = await monitoringAgent.execute({
      type: 'monitoring.metrics',
      payload: { duration: req.query.duration || '1h' }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Analytics Endpoints ─────────────────────────────────────

/**
 * GET /api/agents/analytics/revenue
 * Phân tích doanh thu
 */
router.get('/analytics/revenue', async (req, res) => {
  try {
    const result = await analyticsAgent.execute({
      type: 'analytics.revenue',
      payload: { period: req.query.period || '30d' }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/agents/analytics/products
 * Phân tích sản phẩm
 */
router.get('/analytics/products', async (req, res) => {
  try {
    const result = await analyticsAgent.execute({
      type: 'analytics.products',
      payload: { period: req.query.period || '30d' }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/agents/analytics/customers
 * Phân tích khách hàng
 */
router.get('/analytics/customers', async (req, res) => {
  try {
    const result = await analyticsAgent.execute({
      type: 'analytics.customers',
      payload: { period: req.query.period || '30d' }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/agents/analytics/forecast
 * Dự báo doanh thu
 */
router.get('/analytics/forecast', async (req, res) => {
  try {
    const result = await analyticsAgent.execute({
      type: 'analytics.forecast',
      payload: { period: req.query.period || '30d' }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SEO Endpoints ────────────────────────────────────────────

/**
 * POST /api/agents/seo/optimize
 * Tối ưu SEO cho sản phẩm
 */
router.post('/seo/optimize', async (req, res) => {
  try {
    const { product } = req.body;
    if (!product) return res.status(400).json({ error: 'Thiếu thông tin sản phẩm' });
    const result = await seoAgent.execute({
      type: 'seo.optimize',
      payload: { product }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/agents/seo/audit
 * SEO audit toàn trang
 */
router.get('/seo/audit', async (req, res) => {
  try {
    const result = await seoAgent.execute({
      type: 'seo.audit',
      payload: { url: req.query.url }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/agents/seo/keywords
 * Đề xuất từ khóa
 */
router.post('/seo/keywords', async (req, res) => {
  try {
    const { product } = req.body;
    const result = await seoAgent.execute({
      type: 'seo.keywords',
      payload: { product }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Content Endpoints ────────────────────────────────────────

/**
 * POST /api/agents/content/generate
 * Tạo mô tả sản phẩm
 */
router.post('/content/generate', async (req, res) => {
  try {
    const { product } = req.body;
    if (!product) return res.status(400).json({ error: 'Thiếu thông tin sản phẩm' });
    const result = await contentAgent.execute({
      type: 'content.generate',
      payload: { product }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/agents/content/blog/:topic
 * Lấy blog post theo chủ đề
 */
router.get('/content/blog/:topic', async (req, res) => {
  try {
    const result = await contentAgent.execute({
      type: 'content.blog',
      payload: { template: req.params.topic }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/agents/content/promotion
 * Tạo nội dung promotion
 */
router.get('/content/promotion', async (req, res) => {
  try {
    const result = await contentAgent.execute({
      type: 'content.promotion',
      payload: { campaign: { type: req.query.type || 'flash-sale' } }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Marketing Endpoints ──────────────────────────────────────

/**
 * POST /api/agents/marketing/campaign
 * Tạo chiến dịch marketing
 */
router.post('/marketing/campaign', async (req, res) => {
  try {
    const result = await marketingAgent.execute({
      type: 'marketing.campaign',
      payload: { campaign: req.body }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/agents/marketing/analytics
 * Phân tích hiệu quả chiến dịch
 */
router.get('/marketing/analytics', async (req, res) => {
  try {
    const result = await marketingAgent.execute({
      type: 'marketing.analytics',
      payload: { campaignId: req.query.campaignId }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/agents/marketing/abandoned-cart
 * Xử lý giỏ hàng bỏ quên
 */
router.post('/marketing/abandoned-cart', async (req, res) => {
  try {
    const result = await marketingAgent.execute({
      type: 'marketing.abandoned-cart',
      payload: req.body
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Recommendation Endpoints ─────────────────────────────────

/**
 * POST /api/agents/recommend/cross-sell
 * Cross-sell recommendations
 */
router.post('/recommend/cross-sell', async (req, res) => {
  try {
    const { productId, category } = req.body;
    const result = await recommendationAgent.execute({
      type: 'recommend.cross-sell',
      payload: { productId, category }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/agents/recommend/personalized
 * Gợi ý cá nhân hóa
 */
router.post('/recommend/personalized', async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await recommendationAgent.execute({
      type: 'recommend.personalized',
      payload: { userId }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/agents/recommend/cart
 * Gợi ý dựa trên giỏ hàng
 */
router.post('/recommend/cart', async (req, res) => {
  try {
    const { items } = req.body;
    const result = await recommendationAgent.execute({
      type: 'recommend.cart',
      payload: { cartItems: items }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Data Pipeline Endpoints ─────────────────────────────────

/**
 * POST /api/agents/data/import
 * Import dữ liệu
 */
router.post('/data/import', async (req, res) => {
  try {
    const { data, format } = req.body;
    if (!data) return res.status(400).json({ error: 'Thiếu dữ liệu' });
    const result = await dataPipelineAgent.execute({
      type: 'datapipeline.import',
      payload: { data, format: format || 'json' }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/agents/data/export/:type
 * Export dữ liệu (products, orders, customers)
 */
router.get('/data/export/:type', async (req, res) => {
  try {
    const result = await dataPipelineAgent.execute({
      type: 'datapipeline.export',
      payload: { type: req.params.type, format: req.query.format || 'json' }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/agents/data/validate
 * Validate dữ liệu
 */
router.post('/data/validate', async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'Thiếu dữ liệu' });
    const result = await dataPipelineAgent.execute({
      type: 'datapipeline.validate',
      payload: { data }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Memory Agent Endpoints ───────────────────────────────────

/**
 * POST /api/agents/memory/save
 * Lưu dữ liệu vào memory
 */
router.post('/memory/save', async (req, res) => {
  try {
    const { key, data, ttl } = req.body;
    if (!key || !data) return res.status(400).json({ error: 'Thiếu key hoặc data' });
    const result = await memoryAgent.execute({
      type: 'memory.save',
      payload: { key, data, ttl }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/agents/memory/get/:key
 * Lấy dữ liệu từ memory
 */
router.get('/memory/get/:key', async (req, res) => {
  try {
    const result = await memoryAgent.execute({
      type: 'memory.get',
      payload: { key: req.params.key }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/agents/memory/stats
 * Thống kê memory
 */
router.get('/memory/stats', async (req, res) => {
  try {
    const result = await memoryAgent.execute({
      type: 'memory.stats',
      payload: {}
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
