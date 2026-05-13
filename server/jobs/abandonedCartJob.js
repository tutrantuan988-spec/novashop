/**
 * Abandoned Cart Recovery Job (P6).
 *
 * Logic:
 * - Mỗi giờ, query cart_items có addedAt > 1 giờ, user chưa checkout
 * - Lần 1 (sau 1h): email nhắc nhở thường
 * - Lần 2 (sau 24h): email nhắc + coupon 5%
 * - Sau lần 2 không gửi nữa
 *
 * Requires `node-cron`. Nếu chưa cài → skip + log warning.
 *
 * Trong app, cart hiện đang lưu localStorage → cần sync lên Firestore khi user login
 * để job này hoạt động. Hoặc skip nếu chưa có cart_items collection.
 */

const { sendAbandonedCartEmail } = require('../email');

const REMINDER_1_HOURS = 1;
const REMINDER_2_HOURS = 24;
const COUPON_2ND_REMINDER = process.env.ABANDONED_COUPON_CODE || 'COMEBACK5';

function getCronModule() {
  try {
    // eslint-disable-next-line global-require
    return require('node-cron');
  } catch {
    console.warn('[AbandonedCart] node-cron chưa được cài. Bỏ qua scheduler.');
    return null;
  }
}

async function runAbandonedCheck(adminDb) {
  if (!adminDb) return;
  const now = Date.now();
  const r1Cutoff = now - REMINDER_1_HOURS * 60 * 60 * 1000;
  const r2Cutoff = now - REMINDER_2_HOURS * 60 * 60 * 1000;

  // Query cart_items
  try {
    const snap = await adminDb
      .collection('cart_items')
      .where('checkedOut', '==', false)
      .limit(200)
      .get();

    const byUser = new Map();
    snap.docs.forEach((doc) => {
      const data = doc.data();
      const addedAt = data.addedAt?.toMillis?.() || data.addedAt?.getTime?.() || 0;
      const userId = data.userId;
      if (!userId) return;
      if (!byUser.has(userId)) {
        byUser.set(userId, { items: [], oldestMs: addedAt, reminderSent: data.reminderSent || 0, email: data.email });
      }
      const entry = byUser.get(userId);
      entry.items.push({ id: doc.id, ...data });
      entry.oldestMs = Math.min(entry.oldestMs, addedAt);
    });

    let sentCount = 0;
    for (const [userId, entry] of byUser) {
      if (!entry.email) continue;

      // Lần 2 (24h)
      if (entry.oldestMs <= r2Cutoff && entry.reminderSent < 2) {
        await sendAbandonedCartEmail({
          email: entry.email,
          items: entry.items,
          reminderLevel: 2,
          couponCode: COUPON_2ND_REMINDER
        });
        // Update reminderSent
        const batch = adminDb.batch();
        entry.items.forEach((it) => batch.update(adminDb.collection('cart_items').doc(it.id), { reminderSent: 2 }));
        await batch.commit();
        sentCount += 1;
        continue;
      }

      // Lần 1 (1h)
      if (entry.oldestMs <= r1Cutoff && entry.reminderSent < 1) {
        await sendAbandonedCartEmail({
          email: entry.email,
          items: entry.items,
          reminderLevel: 1
        });
        const batch = adminDb.batch();
        entry.items.forEach((it) => batch.update(adminDb.collection('cart_items').doc(it.id), { reminderSent: 1 }));
        await batch.commit();
        sentCount += 1;
      }
    }
    if (sentCount > 0) {
      console.log(`[AbandonedCart] Sent ${sentCount} reminders`);
    }
  } catch (err) {
    console.warn('[AbandonedCart] check failed:', err.message);
  }
}

function startAbandonedCartJob(adminDb) {
  const cron = getCronModule();
  if (!cron) return;
  // Mỗi giờ, phút 5
  cron.schedule('5 * * * *', () => {
    runAbandonedCheck(adminDb).catch((e) => console.warn('[AbandonedCart] error:', e.message));
  });
  console.log('[AbandonedCart] Scheduler started: hourly at :05');
}

module.exports = {
  runAbandonedCheck,
  startAbandonedCartJob
};
