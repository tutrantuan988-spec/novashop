/**
 * Audit Logging Middleware
 * 
 * Tracks all administrative actions and sensitive operations
 * for security, compliance, and debugging purposes.
 * 
 * @module server/middleware/auditLog
 */

const logger = require('../utils/logger');

/**
 * Audit event types
 */
const AUDIT_EVENTS = {
  // Authentication events
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_FAILED: 'auth.failed',
  AUTH_TOKEN_REFRESH: 'auth.token_refresh',
  
  // User management
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_ROLE_CHANGE: 'user.role_change',
  
  // Product management
  PRODUCT_CREATE: 'product.create',
  PRODUCT_UPDATE: 'product.update',
  PRODUCT_DELETE: 'product.delete',
  PRODUCT_STOCK_CHANGE: 'product.stock_change',
  
  // Order management
  ORDER_CREATE: 'order.create',
  ORDER_UPDATE: 'order.update',
  ORDER_STATUS_CHANGE: 'order.status_change',
  ORDER_CANCEL: 'order.cancel',
  ORDER_REFUND: 'order.refund',
  
  // Coupon management
  COUPON_CREATE: 'coupon.create',
  COUPON_UPDATE: 'coupon.update',
  COUPON_DELETE: 'coupon.delete',
  COUPON_USE: 'coupon.use',
  
  // Settings
  SETTINGS_UPDATE: 'settings.update',
  
  // Security events
  SECURITY_PERMISSION_DENIED: 'security.permission_denied',
  SECURITY_RATE_LIMIT: 'security.rate_limit',
  SECURITY_SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
  
  // System events
  SYSTEM_ERROR: 'system.error',
  SYSTEM_CONFIG_CHANGE: 'system.config_change'
};

/**
 * Create audit log entry
 * @param {object} params
 * @param {string} params.event - Event type from AUDIT_EVENTS
 * @param {string} params.userId - User ID performing the action
 * @param {string} params.userEmail - User email
 * @param {string} params.userRole - User role
 * @param {string} params.action - Human-readable action description
 * @param {string} params.resource - Resource type (product, order, user, etc.)
 * @param {string} params.resourceId - Resource ID
 * @param {object} params.changes - Before/after changes
 * @param {object} params.metadata - Additional metadata
 * @param {string} params.ipAddress - Client IP address
 * @param {string} params.userAgent - Client user agent
 * @param {string} params.status - success, failure, error
 * @param {string} params.errorMessage - Error message if failed
 * @returns {object} Audit log entry
 */
function createAuditLog({
  event,
  userId,
  userEmail,
  userRole,
  action,
  resource,
  resourceId,
  changes = null,
  metadata = {},
  ipAddress,
  userAgent,
  status = 'success',
  errorMessage = null
}) {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    user: {
      id: userId,
      email: userEmail,
      role: userRole
    },
    action,
    resource: {
      type: resource,
      id: resourceId
    },
    changes,
    metadata,
    request: {
      ipAddress,
      userAgent
    },
    status,
    errorMessage
  };
  
  return entry;
}

/**
 * Save audit log to database
 * @param {object} adminDb - Firestore instance
 * @param {object} entry - Audit log entry
 */
async function saveAuditLog(adminDb, entry) {
  if (!adminDb) {
    // Fallback to file logging if database unavailable
    logger.info('[AUDIT]', entry);
    return;
  }
  
  try {
    await adminDb.collection('audit_logs').add(entry);
  } catch (error) {
    // Don't fail the request if audit logging fails
    logger.error('[AUDIT] Failed to save audit log:', error.message);
    logger.info('[AUDIT] Entry:', entry);
  }
}

/**
 * Middleware: Audit log for admin actions
 * Automatically logs all admin actions with before/after state
 * 
 * @param {object} options
 * @param {string} options.event - Event type
 * @param {string} options.resource - Resource type
 * @param {Function} options.getResourceId - Function to extract resource ID from request
 * @param {Function} options.getChanges - Function to extract changes from request
 * @returns {Function} Express middleware
 */
