/**
 * 🛡️ VALIDATION MIDDLEWARE
 * Request validation cho tất cả API endpoints
 * Tự động validate body, query, params theo schema
 *
 * Pattern: context7-style structured validation
 * Tích hợp: everything-claude-code security best practices
 */

const logger = require('../utils/logger');

class ValidationError extends Error {
  constructor(message, status = 400, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Validate request body against a schema
 * @param {Object} schema - { fieldName: { type, required, min, max, pattern, message } }
 */
function validateBody(schema) {
  return (req, res, next) => {
    const errors = [];
    const body = req.body || {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];

      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: rules.message || `${field} là bắt buộc` });
        continue;
      }

      if (value === undefined || value === null) continue;

      // Type check
      if (rules.type && typeof value !== rules.type) {
        errors.push({ field, message: `${field} phải là kiểu ${rules.type}` });
        continue;
      }

      // Number range
      if (rules.type === 'number') {
        const num = Number(value);
        if (rules.min !== undefined && num < rules.min) {
          errors.push({ field, message: `${field} tối thiểu ${rules.min}` });
        }
        if (rules.max !== undefined && num > rules.max) {
          errors.push({ field, message: `${field} tối đa ${rules.max}` });
        }
      }

      // String length
      if (typeof value === 'string') {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push({ field, message: `${field} tối thiểu ${rules.minLength} ký tự` });
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push({ field, message: `${field} tối đa ${rules.maxLength} ký tự` });
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push({ field, message: rules.patternMessage || `${field} không đúng định dạng` });
        }
      }

      // Enum check
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({ field, message: `${field} phải là một trong: ${rules.enum.join(', ')}` });
      }
    }

    if (errors.length > 0) {
      logger.warn('Validation failed', { path: req.path, errors });
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        details: errors,
      });
    }

    next();
  };
}

/**
 * Validate query parameters
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const errors = [];
    const query = req.query || {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = query[field];

      if (rules.required && (value === undefined || value === '')) {
        errors.push({ field, message: rules.message || `Query parameter ${field} là bắt buộc` });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Query không hợp lệ', details: errors });
    }

    next();
  };
}

/**
 * Validate MongoDB ObjectId format for params
 */
function validateObjectId(paramName = 'id') {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({ error: `${paramName} không hợp lệ` });
    }
    next();
  };
}

/**
 * Sanitize string inputs (trim, remove HTML tags)
 */
function sanitizeStrings(req, res, next) {
  function sanitize(obj) {
    if (typeof obj === 'string') {
      return obj.trim().replace(/<[^>]*>/g, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const cleaned = {};
      for (const [key, val] of Object.entries(obj)) {
        cleaned[key] = sanitize(val);
      }
      return cleaned;
    }
    return obj;
  }

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  next();
}

/**
 * Rate limit by user/IP cho các API nhạy cảm
 */
function sensitiveOperation(req, res, next) {
  const key = req.user?.id || req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 phút
  const maxRequests = 10;

  if (!global._rateLimitStore) global._rateLimitStore = {};
  if (!global._rateLimitStore[key]) {
    global._rateLimitStore[key] = { count: 1, start: now };
    return next();
  }

  const entry = global._rateLimitStore[key];
  if (now - entry.start > windowMs) {
    entry.count = 1;
    entry.start = now;
    return next();
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return res.status(429).json({
      error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
    });
  }

  next();
}

module.exports = {
  ValidationError,
  validateBody,
  validateQuery,
  validateObjectId,
  sanitizeStrings,
  sensitiveOperation,
};
