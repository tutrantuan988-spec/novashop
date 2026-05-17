/**
 * 🧠 CONTEXT API ROUTES
 * REST API cho AI Chatbot context persistence
 * Pattern: upstash/context7
 * 
 * POST   /api/context/:userId/:sessionId  — Lưu context
 * GET    /api/context/:userId/:sessionId  — Đọc context
 * DELETE /api/context/:userId/:sessionId  — Xoá context
 */

const express = require('express');
const router = express.Router();
const contextService = require('../services/contextService');
const logger = require('../utils/logger');

/**
 * POST /api/context/:userId/:sessionId
 * Lưu context hội thoại
 */
router.post('/:userId/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages phải là một mảng' });
    }

    if (messages.length === 0) {
      return res.status(400).json({ error: 'messages không được để trống' });
    }

    const success = await contextService.saveContext(userId, sessionId, messages);
    
    if (success) {
      res.json({ success: true, saved: messages.length });
    } else {
      res.status(500).json({ error: 'Không thể lưu context' });
    }
  } catch (err) {
    logger.error('POST /api/context error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/context/:userId/:sessionId
 * Đọc context hội thoại
 */
router.get('/:userId/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const context = await contextService.getContext(userId, sessionId);
    res.json(context);
  } catch (err) {
    logger.error('GET /api/context error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/context/:userId/:sessionId
 * Xoá context hội thoại
 */
router.delete('/:userId/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const success = await contextService.clearContext(userId, sessionId);
    
    if (success) {
      res.json({ success: true, message: 'Context đã được xoá' });
    } else {
      res.status(500).json({ error: 'Không thể xoá context' });
    }
  } catch (err) {
    logger.error('DELETE /api/context error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/context/cleanup
 * Dọn dẹp context cũ (admin only)
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { maxAgeHours = 72 } = req.body;
    const deleted = await contextService.cleanupOldContexts(maxAgeHours);
    res.json({ success: true, deleted });
  } catch (err) {
    logger.error('POST /api/context/cleanup error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
