/**
 * GHN Shipping Service (P14).
 *
 * Free sandbox: https://api-sandbox.ghn.dev/shiip/public-api
 * Production: https://online-gateway.ghn.vn/shiip/public-api
 *
 * Env vars:
 *  - GHN_API_TOKEN: API token (required)
 *  - GHN_SHOP_ID: shop ID đăng ký với GHN
 *  - GHN_API_URL: override base URL (mặc định production)
 */

const DEFAULT_BASE_URL = 'https://online-gateway.ghn.vn/shiip/public-api';

function isGhnConfigured() {
  return !!process.env.GHN_API_TOKEN;
}

function getBaseUrl() {
  return process.env.GHN_API_URL || DEFAULT_BASE_URL;
}

function commonHeaders() {
  return {
    'Content-Type': 'application/json',
    Token: process.env.GHN_API_TOKEN,
    ...(process.env.GHN_SHOP_ID && { ShopId: process.env.GHN_SHOP_ID })
  };
}

async function ghnFetch(path, options = {}) {
  if (!isGhnConfigured()) {
    return { ok: false, code: 'NOT_CONFIGURED', message: 'GHN_API_TOKEN chưa cấu hình' };
  }
  try {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      method: options.method || 'POST',
      headers: { ...commonHeaders(), ...(options.headers || {}) },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json();
    if (data.code !== 200) {
      return { ok: false, code: data.code, message: data.message || 'GHN error', raw: data };
    }
    return { ok: true, data: data.data };
  } catch (err) {
    console.error('[GHN] fetch error:', err.message);
    return { ok: false, code: 'NETWORK', message: err.message };
  }
}

/**
 * Calculate shipping fee.
 * @param {{ from_district_id: number, to_district_id: number, to_ward_code: string, weight: number, height?: number, length?: number, width?: number, service_type_id?: number }} payload
 */
async function calculateShippingFee(payload) {
  return ghnFetch('/v2/shipping-order/fee', {
    method: 'POST',
    body: {
      service_type_id: 2, // 2 = standard, 1 = express
      height: 20,
      length: 20,
      weight: 500,
      width: 20,
      ...payload
    }
  });
}

/**
 * Create a GHN shipment.
 * @param {object} order  must include items, shipping address with district_id, ward_code
 */
async function createShipment(order) {
  if (!order?.shippingAddress) {
    return { ok: false, code: 'INVALID', message: 'Thiếu shippingAddress' };
  }
  const totalWeight = (order.items || []).reduce((sum, it) => sum + (Number(it.weight) || 500) * (it.quantity || 1), 0);
  const payload = {
    payment_type_id: order.paymentStatus === 'paid' ? 1 : 2,
    note: order.note || '',
    required_note: 'KHONGCHOXEMHANG',
    to_name: order.customer?.name,
    to_phone: order.customer?.phone,
    to_address: order.shippingAddress.street,
    to_ward_code: order.shippingAddress.ward_code,
    to_district_id: order.shippingAddress.district_id,
    weight: totalWeight,
    length: 20,
    width: 20,
    height: 20,
    service_type_id: 2,
    items: (order.items || []).map((it) => ({
      name: it.name,
      code: String(it.id || it.productId),
      quantity: it.quantity || 1,
      price: it.price || 0,
      weight: it.weight || 500
    }))
  };
  return ghnFetch('/v2/shipping-order/create', {
    method: 'POST',
    body: payload
  });
}

/**
 * Get tracking status.
 */
async function getTrackingStatus(orderCode) {
  return ghnFetch('/v2/shipping-order/detail', {
    method: 'POST',
    body: { order_code: orderCode }
  });
}

/**
 * Cancel shipment.
 */
async function cancelShipment(orderCode) {
  return ghnFetch('/v2/switch-status/cancel', {
    method: 'POST',
    body: { order_codes: [orderCode] }
  });
}

module.exports = {
  isGhnConfigured,
  calculateShippingFee,
  createShipment,
  getTrackingStatus,
  cancelShipment
};
