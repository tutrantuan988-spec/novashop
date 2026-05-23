/**
 * PostgreSQL Order Service
 *
 * CRUD operations for orders + order_items tables (Workstream D).
 * Supports migrating from Firestore and native PG orders.
 */

const { query, getClient } = require('../db/postgres');

/**
 * Generate unique order code (e.g. TDA1B2C3D4)
 */
async function generateOrderCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let exists = true;
  
  while (exists) {
    let random = '';
    for (let i = 0; i < 8; i++) {
      random += chars[Math.floor(Math.random() * chars.length)];
    }
    code = `TD${random}`;
    const result = await query('SELECT EXISTS(SELECT 1 FROM orders WHERE order_code = $1) AS e', [code]);
    exists = result.rows[0]?.e === true;
  }
  
  return code;
}

/**
 * Create a new order with items (transactional)
 */
async function createOrder({
  userId,
  customerEmail,
  customerName,
  customerPhone,
  shippingAddress,
  billingAddress,
  items,
  subtotal,
  shippingFee = 0,
  discount = 0,
  total,
  paymentMethod = 'cod',
  notes,
  source = 'web',
  guestToken = null,
  legacyId = null
}) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const orderCode = await generateOrderCode();

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (
        order_code, legacy_id, user_id, customer_email, customer_name, customer_phone,
        shipping_address, billing_address,
        subtotal, shipping_fee, discount, total,
        payment_method, notes, source, guest_token
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        orderCode, legacyId, userId || null, customerEmail, customerName, customerPhone,
        JSON.stringify(shippingAddress || {}), JSON.stringify(billingAddress || {}),
        subtotal, shippingFee, discount, total,
        paymentMethod, notes || null, source, guestToken
      ]
    );

    const order = orderResult.rows[0];

    // Create order items
    if (items && items.length > 0) {
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (
            order_id, product_id, variant_id, product_name, product_slug, product_image,
            variant_label, unit_price, quantity, subtotal
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            order.id,
            item.productId || null,
            item.variantId || null,
            item.name,
            item.slug || null,
            item.image || null,
            item.variantLabel || null,
            item.price || 0,
            item.quantity || 1,
            (item.price || 0) * (item.quantity || 1)
          ]
        );
      }
    }

    await client.query('COMMIT');
    return { ...order, items: items || [] };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get order by ID with items
 */
async function getOrder(id) {
  const orderResult = await query('SELECT * FROM orders WHERE id = $1', [id]);
  if (!orderResult.rows[0]) return null;

  const itemsResult = await query(
    'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at',
    [id]
  );

  return { ...orderResult.rows[0], items: itemsResult.rows };
}

/**
 * Get order by order_code
 */
async function getOrderByCode(code) {
  const orderResult = await query('SELECT * FROM orders WHERE order_code = $1', [code]);
  if (!orderResult.rows[0]) return null;

  const itemsResult = await query(
    'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at',
    [orderResult.rows[0].id]
  );

  return { ...orderResult.rows[0], items: itemsResult.rows };
}

/**
 * Get orders by user ID
 */
async function getOrdersByUser(userId, limit = 20, offset = 0) {
  const result = await query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [userId, limit, offset]
  );
  return result.rows;
}

/**
 * Get orders by email (for guest lookup)
 */
async function getOrdersByEmail(email, limit = 20) {
  const result = await query(
    'SELECT * FROM orders WHERE customer_email = $1 ORDER BY created_at DESC LIMIT $2',
    [email, limit]
  );
  return result.rows;
}

/**
 * List orders with filters (admin)
 */
async function listOrders(filters = {}) {
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const values = [];
  let idx = 1;

  if (filters.order_status) {
    sql += ` AND order_status = $${idx++}`;
    values.push(filters.order_status);
  }
  if (filters.payment_status) {
    sql += ` AND payment_status = $${idx++}`;
    values.push(filters.payment_status);
  }
  if (filters.payment_method) {
    sql += ` AND payment_method = $${idx++}`;
    values.push(filters.payment_method);
  }
  if (filters.source) {
    sql += ` AND source = $${idx++}`;
    values.push(filters.source);
  }
  if (filters.search) {
    sql += ` AND (customer_name ILIKE $${idx} OR customer_email ILIKE $${idx} OR order_code ILIKE $${idx})`;
    values.push(`%${filters.search}%`);
    idx++;
  }
  if (filters.date_from) {
    sql += ` AND created_at >= $${idx++}`;
    values.push(filters.date_from);
  }
  if (filters.date_to) {
    sql += ` AND created_at <= $${idx++}`;
    values.push(filters.date_to);
  }

  sql += ' ORDER BY created_at DESC';

  if (filters.limit) {
    sql += ` LIMIT $${idx++}`;
    values.push(parseInt(filters.limit) || 50);
  }
  if (filters.offset) {
    sql += ` OFFSET $${idx++}`;
    values.push(parseInt(filters.offset) || 0);
  }

  const result = await query(sql, values);
  return result.rows;
}

/**
 * Update order status
 */
async function updateOrderStatus(id, { orderStatus, paymentStatus, trackingNumber, notes, adminNotes }) {
  const setClauses = [];
  const values = [];
  let idx = 1;

  if (orderStatus) {
    setClauses.push(`order_status = $${idx++}`);
    values.push(orderStatus);
    if (orderStatus === 'shipped') {
      setClauses.push(`shipped_at = CURRENT_TIMESTAMP`);
    }
    if (orderStatus === 'delivered') {
      setClauses.push(`delivered_at = CURRENT_TIMESTAMP`);
    }
  }
  if (paymentStatus) {
    setClauses.push(`payment_status = $${idx++}`);
    values.push(paymentStatus);
    if (paymentStatus === 'paid') {
      setClauses.push(`paid_at = CURRENT_TIMESTAMP`);
    }
  }
  if (trackingNumber) {
    setClauses.push(`tracking_number = $${idx++}`);
    values.push(trackingNumber);
  }
  if (notes !== undefined) {
    setClauses.push(`notes = $${idx++}`);
    values.push(notes);
  }
  if (adminNotes !== undefined) {
    setClauses.push(`admin_notes = $${idx++}`);
    values.push(adminNotes);
  }

  if (setClauses.length === 0) return null;

  values.push(id);
  const result = await query(
    `UPDATE orders SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

/**
 * Get order analytics summary
 */
async function getOrderAnalytics(days = 30) {
  const result = await query(
    `SELECT
      COUNT(*)::int AS total_orders,
      COUNT(*) FILTER (WHERE payment_status = 'paid')::int AS paid_orders,
      COALESCE(SUM(total) FILTER (WHERE payment_status = 'paid'), 0) AS total_revenue,
      COALESCE(AVG(total) FILTER (WHERE payment_status = 'paid'), 0) AS avg_order_value,
      COUNT(*) FILTER (WHERE order_status = 'cancelled')::int AS cancelled_orders,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '1 day')::int AS orders_today
    FROM orders
    WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '1 day' * $1`,
    [days]
  );
  return result.rows[0];
}

module.exports = {
  generateOrderCode,
  createOrder,
  getOrder,
  getOrderByCode,
  getOrdersByUser,
  getOrdersByEmail,
  listOrders,
  updateOrderStatus,
  getOrderAnalytics
};
