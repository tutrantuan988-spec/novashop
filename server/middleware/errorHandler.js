/**
 * Global Error Handler Middleware
 * 
 * Provides standardized error handling across the application.
 * Prevents internal error details from leaking to clients.
 * 
 * @module server/middleware/errorHandler
 */

const logger = require('../utils/logger');

/**
 * Custom error classes
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTH_REQUIRED');
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Determine if error should be logged as error or warning
 * @param {Error} err 
 * @returns {boolean}
 */
function shouldLogAsError(err) {
  // Client errors (4xx) are warnings, server errors (5xx) are errors
  if (err.statusCode) {
    return err.statusCode >= 500;
  }
  return true;
}

/**
 * Format error for logging
 * @param {Error} err 
 * @param {object} req 
 * @returns {object}
 */
function formatErrorForLogging(err, req) {
  return {
    message: err.message,
    name: err.name,
    code: err.code,
    statusCode: err.statusCode,
    stack: err.stack,
    correlationId: req.correlationId || req.id,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body ? Object.keys(req.body) : [],
    user: req.user ? {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role
    } : null,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent')
  };
}

/**
 * Format error for client response
 * @param {Error} err 
 * @param {object} req 
 * @param {boolean} isDevelopment 
 * @returns {object}
 */
function formatErrorForClient(err, req, isDevelopment = false) {
  const response = {
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    correlationId: req.correlationId || req.id
  };

  // Add details for operational errors
  if (err.isOperational && err.details) {
    response.details = err.details;
  }

  // Add stack trace in development
  if (isDevelopment && err.stack) {
    response.stack = err.stack;
  }

  return response;
}

/**
 * Global error handler middleware
 * Must be registered AFTER all routes
 */
function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Determine status code
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Log error
  const logData = formatErrorForLogging(err, req);
  if (shouldLogAsError(err)) {
    logger.error('Request error:', logData);
  } else {
    logger.warn('Request warning:', logData);
  }

  // Send error response
  const clientError = formatErrorForClient(err, req, isDevelopment);
  res.status(statusCode).json(clientError);
}

/**
 * 404 Not Found handler
 * Must be registered AFTER all routes but BEFORE error handler
 */
function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`Route not found: ${req.method} ${req.path}`);
  next(error);
}

/**
 * Async route wrapper
 * Catches async errors and passes them to error handler
 * 
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware
 */
function asyncHandler(fn) {
  return function(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Wrap all route handlers in an object with asyncHandler
 * @param {object} handlers - Object with route handlers
 * @returns {object} Wrapped handlers
 */
function wrapHandlers(handlers) {
  const wrapped = {};
  for (const [key, handler] of Object.entries(handlers)) {
    if (typeof handler === 'function') {
      wrapped[key] = asyncHandler(handler);
    } else {
      wrapped[key] = handler;
    }
  }
  return wrapped;
}

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  
  // Middleware
  errorHandler,
  notFoundHandler,
  asyncHandler,
  wrapHandlers
};
