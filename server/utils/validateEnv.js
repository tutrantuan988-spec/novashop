/**
 * Environment Variable Validation
 * 
 * Validates all required environment variables on server startup.
 * Fails fast with clear error messages if configuration is invalid.
 * 
 * @module server/utils/validateEnv
 */

const logger = require('./logger');

/**
 * Environment variable schema
 * Defines all environment variables, their types, requirements, and validation rules
 */
const ENV_SCHEMA = {
  // Server configuration
  NODE_ENV: {
    type: 'string',
    required: false,
    default: 'development',
    enum: ['development', 'production', 'test', 'staging'],
    description: 'Node environment'
  },
  PORT: {
    type: 'number',
    required: false,
    default: 3001,
    min: 1,
    max: 65535,
    description: 'Server port'
  },
  CLIENT_URL: {
    type: 'url',
    required: true,
    description: 'Frontend URL for CORS and redirects'
  },
  
  // Security
  JWT_SECRET: {
    type: 'string',
    required: true,
    minLength: 32,
    description: 'JWT signing secret (min 32 characters)',
    sensitive: true
  },
  JWT_EXPIRES_IN: {
    type: 'string',
    required: false,
    default: '7d',
    pattern: /^\d+[smhd]$/,
    description: 'JWT expiration time (e.g., 7d, 24h)'
  },
  ADMIN_API_TOKEN: {
    type: 'string',
    required: false, // Optional during migration
    minLength: 32,
    description: 'Legacy admin API token',
    sensitive: true,
    deprecated: true
  },
  ADMIN_EMAILS: {
    type: 'string',
    required: false,
    default: 'admin@example.com',
    description: 'Comma-separated list of admin emails'
  },
  
  // Database - Firebase
  FIREBASE_PROJECT_ID: {
    type: 'string',
    required: false, // Optional if using other DB
    description: 'Firebase project ID'
  },
  FIREBASE_SERVICE_ACCOUNT_FILE: {
    type: 'string',
    required: false,
    description: 'Path to Firebase service account JSON file'
  },
  FIREBASE_SERVICE_ACCOUNT_JSON: {
    type: 'json',
    required: false,
    description: 'Firebase service account JSON (inline)',
    sensitive: true
  },
  
  // Database - MongoDB
  MONGODB_URI: {
    type: 'string',
    required: false,
    description: 'MongoDB connection string',
    sensitive: true
  },
  
  // Database - PostgreSQL
  DATABASE_URL: {
    type: 'string',
    required: false,
    description: 'PostgreSQL connection string',
    sensitive: true
  },
  
  // Redis
  REDIS_URL: {
    type: 'string',
    required: false,
    description: 'Redis connection URL',
    sensitive: true
  },
  REDIS_HOST: {
    type: 'string',
    required: false,
    default: 'localhost',
    description: 'Redis host'
  },
  REDIS_PORT: {
    type: 'number',
    required: false,
    default: 6379,
    description: 'Redis port'
  },
  UPSTASH_REDIS_REST_URL: {
    type: 'url',
    required: false,
    description: 'Upstash Redis REST URL'
  },
  UPSTASH_REDIS_REST_TOKEN: {
    type: 'string',
    required: false,
    description: 'Upstash Redis REST token',
    sensitive: true
  },
  
  // Payment - Stripe
  STRIPE_SECRET_KEY: {
    type: 'string',
    required: false,
    pattern: /^sk_(test|live)_/,
    description: 'Stripe secret key',
    sensitive: true
  },
  STRIPE_WEBHOOK_SECRET: {
    type: 'string',
    required: false,
    pattern: /^whsec_/,
    description: 'Stripe webhook secret',
    sensitive: true
  },
  VITE_STRIPE_PUBLISHABLE_KEY: {
    type: 'string',
    required: false,
    pattern: /^pk_(test|live)_/,
    description: 'Stripe publishable key (for frontend)'
  },
  
  // Payment - MoMo
  MOMO_PARTNER_CODE: {
    type: 'string',
    required: false,
    description: 'MoMo partner code',
    sensitive: true
  },
  MOMO_ACCESS_KEY: {
    type: 'string',
    required: false,
    description: 'MoMo access key',
    sensitive: true
  },
  MOMO_SECRET_KEY: {
    type: 'string',
    required: false,
    description: 'MoMo secret key',
    sensitive: true
  },
  
  // Payment - VNPay
  VNP_TMN_CODE: {
    type: 'string',
    required: false,
    description: 'VNPay terminal code',
    sensitive: true
  },
  VNP_HASH_SECRET: {
    type: 'string',
    required: false,
    description: 'VNPay hash secret',
    sensitive: true
  },
  
  // Email
  RESEND_API_KEY: {
    type: 'string',
    required: false,
    pattern: /^re_/,
    description: 'Resend API key',
    sensitive: true
  },
  EMAIL_FROM: {
    type: 'email',
    required: false,
    description: 'From email address'
  },
  ADMIN_NOTIFICATION_EMAIL: {
    type: 'email',
    required: false,
    description: 'Admin notification email'
  },
  
  // File Upload
  CLOUDINARY_CLOUD_NAME: {
    type: 'string',
    required: false,
    description: 'Cloudinary cloud name'
  },
  CLOUDINARY_API_KEY: {
    type: 'string',
    required: false,
    description: 'Cloudinary API key',
    sensitive: true
  },
  CLOUDINARY_API_SECRET: {
    type: 'string',
    required: false,
    description: 'Cloudinary API secret',
    sensitive: true
  },
  
  // Search
  ALGOLIA_APP_ID: {
    type: 'string',
    required: false,
    description: 'Algolia application ID'
  },
  ALGOLIA_ADMIN_API_KEY: {
    type: 'string',
    required: false,
    description: 'Algolia admin API key',
    sensitive: true
  },
  VITE_ALGOLIA_SEARCH_KEY: {
    type: 'string',
    required: false,
    description: 'Algolia search-only API key (for frontend)'
  },
  
  // AI/RAG
  OPENAI_API_KEY: {
    type: 'string',
    required: false,
    pattern: /^sk-/,
    description: 'OpenAI API key',
    sensitive: true
  },
  PINECONE_API_KEY: {
    type: 'string',
    required: false,
    description: 'Pinecone API key',
    sensitive: true
  },
  
  // Monitoring
  SENTRY_DSN: {
    type: 'url',
    required: false,
    description: 'Sentry DSN for error tracking'
  },
  VITE_SENTRY_DSN: {
    type: 'url',
    required: false,
    description: 'Sentry DSN for frontend'
  },
  
  // Shipping
  GHN_API_TOKEN: {
    type: 'string',
    required: false,
    description: 'GHN (Giao Hàng Nhanh) API token',
    sensitive: true
  },
  GHN_SHOP_ID: {
    type: 'string',
    required: false,
    description: 'GHN shop ID'
  },
  
  // Authentication
  VITE_CLERK_PUBLISHABLE_KEY: {
    type: 'string',
    required: false,
    pattern: /^pk_(test|live)_/,
    description: 'Clerk publishable key (for frontend)'
  }
};

