/**
 * Security middleware (P10).
 *
 * - Rate limiters cho từng nhóm route
 * - Idempotency key middleware cho POST checkout
 * - sanitize helpers (text-only) — tránh phụ thuộc thêm package
 */

const { ipKeyGenerator, rateLimit } = require('express-rate-limit');
const crypto = require('crypto');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Helper: skip rate limit trong test/dev nếu muốn
const skipInDev = () => !IS_PRODUCTION && process.env.DISABLE_RATE_LIMIT === '1';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều yêu cầu xác thực, vui lòng đợi 15 phút.' },
  skip: skipInDev
});

const checkoutHardLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều lần đặt hàng, vui lòng đợi.' },
  keyGenerator: (req) => req.header('x-user-id') || ipKeyGenerator(req.ip),
  skip: skipInDev
});

const publicReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev
});

const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn đã viết quá nhiều đánh giá. Vui lòng đợi 1 giờ.' },
  keyGenerator: (req) => req.header('x-user-id') || req.body?.email || ipKeyGenerator(req.ip),
  skip: skipInDev
});

/**
 * Sanitize plain text — strip HTML tags + escape entities.
 * Đủ cho review/comment do dùng React renders text safely.
 */
function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<\/?[^>]+(>|$)/g, '') // strip tags
    .replace(/[\u0000-\u001F\u007F]/g, '') // control chars
    .trim()
    .slice(0, 2000);
}

/**
 * Deep sanitize an object — sanitize all string values recursively.
 * Useful for request body sanitization.
 */
function sanitizeObject(obj, maxDepth = 5) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (maxDepth <= 0) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, maxDepth - 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, maxDepth - 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Middleware: Sanitize request body strings to prevent XSS.
 * Apply to routes that accept user input.
 */
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Idempotency middleware:
 * - Read `Idempotency-Key` header
 * - Nếu key đã thấy trong 24h → return cached response
 * - Lưu response sau khi route handler hoàn thành
 *
 * @param {{ adminDb: import('firebase-admin/firestore').Firestore | null }} options
 */
function idempotencyMiddleware({ adminDb }) {
  return async function (req, res, next) {
    const key = req.header('idempotency-key') || req.header('Idempotency-Key');
    if (!key || !adminDb) return next();

    // Hash key + body để bind response với content cụ thể
    const bodyHash = crypto.createHash('sha256').update(JSON.stringify(req.body || {})).digest('hex');
    const docId = crypto.createHash('sha256').update(`${key}:${bodyHash}`).digest('hex').slice(0, 32);

    try {
      const ref = adminDb.collection('processed_webhooks').doc(`idem_${docId}`);
      const snap = await ref.get();
      if (snap.exists) {
        const cached = snap.data();
        // Cache TTL 24h
        const ageMs = Date.now() - (cached.processedAt?.toMillis?.() || cached.processedAt?.getTime?.() || 0);
        if (ageMs < 24 * 60 * 60 * 1000) {
          return res.status(cached.statusCode || 200).json(cached.body || {});
        }
      }
      // Wrap res.json để cache
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        ref.set({
          eventId: docId,
          eventType: 'idempotency',
          body,
          statusCode: res.statusCode,
          processedAt: new Date()
        }).catch((e) => console.warn('[Idem] persist failed:', e.message));
        return originalJson(body);
      };
      next();
    } catch (err) {
      console.warn('[Idem] middleware error:', err.message);
      next();
    }
  };
}

module.exports = {
  authLimiter,
  checkoutHardLimiter,
  publicReadLimiter,
  reviewLimiter,
  sanitizeText,
  sanitizeObject,
  sanitizeBody,
  idempotencyMiddleware
};
