/**
 * Stripe Refund Service (P7).
 *
 * Auto-refund khi return request được approve.
 */

function isStripeAvailable(stripe) {
  return !!stripe;
}

/**
 * Issue refund via Stripe.
 * @param {import('stripe').Stripe|null} stripe
 * @param {{ paymentIntentId: string, amount?: number, reason?: string, metadata?: object }} payload
 *   amount: VND (integer, sẽ convert). Bỏ qua nếu refund toàn phần.
 */
async function issueStripeRefund(stripe, { paymentIntentId, amount, reason = 'requested_by_customer', metadata = {} }) {
  if (!isStripeAvailable(stripe)) {
    return { ok: false, error: 'Stripe chưa được cấu hình' };
  }
  if (!paymentIntentId) {
    return { ok: false, error: 'Thiếu paymentIntentId' };
  }
  try {
    const payload = {
      payment_intent: paymentIntentId,
      reason,
      metadata
    };
    if (typeof amount === 'number' && amount > 0) {
      // Stripe đang dùng currency VND → amount = số nguyên VND (no zero-decimal)
      payload.amount = Math.round(amount);
    }
    const refund = await stripe.refunds.create(payload);
    return { ok: true, refundId: refund.id, status: refund.status, amount: refund.amount };
  } catch (err) {
    console.error('[Refund] Stripe error:', err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = {
  issueStripeRefund
};
