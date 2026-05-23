/**
 * Service Layer Index
 * Exports all commerce services for easy import
 */

const catalogService = require('./catalogService');
const categoryService = require('./categoryService');
const attributeService = require('./attributeService');
const variantService = require('./variantService');
const inventoryService = require('./inventoryService');

module.exports = {
  catalogService,
  categoryService,
  attributeService,
  variantService,
  inventoryService
};
