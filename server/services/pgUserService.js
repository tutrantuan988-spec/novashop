/**
 * PostgreSQL User Service
 *
 * CRUD operations for users table (Workstream D).
 * Supports both Firebase-authenticated and native-auth users.
 */

const { query, getClient } = require('../db/postgres');

/**
 * Create or update user from Firebase Auth
 */
async function upsertUser({ email, firebaseUid, fullName, phone, avatarUrl, isGuest = false }) {
  const result = await query(
    `INSERT INTO users (email, firebase_uid, full_name, phone, avatar_url, is_guest, last_login_at)
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
     ON CONFLICT (email) DO UPDATE SET
       full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), users.full_name),
       firebase_uid = COALESCE(NULLIF(EXCLUDED.firebase_uid, ''), users.firebase_uid),
       avatar_url = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), users.avatar_url),
       last_login_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [email, firebaseUid || null, fullName || null, phone || null, avatarUrl || null, isGuest]
  );
  return result.rows[0];
}

/**
 * Get user by ID
 */
async function getUser(id) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

/**
 * Get user by email
 */
async function getUserByEmail(email) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

/**
 * Get user by Firebase UID
 */
async function getUserByFirebaseUid(firebaseUid) {
  const result = await query('SELECT * FROM users WHERE firebase_uid = $1', [firebaseUid]);
  return result.rows[0] || null;
}

/**
 * Update user profile
 */
async function updateUser(id, updates) {
  const allowedFields = ['full_name', 'phone', 'avatar_url', 'address_line', 'ward', 'district', 'province', 'meta'];
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) return null;

  values.push(id);
  const result = await query(
    `UPDATE users SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

/**
 * Create a guest user — lightweight, no password
 */
async function createGuestUser({ email, name, phone }) {
  const result = await query(
    `INSERT INTO users (email, full_name, phone, is_guest, role, last_login_at)
     VALUES ($1, $2, $3, true, 'customer', CURRENT_TIMESTAMP)
     ON CONFLICT (email) DO UPDATE SET
       last_login_at = CURRENT_TIMESTAMP,
       phone = COALESCE(NULLIF(EXCLUDED.phone, ''), users.phone)
     RETURNING *`,
    [email, name || null, phone || null]
  );
  return result.rows[0];
}

/**
 * List users (admin)
 */
async function listUsers(filters = {}) {
  let sql = 'SELECT * FROM users WHERE 1=1';
  const values = [];
  let idx = 1;

  if (filters.role) {
    sql += ` AND role = $${idx++}`;
    values.push(filters.role);
  }
  if (filters.is_guest !== undefined) {
    sql += ` AND is_guest = $${idx++}`;
    values.push(filters.is_guest === 'true' || filters.is_guest === true);
  }
  if (filters.search) {
    sql += ` AND (full_name ILIKE $${idx} OR email ILIKE $${idx})`;
    values.push(`%${filters.search}%`);
    idx++;
  }

  sql += ' ORDER BY created_at DESC';
  if (filters.limit) {
    sql += ` LIMIT $${idx++}`;
    values.push(parseInt(filters.limit) || 50);
  }

  const result = await query(sql, values);
  return result.rows;
}

module.exports = {
  upsertUser,
  getUser,
  getUserByEmail,
  getUserByFirebaseUid,
  updateUser,
  createGuestUser,
  listUsers
};
