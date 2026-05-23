/**
 * VariantService - Product variant management
 * Handles variant CRUD, SKU generation, and combination generation
 */

const { BaseService, ValidationError } = require('./BaseService');

// Simple logger wrapper
const logger = {
  info: (message, meta) => console.log(`[INFO] ${message}`, meta || '')
};

class VariantService extends BaseService {
  constructor() {
    super('product_variants');
  }

  /**
   * Create a product variant
   * @param {string} productId - Product UUID
   * @param {Object} variantData - Variant information
   * @param {Array} attributes - Variant attributes [{attribute_id, value_text}]
   * @returns {Object} Created variant
   */
  async createVariant(productId, variantData, attributes = []) {
    return this.transaction(async (client) => {
      // Generate SKU if not provided
      if (!variantData.sku) {
        variantData.sku = await this.generateSKU(productId, attributes);
      }
      
      // Insert variant
      const variantColumns = Object.keys({ product_id: productId, ...variantData });
      const variantValues = Object.values({ product_id: productId, ...variantData });
      const variantPlaceholders = variantValues.map((_, i) => `$${i + 1}`).join(', ');
      
      const variantSql = `
        INSERT INTO product_variants (${variantColumns.join(', ')})
        VALUES (${variantPlaceholders})
        RETURNING *
      `;
      
      const variantResult = await client.query(variantSql, variantValues);
      const variant = variantResult.rows[0];
      
      // Insert variant attributes
      if (attributes.length > 0) {
        for (const attr of attributes) {
          await client.query(
            `INSERT INTO variant_attributes (variant_id, attribute_id, value_text, value_number)
             VALUES ($1, $2, $3, $4)`,
            [variant.id, attr.attribute_id, attr.value_text, attr.value_number]
          );
        }
      }
      
      logger.info('Variant created', {
        service: 'VariantService',
        variantId: variant.id,
        productId,
        sku: variant.sku
      });
      
      return variant;
    });
  }

  /**
   * Generate all possible variant combinations from attributes
   * @param {string} productId - Product UUID
   * @param {Array} attributeIds - Array of variant attribute IDs
   * @returns {Array} Array of variant combinations
   */
  async generateVariantCombinations(productId, attributeIds) {
    // TODO: Implement in Phase 5 (Task 16.4)
    
    // Get attributes with their options
    const attributesData = [];
    
    for (const attrId of attributeIds) {
      const sql = `SELECT * FROM attributes WHERE id = $1 AND is_variant = true`;
      const result = await this.query(sql, [attrId]);
      
      if (result.rows.length === 0) {
        throw new ValidationError(`Attribute ${attrId} is not a variant attribute`);
      }
      
      const attribute = result.rows[0];
      
      if (!attribute.options || attribute.options.length === 0) {
        throw new ValidationError(`Attribute ${attribute.name_vi} has no options defined`);
      }
      
      attributesData.push(attribute);
    }
    
    // Generate combinations
    const combinations = this.cartesianProduct(
      attributesData.map(attr => 
        attr.options.map(opt => ({
          attribute_id: attr.id,
          attribute_name: attr.name_vi,
          value: opt.value,
          label_vi: opt.label_vi
        }))
      )
    );
    
    // Format combinations
    return combinations.map(combo => ({
      attributes: combo,
      sku: null, // Will be generated on create
      name_vi: combo.map(c => c.label_vi).join(' - ')
    }));
  }

  /**
   * Generate SKU for a variant
   * @param {string} productId - Product UUID
   * @param {Array} attributes - Variant attributes
   * @returns {string} Generated SKU
   */
  async generateSKU(productId, attributes) {
    // TODO: Implement in Phase 5 (Task 16.4)
    
    // Get product SKU prefix
    const productSql = `SELECT sku FROM products WHERE id = $1`;
    const productResult = await this.query(productSql, [productId]);
    
    let skuPrefix = 'PRD';
    if (productResult.rows.length > 0 && productResult.rows[0].sku) {
      skuPrefix = productResult.rows[0].sku;
    } else {
      // Generate product SKU prefix from ID
      skuPrefix = `PRD-${productId.substring(0, 8).toUpperCase()}`;
    }
    
    // Add attribute values to SKU
    const attrParts = attributes
      .map(attr => {
        const value = attr.value_text || attr.value_number;
        return value.toString().substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
      })
      .filter(part => part.length > 0)
      .join('-');
    
    let sku = `${skuPrefix}-${attrParts}`;
    
    // Ensure uniqueness
    let counter = 1;
    let finalSku = sku;
    
    while (await this.skuExists(finalSku)) {
      finalSku = `${sku}-${counter}`;
      counter++;
    }
    
    return finalSku;
  }

