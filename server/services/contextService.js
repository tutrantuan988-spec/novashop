/**
 * 🧠 CONTEXT SERVICE
 * Context persistence cho AI Chatbot
 * Pattern: upstash/context7 — persistent context across sessions
 * 
 * Lưu hội thoại AI vào Firestore để:
 * - Giữ context giữa các lần refresh
 * - Cho phép AI nhớ lịch sử trò chuyện
 * - Đồng bộ giữa các thiết bị
 */

const admin = require('firebase-admin');
const logger = require('../utils/logger');

const CONTEXT_COLLECTION = 'ai_context';
const MAX_HISTORY = 50; // Giữ tối đa 50 tin nhắn

/**
 * Lưu context hội thoại
 */
async function saveContext(userId, sessionId, messages) {
  try {
    const db = admin.firestore();
    const docRef = db.collection(CONTEXT_COLLECTION).doc(`${userId}_${sessionId}`);
    
    // Chỉ giữ MAX_HISTORY tin nhắn gần nhất
    const trimmed = messages.slice(-MAX_HISTORY);
    
    await docRef.set({
      userId,
      sessionId,
      messages: trimmed,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      messageCount: trimmed.length,
    }, { merge: true });

    logger.info(`Context saved: ${userId}/${sessionId} (${trimmed.length} messages)`);
    return true;
  } catch (err) {
    logger.error('Save context error:', err.message);
    return false;
  }
}

/**
 * Đọc context hội thoại
 */
async function getContext(userId, sessionId) {
  try {
    const db = admin.firestore();
    const docRef = db.collection(CONTEXT_COLLECTION).doc(`${userId}_${sessionId}`);
    const doc = await docRef.get();

    if (!doc.exists) {
      return { messages: [], createdAt: null };
    }

    const data = doc.data();
    return {
      messages: data.messages || [],
      createdAt: data.createdAt?.toDate() || null,
      updatedAt: data.updatedAt?.toDate() || null,
      messageCount: data.messageCount || 0,
    };
  } catch (err) {
    logger.error('Get context error:', err.message);
    return { messages: [] };
  }
}

/**
 * Xoá context hội thoại
 */
async function clearContext(userId, sessionId) {
  try {
    const db = admin.firestore();
    const docRef = db.collection(CONTEXT_COLLECTION).doc(`${userId}_${sessionId}`);
    await docRef.delete();
    logger.info(`Context cleared: ${userId}/${sessionId}`);
    return true;
  } catch (err) {
    logger.error('Clear context error:', err.message);
    return false;
  }
}

/**
 * Xoá context cũ (dọn dẹp tự động)
 */
async function cleanupOldContexts(maxAgeHours = 72) {
  try {
    const db = admin.firestore();
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    const snapshot = await db.collection(CONTEXT_COLLECTION)
      .where('updatedAt', '<', cutoff)
      .limit(100)
      .get();

    let deleted = 0;
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
      deleted++;
    });

    if (deleted > 0) {
      await batch.commit();
      logger.info(`Cleaned up ${deleted} old contexts`);
    }
    return deleted;
  } catch (err) {
    logger.error('Cleanup contexts error:', err.message);
    return 0;
  }
}

module.exports = {
  saveContext,
  getContext,
  clearContext,
  cleanupOldContexts,
};
