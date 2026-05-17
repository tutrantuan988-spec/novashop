/**
 * Enhanced Rate Limiting Middleware
 * 
 * Provides stricter rate limiting for sensitive operations
 * 
 * @module server/middleware/rateLimiters
 */

const rateLimit = require('express-rate-limit');

/**
 * Stricter rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
const authStrictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: { 
    error: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.',
    code: 'RATE_LIMIT_AUTH'
  }
});

/**
 * Stricter rate limiter for admin operations
 * Prevents admin account abuse
 */
const adminStrictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 5, // 5 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'Quá nhiều thao tác admin. Vui lòng thử lại sau 1 phút.',
    code: 'RATE_LIMIT_ADMIN'
  }
});

/**
 * Rate limiter for payment operations
 * Prevents payment fraud attempts
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10, // 10 payment attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'Quá nhiều giao dịch thanh toán. Vui lòng thử lại sau.',
    code: 'RATE_LIMIT_PAYMENT'
  }
});

/**
 * Rate limiter for sensitive data access
 * Prevents data scraping
 */
const sensitiveDataLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
    code: 'RATE_LIMIT_DATA'
  }
});

/**
 * Rate limiter for file uploads
 * Prevents upload abuse
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20, // 20 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'Quá nhiều lần tải ảnh. Vui lòng thử lại sau.',
    code: 'RATE_LIMIT_UPLOAD'
  }
});

/**
 * Rate limiter for contact/support forms
 * Prevents spam
 */
const contactStrictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3, // 3 messages per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau 1 giờ.',
    code: 'RATE_LIMIT_CONTACT'
  }
});

/**
 * Rate limiter for review submissions
 * Prevents review spam
 */
const reviewStrictLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  limit: 5, // 5 reviews per day
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'Bạn đã đánh giá quá nhiều. Vui lòng thử lại sau.',
    code: 'RATE_LIMIT_REVIEW'
  }
});

/**
 * Rate limiter for order tracking
 * Prevents tracking abuse
 */
const trackingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10, // 10 tracking requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    error: 'Quá nhiều yêu cầu tra cứu. Vui lòng thử lại sau.',
    code: 'RATE_LIMIT_TRACKING'
  }
});

module.exports = {
  authStrictLimiter,
  adminStrictLimiter,
  paymentLimiter,
  sensitiveDataLimiter,
  uploadLimiter,
  contactStrictLimiter,
  reviewStrictLimiter,
  trackingLimiter
};
