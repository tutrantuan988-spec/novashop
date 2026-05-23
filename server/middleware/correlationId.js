/**
 * Correlation ID Middleware
 * 
 * Adds a unique correlation ID to each request for tracking and debugging.
 * The correlation ID is included in all logs and error responses.
 * 
 * @module server/middleware/correlationId
 */

const crypto = require('crypto');

/**
 * Generate a unique correlation ID
 * @returns {string} Correlation ID
 */
function generateCorrelationId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Middleware: Add correlation ID to request
 * Checks for existing correlation ID in headers, otherwise generates new one
 */
function correlationId(req, res, next) {
  // Check if correlation ID already exists in headers
  const existingId = req.header('x-correlation-id') || req.header('x-request-id');
  
  // Use existing or generate new
  req.correlationId = existingId || generateCorrelationId();
  
  // Add to response headers for client tracking
  res.setHeader('x-correlation-id', req.correlationId);
  
  // Add to request object for logging
  req.id = req.correlationId;
  
  next();
}

module.exports = {
  correlationId,
  generateCorrelationId
};
