/**
 * Product Transformation Utilities
 * Transforms Firestore products to PostgreSQL schema
 */

/**
 * Transform Firestore product to PostgreSQL format
 * @param {Object} firestoreProduct - Product from Firestore
 * @returns {Object} PostgreSQL-compatible product data
 */
function transformFirestoreProduct(firestoreProduct) {
  const transformed = {
    legacy_id: firestoreProduct.id,
    name_vi: firestoreProduct.name || firestoreProduct.title || 'Untitled Product',
    name_en: firestoreProduct.nameEn || null,
    description_vi: firestoreProduct.description || null,
    description_en: firestoreProduct.descriptionEn || null,
    short_description_vi: firestoreProduct.shortDescription || null,
    
    // Pricing
    base_price: parseFloat(firestoreProduct.price) || 1000,
    sale_price: firestoreProduct.salePrice ? parseFloat(firestoreProduct.salePrice) : null,
    cost_price: firestoreProduct.costPrice ? parseFloat(firestoreProduct.costPrice) : null,
    
    // Media
    primary_image_url: firestoreProduct.imageUrl || firestoreProduct.image || null,
    images: transformImages(firestoreProduct.images || firestoreProduct.imageUrls),
    
    // Status
    status: mapStatus(firestoreProduct.status || firestoreProduct.active),
    is_featured: firestoreProduct.isFeatured || firestoreProduct.featured || false,
    is_new: firestoreProduct.isNew || false,
    is_bestseller: firestoreProduct.isBestseller || firestoreProduct.bestseller || false,
    
    // SEO
    meta_title_vi: firestoreProduct.metaTitle || firestoreProduct.name || null,
    meta_description_vi: firestoreProduct.metaDescription || null,
    
    // Inventory
    track_inventory: firestoreProduct.trackInventory !== false,
    allow_backorder: firestoreProduct.allowBackorder || false,
    low_stock_threshold: firestoreProduct.lowStockThreshold || 10,
    
    // Vietnamese-specific
    badge_vi: firestoreProduct.badge || null,
    
    // Timestamps
    created_at: firestoreProduct.createdAt?.toDate?.() || new Date(),
    updated_at: firestoreProduct.updatedAt?.toDate?.() || new Date()
  };
  
  // Map category
  if (firestoreProduct.categoryId || firestoreProduct.category) {
    transformed.category_id = mapLegacyCategory(
      firestoreProduct.categoryId || firestoreProduct.category
    );
  }
  
  // Generate slug
  if (!firestoreProduct.slug) {
    transformed.slug = generateSlug(transformed.name_vi);
  } else {
    transformed.slug = firestoreProduct.slug;
  }
  
  // Generate SKU if missing
  if (!firestoreProduct.sku) {
    transformed.sku = `PRD-${firestoreProduct.id.substring(0, 8).toUpperCase()}`;
  } else {
    transformed.sku = firestoreProduct.sku;
  }
  
  return transformed;
}

/**
 * Map legacy category to new category ID
 * @param {string} legacyCategory - Old category identifier
 * @returns {string} New category UUID (placeholder for now)
 */
function mapLegacyCategory(legacyCategory) {
  // TODO: Implement actual category mapping
  // For now, return null and handle in migration script
  
  const categoryMap = {
    'dog-food': 'thuc-an-cho',
    'cat-food': 'thuc-an-meo',
    'pet-accessories': 'phu-kien-thu-cung',
    'pet-toys': 'do-choi-thu-cung'
  };
  
  return categoryMap[legacyCategory] || null;
}

/**
 * Transform hardcoded attributes (colors, sizes) to dynamic attributes
 * @param {Array} colors - Array of color values
 * @param {Array} sizes - Array of size values
 * @returns {Array} Attribute objects
 */
function transformHardcodedAttributes(colors = [], sizes = []) {
  const attributes = [];
  
  // Transform colors
  if (colors && colors.length > 0) {
    colors.forEach(color => {
      attributes.push({
        attribute_slug: 'mau-sac',
        value_text: color,
        is_variant: true
      });
    });
  }
  
  // Transform sizes
  if (sizes && sizes.length > 0) {
    sizes.forEach(size => {
      attributes.push({
        attribute_slug: 'kich-thuoc',
        value_text: size,
        is_variant: true
      });
    });
  }
  
  return attributes;
}