function auditLog(options = {}) {
  const {
    event,
    resource,
    getResourceId = (req) => req.params.id,
    getChanges = null
  } = options;
  
  return async function(req, res, next) {
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);
    
    // Capture request start time
    const startTime = Date.now();
    
    // Override res.json to log after response
    res.json = function(data) {
      const duration = Date.now() - startTime;
      
      // Create audit log entry
      const entry = createAuditLog({
        event,
        userId: req.user?.userId || req.user?.email || 'anonymous',
        userEmail: req.user?.email || 'unknown',
        userRole: req.user?.role || 'unknown',
        action: `${req.method} ${req.path}`,
        resource,
        resourceId: getResourceId(req),
        changes: getChanges ? getChanges(req, data) : null,
        metadata: {
          method: req.method,
          path: req.path,
          duration,
          statusCode: res.statusCode
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: res.statusCode < 400 ? 'success' : 'failure',
        errorMessage: res.statusCode >= 400 ? data.error : null
      });
      
      // Save audit log asynchronously (don't block response)
      const adminDb = req.app.locals.adminDb;
      saveAuditLog(adminDb, entry).catch(() => {});
      
      // Send original response
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Middleware: Audit authentication events
 */
function auditAuth(event) {
  return function(req, res, next) {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      const entry = createAuditLog({
        event,
        userId: req.user?.userId || req.body?.email || 'anonymous',
        userEmail: req.user?.email || req.body?.email || 'unknown',
        userRole: req.user?.role || 'unknown',
        action: event,
        resource: 'authentication',
        resourceId: req.user?.userId || req.body?.email,
        metadata: {
          method: req.method,
          path: req.path,
          authMethod: req.user?.authMethod || 'unknown'
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: res.statusCode < 400 ? 'success' : 'failure',
        errorMessage: res.statusCode >= 400 ? data.error : null
      });
      
      const adminDb = req.app.locals.adminDb;
      saveAuditLog(adminDb, entry).catch(() => {});
      
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Middleware: Audit security events (permission denied, rate limit, etc.)
 */
function auditSecurityEvent(event, details = {}) {
  return function(req, res, next) {
    const entry = createAuditLog({
      event,
      userId: req.user?.userId || 'anonymous',
      userEmail: req.user?.email || 'unknown',
      userRole: req.user?.role || 'unknown',
      action: event,
      resource: 'security',
      resourceId: null,
      metadata: {
        ...details,
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body ? Object.keys(req.body) : []
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      status: 'failure'
    });
    
    const adminDb = req.app.locals.adminDb;
    saveAuditLog(adminDb, entry).catch(() => {});
    
    next();
  };
}

/**
 * Get audit logs with filtering
 * @param {object} adminDb - Firestore instance
 * @param {object} filters
 * @param {string} filters.userId - Filter by user ID
 * @param {string} filters.event - Filter by event type
 * @param {string} filters.resource - Filter by resource type
 * @param {Date} filters.startDate - Filter by start date
 * @param {Date} filters.endDate - Filter by end date
 * @param {number} filters.limit - Limit results
 * @returns {Promise<Array>} Audit log entries
 */
async function getAuditLogs(adminDb, filters = {}) {
  if (!adminDb) {
    throw new Error('Database not available');
  }
  
  let query = adminDb.collection('audit_logs');
  
  // Apply filters
  if (filters.userId) {
    query = query.where('user.id', '==', filters.userId);
  }
  
  if (filters.event) {
    query = query.where('event', '==', filters.event);
  }
  
  if (filters.resource) {
    query = query.where('resource.type', '==', filters.resource);
  }
  
  if (filters.startDate) {
    query = query.where('timestamp', '>=', filters.startDate.toISOString());
  }
  
  if (filters.endDate) {
    query = query.where('timestamp', '<=', filters.endDate.toISOString());
  }
  
  // Order by timestamp descending
  query = query.orderBy('timestamp', 'desc');
  
  // Limit results
  const limit = Math.min(filters.limit || 100, 1000);
  query = query.limit(limit);
  
  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get audit log statistics
 * @param {object} adminDb - Firestore instance
 * @param {object} filters
 * @returns {Promise<object>} Statistics
 */
async function getAuditStats(adminDb, filters = {}) {
  const logs = await getAuditLogs(adminDb, { ...filters, limit: 10000 });
  
  const stats = {
    total: logs.length,
    byEvent: {},
    byUser: {},
    byResource: {},
    byStatus: {
      success: 0,
      failure: 0,
      error: 0
    },
    recentActivity: logs.slice(0, 10)
  };
  
  for (const log of logs) {
    // Count by event
    stats.byEvent[log.event] = (stats.byEvent[log.event] || 0) + 1;
    
    // Count by user
    const userKey = log.user.email || log.user.id;
    stats.byUser[userKey] = (stats.byUser[userKey] || 0) + 1;
    
    // Count by resource
    if (log.resource?.type) {
      stats.byResource[log.resource.type] = (stats.byResource[log.resource.type] || 0) + 1;
    }
    
    // Count by status
    if (log.status) {
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
    }
  }
  
  return stats;
}

module.exports = {
  // Constants
  AUDIT_EVENTS,
  
  // Core functions
  createAuditLog,
  saveAuditLog,
  
  // Middleware
  auditLog,
  auditAuth,
  auditSecurityEvent,
  
  // Query functions
  getAuditLogs,
  getAuditStats
};
