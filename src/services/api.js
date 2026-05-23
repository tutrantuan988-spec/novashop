const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
export const isBackendConfigured = () =>
  !!import.meta.env.VITE_API_URL || !import.meta.env.PROD;
const ADMIN_SESSION_KEY = 'trongdinhstore:adminToken';
const LOCAL_ORDERS_KEY = 'trongdinhstore:localOrders';

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

export function isFallback(result) {
  return result && typeof result === 'object' && result.fallback === true;
}

async function request(path, { method = 'GET', body, adminEmail, adminToken, headers = {} } = {}) {
  try {
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
    if (res.status === 404 && !import.meta.env.VITE_API_URL) {
      throw new Error('Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.');
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const err = new Error(data.error || `Yêu cầu thất bại (${res.status})`);
      err.status = res.status;
      err.code = data.code || null;
      err.insufficientItems = data.insufficientItems || null;
      throw err;
    }
    return res.json();
  } catch (err) {
    if (err.name === 'TypeError') { // network error
      throw new Error('Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }
    throw err;
  }
}

const api = {
  get(path, options = {}) {
    return request(path.startsWith('/') ? path : `/${path}`, { ...options, method: 'GET' });
  },
  post(path, body, options = {}) {
    return request(path.startsWith('/') ? path : `/${path}`, { ...options, method: 'POST', body });
  },
  put(path, body, options = {}) {
    return request(path.startsWith('/') ? path : `/${path}`, { ...options, method: 'PUT', body });
  },
  patch(path, body, options = {}) {
    return request(path.startsWith('/') ? path : `/${path}`, { ...options, method: 'PATCH', body });
  },
  delete(path, options = {}) {
    return request(path.startsWith('/') ? path : `/${path}`, { ...options, method: 'DELETE' });
  },
};

export default api;

function createLocalOrder(order) {
  const id = `TD${Date.now().toString(36).toUpperCase()}`;
  const saved = {
    id,
    ...order,
    status: 'pending',
    createdAt: new Date().toISOString(),
    source: 'local'
  };
  if (typeof window !== 'undefined') {
    try {
      const all = JSON.parse(window.localStorage.getItem(LOCAL_ORDERS_KEY) || '[]');
      window.localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify([saved, ...all]));
    } catch {}
  }
  return saved;
}

function isStaticApiFailure(error) {
  return error?.status === 404 || error?.status === 405 || /failed|network|fetch|404/i.test(error?.message || '');
}

export async function createOrderApi(order) {
  try {
    return await request('/api/orders', { method: 'POST', body: { order } });
  } catch (error) {
    if (isStaticApiFailure(error)) return createLocalOrder(order);
    throw error;
  }
}

// ===== Guest Checkout (P4) =====
export function createGuestOrderApi(order) {
  return request('/api/checkout/guest', { method: 'POST', body: { order } });
}

export function trackOrderApi(token) {
  return request(`/api/track-order?token=${encodeURIComponent(token)}`);
}

const GUEST_TOKEN_KEY = 'novashop:guestTokens';

export function saveGuestToken(orderId, token) {
  if (typeof window === 'undefined') return;
  try {
    const all = JSON.parse(window.localStorage.getItem(GUEST_TOKEN_KEY) || '{}');
    all[orderId] = token;
    window.localStorage.setItem(GUEST_TOKEN_KEY, JSON.stringify(all));
  } catch {}
}

export function listGuestTokens() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(GUEST_TOKEN_KEY) || '{}');
  } catch {
    return {};
  }
}

// ===== Product Variants (P2) =====
export function listVariantsApi(productId) {
  return request(`/api/products/${encodeURIComponent(productId)}/variants`);
}

export function createVariantApi(productId, variant, adminEmail) {
  return request(`/api/products/${encodeURIComponent(productId)}/variants`, {
    method: 'POST',
    body: { variant },
    adminEmail
  });
}

export function updateVariantApi(productId, variantId, variant, adminEmail) {
  return request(`/api/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`, {
    method: 'PUT',
    body: { variant },
    adminEmail
  });
}

export function deleteVariantApi(productId, variantId, adminEmail) {
  return request(`/api/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`, {
    method: 'DELETE',
    adminEmail
  });
}

// ===== Returns & Refunds (P7) =====
export function createReturnApi(returnRequest) {
  return request('/api/returns', { method: 'POST', body: { returnRequest } });
}

export function listReturnsApi({ userId, adminEmail } = {}) {
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return request(`/api/returns${qs}`, { adminEmail });
}

export function approveReturnApi(id, { adminNote, refundAmount } = {}, adminEmail) {
  return request(`/api/returns/${encodeURIComponent(id)}/approve`, {
    method: 'PUT',
    body: { adminNote, refundAmount },
    adminEmail
  });
}

export function rejectReturnApi(id, adminNote, adminEmail) {
  return request(`/api/returns/${encodeURIComponent(id)}/reject`, {
    method: 'PUT',
    body: { adminNote },
    adminEmail
  });
}

// ===== Addresses (P13) =====
export function listAddressesApi(userId) {
  return request(`/api/addresses?userId=${encodeURIComponent(userId)}`);
}

