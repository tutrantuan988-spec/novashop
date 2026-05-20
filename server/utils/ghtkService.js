const GHTK_API_BASE = 'https://services.giaohangtietkiem.vn/services';

/**
 * GHTK Shipping Service
 *
 * Required env variables:
 *   GHTK_TOKEN - API token from GHTK
 *
 * Usage:
 *   const ghtk = require('./ghtkService');
 *   const fee = await ghtk.calculateFee({ from_district, to_district, weight, value, deliver });
 */

function getHeaders() {
  const token = process.env.GHTK_TOKEN;
  if (!token) throw new Error('GHTK_TOKEN is not configured');
  return {
    'Content-Type': 'application/json',
    'Token': token,
    'Accept': 'application/json'
  };
}

/**
 * Calculate shipping fee
 * @param {Object} params
 * @param {string} params.from_district - District ID of sender
 * @param {string} params.to_district - District ID of receiver
 * @param {number} params.weight - Weight in grams
 * @param {number} params.value - Order value in VND
 * @param {boolean} params.deliver - Whether to deliver (true) or pickup (false)
 * @returns {Promise<Object>} { fee, insurance_fee, total }
 */
async function calculateFee({ from_district, to_district, weight, value, deliver = true }) {
  const params = new URLSearchParams({
    from_district,
    to_district,
    weight: String(weight),
    value: String(value),
    deliver: deliver ? 'true' : 'false'
  });

  const res = await fetch(`${GHTK_API_BASE}/shipment/fee?${params}`, {
    headers: getHeaders()
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'GHTK API error' }));
    throw new Error(error.message || 'Failed to calculate GHTK fee');
  }

  const data = await res.json();
  return {
    fee: data.fee || 0,
    insurance_fee: data.insurance_fee || 0,
    total: (data.fee || 0) + (data.insurance_fee || 0)
  };
}

/**
 * Create a shipment order
 * @param {Object} orderData
 * @returns {Promise<Object>}
 */
async function createOrder(orderData) {
  const res = await fetch(`${GHTK_API_BASE}/shipment/v2/create`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(orderData)
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'GHTK API error' }));
    throw new Error(error.message || 'Failed to create GHTK order');
  }

  return res.json();
}

/**
 * Track a shipment
 * @param {string} trackingId - GHTK tracking ID
 * @returns {Promise<Object>}
 */
async function trackOrder(trackingId) {
  const res = await fetch(`${GHTK_API_BASE}/shipment/v2/${trackingId}`, {
    headers: getHeaders()
  });

  if (!res.ok) {
    throw new Error('Failed to track GHTK shipment');
  }

  return res.json();
}

/**
 * Get available provinces/districts from GHTK
 * @returns {Promise<Array>}
 */
async function getProvinces() {
  const res = await fetch(`${GHTK_API_BASE}/address/provinces`, {
    headers: getHeaders()
  });

  if (!res.ok) {
    throw new Error('Failed to fetch GHTK provinces');
  }

  return res.json();
}

/**
 * Get districts by province code
 * @param {string} provinceCode
 * @returns {Promise<Array>}
 */
async function getDistricts(provinceCode) {
  const res = await fetch(`${GHTK_API_BASE}/address/districts?province=${provinceCode}`, {
    headers: getHeaders()
  });

  if (!res.ok) {
    throw new Error('Failed to fetch GHTK districts');
  }

  return res.json();
}

/**
 * Check if GHTK is configured
 * @returns {boolean}
 */
function isConfigured() {
  return !!(process.env.GHTK_TOKEN && process.env.GHTK_TOKEN.length > 10);
}

module.exports = {
  calculateFee,
  createOrder,
  trackOrder,
  getProvinces,
  getDistricts,
  isConfigured
};
