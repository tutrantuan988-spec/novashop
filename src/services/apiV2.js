/**
 * API v2 — PostgreSQL Commerce Core Client
 *
 * Bridges between PostgreSQL `/api` endpoints and the frontend's expected data format.
 * All functions return empty fallback when the API is unavailable.
 */

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

// ============================================================
//  Feature Detection
// ============================================================

/** Returns true if PostgreSQL backend is expected to be available */
export function isV2ApiConfigured() {
  return !!import.meta.env.VITE_API_URL || !import.meta.env.PROD;
}

// ============================================================
//  HTTP Helpers
// ============================================================

async function v2Request(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}/api${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    if (!res.ok) throw new Error(`API error (${res.status}): ${res.statusText}`);
    return res.json();
  } catch (err) {
    if (err.name === 'TypeError') return null; // network error
    throw err;
  }
}

// ============================================================
//  Data Transformers
// ============================================================

function transformProduct(pgProduct) {
  const basePrice = Number(pgProduct.base_price) || 0;
  const salePrice = Number(pgProduct.sale_price) || 0;

  let totalStock = 0;
  let defaultVariant = null;
  let variants = [];

  if (pgProduct.variants && pgProduct.variants.length > 0) {
    variants = pgProduct.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name_vi || '',
      price: Number(v.price) || 0,
      salePrice: Number(v.sale_price) || 0,
      image: v.image_url || '',
      stock: Number(v.stock_quantity) || 0,
      reserved: Number(v.reserved_quantity) || 0,
      isDefault: v.is_default === true,
      attributes: v.variant_attributes || []
    }));

    totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
    defaultVariant = variants.find((v) => v.isDefault) || variants[0];
  }

  const effectivePrice = defaultVariant ? (defaultVariant.price || basePrice) : basePrice;
  const effectiveSalePrice = defaultVariant ? (defaultVariant.salePrice || salePrice) : salePrice;

  return {
    id: pgProduct.id,
    name: pgProduct.name_vi || pgProduct.name_en || '',
    category: pgProduct.category_name_vi || '',
    price: effectivePrice,
    oldPrice: effectiveSalePrice > effectivePrice ? effectiveSalePrice : undefined,
    stock: totalStock,
    badge: pgProduct.badge_vi || '',
    image: pgProduct.primary_image_url || '',
    description: pgProduct.description_vi || pgProduct.description_en || '',
    slug: pgProduct.slug || '',
    rating: 4.5,
    reviewCount: 0,
    brand: pgProduct.brand || '',
    weight: '',
    gallery: pgProduct.images
      ? (typeof pgProduct.images === 'string' ? JSON.parse(pgProduct.images) : pgProduct.images)
      : [pgProduct.primary_image_url],
    colors: [],
    sizes: [],
    attributes: pgProduct.attributes || [],
    variants,
    _pg: pgProduct
  };
}

function transformProducts(pgProducts) {
  return (pgProducts || []).map(transformProduct);
}

function transformCategory(pgCat) {
  return {
    id: pgCat.id,
    name: pgCat.name_vi || pgCat.name_en || '',
    slug: pgCat.slug || '',
    description: pgCat.description_vi || '',
    image: pgCat.image_url || '',
    parentId: pgCat.parent_id || null,
    displayOrder: pgCat.display_order || 0,
    isActive: pgCat.is_active !== false,
    showInMenu: pgCat.show_in_menu !== false,
    showInHomepage: pgCat.show_in_homepage || false,
    _pg: pgCat
  };
}

function transformCategories(pgCategories) {
  return (pgCategories || []).map(transformCategory);
}

// ============================================================
//  Category API
// ============================================================

let cachedCategories = null;

/** Fetch all categories */
export async function fetchCategories() {
  if (cachedCategories) return cachedCategories;

  const res = await v2Request('/categories');
  if (res?.data) {
    const cats = transformCategories(res.data);
    const nameList = cats
      .filter(c => c.isActive && c.showInMenu)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(c => c.name);
    cachedCategories = { raw: cats, names: ['Tất cả', ...nameList] };
    return cachedCategories;
  }

  return { raw: [], names: ['Tất cả'] };
}

/** Get category tree (hierarchical) */
export async function fetchCategoryTree() {
  const res = await v2Request('/categories/tree');
  if (res?.data) return res.data;
  return [];
}

/** Get category by slug */
export async function fetchCategoryBySlug(slug) {
  const res = await v2Request(`/categories/${encodeURIComponent(slug)}`);
  if (res?.data) return transformCategory(res.data);
  return null;
}

/** Resolve a Vietnamese name to category slug */
export async function resolveCategorySlug(displayName) {
  if (!displayName || displayName === 'Tất cả') return null;
  const cats = await fetchCategories();
  const found = cats.raw.find(c => c.name === displayName);
  return found?.slug || null;
}

// ============================================================
//  Product API
// ============================================================

/** Fetch all products with optional filters */
export async function fetchProducts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category_slug) params.set('category_slug', filters.category_slug);
  if (filters.category_name) {
    const slug = await resolveCategorySlug(filters.category_name);
    if (slug) params.set('category_slug', slug);
  }
  if (filters.search) params.set('search', filters.search);
  if (filters.min_price) params.set('min_price', filters.min_price);
  if (filters.max_price) params.set('max_price', filters.max_price);
  if (filters.is_featured) params.set('is_featured', 'true');
  if (filters.is_new) params.set('is_new', 'true');
  if (filters.is_bestseller) params.set('is_bestseller', 'true');
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.page) params.set('page', String(filters.page));
  if (filters.sort_by) params.set('sort_by', filters.sort_by);
  if (filters.sort_order) params.set('sort_order', filters.sort_order);

  const qs = params.toString();
  const res = await v2Request(`/products${qs ? `?${qs}` : ''}`);
  if (res?.data) {
    return transformProducts(res.data);
  }

  return [];
}