  /**
   * Get variant by attribute values
   * @param {string} productId - Product UUID
   * @param {Object} attributeValues - { attribute_id: value }
   * @returns {Object} Matching variant or null
   */
  async getVariantByAttributes(productId, attributeValues) {
    // TODO: Implement in Phase 5 (Task 16.4)
    
    const attributeIds = Object.keys(attributeValues);
    
    if (attributeIds.length === 0) {
      return null;
    }
    
    // Find variants with matching attributes
    const sql = `
      SELECT pv.*, COUNT(va.id) as match_count
      FROM product_variants pv
      JOIN variant_attributes va ON pv.id = va.variant_id
      WHERE pv.product_id = $1
        AND pv.is_active = true
        AND va.attribute_id = ANY($2)
        AND va.value_text = ANY($3)
      GROUP BY pv.id
      HAVING COUNT(va.id) = $4
      LIMIT 1
    `;
    
    const values = Object.values(attributeValues);
    const result = await this.query(sql, [productId, attributeIds, values, attributeIds.length]);
    
    return result.rows[0] || null;
  }

  /**
   * Update variant
   * @param {string} variantId - Variant UUID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated variant
   */
  async updateVariant(variantId, updates) {
    // TODO: Implement with price and stock updates
    // TODO: Implement in Phase 5 (Task 16.4)
    return this.update(variantId, updates);
  }

  /**
   * Delete variant
   * @param {string} variantId - Variant UUID
   * @returns {Object} Deleted variant
   */
  async deleteVariant(variantId) {
    // TODO: Add transaction history check
    // TODO: Implement in Phase 5 (Task 16.4)
    return this.delete(variantId);
  }

  /**
   * Get all variants for a product
   * @param {string} productId - Product UUID
   * @returns {Array} Product variants
   */
  async getProductVariants(productId) {
    // TODO: Implement with active filtering
    // TODO: Implement in Phase 5 (Task 16.4)
    const sql = `
      SELECT pv.*, 
        (SELECT json_agg(json_build_object(
          'attribute_id', va.attribute_id,
          'attribute_name', a.name_vi,
          'value_text', va.value_text,
          'value_number', va.value_number
        ))
        FROM variant_attributes va
        JOIN attributes a ON va.attribute_id = a.id
        WHERE va.variant_id = pv.id
        ) as attributes
      FROM product_variants pv
      WHERE pv.product_id = $1 AND pv.is_active = true
      ORDER BY pv.is_default DESC, pv.created_at ASC
    `;
    
    const result = await this.query(sql, [productId]);
    return result.rows;
  }

  /**
   * Set default variant for a product
   * @param {string} variantId - Variant UUID
   * @returns {Object} Updated variant
   */
  async setDefaultVariant(variantId) {
    // TODO: Ensure only one default per product
    // TODO: Implement in Phase 5 (Task 16.4)
    return this.update(variantId, { is_default: true });
  }

  /**
   * Check if variant is available with sufficient stock
   * @param {string} variantId - Variant UUID
   * @param {number} quantity - Required quantity
   * @returns {boolean} Is available
   */
  async isVariantAvailable(variantId, quantity = 1) {
    // TODO: Check stock across locations
    // TODO: Implement in Phase 5 (Task 16.4)
    const variant = await this.findById(variantId);
    
    if (!variant || !variant.is_active) {
      return false;
    }
    
    const availableStock = variant.stock_quantity - variant.reserved_quantity;
    return availableStock >= quantity;
  }

  /**
   * Helper: Check if SKU already exists
   */
  async skuExists(sku) {
    const sql = `SELECT 1 FROM product_variants WHERE sku = $1 LIMIT 1`;
    const result = await this.query(sql, [sku]);
    return result.rows.length > 0;
  }

  /**
   * Helper: Generate cartesian product of arrays
   */
  cartesianProduct(arrays) {
    if (arrays.length === 0) return [[]];
    if (arrays.length === 1) return arrays[0].map(item => [item]);
    
    const [first, ...rest] = arrays;
    const restProduct = this.cartesianProduct(rest);
    
    return first.flatMap(item =>
      restProduct.map(combo => [item, ...combo])
    );
  }
}

module.exports = new VariantService();
