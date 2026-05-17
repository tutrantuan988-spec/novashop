/**
 * Input Sanitization Middleware
 * 
 * Provides comprehensive input sanitization to prevent XSS, SQL injection,
 * and other injection attacks. Uses DOMPurify for HTML sanitization.
 * 
 * @module server/middleware/sanitize
 */

const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

// Create DOMPurify instance for server-side use
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitize HTML content - removes dangerous tags and attributes
 * @param {string} dirty - Potentially unsafe HTML
 * @param {object} options - DOMPurify options
 * @returns {string} Clean HTML
 */
function sanitizeHtml(dirty, options = {}) {
  if (typeof dirty !== 'string') return '';
  
  const defaultOptions = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false,
    ...options
  };
  
  return DOMPurify.sanitize(dirty, defaultOptions);
}

/**
 * Sanitize plain text - strips all HTML tags
 * @param {string} input - Input string
 * @returns {string} Plain text
 */
function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
    .replace(/[\u0000-\u001F\u007F]/g, '') // Remove control characters
    .trim()
    .slice(0, 2000); // Limit length
}

/**
 * Sanitize email address
 * @param {string} email 
 * @returns {string|null} Valid email or null
 */
function sanitizeEmail(email) {
  if (typeof email !== 'string') return null;
  
  const cleaned = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(cleaned) ? cleaned : null;
}

/**
 * Sanitize phone number - removes non-numeric characters
 * @param {string} phone 
 * @returns {string} Numeric phone number
 */
function sanitizePhone(phone) {
  if (typeof phone !== 'string') return '';
  
  // Remove all non-numeric characters except + at start
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ensure + only at start
  if (cleaned.includes('+')) {
    cleaned = '+' + cleaned.replace(/\+/g, '');
  }
  
  return cleaned.slice(0, 20); // Limit length
}

/**
 * Sanitize URL - ensures it's a valid HTTP(S) URL
 * @param {string} url 
 * @returns {string|null} Valid URL or null
 */
function sanitizeUrl(url) {
  if (typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize number - ensures it's a valid number within range
 * @param {any} value 
 * @param {object} options 
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @param {number} options.default - Default value if invalid
 * @returns {number}
 */
function sanitizeNumber(value, options = {}) {
  const { min = -Infinity, max = Infinity, default: defaultValue = 0 } = options;
  
  const num = Number(value);
  
  if (isNaN(num)) return defaultValue;
  if (num < min) return min;
  if (num > max) return max;
  
  return num;
}

/**
 * Sanitize integer
 * @param {any} value 
 * @param {object} options 
 * @returns {number}
 */
function sanitizeInteger(value, options = {}) {
  return Math.floor(sanitizeNumber(value, options));
}

/**
 * Sanitize boolean
 * @param {any} value 
 * @returns {boolean}
 */
function sanitizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }
  return Boolean(value);
}

/**
 * Sanitize array - ensures it's an array and sanitizes each element
 * @param {any} value 
 * @param {Function} itemSanitizer - Function to sanitize each item
 * @param {object} options 
 * @param {number} options.maxLength - Maximum array length
 * @returns {Array}
 */
function sanitizeArray(value, itemSanitizer = (x) => x, options = {}) {
  const { maxLength = 100 } = options;
  
  if (!Array.isArray(value)) return [];
  
  return value
    .slice(0, maxLength)
    .map(itemSanitizer)
    .filter(item => item !== null && item !== undefined);
}

/**
 * Sanitize object - removes dangerous keys and sanitizes values
 * @param {any} value 
 * @param {object} schema - Schema defining allowed keys and their sanitizers
 * @returns {object}
 */
function sanitizeObject(value, schema = {}) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  
  const sanitized = {};
  
  for (const [key, sanitizer] of Object.entries(schema)) {
    if (key in value) {
      sanitized[key] = typeof sanitizer === 'function' 
        ? sanitizer(value[key])
        : value[key];
    }
  }
  
  return sanitized;
}

/**
 * Middleware: Sanitize request body
 * @param {object} schema - Schema defining how to sanitize each field
 * @returns {Function} Express middleware
 */
function sanitizeBody(schema) {
  return function(req, res, next) {
    if (!req.body || typeof req.body !== 'object') {
      req.body = {};
      return next();
    }
    
    req.body = sanitizeObject(req.body, schema);
    next();
  };
}

