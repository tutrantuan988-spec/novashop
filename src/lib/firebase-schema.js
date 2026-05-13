/**
 * Firestore schema validators (frontend-side).
 * Dùng để validate data shape trước khi gửi lên server hoặc Firestore client.
 */

/** @typedef {'pending'|'approved'|'rejected'|'completed'} ReturnStatus */
/** @typedef {'sale'|'restock'|'return'|'adjustment'} InventoryLogType */

const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  CART_ITEMS: 'cart_items',
  ORDERS: 'orders',
  ADDRESSES: 'addresses',
  RETURN_REQUESTS: 'return_requests',
  NOTIFICATIONS: 'notifications',
  SHIPPING_TRACKING: 'shipping_tracking',
  COUPONS: 'coupons',
  REVIEWS: 'reviews',
  PROCESSED_WEBHOOKS: 'processed_webhooks'
};

const SUB_COLLECTIONS = {
  VARIANTS: 'variants',
  INVENTORY_LOGS: 'inventory_logs'
};

/** Validate variant document shape. Returns array of errors (empty if valid). */
function validateVariant(variant) {
  const errors = [];
  if (!variant || typeof variant !== 'object') return ['Variant must be an object'];
  if (!variant.sku || typeof variant.sku !== 'string') errors.push('sku is required');
  if (!variant.attributes || typeof variant.attributes !== 'object') errors.push('attributes is required');
  if (typeof variant.price !== 'number' || variant.price < 0) errors.push('price must be a positive number');
  if (typeof variant.stock !== 'number' || variant.stock < 0) errors.push('stock must be a positive number');
  if (variant.status && !['active', 'inactive'].includes(variant.status)) {
    errors.push('status must be active or inactive');
  }
  return errors;
}

/** Validate address document shape. */
function validateAddress(addr) {
  const errors = [];
  if (!addr) return ['Address is required'];
  if (!addr.userId) errors.push('userId is required');
  if (!addr.recipientName) errors.push('recipientName is required');
  if (!addr.phone || !/^0\d{9}$/.test(String(addr.phone).replace(/\s/g, ''))) {
    errors.push('phone is invalid (10 digits starting 0)');
  }
  if (!addr.province) errors.push('province is required');
  if (!addr.district) errors.push('district is required');
  if (!addr.ward) errors.push('ward is required');
  if (!addr.street) errors.push('street is required');
  return errors;
}

/** Validate return request shape. */
function validateReturnRequest(req) {
  const errors = [];
  if (!req) return ['Return request is required'];
  if (!req.orderId) errors.push('orderId is required');
  if (!req.userId) errors.push('userId is required');
  if (!Array.isArray(req.items) || req.items.length === 0) {
    errors.push('items must be a non-empty array');
  } else {
    req.items.forEach((it, i) => {
      if (!it.productId) errors.push(`items[${i}].productId is required`);
      if (typeof it.quantity !== 'number' || it.quantity < 1) errors.push(`items[${i}].quantity must be >= 1`);
      if (!it.reason) errors.push(`items[${i}].reason is required`);
    });
  }
  if (!['return', 'exchange'].includes(req.type)) errors.push('type must be return or exchange');
  return errors;
}

/** Build empty default doc (useful for forms). */
function emptyVariant() {
  return {
    sku: '',
    attributes: {},
    price: 0,
    originalPrice: 0,
    stock: 0,
    images: [],
    status: 'active'
  };
}

function emptyAddress(userId = '') {
  return {
    userId,
    label: 'Nhà',
    recipientName: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    street: '',
    isDefault: false
  };
}

function emptyNotification(userId = '') {
  return {
    userId,
    type: 'order_status',
    title: '',
    body: '',
    isRead: false,
    targetUrl: ''
  };
}

export {
  COLLECTIONS,
  SUB_COLLECTIONS,
  validateVariant,
  validateAddress,
  validateReturnRequest,
  emptyVariant,
  emptyAddress,
  emptyNotification
};
