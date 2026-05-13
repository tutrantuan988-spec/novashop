/**
 * Inventory Transaction Helpers
 *
 * Atomic stock management dùng Firestore Transaction để ngăn race condition
 * khi nhiều user mua cùng một sản phẩm cuối cùng.
 *
 * @module server/utils/inventoryTransaction
 */

const { FieldValue, Timestamp } = require('firebase-admin/firestore');

/**
 * Custom error class for insufficient stock — frontend dựa vào field
 * `insufficientItems` để highlight các sản phẩm không đủ hàng trong giỏ.
 */
class InsufficientStockError extends Error {
  /**
   * @param {Array<{productId: string, variantId: string|null, name: string, requested: number, available: number}>} insufficientItems
   */
  constructor(insufficientItems) {
    super('Một số sản phẩm không đủ tồn kho');
    this.name = 'InsufficientStockError';
    this.code = 'INSUFFICIENT_STOCK';
    this.insufficientItems = insufficientItems;
    this.statusCode = 409; // Conflict
  }
}

/**
 * Reserve inventory atomically using Firestore Transaction.
 * - Đọc stock của tất cả items trong cùng 1 transaction
 * - Validate đủ hàng
 * - Trừ stock + ghi inventory_log trong cùng 1 commit
 * - Firestore tự retry transaction nếu phát hiện conflict
 *
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {Array<{productId: string, variantId?: string|null, quantity: number, name?: string}>} orderItems
 * @param {{ orderId: string, userId?: string, type?: 'sale'|'restock'|'return'|'adjustment', note?: string }} meta
 * @returns {Promise<Array<{productId: string, variantId: string|null, before: number, after: number}>>}
 */
async function reserveInventory(db, orderItems, meta) {
  if (!db) throw new Error('Firestore instance is required');
  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw new Error('orderItems must be a non-empty array');
  }
  const orderId = meta?.orderId;
  if (!orderId) throw new Error('meta.orderId is required for inventory log');

  const type = meta?.type || 'sale';
  const userId = meta?.userId || null;
  const note = meta?.note || '';

  // Build refs for transaction reads
  const itemRefs = orderItems.map((item) => {
    const productRef = db.collection('products').doc(String(item.productId));
    const variantRef = item.variantId
      ? productRef.collection('variants').doc(String(item.variantId))
      : null;
    return { productRef, variantRef, item };
  });

  return db.runTransaction(async (tx) => {
    // 1. READ phase — phải đọc TẤT CẢ trước khi write trong transaction
    const reads = await Promise.all(
      itemRefs.map(async ({ productRef, variantRef }) => {
        const productSnap = await tx.get(productRef);
        const variantSnap = variantRef ? await tx.get(variantRef) : null;
        return { productSnap, variantSnap };
      })
    );

    // 2. VALIDATE phase
    const insufficientItems = [];
    const stockDeltas = []; // Để ghi log + write
    for (let i = 0; i < itemRefs.length; i += 1) {
      const { item, productRef, variantRef } = itemRefs[i];
      const { productSnap, variantSnap } = reads[i];

      if (!productSnap.exists) {
        throw new Error(`Sản phẩm ${item.productId} không tồn tại`);
      }
      const product = productSnap.data();
      const productName = product.name || `SP ${item.productId}`;
      const requested = Number(item.quantity) || 0;
      if (requested <= 0) continue;

      let available;
      let useVariant = false;
      if (variantRef) {
        if (!variantSnap || !variantSnap.exists) {
          throw new Error(`Biến thể ${item.variantId} của ${productName} không tồn tại`);
        }
        available = Number(variantSnap.data().stock) || 0;
        useVariant = true;
      } else {
        available = Number(product.stock) || 0;
      }

      if (available < requested) {
        insufficientItems.push({
          productId: String(item.productId),
          variantId: item.variantId || null,
          name: productName,
          requested,
          available
        });
        continue;
      }

      stockDeltas.push({
        productRef,
        variantRef,
        useVariant,
        productName,
        before: available,
        change: -requested,
        after: available - requested,
        item
      });
    }

    if (insufficientItems.length > 0) {
      throw new InsufficientStockError(insufficientItems);
    }

    // 3. WRITE phase
    const result = [];
    for (const delta of stockDeltas) {
      const target = delta.useVariant ? delta.variantRef : delta.productRef;
      tx.update(target, {
        stock: delta.after,
        updatedAt: FieldValue.serverTimestamp()
      });

      // Ghi inventory_log dưới sub-collection của product
      const logRef = delta.productRef.collection('inventory_logs').doc();
      tx.set(logRef, {
        variantId: delta.useVariant ? String(delta.item.variantId) : null,
        type,
        quantityBefore: delta.before,
        quantityChange: delta.change,
        quantityAfter: delta.after,
        referenceId: orderId,
        userId,
        note: note || `Order ${orderId} ${type}`,
        createdAt: FieldValue.serverTimestamp()
      });

      result.push({
        productId: String(delta.item.productId),
        variantId: delta.useVariant ? String(delta.item.variantId) : null,
        before: delta.before,
        after: delta.after
      });
    }

    return result;
  });
}

