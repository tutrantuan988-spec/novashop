const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required');
    }

    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: parseInt(process.env.PG_POOL_MAX || '10', 10),
      min: parseInt(process.env.PG_POOL_MIN || '2', 10),
      idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT || '30000', 10),
      connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT || '5000', 10)
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL] Unexpected pool error:', err.message);
    });
  }
  return pool;
}

async function initializePool() {
  try {
    const p = getPool();
    await p.query('SELECT NOW()');
    console.log('[PostgreSQL] Connection pool initialized successfully');
    return p;
  } catch (err) {
    console.error('[PostgreSQL] Failed to initialize pool:', err.message);
    throw err;
  }
}

async function query(text, params = []) {
  const p = getPool();
  return p.query(text, params);
}

async function getClient() {
  const p = getPool();
  return p.connect();
}

async function shutdown() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[PostgreSQL] Pool closed');
  }
}

async function checkHealth() {
  try {
    const p = getPool();
    const result = await p.query('SELECT NOW() as now');
    return {
      status: 'healthy',
      database: 'PostgreSQL',
      timestamp: result.rows[0].now
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      database: 'PostgreSQL',
      error: err.message
    };
  }
}

module.exports = {
  initializePool,
  query,
  getClient,
  shutdown,
  checkHealth
};
