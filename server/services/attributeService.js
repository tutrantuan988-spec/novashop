/**
 * AttributeService - Product attribute management
 * Handles attribute CRUD and validation
 */

const { BaseService, ValidationError } = require('./BaseService');

// Simple logger wrapper
const logger = {
  info: (message, meta) => console.log(`[INFO] ${message}`, meta || '')
};

class AttributeService extends BaseService {
  constructor() {
    super('attributes');
  }

  /**
   * Create a new attribute
   * @param {Object} attributeData - Attribute information
   * @returns {Object} Created attribute
   */
  async createAttribute(attributeData) {
    // Generate slug if not provided
    if (!attributeData.slug && attributeData.name_vi) {
      attributeData.slug = this.generateSlug(attributeData.name_vi);
    }
    
    // Validate attribute type
    const validTypes = ['text', 'number', 'select', 'multiselect', 'color', 'boolean', 'date'];
    if (!validTypes.includes(attributeData.type)) {
      throw new ValidationError(`Invalid attribute type. Must be one of: ${validTypes.join(', ')}`);
    }
    
    const attribute = await this.create(attributeData);
    
    logger.info('Attribute created', {
      service: 'AttributeService',
      attributeId: attribute.id,
      slug: attribute.slug,
      type: attribute.type
    });
    
    return attribute;
  }

  /**
   * Validate attribute value against attribute definition
   * @param {string} attributeId - Attribute UUID
   * @param {any} value - Value to validate
   * @returns {Object} { valid: boolean, error: string }
   */
  async validateAttributeValue(attributeId, value) {
    const attribute = await this.findById(attributeId);
    
    if (!attribute) {
      return { valid: false, error: 'Attribute not found' };
    }
    
    // Check required
    if (attribute.is_required && (value === null || value === undefined || value === '')) {
      return { valid: false, error: `${attribute.name_vi} is required` };
    }
    
    // Type-specific validation
    switch (attribute.type) {
      case 'number':
        if (isNaN(value)) {
          return { valid: false, error: `${attribute.name_vi} must be a number` };
        }
        
        // Check validation rules
        if (attribute.validation_rules) {
          const rules = attribute.validation_rules;
          const numValue = parseFloat(value);
          
          if (rules.min !== undefined && numValue < rules.min) {
            return { valid: false, error: `${attribute.name_vi} must be at least ${rules.min}` };
          }
          
          if (rules.max !== undefined && numValue > rules.max) {
            return { valid: false, error: `${attribute.name_vi} must be at most ${rules.max}` };
          }
        }
        break;
      
      case 'select':
        if (attribute.options) {
          const validOptions = attribute.options.map(opt => opt.value);
          if (!validOptions.includes(value)) {
            return { valid: false, error: `${attribute.name_vi} must be one of: ${validOptions.join(', ')}` };
          }
        }
        break;
      
      case 'multiselect':
        if (!Array.isArray(value)) {
          return { valid: false, error: `${attribute.name_vi} must be an array` };
        }
        
        if (attribute.options) {
          const validOptions = attribute.options.map(opt => opt.value);
          const invalidValues = value.filter(v => !validOptions.includes(v));
          
          if (invalidValues.length > 0) {
            return { valid: false, error: `Invalid values for ${attribute.name_vi}: ${invalidValues.join(', ')}` };
          }
        }
        break;
      
      case 'color':
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!colorRegex.test(value)) {
          return { valid: false, error: `${attribute.name_vi} must be a valid hex color (e.g., #FF0000)` };
        }
        break;
      
      case 'boolean':
        if (typeof value !== 'boolean') {
          return { valid: false, error: `${attribute.name_vi} must be true or false` };
        }
        break;
      
      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return { valid: false, error: `${attribute.name_vi} must be a valid date` };
        }
        break;
      
      case 'text':
        if (attribute.validation_rules && attribute.validation_rules.pattern) {
          const regex = new RegExp(attribute.validation_rules.pattern);
          if (!regex.test(value)) {
            return { valid: false, error: `${attribute.name_vi} format is invalid` };
          }
        }
        