export function createAddressApi(address) {
  return request('/api/addresses', { method: 'POST', body: { address } });
}

export function updateAddressApi(id, address) {
  return request(`/api/addresses/${encodeURIComponent(id)}`, { method: 'PUT', body: { address } });
}

export function deleteAddressApi(id, userId) {
  return request(`/api/addresses/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE'
  });
}

export function setDefaultAddressApi(id, userId) {
  return request(`/api/addresses/${encodeURIComponent(id)}/default`, {
    method: 'PUT',
    body: { userId }
  });
}

// ===== Notifications (P12) =====
export function listNotificationsApi(userId) {
  return request(`/api/notifications?userId=${encodeURIComponent(userId)}`);
}

export function markNotificationReadApi(id) {
  return request(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PUT' });
}

export function markAllNotificationsReadApi(userId) {
  return request('/api/notifications/mark-all-read', { method: 'POST', body: { userId } });
}

// ===== Cart Sync (P6) =====
export function syncCartApi(userId, email, items) {
  return request('/api/cart/sync', { method: 'POST', body: { userId, email, items } });
}

export function markCartCheckedOutApi(userId) {
  return request('/api/cart/checkout', { method: 'POST', body: { userId } });
}

// ===== GHN Shipping (P14) =====
export function calculateShippingFeeApi(payload) {
  return request('/api/shipping/calculate', { method: 'POST', body: payload });
}

export function createShipmentApi(order, adminEmail) {
  return request('/api/shipping/create', { method: 'POST', body: { order }, adminEmail });
}

export function trackShipmentApi(orderCode) {
  return request(`/api/shipping/track/${encodeURIComponent(orderCode)}`);
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

export function getIntegrationsStatusApi(adminEmail) {
  return request('/api/integrations/status', { adminEmail });
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

export async function listMyPgOrdersApi() {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE}/api/orders/pg`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load orders');
  }
  return res.json();
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

// ===== PostgreSQL Cart API (Commerce Core) =====
// Session ID is stored in localStorage; generated on first visit
export function getSessionId() {
  if (typeof window === 'undefined') return '';
  let sid = window.localStorage.getItem('novashop:sessionId');
  if (!sid) {
    sid = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
    window.localStorage.setItem('novashop:sessionId', sid);
  }
  return sid;
}

export async function fetchPgCart() {
  const sid = getSessionId();
  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/cart?session_id=${encodeURIComponent(sid)}`, { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load cart');
  }
  return res.json();
}

export async function addToPgCart(productId, { variantId, quantity } = {}) {
  const sid = getSessionId();
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/cart/add`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ session_id: sid, product_id: productId, variant_id: variantId || null, quantity: quantity || 1 })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to add to cart');
  }
  return res.json();
}

export async function updatePgCartItem(itemId, quantity) {
  const res = await fetch(`${API_BASE}/api/cart/item/${encodeURIComponent(itemId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update cart item');
  }
  return res.json();
}

export async function removePgCartItem(itemId) {
  const res = await fetch(`${API_BASE}/api/cart/item/${encodeURIComponent(itemId)}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to remove cart item');
  }
  return res.json();
}

export async function clearPgCart() {
  const sid = getSessionId();
  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/cart?session_id=${encodeURIComponent(sid)}`, {
    method: 'DELETE',
    headers
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to clear cart');
  }
  return res.json();
}

export async function checkoutPgCart({ customer_name, customer_phone, customer_email, shipping_address, payment_method, notes }) {
  const sid = getSessionId();
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/checkout`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ session_id: sid, customer_name, customer_phone, customer_email, shipping_address, payment_method: payment_method || 'cod', notes })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || 'Checkout failed');
    err.code = data.code;
    err.insufficient_items = data.insufficient_items;
    throw err;
  }
  return res.json();
}

export async function fetchPgOrders({ limit, offset } = {}) {
  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit);
  if (offset) params.set('offset', offset);
  const res = await fetch(`${API_BASE}/api/orders/pg?${params.toString()}`, { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load orders');
  }
  return res.json();
}

// ===== PostgreSQL Auth API (Commerce Core) =====
const AUTH_TOKEN_KEY = 'novashop:authToken';

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token) {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function clearAuthToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function authRequest(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function registerApi({ email, password, full_name }) {
  return authRequest('/api/auth/register', {
    method: 'POST',
    body: { email, password, full_name }
  });
}

export async function loginApi({ email, password }) {
  return authRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password }
  });
}

export async function loginWithGoogleApi(idToken) {
  return authRequest('/api/auth/google', {
    method: 'POST',
    body: { idToken }
  });
}

export async function getMeApi() {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    if (res.status === 401) clearAuthToken();
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Session expired');
  }
  return res.json();
}

export async function updateProfileApi(data) {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE}/api/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update profile');
  }
  return res.json();
}

export async function changePasswordApi(currentPassword, newPassword) {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE}/api/auth/change-password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to change password');
  }
  return res.json();
}

export async function fetchPgOrderDetail(orderId) {
  const token = getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/orders/pg/${encodeURIComponent(orderId)}`, { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load order');
  }
  return res.json();
}
