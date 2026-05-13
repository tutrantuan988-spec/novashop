const mongoose = require('mongoose');

let _connection = null;

async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (_connection) return _connection;
  if (!uri) {
    console.warn('[MongoDB] MONGODB_URI not set. MongoDB features disabled.');
    return null;
  }
  try {
    _connection = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('[MongoDB] Connected:', mongoose.connection.host);
    return _connection;
  } catch (err) {
    console.error('[MongoDB] Connection failed:', err.message);
    return null;
  }
}

function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDatabase, isConnected, mongoose };