/**
 * Release inventory atomically — dùng khi:
 * - Đơn hàng bị hủy
 * - Refund toàn phần / một phần
 * - Return được duyệt
 *
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {Array<{productId: string, variantId?: string|null, quantity: number}>} orderItems
 * @param {{ orderId: string, userId?: string, type?: 'restock'|'return'|'adjustment', note?: string }} meta
 * @returns {Promise<Array<{productId: string, variantId: string|null, before: number, after: number}>>}
 */
async function releaseInventory(db, orderItems, meta) {
  if (!db) throw new Error('Firestore instance is required');
  if (!Array.isArray(orderItems) || orderItems.length === 0) return [];
  const orderId = meta?.orderId;
  if (!orderId) throw new Error('meta.orderId is required');

  const type = meta?.type || 'restock';
  const userId = meta?.userId || null;
  const note = meta?.note || '';

  const itemRefs = orderItems.map((item) => {
    const productRef = db.collection('products').doc(String(item.productId));
    const variantRef = item.variantId
      ? productRef.collection('variants').doc(String(item.variantId))
      : null;
    return { productRef, variantRef, item };
  });

  return db.runTransaction(async (tx) => {
    const reads = await Promise.all(
      itemRefs.map(async ({ productRef, variantRef }) => {
        const productSnap = await tx.get(productRef);
        const variantSnap = variantRef ? await tx.get(variantRef) : null;
        return { productSnap, variantSnap };
      })
    );

    const result = [];
    for (let i = 0; i < itemRefs.length; i += 1) {
      const { item, productRef, variantRef } = itemRefs[i];
      const { productSnap, variantSnap } = reads[i];
      if (!productSnap.exists) continue;

      const qty = Number(item.quantity) || 0;
      if (qty <= 0) continue;

      let before;
      let target;
      let useVariant = false;
      if (variantRef && variantSnap && variantSnap.exists) {
        before = Number(variantSnap.data().stock) || 0;
        target = variantRef;
        useVariant = true;
      } else {
        before = Number(productSnap.data().stock) || 0;
        target = productRef;
      }

      const after = before + qty;
      tx.update(target, {
        stock: after,
        updatedAt: FieldValue.serverTimestamp()
      });

      const logRef = productRef.collection('inventory_logs').doc();
      tx.set(logRef, {
        variantId: useVariant ? String(item.variantId) : null,
        type,
        quantityBefore: before,
        quantityChange: qty,
        quantityAfter: after,
        referenceId: orderId,
        userId,
        note: note || `Release ${orderId} ${type}`,
        createdAt: FieldValue.serverTimestamp()
      });

      result.push({
        productId: String(item.productId),
        variantId: useVariant ? String(item.variantId) : null,
        before,
        after
      });
    }
    return result;
  });
}

/**
 * Pre-flight stock check (không transaction, nhanh, dùng cho UI hiển thị).
 * KHÔNG được dùng làm cơ sở reserve stock — chỉ để show realtime indicator.
 *
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {Array<{productId: string, variantId?: string|null, quantity: number}>} orderItems
 * @returns {Promise<Array<{productId: string, variantId: string|null, available: number, requested: number, ok: boolean}>>}
 */
async function checkStockAvailability(db, orderItems) {
  if (!db) throw new Error('Firestore instance is required');
  const results = await Promise.all(
    orderItems.map(async (item) => {
      const productRef = db.collection('products').doc(String(item.productId));
      const productSnap = await productRef.get();
      if (!productSnap.exists) {
        return {
          productId: String(item.productId),
          variantId: item.variantId || null,
          available: 0,
          requested: Number(item.quantity) || 0,
          ok: false
        };
      }
      let available = Number(productSnap.data().stock) || 0;
      if (item.variantId) {
        const variantSnap = await productRef
          .collection('variants')
          .doc(String(item.variantId))
          .get();
        available = variantSnap.exists ? Number(variantSnap.data().stock) || 0 : 0;
      }
      const requested = Number(item.quantity) || 0;
      return {
        productId: String(item.productId),
        variantId: item.variantId || null,
        available,
        requested,
        ok: available >= requested
      };
    })
  );
  return results;
}

module.exports = {
  InsufficientStockError,
  reserveInventory,
  releaseInventory,
  checkStockAvailability
};
