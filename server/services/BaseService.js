/**
 * BaseService - Abstract base class for all service layer operations
 * Provides common CRUD operations and error handling
 */

const { getClient } = require('../db/postgres');

// Simple logger wrapper
const logger = {
  info: (message, meta) => console.log(`[INFO] ${message}`, meta || ''),
  warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
  error: (message, meta) => console.error(`[ERROR] ${message}`, meta || '')
};

class BaseService {
  constructor(tableName) {
    this.tableName = tableName;
  }

  /**
   * Execute a query with automatic error handling and logging
   */
  async query(sql, params = [], context = {}) {
    const startTime = Date.now();
    
    try {
      const { query } = require('../db/postgres');
      const result = await query(sql, params);
      
      const duration = Date.now() - startTime;
      
      // Log slow queries (> 100ms)
      if (duration > 100) {
        logger.warn('Slow query detected', {
          service: this.constructor.name,
          table: this.tableName,
          duration,
          sql: sql.substring(0, 200),
          ...context
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Database query failed', {
        service: this.constructor.name,
        table: this.tableName,
        duration,
        error: error.message,
        sql: sql.substring(0, 200),
        ...context
      });
      
      throw this.handleDatabaseError(error);
    }
  }

  /**
   * Execute a transaction with automatic rollback on error
   */
  async transaction(callback) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction rolled back', {
        service: this.constructor.name,
        table: this.tableName,
        error: error.message
      });
      throw this.handleDatabaseError(error);
    } finally {
      client.release();
    }
  }

  /**
   * Find a single record by ID
   */
  async findById(id, columns = '*') {
    const sql = `SELECT ${columns} FROM ${this.tableName} WHERE id = $1`;
    const result = await this.query(sql, [id], { operation: 'findById', id });
    return result.rows[0] || null;
  }

  /**
   * Find multiple records with filters
   */
  async find(filters = {}, options = {}) {
    const { limit = 50, offset = 0, orderBy = 'created_at', order = 'DESC' } = options;
    
    const whereConditions = [];
    const params = [];
    let paramIndex = 1;
    
    // Build WHERE clause
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        whereConditions.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    const sql = `
      SELECT * FROM ${this.tableName}
      ${whereClause}
      ORDER BY ${orderBy} ${order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    
    const result = await this.query(sql, params, { operation: 'find', filters });
    return result.rows;
  }

  /**
   * Count records with filters
   */
  async count(filters = {}) {
    const whereConditions = [];
    const params = [];
    let paramIndex = 1;
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        whereConditions.push(`${key} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';
    
    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;
    const result = await this.query(sql, params, { operation: 'count', filters });
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Create a new record
   */
  async create(data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const sql = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.query(sql, values, { operation: 'create' });
    
    logger.info('Record created', {
      service: this.constructor.name,
      table: this.tableName,
      id: result.rows[0].id
    });
    
    return result.rows[0];
  }

  /**
   * Update a record by ID
   */
  async update(id, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, i) => `${col} = $${i + 2}`).join(', ');
    
    const sql = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.query(sql, [id, ...values], { operation: 'update', id });
    
    if (result.rows.length === 0) {
      throw new NotFoundError(`${this.tableName} with id ${id} not found`);
    }
    
    logger.info('Record updated', {
      service: this.constructor.name,
      table: this.tableName,
      id
    });
    
    return result.rows[0];
  }

  /**
   * Delete a record by ID
   */
  async delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
    const result = await this.query(sql, [id], { operation: 'delete', id });
    
    if (result.rows.length === 0) {
      throw new NotFoundError(`${this.tableName} with id ${id} not found`);
    }
    
    logger.info('Record deleted', {
      service: this.constructor.name,
      table: this.tableName,
      id
    });
    
    return result.rows[0];
  }

  /**
   * Soft delete (set is_active = false)
   */
  async softDelete(id) {
    return this.update(id, { is_active: false });
  }

  /**
   * Handle database errors and convert to application errors
   */
  handleDatabaseError(error) {
    // PostgreSQL error codes
    const errorCode = error.code;
    
    switch (errorCode) {
      case '23505': // unique_violation
        return new ValidationError('Duplicate entry: ' + error.detail);
      
      case '23503': // foreign_key_violation
        return new ValidationError('Referenced record does not exist: ' + error.detail);
      
      case '23502': // not_null_violation
        return new ValidationError('Required field missing: ' + error.column);
      
      case '23514': // check_violation
        return new ValidationError('Constraint violation: ' + error.detail);
      
      case '22P02': // invalid_text_representation
        return new ValidationError('Invalid data format: ' + error.message);
      
      default:
        return new DatabaseError(error.message, errorCode);
    }
  }
}

// Custom error classes
class DatabaseError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.statusCode = 500;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

module.exports = {
  BaseService,
  DatabaseError,
  ValidationError,
  NotFoundError
};
