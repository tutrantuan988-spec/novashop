/**
 * Reusable Audit Logging Middleware
 * 
 * Provides pre-configured audit logging for common operations
 * 
 * @module server/middleware/auditMiddleware
 */

const { auditLog, AUDIT_EVENTS } = require('./auditLog');

/**
 * Audit middleware for product operations
 */
const auditProductCreate = auditLog({
  event: AUDIT_EVENTS.PRODUCT_CREATE,
  resource: 'product',
  getResourceId: (req) => req.body.product?.id || 'new',
  getChanges: (req) => ({ after: req.body.product })
});

const auditProductUpdate = auditLog({
  event: AUDIT_EVENTS.PRODUCT_UPDATE,
  resource: 'product',
  getResourceId: (req) => req.params.id || req.params.productId,
  getChanges: (req) => ({ after: req.body.product || req.body.patch })
});

const auditProductDelete = auditLog({
  event: AUDIT_EVENTS.PRODUCT_DELETE,
  resource: 'product',
  getResourceId: (req) => req.params.id || req.params.productId
});

/**
 * Audit middleware for order operations
 */
const auditOrderCreate = auditLog({
  event: AUDIT_EVENTS.ORDER_CREATE,
  resource: 'order',
  getResourceId: (req, data) => data.id || 'new',
  getChanges: (req) => ({ after: req.body.order })
});

const auditOrderUpdate = auditLog({
  event: AUDIT_EVENTS.ORDER_UPDATE,
  resource: 'order',
  getResourceId: (req) => req.params.id,
  getChanges: (req) => ({ after: req.body })
});

const auditOrderStatusChange = auditLog({
  event: AUDIT_EVENTS.ORDER_STATUS_CHANGE,
  resource: 'order',
  getResourceId: (req) => req.params.id,
  getChanges: (req) => ({ status: req.body.status })
});

const auditOrderCancel = auditLog({
  event: AUDIT_EVENTS.ORDER_CANCEL,
  resource: 'order',
  getResourceId: (req) => req.params.id
});

const auditOrderRefund = auditLog({
  event: AUDIT_EVENTS.ORDER_REFUND,
  resource: 'order',
  getResourceId: (req) => req.params.id,
  getChanges: (req) => ({ refundAmount: req.body.refundAmount })
});

/**
 * Audit middleware for coupon operations
 */
const auditCouponCreate = auditLog({
  event: AUDIT_EVENTS.COUPON_CREATE,
  resource: 'coupon',
  getResourceId: (req) => req.body.coupon?.code,
  getChanges: (req) => ({ after: req.body.coupon })
});

const auditCouponUpdate = auditLog({
  event: AUDIT_EVENTS.COUPON_UPDATE,
  resource: 'coupon',
  getResourceId: (req) => req.params.code,
  getChanges: (req) => ({ after: req.body.patch })
});

const auditCouponDelete = auditLog({
  event: AUDIT_EVENTS.COUPON_DELETE,
  resource: 'coupon',
  getResourceId: (req) => req.params.code
});

const auditCouponUse = auditLog({
  event: AUDIT_EVENTS.COUPON_USE,
  resource: 'coupon',
  getResourceId: (req) => req.body.code
});

/**
 * Audit middleware for settings operations
 */
const auditSettingsUpdate = auditLog({
  event: AUDIT_EVENTS.SETTINGS_UPDATE,
  resource: 'settings',
  getResourceId: (req) => req.params.key || 'general',
  getChanges: (req) => ({ after: req.body })
});

module.exports = {
  // Product audits
  auditProductCreate,
  auditProductUpdate,
  auditProductDelete,
  
  // Order audits
  auditOrderCreate,
  auditOrderUpdate,
  auditOrderStatusChange,
  auditOrderCancel,
  auditOrderRefund,
  
  // Coupon audits
  auditCouponCreate,
  auditCouponUpdate,
  auditCouponDelete,
  auditCouponUse,
  
  // Settings audits
  auditSettingsUpdate
};
