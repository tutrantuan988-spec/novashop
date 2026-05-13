/**
 * Unified search client (P8).
 *
 * - Nếu có VITE_ALGOLIA_APP_ID + VITE_ALGOLIA_SEARCH_KEY → dùng Algolia (instant search)
 * - Else fallback /api/search endpoint của backend
 */

const ALGOLIA_APP_ID = import.meta.env.VITE_ALGOLIA_APP_ID;
const ALGOLIA_SEARCH_KEY = import.meta.env.VITE_ALGOLIA_SEARCH_KEY;
const ALGOLIA_INDEX_NAME = import.meta.env.VITE_ALGOLIA_INDEX_NAME || 'products';

let algoliaClient = null;

async function getAlgoliaIndex() {
  if (!ALGOLIA_APP_ID || !ALGOLIA_SEARCH_KEY) return null;
  if (algoliaClient) return algoliaClient;
  try {
    const mod = await import('algoliasearch/lite');
    const algoliasearch = mod.default || mod;
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
    algoliaClient = client.initIndex(ALGOLIA_INDEX_NAME);
    return algoliaClient;
  } catch (err) {
    console.warn('[Search] Algolia init failed:', err.message);
    return null;
  }
}

/**
 * Search products.
 * @param {string} query
 * @param {{ filters?: object, hitsPerPage?: number, page?: number }} options
 * @returns {Promise<{ hits: Array, total: number, source: 'algolia'|'firestore' }>}
 */
export async function searchProducts(query, options = {}) {
  const { hitsPerPage = 20, page = 0, filters = {} } = options;
  const trimmed = String(query || '').trim();

  // Try Algolia first
  const index = await getAlgoliaIndex();
  if (index && trimmed) {
    try {
      const facetFilters = [];
      if (filters.brand) facetFilters.push(`brand:${filters.brand}`);
      if (filters.category) facetFilters.push(`category:${filters.category}`);
      const numericFilters = [];
      if (filters.minPrice) numericFilters.push(`price >= ${filters.minPrice}`);
      if (filters.maxPrice) numericFilters.push(`price <= ${filters.maxPrice}`);
      if (filters.minRating) numericFilters.push(`rating >= ${filters.minRating}`);

      const result = await index.search(trimmed, {
        hitsPerPage,
        page,
        facetFilters,
        numericFilters
      });
      return { hits: result.hits, total: result.nbHits, source: 'algolia' };
    } catch (err) {
      console.warn('[Search] Algolia failed, fallback:', err.message);
    }
  }

  // Fallback: backend API
  const params = new URLSearchParams({ q: trimmed, limit: String(hitsPerPage) });
  const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
  try {
    const res = await fetch(`${API_BASE}/api/search?${params}`);
    if (!res.ok) throw new Error(`Search failed (${res.status})`);
    const data = await res.json();
    let hits = data.hits || [];
    // Apply filters client-side
    if (filters.brand) hits = hits.filter((p) => p.brand === filters.brand);
    if (filters.category) hits = hits.filter((p) => p.category === filters.category);
    if (filters.minPrice) hits = hits.filter((p) => (p.price || 0) >= filters.minPrice);
    if (filters.maxPrice) hits = hits.filter((p) => (p.price || 0) <= filters.maxPrice);
    if (filters.minRating) hits = hits.filter((p) => (p.rating || 0) >= filters.minRating);
    return { hits, total: hits.length, source: 'firestore' };
  } catch (err) {
    console.warn('[Search] Fallback failed:', err.message);
    return { hits: [], total: 0, source: 'firestore' };
  }
}

export const isAlgoliaEnabled = () => !!(ALGOLIA_APP_ID && ALGOLIA_SEARCH_KEY);
