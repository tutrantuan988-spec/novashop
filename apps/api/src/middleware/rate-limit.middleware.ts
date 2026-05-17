import rateLimit from 'express-rate-limit';

// Per IP rate limiting
export const ipRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later' },
});

// Per tenant rate limiting
export const tenantRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each tenant to 500 requests per windowMs
  keyGenerator: (req) => {
    // Extract organizationId from request (from JWT token or session)
    const organizationId = (req as any).organizationId || 'anonymous';
    return organizationId;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests for this organization, please try again later' },
});

// Strict rate limiting for sensitive endpoints (auth, payments)
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

// API-specific rate limiting
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit to 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'API rate limit exceeded, please try again later' },
});
