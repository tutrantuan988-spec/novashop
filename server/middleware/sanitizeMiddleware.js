/**
 * Reusable Input Sanitization Middleware
 * 
 * Provides pre-configured sanitization for common operations
 * 
 * @module server/middleware/sanitizeMiddleware
 */

const { sanitizeProduct, sanitizeOrder, sanitizeReview, sanitizeText } = require('./sanitize');

/**
 * Sanitize product data in request body
 */
function sanitizeProductBody(req, res, next) {
  if (req.body && req.body.product) {
    req.body.product = sanitizeProduct(req.body.product);
  }
  next();
}

/**
 * Sanitize order data in request body
 */
function sanitizeOrderBody(req, res, next) {
  if (req.body && req.body.order) {
    req.body.order = sanitizeOrder(req.body.order);
  }
  next();
}

/**
 * Sanitize review data in request body
 */
function sanitizeReviewBody(req, res, next) {
  if (req.body && req.body.review) {
    req.body.review = sanitizeReview(req.body.review);
  }
  next();
}

/**
 * Sanitize contact form data
 */
function sanitizeContactBody(req, res, next) {
  if (req.body) {
    if (req.body.name) req.body.name = sanitizeText(req.body.name).slice(0, 100);
    if (req.body.subject) req.body.subject = sanitizeText(req.body.subject).slice(0, 200);
    if (req.body.message) req.body.message = sanitizeText(req.body.message).slice(0, 2000);
  }
  next();
}

/**
 * Sanitize chat message data
 */
function sanitizeChatBody(req, res, next) {
  if (req.body && req.body.message) {
    req.body.message = sanitizeText(req.body.message).slice(0, 2000);
  }
  if (req.body && Array.isArray(req.body.messages)) {
    req.body.messages = req.body.messages.map(msg => ({
      ...msg,
      content: sanitizeText(msg.content || '').slice(0, 2000)
    }));
  }
  next();
}

/**
 * Sanitize return request data
 */
function sanitizeReturnBody(req, res, next) {
  if (req.body) {
    if (req.body.reason) req.body.reason = sanitizeText(req.body.reason).slice(0, 500);
    if (req.body.description) req.body.description = sanitizeText(req.body.description).slice(0, 1000);
    if (req.body.adminNote) req.body.adminNote = sanitizeText(req.body.adminNote).slice(0, 500);
  }
  next();
}

/**
 * Sanitize address data
 */
function sanitizeAddressBody(req, res, next) {
  if (req.body) {
    if (req.body.name) req.body.name = sanitizeText(req.body.name).slice(0, 100);
    if (req.body.phone) req.body.phone = sanitizeText(req.body.phone).slice(0, 20);
    if (req.body.address) req.body.address = sanitizeText(req.body.address).slice(0, 500);
    if (req.body.note) req.body.note = sanitizeText(req.body.note).slice(0, 200);
  }
  next();
}

module.exports = {
  sanitizeProductBody,
  sanitizeOrderBody,
  sanitizeReviewBody,
  sanitizeContactBody,
  sanitizeChatBody,
  sanitizeReturnBody,
  sanitizeAddressBody
};
