/**
 * Authentication & Authorization Middleware
 * 
 * Provides secure JWT-based authentication with backward compatibility
 * for the existing admin token system during migration period.
 * 
 * @module server/middleware/auth
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Check if email is in admin list (legacy method - to be deprecated)
 * @param {string} email 
 * @returns {boolean}
 */
function isAdminEmail(email) {
  const admins = (process.env.ADMIN_EMAILS || 'admin@example.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(String(email || '').toLowerCase());
}

/**
 * Safe constant-time string comparison
 * @param {string} actual 
 * @param {string} expected 
 * @returns {boolean}
 */
function safeTokenEqual(actual, expected) {
  const actualBuffer = Buffer.from(String(actual || ''));
  const expectedBuffer = Buffer.from(String(expected || ''));
  return actualBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

/**
 * Extract Bearer token from Authorization header
 * @param {import('express').Request} req 
 * @returns {string}
 */
function readBearerToken(req) {
  const header = req.header('authorization') || '';
  if (!header.toLowerCase().startsWith('bearer ')) return '';
  return header.slice(7).trim();
}

/**
 * Generate JWT token for authenticated user
 * @param {object} payload - User data to encode
 * @param {string} payload.userId - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role (user, admin, etc.)
 * @param {object} options - JWT options
 * @returns {string} JWT token
 */
function generateToken(payload, options = {}) {
  const expiresIn = options.expiresIn || JWT_EXPIRES_IN;
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify and decode JWT token
 * @param {string} token 
 * @returns {object|null} Decoded payload or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware: Require valid authentication (JWT or legacy token)
 * Supports both new JWT-based auth and legacy admin token during migration
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
function requireAuth(req, res, next) {
  const token = readBearerToken(req);
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // Try JWT authentication first (new method)
  const decoded = verifyToken(token);
  if (decoded) {
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
      authMethod: 'jwt'
    };
    return next();
  }

  // Fallback to legacy admin token (backward compatibility)
  const legacyToken = process.env.ADMIN_API_TOKEN;
  if (legacyToken && safeTokenEqual(token, legacyToken)) {
    const email = req.header('x-admin-email');
    if (isAdminEmail(email)) {
      req.user = {
        userId: email,
        email,
        role: 'admin',
        authMethod: 'legacy'
      };
      console.warn('[Auth] Legacy admin token used - please migrate to JWT');
      return next();
    }
  }

  return res.status(401).json({ 
    error: 'Invalid or expired token',
    code: 'INVALID_TOKEN'
  });
}

/**
 * Middleware: Require admin role
 * Must be used after requireAuth middleware
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
function requireAdmin(req, res, next) {
  // First check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // Check if user has admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      code: 'FORBIDDEN'
    });
  }

  // CRITICAL: In production, JWT_SECRET must be set
  if (IS_PRODUCTION && JWT_SECRET === 'dev-secret-change-in-production') {
    console.error('[SECURITY] JWT_SECRET not configured in production!');
    return res.status(503).json({ 
      error: 'Server configuration error',
      code: 'CONFIG_ERROR'
    });
  }

  next();
}

/**
 * Middleware: Require specific permission
 * Implements permission-based access control (PBAC)
 * 
 * @param {string|string[]} requiredPermissions - Permission(s) required
 * @returns {Function} Express middleware
 */
function requirePermission(requiredPermissions) {
  const permissions = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];

  return function(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has required permissions
    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some(perm => 
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: permissions
      });
    }

    next();
  };
}

/**
 * Middleware: Optional authentication
 * Attaches user to request if authenticated, but doesn't require it
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
function optionalAuth(req, res, next) {
  const token = readBearerToken(req);
  
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role || 'user',
        authMethod: 'jwt'
      };
    }
  }
  
  next();
}

/**
 * Legacy middleware for backward compatibility
 * @deprecated Use requireAuth + requireAdmin instead
 */
function requireAdminLegacy(req, res, next) {
  const email = req.header('x-admin-email');
  if (!isAdminEmail(email)) {
    return res.status(403).json({ error: 'Bạn không có quyền admin' });
  }
  
  const expectedToken = process.env.ADMIN_API_TOKEN;
  if (!expectedToken && IS_PRODUCTION) {
    return res.status(503).json({ 
      error: 'ADMIN_API_TOKEN chưa được cấu hình trên server production' 
    });
  }
  
  if (expectedToken) {
    const token = readBearerToken(req);
    if (!safeTokenEqual(token, expectedToken)) {
      return res.status(403).json({ error: 'Token admin không hợp lệ' });
    }
  }
  
  req.adminEmail = email;
  req.user = { email, role: 'admin', authMethod: 'legacy' };
  next();
}

module.exports = {
  // Core authentication
  requireAuth,
  requireAdmin,
  requirePermission,
  optionalAuth,
  
  // Token management
  generateToken,
  verifyToken,
  
  // Utilities
  isAdminEmail,
  readBearerToken,
  
  // Legacy (deprecated)
  requireAdminLegacy
};
