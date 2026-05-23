/**
 * PostgresAdapter - PostgreSQL operations for dual-write
 * Provides consistent interface matching FirestoreAdapter
 */

const { query, getClient } = require('../db/postgres');

class PostgresAdapter {
  /**
   * Create a product in PostgreSQL
   * @param {Object} productData - Product data
   * @returns {Object} Created product with ID
   */
  async createProduct(productData) {
    try {
      const columns = Object.keys(productData);
      const values = Object.values(productData);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const sql = `
        INSERT INTO products (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('[PostgresAdapter] Create product failed:', error.message);
      throw error;
    }
  }

  /**
   * Get a product from PostgreSQL with related data
   * @param {string} productId - Product UUID
   * @returns {Object} Product with variants and attributes
   */
  async getProduct(productId) {
    try {
      // Get product
      const productSql = `SELECT * FROM products WHERE id = $1`;
      const productResult = await query(productSql, [productId]);
      
      if (productResult.rows.length === 0) {
        return null;
      }
      
      const product = productResult.rows[0];
      
      // Get variants
      const variantsSql = `
        SELECT * FROM product_variants
        WHERE product_id = $1 AND is_active = true
        ORDER BY is_default DESC, created_at ASC
      `;
      const variantsResult = await query(variantsSql, [productId]);
      product.variants = variantsResult.rows;
      
      // Get attributes
      const attrSql = `
        SELECT pa.*, a.name_vi, a.name_en, a.type
        FROM product_attributes pa
        JOIN attributes a ON pa.attribute_id = a.id
        WHERE pa.product_id = $1
      `;
      const attrResult = await query(attrSql, [productId]);
      product.attributes = attrResult.rows;
      
      return product;
    } catch (error) {
      console.error('[PostgresAdapter] Get product failed:', error.message);
      throw error;
    }
  }

  /**
   * Update a product in PostgreSQL
   * @param {string} productId - Product UUID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated product
   */
  async updateProduct(productId, updates) {
    try {
      const columns = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = columns.map((col, i) => `${col} = $${i + 2}`).join(', ');
      
      const sql = `
        UPDATE products
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await query(sql, [productId, ...values]);
      return result.rows[0];
    } catch (error) {
      console.error('[PostgresAdapter] Update product failed:', error.message);
      throw error;
    }
  }

  /**
   * Delete a product from PostgreSQL
   * @param {string} productId - Product UUID
   * @returns {boolean} Success
   */
  async deleteProduct(productId) {
    try {
      const sql = `DELETE FROM products WHERE id = $1`;
      await query(sql, [productId]);
      return true;
    } catch (error) {
      console.error('[PostgresAdapter] Delete product failed:', error.message);
      throw error;
    }
  }

  /**
   * List products from PostgreSQL with cursor-based pagination
   * @param {Object} filters - Query filters
   * @param {Object} pagination - Pagination options
   * @returns {Array} Products
   */
  async listProducts(filters = {}, pagination = {}) {
    try {
      const conditions = [];
      const params = [];
      let paramIndex = 1;
      
      // Build WHERE conditions
      if (filters.category_id) {
        conditions.push(`category_id = $${paramIndex}`);
        params.push(filters.category_id);
        paramIndex++;
      }
      
      if (filters.status) {
        conditions.push(`status = $${paramIndex}`);
        params.push(filters.status);
        paramIndex++;
      }
      
      const whereClause = conditions.length > 0 
        ? `WHERE ${conditions.join(' AND ')}` 
        : '';
      
      // Pagination
      const limit = pagination.limit || 20;
      const offset = pagination.offset || 0;
      
      const sql = `
        SELECT p.*, c.name_vi as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(limit, offset);
      
      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      console.error('[PostgresAdapter] List products failed:', error.message);
      throw error;
    }
  }

  /**
   * Create a category in PostgreSQL
   * @param {Object} categoryData - Category data
   * @returns {Object} Created category with ID
   */
  async createCategory(categoryData) {
    try {
      const columns = Object.keys(categoryData);
      const values = Object.values(categoryData);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const sql = `
        INSERT INTO categories (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *
      `;
      
      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('[PostgresAdapter] Create category failed:', error.message);
      throw error;
    }
  }

  /**
   * Update a category in PostgreSQL
   * @param {string} categoryId - Category UUID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated category
   */
  async updateCategory(categoryId, updates) {
    try {
      const columns = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = columns.map((col, i) => `${col} = $${i + 2}`).join(', ');
      
      const sql = `
        UPDATE categories
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await query(sql, [categoryId, ...values]);
      return result.rows[0];
    } catch (error) {
      console.error('[PostgresAdapter] Update category failed:', error.message);
      throw error;
    }
  }

  /**
   * Delete a category from PostgreSQL
   * @param {string} categoryId - Category UUID
   * @returns {boolean} Success
   */
  async deleteCategory(categoryId) {
    try {
      const sql = `DELETE FROM categories WHERE id = $1`;
      await query(sql, [categoryId]);
      return true;
    } catch (error) {
      console.error('[PostgresAdapter] Delete category failed:', error.message);
      throw error;
    }
  }
}

module.exports = new PostgresAdapter();