/** Fetch a single product by its slug */
export async function fetchProductBySlug(slug) {
  const res = await v2Request(`/products/${encodeURIComponent(slug)}?include_variants=true&include_attributes=true`);
  if (res?.data) return transformProduct(res.data);

  return null;
}

/** Search products via PostgreSQL full-text search */
export async function searchProductsV2(query, filters = {}) {
  const params = new URLSearchParams();
  params.set('q', query);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.page) params.set('page', String(filters.page));
  if (filters.min_price) params.set('min_price', String(filters.min_price));
  if (filters.max_price) params.set('max_price', String(filters.max_price));
  if (filters.sort_by) params.set('sort_by', filters.sort_by);
  if (filters.sort_order) params.set('sort_order', filters.sort_order);

  const qs = params.toString();
  const res = await v2Request(`/products/search?${qs}`);
  if (res?.data) {
    return {
      products: transformProducts(res.data),
      total: res.total || 0,
      page: res.page || 1,
      limit: res.limit || 20,
      totalPages: res.totalPages || 1
    };
  }

  return { products: [], total: 0, page: 1, limit: 20, totalPages: 1 };
}

/** Fetch featured products */
export async function fetchFeaturedProducts(limit = 10) {
  const res = await v2Request(`/products/featured?limit=${limit}`);
  if (res?.data) return transformProducts(res.data);

  return [];
}

/** Fetch new products */
export async function fetchNewProducts(limit = 10) {
  const res = await v2Request(`/products/new?limit=${limit}`);
  if (res?.data) return transformProducts(res.data);

  return [];
}

/** Fetch best-selling products */
export async function fetchBestsellers(limit = 10, categoryId = null) {
  let url = `/products/bestsellers?limit=${limit}`;
  if (categoryId) url += `&category_id=${encodeURIComponent(categoryId)}`;
  const res = await v2Request(url);
  if (res?.data) return transformProducts(res.data);

  return [];
}

/** Fetch related products (by same category) */
export async function fetchRelatedProducts(productId, limit = 6) {
  const res = await v2Request(`/products/${encodeURIComponent(productId)}/related?limit=${limit}`);
  if (res?.data) return transformProducts(res.data);
  return [];
}

// ============================================================
//  Admin CRUD API
// ============================================================

/** Create a product in PostgreSQL via admin API */
export async function createProductV2(data) {
  let categorySlug = data.category_slug || '';
  if (!categorySlug && data.category) {
    categorySlug = await resolveCategorySlug(data.category) || '';
  }

  const transformed = {
    name_vi: data.name,
    slug: data.slug || slugify(data.name) + '-' + Date.now(),
    base_price: Number(data.price) || 0,
    sale_price: Number(data.oldPrice) || 0,
    category_slug: categorySlug,
    brand: data.brand || '',
    primary_image_url: data.image || '',
    description_vi: data.description || '',
    is_active: true
  };

  const res = await v2Request('/admin/products', {
    method: 'POST',
    body: JSON.stringify({ product: transformed })
  });
  if (res?.data) return transformProduct(res.data);
  throw new Error('Failed to create product via PostgreSQL');
}

/** Update a product in PostgreSQL via admin API */
export async function updateProductV2(id, patch) {
  const transformed = {};
  if (patch.name !== undefined) transformed.name_vi = patch.name;
  if (patch.price !== undefined) transformed.base_price = Number(patch.price);
  if (patch.oldPrice !== undefined) transformed.sale_price = Number(patch.oldPrice);
  if (patch.stock !== undefined) transformed.stock = Number(patch.stock);
  if (patch.image !== undefined) transformed.primary_image_url = patch.image;
  if (patch.description !== undefined) transformed.description_vi = patch.description;
  if (patch.brand !== undefined) transformed.brand = patch.brand;
  if (patch.category !== undefined) transformed.category_slug = patch.category;

  const res = await v2Request(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(transformed)
  });
  if (res?.data) return transformProduct(res.data);
  throw new Error('Failed to update product via PostgreSQL');
}

/** Delete a product from PostgreSQL via admin API */
export async function deleteProductV2(id) {
  const res = await v2Request(`/admin/products/${id}`, { method: 'DELETE' });
  if (res?.ok) return true;
  throw new Error('Failed to delete product via PostgreSQL');
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ============================================================
//  Cache Control
// ============================================================

/** Invalidate the categories cache (useful after admin changes) */
export function invalidateCategoryCache() {
  cachedCategories = null;
}

export default {
  isV2ApiConfigured,
  fetchCategories,
  fetchCategoryTree,
  fetchCategoryBySlug,
  resolveCategorySlug,
  fetchProducts,
  fetchProductBySlug,
  searchProductsV2,
  fetchFeaturedProducts,
  fetchNewProducts,
  fetchBestsellers,
  fetchRelatedProducts,
  createProductV2,
  updateProductV2,
  deleteProductV2,
  invalidateCategoryCache
};
