/**
 * CatalogService - Product catalog management
 * Handles product CRUD, search, and listing operations
 */

const { BaseService } = require('./BaseService');

// Simple logger wrapper
const logger = {
  info: (message, meta) => console.log(`[INFO] ${message}`, meta || '')
};

class CatalogService extends BaseService {
  constructor() {
    super('products');
  }

  /**
   * Create a new product with attributes and variants
   * @param {Object} productData - Product information
   * @param {Array} attributes - Product attributes [{attribute_id, value_text, value_number}]
   * @param {Array} variants - Product variants (optional)
   * @returns {Object} Created product with ID
   */
  async createProduct(productData, attributes = [], variants = []) {
    return this.transaction(async (client) => {
      // Insert product
      const productColumns = Object.keys(productData);
      const productValues = Object.values(productData);
      const productPlaceholders = productValues.map((_, i) => `$${i + 1}`).join(', ');
      
      const productSql = `
        INSERT INTO products (${productColumns.join(', ')})
        VALUES (${productPlaceholders})
        RETURNING *
      `;
      
      const productResult = await client.query(productSql, productValues);
      const product = productResult.rows[0];
      
      // Insert product attributes
      if (attributes.length > 0) {
        for (const attr of attributes) {
          await client.query(
            `INSERT INTO product_attributes (product_id, attribute_id, value_text, value_number, value_date)
             VALUES ($1, $2, $3, $4, $5)`,
            [product.id, attr.attribute_id, attr.value_text, attr.value_number, attr.value_date]
          );
        }
      }
      
      // Insert variants if provided
      if (variants.length > 0) {
        for (const variant of variants) {
          const variantColumns = Object.keys(variant);
          const variantValues = Object.values(variant);
          const variantPlaceholders = variantValues.map((_, i) => `$${i + 2}`).join(', ');
          
          await client.query(
            `INSERT INTO product_variants (product_id, ${variantColumns.join(', ')})
             VALUES ($1, ${variantPlaceholders})`,
            [product.id, ...variantValues]
          );
        }
      }
      
      logger.info('Product created', {
        service: 'CatalogService',
        productId: product.id,
        sku: product.sku,
        attributeCount: attributes.length,
        variantCount: variants.length
      });
      
      return product;
    });
  }

  /**
   * Get product by ID with optional related data
   * @param {string} productId - Product UUID
   * @param {Object} options - { includeAttributes, includeVariants, includeCategory }
   * @returns {Object} Product with related data
   */
  async getProduct(productId, options = {}) {
    const {
      includeAttributes = false,
      includeVariants = false,
      includeCategory = false
    } = options;
    
    // Get product
    const product = await this.findById(productId);
    
    if (!product) {
      return null;
    }
    
    // Include attributes
    if (includeAttributes) {
      const attrResult = await this.query(
        `SELECT pa.*, a.name_vi, a.name_en, a.type, a.unit_vi
         FROM product_attributes pa
         JOIN attributes a ON pa.attribute_id = a.id
         WHERE pa.product_id = $1
         ORDER BY a.display_order`,
        [productId]
      );
      product.attributes = attrResult.rows;
    }
    
    // Include variants
    if (includeVariants) {
      const variantResult = await this.query(
        `SELECT * FROM product_variants
         WHERE product_id = $1 AND is_active = true
         ORDER BY is_default DESC, created_at ASC`,
        [productId]
      );
      product.variants = variantResult.rows;
    }
    
    // Include category
    if (includeCategory) {
      const categoryResult = await this.query(
        `SELECT * FROM categories WHERE id = $1`,
        [product.category_id]
      );
      product.category = categoryResult.rows[0] || null;
    }
    
    return product;
  }

