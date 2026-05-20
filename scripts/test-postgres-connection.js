/**
 * Simple test script to verify PostgreSQL connection
 * 
 * Usage: node server/db/test-connection.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.local') });
const { initializePool, checkHealth, getPoolStats, shutdown } = require('./postgres');

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection...\n');

  try {
    // Initialize pool
    console.log('1. Initializing connection pool...');
    await initializePool();
    console.log('✅ Pool initialized\n');

    // Check health
    console.log('2. Checking database health...');
    const health = await checkHealth();
    
    if (health.ok) {
      console.log('✅ Database is healthy');
      console.log(`   Latency: ${health.latency}ms`);
      console.log(`   Server time: ${health.serverTime}`);
      console.log(`   Pool stats:`, health.pool);
    } else {
      console.log('❌ Database health check failed');
      console.log(`   Reason: ${health.reason}`);
      console.log(`   Message: ${health.message}`);
    }
    console.log('');

    // Get pool stats
    console.log('3. Pool statistics:');
    const stats = getPoolStats();
    if (stats) {
      console.log(`   Total connections: ${stats.totalCount}/${stats.maxConnections}`);
      console.log(`   Idle connections: ${stats.idleCount}`);
      console.log(`   Waiting requests: ${stats.waitingCount}`);
      console.log(`   Utilization: ${stats.utilizationPercent}%`);
    } else {
      console.log('   Pool not initialized');
    }
    console.log('');

    // Test query
    console.log('4. Testing query execution...');
    const { query } = require('./postgres');
    const result = await query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Query executed successfully');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL version: ${result.rows[0].version.split(',')[0]}`);
    console.log('');

    console.log('✅ All tests passed!\n');
    console.log('🚀 PostgreSQL connection is ready for use\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure PostgreSQL is running');
    console.error('   2. Check DATABASE_URL in .env.local');
    console.error('   3. Verify database credentials');
    console.error('   4. Check if port 5432 is accessible\n');
    process.exit(1);
  } finally {
    // Cleanup
    await shutdown();
    process.exit(0);
  }
}

testConnection();
