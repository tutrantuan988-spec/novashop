import { getAdminSessionToken } from './api';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

function getToken() {
  if (typeof window === 'undefined') return '';
  return window.sessionStorage.getItem('trongdinhstore:adminToken') || '';
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// Products
export function getProducts(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return fetchJson(`${API_BASE}/api/v1/products?${qs}`);
}

export function getProductBySlug(slug) {
  return fetchJson(`${API_BASE}/api/v1/products/${slug}`);
}

export function getRelatedProducts(slug) {
  return fetchJson(`${API_BASE}/api/v1/products/${slug}/related`);
}

export function getFeaturedProducts() {
  return fetchJson(`${API_BASE}/api/v1/products/featured`);
}

export function getCategories() {
  return fetchJson(`${API_BASE}/api/v1/products/categories`);
}

// Orders
export function createOrder(body) {
  return fetchJson(`${API_BASE}/api/v1/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body)
  });
}

export function getMyOrders(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return fetchJson(`${API_BASE}/api/v1/orders/my-orders?${qs}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
}

export function getOrderByCode(code) {
  return fetchJson(`${API_BASE}/api/v1/orders/${code}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
}

// Users
export function getProfile() {
  return fetchJson(`${API_BASE}/api/v1/users/profile`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
}

export function updateProfile(body) {
  return fetchJson(`${API_BASE}/api/v1/users/profile`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body)
  });
}

export function getWishlist() {
  return fetchJson(`${API_BASE}/api/v1/users/wishlist`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
}

export function toggleWishlist(productId) {
  return fetchJson(`${API_BASE}/api/v1/users/wishlist`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ productId })
  });
}

// Admin
export function getAdminStats() {
  return fetchJson(`${API_BASE}/api/v1/admin/stats`, {
    headers: { Authorization: `Bearer ${getAdminSessionToken()}` }
  });
}

export function getAdminOrders(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return fetchJson(`${API_BASE}/api/v1/admin/orders?${qs}`, {
    headers: { Authorization: `Bearer ${getAdminSessionToken()}` }
  });
}

export function updateOrderStatus(id, body) {
  return fetchJson(`${API_BASE}/api/v1/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${getAdminSessionToken()}` },
    body: JSON.stringify(body)
  });
}

export function createProduct(body) {
  return fetchJson(`${API_BASE}/api/v1/admin/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAdminSessionToken()}` },
    body: JSON.stringify(body)
  });
}

export function updateProduct(id, body) {
  return fetchJson(`${API_BASE}/api/v1/admin/products/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${getAdminSessionToken()}` },
    body: JSON.stringify(body)
  });
}

export function deleteProduct(id) {
  return fetchJson(`${API_BASE}/api/v1/admin/products/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getAdminSessionToken()}` }
  });
}