        if (attribute.validation_rules && attribute.validation_rules.maxLength) {
          if (value.length > attribute.validation_rules.maxLength) {
            return { valid: false, error: `${attribute.name_vi} must be at most ${attribute.validation_rules.maxLength} characters` };
          }
        }
        break;
    }
    
    return { valid: true };
  }

  /**
   * Get variant attributes (attributes that can be used for variants)
   * @returns {Array} Variant attributes
   */
  async getVariantAttributes() {
    const sql = `
      SELECT a.*, ag.name_vi as group_name_vi, ag.name_en as group_name_en
      FROM attributes a
      LEFT JOIN attribute_groups ag ON a.group_id = ag.id
      WHERE a.is_variant = true
      ORDER BY ag.display_order, a.display_order
    `;
    
    const result = await this.query(sql);
    return result.rows;
  }

  /**
   * Get filterable attributes for a category
   * @param {string} categoryId - Category UUID
   * @returns {Array} Filterable attributes
   */
  async getFilterableAttributes(categoryId) {
    const sql = `
      SELECT DISTINCT a.*, ag.name_vi as group_name_vi
      FROM attributes a
      LEFT JOIN attribute_groups ag ON a.group_id = ag.id
      LEFT JOIN category_attributes ca ON a.id = ca.attribute_id
      WHERE a.is_filterable = true
        AND (ca.category_id = $1 OR ca.category_id IS NULL)
      ORDER BY ag.display_order, a.display_order
    `;
    
    const result = await this.query(sql, [categoryId]);
    return result.rows;
  }

  /**
   * Update attribute
   * @param {string} attributeId - Attribute UUID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated attribute
   */
  async updateAttribute(attributeId, updates) {
    // TODO: Implement validation rule updates
    // TODO: Implement in Phase 5 (Task 16.3)
    return this.update(attributeId, updates);
  }

  /**
   * Delete attribute
   * @param {string} attributeId - Attribute UUID
   * @returns {Object} Deleted attribute
   */
  async deleteAttribute(attributeId) {
    // TODO: Add constraint checking (prevent if used by products)
    // TODO: Implement in Phase 5 (Task 16.3)
    return this.delete(attributeId);
  }

  /**
   * List attributes with optional filters
   * @param {Object} filters - { group_id, is_variant, is_filterable }
   * @returns {Array} Attributes
   */
  async listAttributes(filters = {}) {
    // TODO: Implement with grouping
    // TODO: Implement in Phase 5 (Task 16.3)
    return this.find(filters, { orderBy: 'display_order', order: 'ASC' });
  }

  /**
   * Get attributes by group
   * @param {string} groupId - Attribute group UUID
   * @returns {Array} Attributes in group
   */
  async getAttributesByGroup(groupId) {
    // TODO: Implement in Phase 5 (Task 16.3)
    return this.find({ group_id: groupId }, { orderBy: 'display_order', order: 'ASC' });
  }

  /**
   * Normalize attribute value for consistent storage
   * @param {string} attributeId - Attribute UUID
   * @param {any} value - Value to normalize
   * @returns {Object} { value_text, value_number, value_date }
   */
  async normalizeAttributeValue(attributeId, value) {
    // TODO: Implement in Phase 5 (Task 16.3)
    const attribute = await this.findById(attributeId);
    
    if (!attribute) {
      throw new ValidationError('Attribute not found');
    }
    
    const normalized = {
      value_text: null,
      value_number: null,
      value_date: null
    };
    
    switch (attribute.type) {
      case 'number':
        normalized.value_number = parseFloat(value);
        normalized.value_text = value.toString();
        break;
      
      case 'date':
        normalized.value_date = new Date(value);
        normalized.value_text = value;
        break;
      
      case 'boolean':
        normalized.value_text = value ? 'true' : 'false';
        normalized.value_number = value ? 1 : 0;
        break;
      
      case 'multiselect':
        normalized.value_text = Array.isArray(value) ? value.join(',') : value;
        break;
      
      default:
        normalized.value_text = value.toString();
    }
    
    return normalized;
  }

  /**
   * Helper: Generate URL-friendly slug from Vietnamese text
   */
  generateSlug(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

module.exports = new AttributeService();