  /**
   * List products with filters and pagination
   * @param {Object} filters - { category_id, status, is_featured, min_price, max_price }
   * @param {Object} pagination - { page, limit, orderBy, order }
   * @returns {Object} { products, total, page, totalPages }
   */
  async listProducts(filters = {}, pagination = {}) {
    const {
      category_id,
      status = 'active',
      is_featured,
      min_price,
      max_price,
      search
    } = filters;
    
    const {
      page = 1,
      limit = 20,
      orderBy = 'created_at',
      order = 'DESC'
    } = pagination;
    
    const offset = (page - 1) * limit;
    
    // Build WHERE conditions
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    if (category_id) {
      conditions.push(`category_id = $${paramIndex}`);
      params.push(category_id);
      paramIndex++;
    }
    
    if (status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    
    if (is_featured !== undefined) {
      conditions.push(`is_featured = $${paramIndex}`);
      params.push(is_featured);
      paramIndex++;
    }
    
    if (min_price) {
      conditions.push(`base_price >= $${paramIndex}`);
      params.push(min_price);
      paramIndex++;
    }
    
    if (max_price) {
      conditions.push(`base_price <= $${paramIndex}`);
      params.push(max_price);
      paramIndex++;
    }
    
    if (search) {
      conditions.push(`(
        to_tsvector('vietnamese', name_vi || ' ' || COALESCE(description_vi, '')) @@ plainto_tsquery('vietnamese', $${paramIndex})
        OR name_vi ILIKE $${paramIndex + 1}
      )`);
      params.push(search, `%${search}%`);
      paramIndex += 2;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM products ${whereClause}`;
    const countResult = await this.query(countSql, params);
    const total = parseInt(countResult.rows[0].count, 10);
    
    // Get products
    const productsSql = `
      SELECT p.*, c.name_vi as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY ${orderBy} ${order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const productsResult = await this.query(productsSql, [...params, limit, offset]);
    
    return {
      products: productsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Search products with Vietnamese full-text search
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @param {Object} pagination - Pagination options
   * @returns {Object} Search results with pagination
   */
  async searchProducts(query, filters = {}, pagination = {}) {
    if (!query || query.trim().length === 0) {
      return this.listProducts(filters, pagination);
    }
    
    return this.listProducts({ ...filters, search: query }, pagination);
  }

  /**
   * Update product
   * @param {string} productId - Product UUID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated product
   */
  async updateProduct(productId, updates) {
    // TODO: Implement in Phase 5 (Task 16.1)
    return this.update(productId, updates);
  }

  /**
   * Delete product (soft delete)
   * @param {string} productId - Product UUID
   * @returns {Object} Deleted product
   */
  async deleteProduct(productId) {
    // TODO: Add constraint checking (prevent if active orders exist)
    // TODO: Implement in Phase 5 (Task 16.1)
    return this.softDelete(productId);
  }

  /**
   * Get featured products for homepage
   * @param {number} limit - Number of products to return
   * @returns {Array} Featured products
   */
  async getFeaturedProducts(limit = 10) {
    // TODO: Implement in Phase 5 (Task 16.1)
    return this.find({ is_featured: true, status: 'active' }, { limit, orderBy: 'created_at', order: 'DESC' });
  }

  /**
   * Get related products based on category
   * @param {string} productId - Product UUID
   * @param {number} limit - Number of products to return
   * @returns {Array} Related products
   */
  async getRelatedProducts(productId, limit = 6) {
    // TODO: Implement in Phase 5 (Task 16.1)
    const product = await this.findById(productId);
    if (!product) return [];
    
    return this.find(
      { category_id: product.category_id, status: 'active' },
      { limit, orderBy: 'created_at', order: 'DESC' }
    );
  }

  /**
   * Get products by category with filters
   * @param {string} categoryId - Category UUID
   * @param {Object} filters - Additional filters
   * @param {Object} pagination - Pagination options
   * @returns {Object} Products with pagination
   */
  async getProductsByCategory(categoryId, filters = {}, pagination = {}) {
    // TODO: Implement in Phase 5 (Task 16.1)
    return this.listProducts({ ...filters, category_id: categoryId }, pagination);
  }
}

module.exports = new CatalogService();
