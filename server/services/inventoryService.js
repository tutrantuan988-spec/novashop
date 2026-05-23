/**
 * InventoryService - Multi-warehouse inventory management
 * Handles stock tracking, reservations, and transactions
 */

const { BaseService, ValidationError } = require('./BaseService');

// Simple logger wrapper
const logger = {
  info: (message, meta) => console.log(`[INFO] ${message}`, meta || '')
};

class InventoryService extends BaseService {
  constructor() {
    super('inventory');
  }

  /**
   * Get stock for a variant at a location
   * @param {string} variantId - Variant UUID
   * @param {string} locationId - Location UUID (null for total across all locations)
   * @returns {Object} Stock information
   */
  async getStock(variantId, locationId = null) {
    if (locationId) {
      const sql = `
        SELECT * FROM inventory
        WHERE variant_id = $1 AND location_id = $2
      `;
      const result = await this.query(sql, [variantId, locationId]);
      return result.rows[0] || null;
    } else {
      // Get total stock across all locations
      const sql = `
        SELECT 
          variant_id,
          SUM(quantity_available) as total_available,
          SUM(quantity_reserved) as total_reserved,
          SUM(quantity_incoming) as total_incoming,
          SUM(quantity_available - quantity_reserved) as total_sellable
        FROM inventory
        WHERE variant_id = $1
        GROUP BY variant_id
      `;
      const result = await this.query(sql, [variantId]);
      return result.rows[0] || null;
    }
  }

  /**
   * Reserve stock for an order
   * @param {string} variantId - Variant UUID
   * @param {number} quantity - Quantity to reserve
   * @param {string} orderId - Order UUID
   * @param {string} locationId - Location UUID (optional, auto-select if null)
   * @returns {Object} Updated inventory
   */
  async reserveStock(variantId, quantity, orderId, locationId = null) {
    return this.transaction(async (client) => {
      // Auto-select location if not provided
      if (!locationId) {
        const locationSql = `
          SELECT location_id, (quantity_available - quantity_reserved) as sellable
          FROM inventory
          WHERE variant_id = $1 AND (quantity_available - quantity_reserved) >= $2
          ORDER BY sellable DESC
          LIMIT 1
        `;
        const locationResult = await client.query(locationSql, [variantId, quantity]);
        
        if (locationResult.rows.length === 0) {
          throw new ValidationError('Insufficient stock available');
        }
        
        locationId = locationResult.rows[0].location_id;
      }
      
      // Reserve stock
      const reserveSql = `
        UPDATE inventory
        SET quantity_reserved = quantity_reserved + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE variant_id = $2 
          AND location_id = $3
          AND (quantity_available - quantity_reserved) >= $1
        RETURNING *
      `;
      
      const reserveResult = await client.query(reserveSql, [quantity, variantId, locationId]);
      
      if (reserveResult.rows.length === 0) {
        throw new ValidationError('Insufficient stock at selected location');
      }
      
      // Record transaction
      await client.query(
        `INSERT INTO inventory_transactions 
         (variant_id, location_id, type, quantity, reference_type, reference_id, note)
         VALUES ($1, $2, 'reserve', $3, 'order', $4, $5)`,
        [variantId, locationId, quantity, orderId, `Reserved ${quantity} units for order`]
      );
      
      logger.info('Stock reserved', {
        service: 'InventoryService',
        variantId,
        locationId,
        quantity,
        orderId
      });
      
      return reserveResult.rows[0];
    });
  }

  /**
   * Release reserved stock (e.g., order cancelled)
   * @param {string} variantId - Variant UUID
   * @param {number} quantity - Quantity to release
   * @param {string} orderId - Order UUID
   * @param {string} locationId - Location UUID
   * @returns {Object} Updated inventory
   */
  async releaseStock(variantId, quantity, orderId, locationId) {
    return this.transaction(async (client) => {
      // Release stock
      const releaseSql = `
        UPDATE inventory
        SET quantity_reserved = GREATEST(quantity_reserved - $1, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE variant_id = $2 AND location_id = $3
        RETURNING *
      `;
      
      const releaseResult = await client.query(releaseSql, [quantity, variantId, locationId]);
      
      if (releaseResult.rows.length === 0) {
        throw new ValidationError('Inventory record not found');
      }
      
      // Record transaction
      await client.query(
        `INSERT INTO inventory_transactions 
         (variant_id, location_id, type, quantity, reference_type, reference_id, note)
         VALUES ($1, $2, 'release', $3, 'order', $4, $5)`,
        [variantId, locationId, quantity, orderId, `Released ${quantity} units from cancelled order`]
      );
      
      logger.info('Stock released', {
        service: 'InventoryService',
        variantId,
        locationId,
        quantity,
        orderId
      });
      
      return releaseResult.rows[0];
    });
  }

