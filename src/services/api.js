const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
const ADMIN_SESSION_KEY = 'trongdinhstore:adminToken';

export function getAdminSessionToken() {
  if (typeof window === 'undefined') return '';
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) || '';
}

export function setAdminSessionToken(token) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(ADMIN_SESSION_KEY, token);
}

export function clearAdminSessionToken() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

async function request(path, { method = 'GET', body, adminEmail, adminToken, headers = {} } = {}) {
  const finalHeaders = { 'Content-Type': 'application/json', ...headers };
  if (adminEmail) {
    finalHeaders['x-admin-email'] = adminEmail;
    const token = adminToken ?? getAdminSessionToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Yêu cầu thất bại (${res.status})`);
  }
  return res.json();
}

export function createOrderApi(order) {
  return request('/api/orders', { method: 'POST', body: { order } });
}

export function createCheckoutSession({ items, orderId, customerEmail }) {
  return request('/api/create-checkout-session', {
    method: 'POST',
    body: { items, orderId, customerEmail }
  });
}

// Admin auth
export function getAdminConfigApi() {
  return request('/api/admin/config');
}

export function verifyAdminApi(adminEmail, adminToken) {
  return request('/api/admin/verify', { adminEmail, adminToken });
}

// Products
export function listProductsApi() {
  return request('/api/products');
}

export function createProductApi(product, adminEmail) {
  return request('/api/products', { method: 'POST', body: { product }, adminEmail });
}

export function updateProductApi(id, patch, adminEmail) {
  return request(`/api/products/${id}`, { method: 'PATCH', body: { patch }, adminEmail });
}

export function deleteProductApi(id, adminEmail) {
  return request(`/api/products/${id}`, { method: 'DELETE', adminEmail });
}

// Orders
export function listOrdersApi(adminEmail) {
  return request('/api/orders', { adminEmail });
}

export function listMyOrdersApi(email) {
  return request(`/api/orders/mine?email=${encodeURIComponent(email)}`);
}

export function getOrderSummaryApi(id) {
  return request(`/api/orders/${id}/summary`);
}

export function updateOrderStatusApi(id, status, adminEmail) {
  return request(`/api/orders/${id}/status`, { method: 'PATCH', body: { status }, adminEmail });
}

export function updateOrderShippingApi(id, shippingInfo, adminEmail) {
  return request(`/api/orders/${id}/shipping`, { method: 'PATCH', body: { shippingInfo }, adminEmail });
}

// Analytics
export function getAnalyticsApi(adminEmail, days = 30) {
  return request(`/api/analytics/summary?days=${days}`, { adminEmail });
}

// VN Payments
export function createVnpayPayment(orderId) {
  return request('/api/payments/vnpay/create', { method: 'POST', body: { orderId } });
}

export function createMomoPayment(orderId) {
  return request('/api/payments/momo/create', { method: 'POST', body: { orderId } });
}

// Coupons
export function listCouponsApi(adminEmail) {
  return request('/api/coupons', { adminEmail });
}

export function createCouponApi(coupon, adminEmail) {
  return request('/api/coupons', { method: 'POST', body: { coupon }, adminEmail });
}

export function updateCouponApi(code, patch, adminEmail) {
  return request(`/api/coupons/${code}`, { method: 'PATCH', body: { patch }, adminEmail });
}

export function deleteCouponApi(code, adminEmail) {
  return request(`/api/coupons/${code}`, { method: 'DELETE', adminEmail });
}

export function validateCouponApi(code, subtotal) {
  return request('/api/coupons/validate', { method: 'POST', body: { code, subtotal } });
}

// Reviews
export function listReviewsApi(productId) {
  return request(`/api/products/${productId}/reviews`);
}

export function createReviewApi(productId, review) {
  return request(`/api/products/${productId}/reviews`, { method: 'POST', body: { review } });
}

export function deleteReviewApi(productId, reviewId, adminEmail) {
  return request(`/api/products/${productId}/reviews/${reviewId}`, { method: 'DELETE', adminEmail });
}
