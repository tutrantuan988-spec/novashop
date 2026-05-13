/**
 * Guest order token (HMAC-signed JSON, no JWT dependency).
 *
 * Format: base64url(payload).base64url(signature)
 * Payload: { orderId, email, exp }
 */

const crypto = require('crypto');

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 ngày

function getSecret() {
  return process.env.GUEST_TOKEN_SECRET
    || process.env.ADMIN_API_TOKEN
    || 'novashop_guest_default_secret_change_me';
}

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  const pad = 4 - (str.length % 4);
  const padded = str + (pad < 4 ? '='.repeat(pad) : '');
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/**
 * Generate guest token.
 * @param {{ orderId: string, email: string, ttl?: number }} input
 */
function generateGuestToken({ orderId, email, ttl = DEFAULT_TTL_SECONDS }) {
  if (!orderId) throw new Error('orderId is required');
  const payload = {
    orderId: String(orderId),
    email: String(email || ''),
    exp: Math.floor(Date.now() / 1000) + ttl
  };
  const payloadStr = base64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', getSecret()).update(payloadStr).digest();
  const sigStr = base64url(sig);
  return `${payloadStr}.${sigStr}`;
}

/**
 * Verify token. Returns payload if valid, throws on invalid/expired.
 */
function verifyGuestToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    throw new Error('Invalid token format');
  }
  const [payloadStr, sigStr] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', getSecret()).update(payloadStr).digest();
  const providedSig = base64urlDecode(sigStr);

  // timing-safe compare
  if (
    expectedSig.length !== providedSig.length
    || !crypto.timingSafeEqual(expectedSig, providedSig)
  ) {
    throw new Error('Invalid signature');
  }

  const payload = JSON.parse(base64urlDecode(payloadStr).toString('utf8'));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  return payload;
}

module.exports = {
  generateGuestToken,
  verifyGuestToken
};
