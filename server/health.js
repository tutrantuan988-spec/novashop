const stripe = require('stripe');

async function checkStripe(secretKey) {
  if (!secretKey) return { ok: false, reason: 'missing-key' };
  try {
    const s = stripe(secretKey);
    // Lightweight call
    await s.paymentMethods.list({ limit: 1 });
    return { ok: true };
  } catch (err) {
    if (err.type === 'StripeAuthenticationError') {
      return { ok: false, reason: 'invalid-key' };
    }
    return { ok: false, reason: err.message };
  }
}

async function checkFirestore(adminDb) {
  if (!adminDb) return { ok: false, reason: 'not-initialized' };
  try {
    // Lightweight ping
    await adminDb.collection('health').doc('ping').get();
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

async function checkEmail() {
  if (!process.env.RESEND_API_KEY) return { ok: false, reason: 'missing-key', skipped: true };
  return { ok: true };
}

async function buildHealth(adminDb) {
  const [stripeStatus, firestoreStatus, emailStatus] = await Promise.all([
    checkStripe(process.env.STRIPE_SECRET_KEY),
    checkFirestore(adminDb),
    checkEmail()
  ]);

  const healthy = stripeStatus.ok && firestoreStatus.ok;

  return {
    status: healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      stripe: stripeStatus,
      firestore: firestoreStatus,
      email: emailStatus
    }
  };
}

module.exports = { buildHealth };