  /**
   * Record an inventory transaction
   * @param {Object} transactionData - Transaction details
   * @returns {Object} Created transaction
   */
  async recordTransaction(transactionData) {
    const sql = `
      INSERT INTO inventory_transactions 
      (variant_id, location_id, type, quantity, reference_type, reference_id, note, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await this.query(sql, [
      transactionData.variant_id,
      transactionData.location_id,
      transactionData.type,
      transactionData.quantity,
      transactionData.reference_type,
      transactionData.reference_id,
      transactionData.note,
      transactionData.user_id
    ]);
    
    return result.rows[0];
  }

  /**
   * Find nearest stock location based on Vietnamese address
   * @param {string} provinceCode - Province code
   * @param {string} districtCode - District code
   * @returns {Object} Nearest location
   */
  async findNearestStockLocation(provinceCode, districtCode) {
    // TODO: Implement Vietnamese logistics routing
    // TODO: Implement in Phase 5 (Task 16.5)
    
    // Simple implementation: find location in same province
    const sql = `
      SELECT * FROM inventory_locations
      WHERE province_code = $1 AND is_active = true
      ORDER BY is_default DESC, created_at ASC
      LIMIT 1
    `;
    
    const result = await this.query(sql, [provinceCode]);
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    // Fallback to default location
    const defaultSql = `
      SELECT * FROM inventory_locations
      WHERE is_default = true AND is_active = true
      LIMIT 1
    `;
    
    const defaultResult = await this.query(defaultSql);
    return defaultResult.rows[0] || null;
  }

  /**
   * Adjust stock (manual adjustment)
   * @param {string} variantId - Variant UUID
   * @param {string} locationId - Location UUID
   * @param {number} quantity - Quantity to adjust (positive or negative)
   * @param {string} reason - Reason for adjustment
   * @param {string} note - Additional notes
   * @returns {Object} Updated inventory
   */
  async adjustStock(variantId, locationId, quantity, reason, note = '') {
    // TODO: Implement with transaction recording
    // TODO: Implement in Phase 5 (Task 16.5)
    return this.transaction(async (client) => {
      const adjustSql = `
        UPDATE inventory
        SET quantity_available = GREATEST(quantity_available + $1, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE variant_id = $2 AND location_id = $3
        RETURNING *
      `;
      
      const adjustResult = await client.query(adjustSql, [quantity, variantId, locationId]);
      
      if (adjustResult.rows.length === 0) {
        throw new ValidationError('Inventory record not found');
      }
      
      // Record transaction
      await client.query(
        `INSERT INTO inventory_transactions 
         (variant_id, location_id, type, quantity, reference_type, reference_id, note)
         VALUES ($1, $2, $3, $4, 'adjustment', NULL, $5)`,
        [variantId, locationId, quantity > 0 ? 'adjustment_in' : 'adjustment_out', Math.abs(quantity), `${reason}: ${note}`]
      );
      
      logger.info('Stock adjusted', {
        service: 'InventoryService',
        variantId,
        locationId,
        quantity,
        reason
      });
      
      return adjustResult.rows[0];
    });
  }

  /**
   * Transfer stock between locations
   * @param {string} variantId - Variant UUID
   * @param {string} fromLocationId - Source location UUID
   * @param {string} toLocationId - Destination location UUID
   * @param {number} quantity - Quantity to transfer
   * @returns {Object} { from, to } Updated inventory records
   */
  async transferStock(variantId, fromLocationId, toLocationId, quantity) {
    // TODO: Implement with atomic operations
    // TODO: Implement in Phase 5 (Task 16.5)
    return this.transaction(async (client) => {
      // Deduct from source
      const deductSql = `
        UPDATE inventory
        SET quantity_available = quantity_available - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE variant_id = $2 
          AND location_id = $3
          AND (quantity_available - quantity_reserved) >= $1
        RETURNING *
      `;
      
      const deductResult = await client.query(deductSql, [quantity, variantId, fromLocationId]);
      
      if (deductResult.rows.length === 0) {
        throw new ValidationError('Insufficient stock at source location');
      }
      
      // Add to destination
      const addSql = `
        INSERT INTO inventory (variant_id, location_id, quantity_available)
        VALUES ($1, $2, $3)
        ON CONFLICT (variant_id, location_id)
        DO UPDATE SET 
          quantity_available = inventory.quantity_available + $3,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      const addResult = await client.query(addSql, [variantId, toLocationId, quantity]);
      
      // Record transactions
      await client.query(
        `INSERT INTO inventory_transactions 
         (variant_id, location_id, type, quantity, reference_type, reference_id, note)
         VALUES 
         ($1, $2, 'transfer_out', $3, 'transfer', $4, $5),
         ($1, $4, 'transfer_in', $3, 'transfer', $2, $6)`,
        [
          variantId, 
          fromLocationId, 
          quantity, 
          toLocationId,
          `Transferred ${quantity} units to location ${toLocationId}`,
          `Received ${quantity} units from location ${fromLocationId}`
        ]
      );
      
      logger.info('Stock transferred', {
        service: 'InventoryService',
        variantId,
        fromLocationId,
        toLocationId,
        quantity
      });
      
      return {
        from: deductResult.rows[0],
        to: addResult.rows[0]
      };
    });
  }

  /**
   * Get transaction history for a variant
   * @param {string} variantId - Variant UUID
   * @param {Object} filters - { location_id, type, start_date, end_date }
   * @returns {Array} Transaction history
   */
  async getTransactionHistory(variantId, filters = {}) {
    // TODO: Implement with pagination
    // TODO: Implement in Phase 5 (Task 16.5)
    const conditions = ['variant_id = $1'];
    const params = [variantId];
    let paramIndex = 2;
    
    if (filters.location_id) {
      conditions.push(`location_id = $${paramIndex}`);
      params.push(filters.location_id);
      paramIndex++;
    }
    
    if (filters.type) {
      conditions.push(`type = $${paramIndex}`);
      params.push(filters.type);
      paramIndex++;
    }
    
    const sql = `
      SELECT it.*, il.name_vi as location_name
      FROM inventory_transactions it
      LEFT JOIN inventory_locations il ON it.location_id = il.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY it.created_at DESC
      LIMIT 100
    `;
    
    const result = await this.query(sql, params);
    return result.rows;
  }

  /**
   * Get low stock products for reorder alerts
   * @param {string} locationId - Location UUID (optional)
   * @returns {Array} Products with low stock
   */
  async getLowStockProducts(locationId = null) {
    // TODO: Implement in Phase 5 (Task 16.5)
    const sql = `
      SELECT 
        pv.id as variant_id,
        pv.sku,
        pv.name_vi,
        p.name_vi as product_name,
        p.low_stock_threshold,
        i.quantity_available,
        i.quantity_reserved,
        (i.quantity_available - i.quantity_reserved) as sellable,
        il.name_vi as location_name
      FROM inventory i
      JOIN product_variants pv ON i.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      JOIN inventory_locations il ON i.location_id = il.id
      WHERE (i.quantity_available - i.quantity_reserved) <= p.low_stock_threshold
        AND pv.is_active = true
        AND p.status = 'active'
        ${locationId ? 'AND i.location_id = $1' : ''}
      ORDER BY (i.quantity_available - i.quantity_reserved) ASC
    `;
    
    const params = locationId ? [locationId] : [];
    const result = await this.query(sql, params);
    return result.rows;
  }

  /**
   * Get stock by location for a variant
   * @param {string} variantId - Variant UUID
   * @returns {Array} Stock at each location
   */
  async getStockByLocation(variantId) {
    // TODO: Implement in Phase 5 (Task 16.5)
    const sql = `
      SELECT 
        i.*,
        il.name_vi as location_name,
        il.code as location_code,
        il.province_code,
        il.district_code
      FROM inventory i
      JOIN inventory_locations il ON i.location_id = il.id
      WHERE i.variant_id = $1
      ORDER BY il.is_default DESC, il.name_vi ASC
    `;
    
    const result = await this.query(sql, [variantId]);
    return result.rows;
  }
}

module.exports = new InventoryService();
