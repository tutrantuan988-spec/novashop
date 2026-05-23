/**
 * Verification script for Task 1.5 implementation
 * 
 * This script verifies that all required components are implemented
 * without requiring an actual database connection.
 * 
 * Usage: node server/db/verify-implementation.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Task 1.5 Implementation...\n');

const checks = [];

// Check 1: pg driver installed
console.log('1. Checking pg driver installation...');
try {
  require('pg');
  checks.push({ name: 'pg driver installed', status: '✅' });
  console.log('   ✅ pg driver is installed\n');
} catch (error) {
  checks.push({ name: 'pg driver installed', status: '❌' });
  console.log('   ❌ pg driver not found\n');
}

// Check 2: postgres.js module exists and exports required functions
console.log('2. Checking database connection module...');
try {
  const postgresModule = require('./postgres');
  const requiredExports = [
    'initializePool',
    'getPool',
    'query',
    'getClient',
    'checkHealth',
    'shutdown',
    'getPoolStats'
  ];
  
  const missingExports = requiredExports.filter(exp => typeof postgresModule[exp] !== 'function');
  
  if (missingExports.length === 0) {
    checks.push({ name: 'Database connection module', status: '✅' });
    console.log('   ✅ All required functions exported:');
    requiredExports.forEach(exp => console.log(`      - ${exp}()`));
    console.log('');
  } else {
    checks.push({ name: 'Database connection module', status: '❌' });
    console.log('   ❌ Missing exports:', missingExports.join(', '), '\n');
  }
} catch (error) {
  checks.push({ name: 'Database connection module', status: '❌' });
  console.log('   ❌ Error loading module:', error.message, '\n');
}

// Check 3: Connection pooling configuration
console.log('3. Checking connection pooling configuration...');
try {
  const postgresContent = fs.readFileSync(path.join(__dirname, 'postgres.js'), 'utf8');
  
  const hasPoolConfig = postgresContent.includes('DATABASE_POOL_MIN') && 
                        postgresContent.includes('DATABASE_POOL_MAX');
  const hasPooling = postgresContent.includes('new Pool(');
  const hasIdleTimeout = postgresContent.includes('idleTimeoutMillis');
  const hasConnectionTimeout = postgresContent.includes('connectionTimeoutMillis');
  
  if (hasPoolConfig && hasPooling && hasIdleTimeout && hasConnectionTimeout) {
    checks.push({ name: 'Connection pooling', status: '✅' });
    console.log('   ✅ Connection pooling configured');
    console.log('      - Pool size configuration (min/max)');
    console.log('      - Idle timeout');
    console.log('      - Connection timeout\n');
  } else {
    checks.push({ name: 'Connection pooling', status: '⚠️' });
    console.log('   ⚠️ Some pooling features missing\n');
  }
} catch (error) {
  checks.push({ name: 'Connection pooling', status: '❌' });
  console.log('   ❌ Error checking configuration:', error.message, '\n');
}

// Check 4: Exponential backoff retry logic
console.log('4. Checking retry logic with exponential backoff...');
try {
  const postgresContent = fs.readFileSync(path.join(__dirname, 'postgres.js'), 'utf8');
  
  const hasRetryConfig = postgresContent.includes('maxRetries');
  const hasRetryDelay = postgresContent.includes('retryDelayMs');
  const hasExponentialBackoff = postgresContent.includes('Math.pow(2, attempt)') || 
                                 postgresContent.includes('2 ** attempt');
  const hasRetryLoop = postgresContent.includes('for') && postgresContent.includes('attempt');
  
  if (hasRetryConfig && hasRetryDelay && hasExponentialBackoff && hasRetryLoop) {
    checks.push({ name: 'Exponential backoff retry', status: '✅' });
    console.log('   ✅ Retry logic with exponential backoff');
    console.log('      - Max retries configuration');
    console.log('      - Exponential delay calculation');
    console.log('      - Retry loop implementation\n');
  } else {
    checks.push({ name: 'Exponential backoff retry', status: '⚠️' });
    console.log('   ⚠️ Some retry features missing\n');
  }
} catch (error) {
  checks.push({ name: 'Exponential backoff retry', status: '❌' });
  console.log('   ❌ Error checking retry logic:', error.message, '\n');
}

// Check 5: Health check endpoint
console.log('5. Checking health check endpoint...');
try {
  const serverContent = fs.readFileSync(path.join(__dirname, '../index.js'), 'utf8');
  
  const hasHealthEndpoint = serverContent.includes('/api/health/database');
  const hasCheckHealth = serverContent.includes('checkHealth');
  const hasPoolStats = serverContent.includes('getPoolStats');
  
  if (hasHealthEndpoint && hasCheckHealth && hasPoolStats) {
    checks.push({ name: 'Health check endpoint', status: '✅' });
    console.log('   ✅ Health check endpoint implemented');
    console.log('      - Endpoint: /api/health/database');
    console.log('      - Includes connectivity check');
    console.log('      - Includes pool statistics\n');
  } else {
    checks.push({ name: 'Health check endpoint', status: '❌' });
    console.log('   ❌ Health check endpoint not properly configured\n');
  }
} catch (error) {
  checks.push({ name: 'Health check endpoint', status: '❌' });
  console.log('   ❌ Error checking health endpoint:', error.message, '\n');
}

// Check 6: Graceful shutdown handling
console.log('6. Checking graceful shutdown handling...');
try {
  const serverContent = fs.readFileSync(path.join(__dirname, '../index.js'), 'utf8');
  const postgresContent = fs.readFileSync(path.join(__dirname, 'postgres.js'), 'utf8');
  
  const hasShutdownFunction = postgresContent.includes('async function shutdown()');
  const hasPoolEnd = postgresContent.includes('pool.end()');
  const hasSigterm = serverContent.includes('SIGTERM');
  const hasSigint = serverContent.includes('SIGINT');
  const callsShutdown = serverContent.includes('shutdownPostgres()') || 
                        serverContent.includes('shutdown()');
  
  if (hasShutdownFunction && hasPoolEnd && hasSigterm && hasSigint && callsShutdown) {
    checks.push({ name: 'Graceful shutdown', status: '✅' });
    console.log('   ✅ Graceful shutdown implemented');
    console.log('      - Shutdown function in postgres.js');
    console.log('      - Pool cleanup (pool.end())');
    console.log('      - SIGTERM handler');
    console.log('      - SIGINT handler\n');
  } else {
    checks.push({ name: 'Graceful shutdown', status: '⚠️' });
    console.log('   ⚠️ Some shutdown features missing\n');
  }
} catch (error) {
  checks.push({ name: 'Graceful shutdown', status: '❌' });
  console.log('   ❌ Error checking shutdown handling:', error.message, '\n');
}

// Check 7: Environment variables documented
console.log('7. Checking environment variables documentation...');
try {
  const envExampleContent = fs.readFileSync(path.join(__dirname, '../../.env.example'), 'utf8');
  
  const hasDatabaseUrl = envExampleContent.includes('DATABASE_URL');
  const hasPoolMin = envExampleContent.includes('DATABASE_POOL_MIN');
  const hasPoolMax = envExampleContent.includes('DATABASE_POOL_MAX');
  
  if (hasDatabaseUrl && hasPoolMin && hasPoolMax) {
    checks.push({ name: 'Environment variables', status: '✅' });
    console.log('   ✅ Environment variables documented in .env.example');
    console.log('      - DATABASE_URL');
    console.log('      - DATABASE_POOL_MIN');
    console.log('      - DATABASE_POOL_MAX\n');
  } else {
    checks.push({ name: 'Environment variables', status: '⚠️' });
    console.log('   ⚠️ Some environment variables not documented\n');
  }
} catch (error) {
  checks.push({ name: 'Environment variables', status: '❌' });
  console.log('   ❌ Error checking .env.example:', error.message, '\n');
}

// Check 8: Test script exists
console.log('8. Checking test script...');
try {
  const testScriptPath = path.join(__dirname, 'test-connection.js');
  if (fs.existsSync(testScriptPath)) {
    checks.push({ name: 'Test script', status: '✅' });
    console.log('   ✅ Test script exists: server/db/test-connection.js\n');
  } else {
    checks.push({ name: 'Test script', status: '❌' });
    console.log('   ❌ Test script not found\n');
  }
} catch (error) {
  checks.push({ name: 'Test script', status: '❌' });
  console.log('   ❌ Error checking test script:', error.message, '\n');
}

// Summary
console.log('═'.repeat(60));
console.log('VERIFICATION SUMMARY');
console.log('═'.repeat(60));
console.log('');

checks.forEach(check => {
  console.log(`${check.status} ${check.name}`);
});

console.log('');

const passed = checks.filter(c => c.status === '✅').length;
const total = checks.length;
const percentage = Math.round((passed / total) * 100);

console.log(`Result: ${passed}/${total} checks passed (${percentage}%)`);
console.log('');

if (percentage === 100) {
  console.log('🎉 All checks passed! Task 1.5 is complete.');
  console.log('');
  console.log('Next steps:');
  console.log('1. Configure DATABASE_URL in .env.local');
  console.log('2. Run: node server/db/test-connection.js');
  console.log('3. Proceed to Task 1.2 (Create database schema)');
} else if (percentage >= 75) {
  console.log('✅ Implementation is mostly complete.');
  console.log('Review warnings (⚠️) and fix any issues (❌).');
} else {
  console.log('❌ Implementation incomplete. Please review failed checks.');
}

console.log('');