/**
 * Validation error class
 */
class ValidationError extends Error {
  constructor(errors) {
    super('Environment variable validation failed');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Validate a single environment variable
 * @param {string} key - Variable name
 * @param {string} value - Variable value
 * @param {object} schema - Variable schema
 * @returns {object} { valid: boolean, error: string|null, value: any }
 */
function validateVariable(key, value, schema) {
  // Check if required
  if (schema.required && !value) {
    return {
      valid: false,
      error: `${key} is required but not set`,
      value: null
    };
  }
  
  // Use default if not set
  if (!value && schema.default !== undefined) {
    return {
      valid: true,
      error: null,
      value: schema.default
    };
  }
  
  // Skip validation if not set and not required
  if (!value) {
    return { valid: true, error: null, value: null };
  }
  
  // Type validation
  switch (schema.type) {
    case 'string':
      if (typeof value !== 'string') {
        return {
          valid: false,
          error: `${key} must be a string`,
          value: null
        };
      }
      
      // Min length
      if (schema.minLength && value.length < schema.minLength) {
        return {
          valid: false,
          error: `${key} must be at least ${schema.minLength} characters`,
          value: null
        };
      }
      
      // Max length
      if (schema.maxLength && value.length > schema.maxLength) {
        return {
          valid: false,
          error: `${key} must be at most ${schema.maxLength} characters`,
          value: null
        };
      }
      
      // Pattern
      if (schema.pattern && !schema.pattern.test(value)) {
        return {
          valid: false,
          error: `${key} format is invalid`,
          value: null
        };
      }
      
      // Enum
      if (schema.enum && !schema.enum.includes(value)) {
        return {
          valid: false,
          error: `${key} must be one of: ${schema.enum.join(', ')}`,
          value: null
        };
      }
      
      return { valid: true, error: null, value };
    
    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        return {
          valid: false,
          error: `${key} must be a number`,
          value: null
        };
      }
      
      // Min/max
      if (schema.min !== undefined && num < schema.min) {
        return {
          valid: false,
          error: `${key} must be at least ${schema.min}`,
          value: null
        };
      }
      
      if (schema.max !== undefined && num > schema.max) {
        return {
          valid: false,
          error: `${key} must be at most ${schema.max}`,
          value: null
        };
      }
      
      return { valid: true, error: null, value: num };
    
    case 'boolean':
      const bool = ['true', '1', 'yes'].includes(value.toLowerCase());
      return { valid: true, error: null, value: bool };
    
    case 'url':
      try {
        new URL(value);
        return { valid: true, error: null, value };
      } catch {
        return {
          valid: false,
          error: `${key} must be a valid URL`,
          value: null
        };
      }
    
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return {
          valid: false,
          error: `${key} must be a valid email`,
          value: null
        };
      }
      return { valid: true, error: null, value };
    
    case 'json':
      try {
        const parsed = JSON.parse(value);
        return { valid: true, error: null, value: parsed };
      } catch {
        return {
          valid: false,
          error: `${key} must be valid JSON`,
          value: null
        };
      }
    
    default:
      return { valid: true, error: null, value };
  }
}