/**
 * Transform image URLs to PostgreSQL JSONB format
 * @param {Array|string} images - Image URLs
 * @returns {Object} JSONB-compatible image array
 */
function transformImages(images) {
  if (!images) return null;
  
  if (typeof images === 'string') {
    return [{ url: images, alt_vi: '', order: 1 }];
  }
  
  if (Array.isArray(images)) {
    return images.map((img, index) => ({
      url: typeof img === 'string' ? img : img.url,
      alt_vi: typeof img === 'object' ? img.alt : '',
      order: index + 1
    }));
  }
  
  return null;
}

/**
 * Map Firestore status to PostgreSQL status
 * @param {string|boolean} status - Firestore status
 * @returns {string} PostgreSQL status
 */
function mapStatus(status) {
  if (typeof status === 'boolean') {
    return status ? 'active' : 'inactive';
  }
  
  const statusMap = {
    'active': 'active',
    'inactive': 'inactive',
    'draft': 'draft',
    'out_of_stock': 'out_of_stock',
    'published': 'active',
    'unpublished': 'inactive'
  };
  
  return statusMap[status] || 'draft';
}

/**
 * Generate URL-friendly slug from Vietnamese text
 * @param {string} text - Text to slugify
 * @returns {string} URL-friendly slug
 */
function generateSlug(text) {
  if (!text) return 'product';
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 200); // Limit length
}

/**
 * Create variants from Firestore product with colors/sizes
 * @param {Object} firestoreProduct - Product from Firestore
 * @param {string} productId - PostgreSQL product UUID
 * @returns {Array} Variant objects
 */
function createVariantsFromLegacy(firestoreProduct, productId) {
  const variants = [];
  const colors = firestoreProduct.colors || [];
  const sizes = firestoreProduct.sizes || [];
  
  // If no colors or sizes, create single default variant
  if (colors.length === 0 && sizes.length === 0) {
    variants.push({
      product_id: productId,
      sku: firestoreProduct.sku || `${productId.substring(0, 8)}-DEFAULT`,
      name_vi: 'Mặc định',
      price: parseFloat(firestoreProduct.price) || 1000,
      stock_quantity: firestoreProduct.stock || firestoreProduct.quantity || 0,
      is_default: true,
      is_active: true
    });
    return variants;
  }
  
  // Create variants for each color-size combination
  if (colors.length > 0 && sizes.length > 0) {
    colors.forEach((color, colorIndex) => {
      sizes.forEach((size, sizeIndex) => {
        variants.push({
          product_id: productId,
          sku: `${firestoreProduct.sku || productId.substring(0, 8)}-${color.substring(0, 3).toUpperCase()}-${size.toUpperCase()}`,
          name_vi: `${color} - ${size}`,
          price: parseFloat(firestoreProduct.price) || 1000,
          stock_quantity: 0, // Will be set during inventory migration
          is_default: colorIndex === 0 && sizeIndex === 0,
          is_active: true
        });
      });
    });
  } else if (colors.length > 0) {
    // Only colors
    colors.forEach((color, index) => {
      variants.push({
        product_id: productId,
        sku: `${firestoreProduct.sku || productId.substring(0, 8)}-${color.substring(0, 3).toUpperCase()}`,
        name_vi: color,
        price: parseFloat(firestoreProduct.price) || 1000,
        stock_quantity: 0,
        is_default: index === 0,
        is_active: true
      });
    });
  } else if (sizes.length > 0) {
    // Only sizes
    sizes.forEach((size, index) => {
      variants.push({
        product_id: productId,
        sku: `${firestoreProduct.sku || productId.substring(0, 8)}-${size.toUpperCase()}`,
        name_vi: size,
        price: parseFloat(firestoreProduct.price) || 1000,
        stock_quantity: 0,
        is_default: index === 0,
        is_active: true
      });
    });
  }
  
  return variants;
}

module.exports = {
  transformFirestoreProduct,
  mapLegacyCategory,
  transformHardcodedAttributes,
  transformImages,
  mapStatus,
  generateSlug,
  createVariantsFromLegacy
};
