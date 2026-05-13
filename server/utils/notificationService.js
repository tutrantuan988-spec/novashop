/**
 * Notification Service (P12).
 *
 * - createNotification(adminDb, userId, type, data)
 * - Tự động trigger email cho order_status / return_update
 */

const { sendNotificationEmail } = require('../email');

/**
 * @param {import('firebase-admin/firestore').Firestore} adminDb
 * @param {string} userId
 * @param {'order_status'|'promotion'|'restock'|'return_update'} type
 * @param {{ title: string, body: string, targetUrl?: string, email?: string, ctaLabel?: string }} data
 */
async function createNotification(adminDb, userId, type, data) {
  if (!adminDb || !userId) return { skipped: true };
  try {
    const doc = {
      userId: String(userId),
      type,
      title: data.title || '',
      body: data.body || '',
      isRead: false,
      targetUrl: data.targetUrl || '',
      createdAt: new Date()
    };
    const ref = await adminDb.collection('notifications').add(doc);

    // Trigger email cho các type quan trọng
    if (['order_status', 'return_update'].includes(type) && data.email) {
      sendNotificationEmail({
        email: data.email,
        subject: doc.title,
        title: doc.title,
        body: doc.body,
        ctaUrl: data.targetUrl ? `${process.env.CLIENT_URL || ''}${data.targetUrl}` : undefined,
        ctaLabel: data.ctaLabel
      }).catch((e) => console.warn('[Notification] email failed:', e.message));
    }

    return { id: ref.id, ...doc };
  } catch (err) {
    console.warn('[Notification] create failed:', err.message);
    return { error: err.message };
  }
}

module.exports = { createNotification };
