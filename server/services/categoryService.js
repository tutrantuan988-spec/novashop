/**
 * CategoryService - Category hierarchy management
 * Handles category CRUD and tree operations
 */

const { BaseService } = require('./BaseService');

// Simple logger wrapper
const logger = {
  info: (message, meta) => console.log(`[INFO] ${message}`, meta || '')
};

class CategoryService extends BaseService {
  constructor() {
    super('categories');
  }

  /**
   * Create a new category
   * @param {Object} categoryData - Category information
   * @returns {Object} Created category
   */
  async createCategory(categoryData) {
    // Generate slug if not provided
    if (!categoryData.slug && categoryData.name_vi) {
      categoryData.slug = this.generateSlug(categoryData.name_vi);
    }
    
    const category = await this.create(categoryData);
    
    logger.info('Category created', {
      service: 'CategoryService',
      categoryId: category.id,
      slug: category.slug,
      parentId: category.parent_id
    });
    
    return category;
  }

  /**
   * Get category tree starting from a root category
   * @param {string} rootId - Root category UUID (null for all root categories)
   * @param {number} maxDepth - Maximum depth to traverse (default: unlimited)
   * @returns {Array} Category tree with children
   */
  async getCategoryTree(rootId = null, maxDepth = null) {
    const sql = `
      WITH RECURSIVE category_tree AS (
        -- Base case: root categories
        SELECT 
          id, parent_id, slug, name_vi, name_en, 
          description_vi, image_url, icon, display_order,
          is_active, is_featured, show_in_menu, show_in_homepage,
          1 as depth,
          ARRAY[display_order::text, id::text] as path
        FROM categories
        WHERE parent_id ${rootId ? '= $1' : 'IS NULL'}
          AND is_active = true
        
        UNION ALL
        
        -- Recursive case: child categories
        SELECT 
          c.id, c.parent_id, c.slug, c.name_vi, c.name_en,
          c.description_vi, c.image_url, c.icon, c.display_order,
          c.is_active, c.is_featured, c.show_in_menu, c.show_in_homepage,
          ct.depth + 1,
          ct.path || ARRAY[c.display_order::text, c.id::text]
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        WHERE c.is_active = true
          ${maxDepth ? `AND ct.depth < ${maxDepth}` : ''}
      )
      SELECT * FROM category_tree
      ORDER BY path
    `;
    
    const params = rootId ? [rootId] : [];
    const result = await this.query(sql, params);
    
    // Build tree structure
    return this.buildTree(result.rows);
  }

  /**
   * Get category path (breadcrumb) from root to category
   * @param {string} categoryId - Category UUID
   * @returns {Array} Array of categories from root to target
   */
  async getCategoryPath(categoryId) {
    const sql = `
      WITH RECURSIVE category_path AS (
        -- Start with target category
        SELECT 
          id, parent_id, slug, name_vi, name_en, display_order,
          1 as level
        FROM categories
        WHERE id = $1
        
        UNION ALL
        
        -- Traverse up to parents
        SELECT 
          c.id, c.parent_id, c.slug, c.name_vi, c.name_en, c.display_order,
          cp.level + 1
        FROM categories c
        INNER JOIN category_path cp ON c.id = cp.parent_id
      )
      SELECT * FROM category_path
      ORDER BY level DESC
    `;
    
    const result = await this.query(sql, [categoryId]);
    return result.rows;
  }

  /**
   * Get attributes assigned to a category
   * @param {string} categoryId - Category UUID
   * @returns {Array} Attributes with category-specific settings
   */
  async getCategoryAttributes(categoryId) {
    const sql = `
      SELECT 
        a.*,
        ca.is_required as category_is_required,
        ca.display_order as category_display_order,
        ag.name_vi as group_name_vi,
        ag.name_en as group_name_en
      FROM category_attributes ca
      JOIN attributes a ON ca.attribute_id = a.id
      LEFT JOIN attribute_groups ag ON a.group_id = ag.id
      WHERE ca.category_id = $1
      ORDER BY ca.display_order, a.display_order
    `;
    
    const result = await this.query(sql, [categoryId]);
    return result.rows;
  }

  /**
   * Update category
   * @param {string} categoryId - Category UUID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated category
   */
  async updateCategory(categoryId, updates) {
    // TODO: Implement slug regeneration if name changes
    // TODO: Implement in Phase 5 (Task 16.2)
    return this.update(categoryId, updates);
  }

  /**
   * Delete category with cascade handling
   * @param {string} categoryId - Category UUID
   * @returns {Object} Deleted category
   */
  async deleteCategory(categoryId) {
    // TODO: Add constraint checking (prevent if has products or active children)
    // TODO: Implement in Phase 5 (Task 16.2)
    return this.delete(categoryId);
  }

  /**
   * Get direct children of a category
   * @param {string} parentId - Parent category UUID (null for root categories)
   * @returns {Array} Child categories
   */
  async getCategoryChildren(parentId = null) {
    // TODO: Implement in Phase 5 (Task 16.2)
    const sql = `
      SELECT * FROM categories
      WHERE parent_id ${parentId ? '= $1' : 'IS NULL'}
        AND is_active = true
      ORDER BY display_order, name_vi
    `;
    
    const params = parentId ? [parentId] : [];
    const result = await this.query(sql, params);
    return result.rows;
  }

  /**
   * Assign attribute to category
   * @param {string} categoryId - Category UUID
   * @param {string} attributeId - Attribute UUID
   * @param {Object} config - { is_required, display_order }
   * @returns {Object} Category attribute assignment
   */
  async assignAttributeToCategory(categoryId, attributeId, config = {}) {
    // TODO: Implement in Phase 5 (Task 16.2)
    const { is_required = false, display_order = 0 } = config;
    
    const sql = `
      INSERT INTO category_attributes (category_id, attribute_id, is_required, display_order)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (category_id, attribute_id) 
      DO UPDATE SET is_required = $3, display_order = $4
      RETURNING *
    `;
    
    const result = await this.query(sql, [categoryId, attributeId, is_required, display_order]);
    return result.rows[0];
  }

  /**
   * Remove attribute from category
   * @param {string} categoryId - Category UUID
   * @param {string} attributeId - Attribute UUID
   * @returns {boolean} Success
   */
  async removeAttributeFromCategory(categoryId, attributeId) {
    // TODO: Implement in Phase 5 (Task 16.2)
    const sql = `
      DELETE FROM category_attributes
      WHERE category_id = $1 AND attribute_id = $2
      RETURNING *
    `;
    
    const result = await this.query(sql, [categoryId, attributeId]);
    return result.rows.length > 0;
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

  /**
   * Helper: Build tree structure from flat array
   */
  buildTree(flatArray) {
    const map = {};
    const roots = [];
    
    // Create map of all nodes
    flatArray.forEach(node => {
      map[node.id] = { ...node, children: [] };
    });
    
    // Build tree
    flatArray.forEach(node => {
      if (node.parent_id && map[node.parent_id]) {
        map[node.parent_id].children.push(map[node.id]);
      } else {
        roots.push(map[node.id]);
      }
    });
    
    return roots;
  }
}

module.exports = new CategoryService();
