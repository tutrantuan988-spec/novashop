/**
 * Algolia sync utilities (P8).
 *
 * Khi không có env ALGOLIA_* → mọi function no-op + log warning.
 * Khi có → sync product records lên Algolia index.
 */

let algoliaIndex = null;
let initialized = false;

function isAlgoliaConfigured() {
  const values = [
    process.env.ALGOLIA_APP_ID,
    process.env.ALGOLIA_ADMIN_API_KEY,
    process.env.ALGOLIA_INDEX_NAME
  ];
  return values.every((value) => value && value !== 'your_key_here');
}

function getIndex() {
  if (initialized) return algoliaIndex;
  initialized = true;
  if (!isAlgoliaConfigured()) {
    console.log('[Algolia] Not configured — sync disabled');
    return null;
  }
  try {
    // Lazy require — không bắt buộc cài algoliasearch nếu không dùng
    // eslint-disable-next-line global-require
    const algoliasearch = require('algoliasearch');
    const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_API_KEY);
    algoliaIndex = client.initIndex(process.env.ALGOLIA_INDEX_NAME);
    console.log('[Algolia] Index ready:', process.env.ALGOLIA_INDEX_NAME);
    return algoliaIndex;
  } catch (err) {
    console.warn('[Algolia] Init failed:', err.message);
    return null;
  }
}

function toAlgoliaRecord(productId, product) {
  return {
    objectID: String(productId),
    name: product.name || '',
    description: product.description || '',
    price: Number(product.price) || 0,
    originalPrice: Number(product.originalPrice) || 0,
    brand: product.brand || '',
    category: product.category || '',
    rating: Number(product.rating) || 0,
    sold: Number(product.sold) || 0,
    stock: Number(product.stock) || 0,
    image: product.image || (Array.isArray(product.images) ? product.images[0] : ''),
    status: product.status || (product.stock > 0 ? 'active' : 'out_of_stock'),
    slug: product.slug || ''
  };
}

async function indexProduct(productId, product) {
  const index = getIndex();
  if (!index) return { skipped: true };
  try {
    await index.saveObject(toAlgoliaRecord(productId, product));
    return { ok: true };
  } catch (err) {
    console.warn('[Algolia] saveObject failed:', err.message);
    return { error: err.message };
  }
}

async function removeProduct(productId) {
  const index = getIndex();
  if (!index) return { skipped: true };
  try {
    await index.deleteObject(String(productId));
    return { ok: true };
  } catch (err) {
    console.warn('[Algolia] deleteObject failed:', err.message);
    return { error: err.message };
  }
}

async function bulkSync(products) {
  const index = getIndex();
  if (!index) return { skipped: true };
  try {
    const records = products.map((p) => toAlgoliaRecord(p.id, p));
    await index.saveObjects(records);
    return { ok: true, count: records.length };
  } catch (err) {
    console.warn('[Algolia] bulkSync failed:', err.message);
    return { error: err.message };
  }
}

module.exports = {
  isAlgoliaConfigured,
  indexProduct,
  removeProduct,
  bulkSync
};