/**
 * Middleware: Sanitize query parameters
 * @param {object} schema - Schema defining how to sanitize each parameter
 * @returns {Function} Express middleware
 */
function sanitizeQuery(schema) {
  return function(req, res, next) {
    if (!req.query || typeof req.query !== 'object') {
      req.query = {};
      return next();
    }
    
    req.query = sanitizeObject(req.query, schema);
    next();
  };
}

/**
 * Middleware: Sanitize all text fields in request body
 * Automatically sanitizes common text fields
 */
function autoSanitizeText(req, res, next) {
  if (!req.body || typeof req.body !== 'object') {
    return next();
  }
  
  const textFields = ['name', 'title', 'description', 'content', 'note', 'comment'];
  
  for (const field of textFields) {
    if (field in req.body && typeof req.body[field] === 'string') {
      req.body[field] = sanitizeText(req.body[field]);
    }
  }
  
  next();
}

/**
 * Prevent prototype pollution
 * @param {object} obj 
 * @returns {object}
 */
function preventPrototypePollution(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const dangerous = ['__proto__', 'constructor', 'prototype'];
  
  for (const key of dangerous) {
    delete obj[key];
  }
  
  // Recursively clean nested objects
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      obj[key] = preventPrototypePollution(obj[key]);
    }
  }
  
  return obj;
}

/**
 * Middleware: Prevent prototype pollution attacks
 */
function prototypePollutionProtection(req, res, next) {
  if (req.body) {
    req.body = preventPrototypePollution(req.body);
  }
  if (req.query) {
    req.query = preventPrototypePollution(req.query);
  }
  if (req.params) {
    req.params = preventPrototypePollution(req.params);
  }
  next();
}

/**
 * Sanitize product data
 * @param {object} product 
 * @returns {object}
 */
function sanitizeProduct(product) {
  return {
    name: sanitizeText(product.name || ''),
    slug: sanitizeText(product.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    description: sanitizeHtml(product.description || '', {
      ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: []
    }),
    price: sanitizeNumber(product.price, { min: 0, max: 1000000000 }),
    oldPrice: sanitizeNumber(product.oldPrice, { min: 0, max: 1000000000 }),
    stock: sanitizeInteger(product.stock, { min: 0, max: 1000000 }),
    category: sanitizeText(product.category || ''),
    brand: sanitizeText(product.brand || ''),
    image: sanitizeUrl(product.image),
    images: sanitizeArray(product.images, sanitizeUrl, { maxLength: 10 }),
    badge: sanitizeText(product.badge || '').slice(0, 20),
    isActive: sanitizeBoolean(product.isActive)
  };
}

/**
 * Sanitize order data
 * @param {object} order 
 * @returns {object}
 */
function sanitizeOrder(order) {
  return {
    customer: {
      name: sanitizeText(order.customer?.name || ''),
      email: sanitizeEmail(order.customer?.email || ''),
      phone: sanitizePhone(order.customer?.phone || ''),
      address: sanitizeText(order.customer?.address || '')
    },
    items: sanitizeArray(order.items, (item) => ({
      id: sanitizeText(item.id || ''),
      name: sanitizeText(item.name || ''),
      quantity: sanitizeInteger(item.quantity, { min: 1, max: 100 }),
      // Note: price validation should be done server-side, not sanitized from client
    }), { maxLength: 50 }),
    paymentMethod: sanitizeText(order.paymentMethod || ''),
    note: sanitizeText(order.note || '').slice(0, 500)
  };
}

/**
 * Sanitize review data
 * @param {object} review 
 * @returns {object}
 */
function sanitizeReview(review) {
  return {
    rating: sanitizeInteger(review.rating, { min: 1, max: 5 }),
    title: sanitizeText(review.title || '').slice(0, 120),
    content: sanitizeText(review.content || '').slice(0, 1000),
    userEmail: sanitizeEmail(review.userEmail || ''),
    userName: sanitizeText(review.userName || '').slice(0, 80)
  };
}

module.exports = {
  // Core sanitizers
  sanitizeHtml,
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
  sanitizeUrl,
  sanitizeNumber,
  sanitizeInteger,
  sanitizeBoolean,
  sanitizeArray,
  sanitizeObject,
  
  // Middleware
  sanitizeBody,
  sanitizeQuery,
  autoSanitizeText,
  prototypePollutionProtection,
  
  // Domain-specific sanitizers
  sanitizeProduct,
  sanitizeOrder,
  sanitizeReview,
  
  // Security
  preventPrototypePollution
};