/**
 * Validate all environment variables
 * @param {object} env - Environment variables (process.env)
 * @param {object} options
 * @param {boolean} options.strict - Fail on warnings
 * @param {boolean} options.logSensitive - Log sensitive values (NEVER in production)
 * @returns {object} { valid: boolean, errors: array, warnings: array, config: object }
 */
function validateEnv(env = process.env, options = {}) {
  const { strict = false, logSensitive = false } = options;
  const errors = [];
  const warnings = [];
  const config = {};
  
  // Validate each variable in schema
  for (const [key, schema] of Object.entries(ENV_SCHEMA)) {
    const result = validateVariable(key, env[key], schema);
    
    if (!result.valid) {
      errors.push({
        key,
        error: result.error,
        description: schema.description
      });
    } else {
      config[key] = result.value;
      
      // Warn about deprecated variables
      if (schema.deprecated && result.value) {
        warnings.push({
          key,
          warning: `${key} is deprecated and will be removed in a future version`,
          description: schema.description
        });
      }
    }
  }
  
  // Production-specific validations
  if (env.NODE_ENV === 'production') {
    // JWT_SECRET must not be default
    if (config.JWT_SECRET === 'dev-secret-change-in-production') {
      errors.push({
        key: 'JWT_SECRET',
        error: 'JWT_SECRET must be changed in production',
        description: 'Using default secret is a critical security risk'
      });
    }
    
    // Warn if using test keys in production
    if (config.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
      warnings.push({
        key: 'STRIPE_SECRET_KEY',
        warning: 'Using Stripe test key in production',
        description: 'Switch to live key for production'
      });
    }
    
    if (config.VITE_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_')) {
      warnings.push({
        key: 'VITE_CLERK_PUBLISHABLE_KEY',
        warning: 'Using Clerk test key in production',
        description: 'Switch to live key for production'
      });
    }
  }
  
  const valid = errors.length === 0 && (!strict || warnings.length === 0);
  
  return {
    valid,
    errors,
    warnings,
    config
  };
}

/**
 * Validate and log results
 * @param {object} env 
 * @param {object} options 
 * @returns {object} Validated config
 * @throws {ValidationError} If validation fails
 */
function validateAndLog(env = process.env, options = {}) {
  const result = validateEnv(env, options);
  
  // Log errors
  if (result.errors.length > 0) {
    logger.error('❌ Environment variable validation failed:');
    for (const error of result.errors) {
      logger.error(`  - ${error.key}: ${error.error}`);
      if (error.description) {
        logger.error(`    ${error.description}`);
      }
    }
    throw new ValidationError(result.errors);
  }
  
  // Log warnings
  if (result.warnings.length > 0) {
    logger.warn('⚠️  Environment variable warnings:');
    for (const warning of result.warnings) {
      logger.warn(`  - ${warning.key}: ${warning.warning}`);
    }
  }
  
  // Log success
  logger.info('✅ Environment variables validated successfully');
  
  // Log configuration summary (hide sensitive values)
  const summary = {};
  for (const [key, value] of Object.entries(result.config)) {
    const schema = ENV_SCHEMA[key];
    if (value !== null && value !== undefined) {
      summary[key] = schema?.sensitive && !options.logSensitive 
        ? '***REDACTED***' 
        : value;
    }
  }
  
  logger.debug('Configuration:', summary);
  
  return result.config;
}

/**
 * Get environment variable with validation
 * @param {string} key 
 * @param {any} defaultValue 
 * @returns {any}
 */
function getEnv(key, defaultValue = undefined) {
  const schema = ENV_SCHEMA[key];
  const value = process.env[key];
  
  if (!schema) {
    return value || defaultValue;
  }
  
  const result = validateVariable(key, value, schema);
  
  if (!result.valid) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(result.error);
  }
  
  return result.value !== null ? result.value : defaultValue;
}

module.exports = {
  ENV_SCHEMA,
  validateEnv,
  validateAndLog,
  getEnv,
  ValidationError
};
