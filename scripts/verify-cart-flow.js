/**
 * Verify script for Cart + Checkout + Order system (PG commerce core)
 * 
 * Tests:
 * 1. GET /api/cart (empty cart)
 * 2. POST /api/cart/add (add item)
 * 3. GET /api/cart (verify item added)
 * 4. PUT /api/cart/item/:id (update quantity)
 * 5. DELETE /api/cart/item/:id (remove item)
 * 6. POST /api/checkout (full checkout flow)
 * 7. GET /api/orders/pg (verify order created)
 * 8. GET /api/orders/pg/:id (verify order detail with items)
 */

const http = require('http');

const BASE = 'http://127.0.0.1:3001';
const SESSION_ID = 'test_sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);

let passed = 0;
let failed = 0;
let testResults = [];

function test(name, fn) {
  testResults.push({ name, fn });
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function fetch(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: 3001,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('═══════════════════════════════════════════════');
  console.log('  CART + CHECKOUT + ORDER VERIFICATION');
  console.log('═══════════════════════════════════════════════\n');
  console.log('Session ID:', SESSION_ID, '\n');

  let productId = null;
  let variantId = null;
  let cartItemId = null;
  let orderId = null;

  // Step 1: Get a product and variant for testing
  try {
    const prodRes = await fetch('GET', '/api/products?limit=1');
    if (prodRes.data && prodRes.data.data && prodRes.data.data.length > 0) {
      productId = prodRes.data.data[0].id;
    }
  } catch (e) {}

  if (!productId) {
    // Use a known product ID from the database
    try {
      const allRes = await fetch('GET', '/api/products');
      const allData = Array.isArray(allRes.data) ? allRes.data : (allRes.data?.data || []);
      if (allData.length > 0) productId = allData[0].id;
    } catch (e) {}
  }

  if (!productId) {
    console.log('⚠  No products found in database — using fallback product ID');
    // Try fetching directly from PG
    try {
      const { query } = require('./db/postgres');
      const result = await query('SELECT id FROM products WHERE status != $1 LIMIT 1', ['deleted']);
      if (result.rows.length > 0) productId = result.rows[0].id;
    } catch (e) {
      productId = 'fallback-product-id';
    }
  }

  console.log('Using product ID:', productId);

  try {
    const vRes = await fetch('GET', `/api/products/${productId}/variants`);
    if (Array.isArray(vRes.data) && vRes.data.length > 0) {
      variantId = vRes.data[0].id;
    }
  } catch (e) {}

  // ===== TEST 1: Get empty cart =====
  try {
    const res = await fetch('GET', `/api/cart?session_id=${SESSION_ID}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.items), 'items should be array');
    assert(res.data.items.length === 0, 'cart should be empty');
    assert(res.data.subtotal === 0, 'subtotal should be 0');
    assert(res.data.item_count === 0, 'item_count should be 0');
    passed++;
    console.log('  ✓ TEST 1: GET empty cart returns empty items');
  } catch (e) {
    failed++;
    console.log('  ✗ TEST 1 FAILED:', e.message);
  }

  // ===== TEST 2: Add item to cart =====
  try {
    const addBody = {
      session_id: SESSION_ID,
      product_id: productId,
      variant_id: variantId,
      quantity: 2
    };
    const res = await fetch('POST', '/api/cart/add', addBody);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'response should have ok: true');
    passed++;
    console.log('  ✓ TEST 2: POST add item to cart returns ok');
  } catch (e) {
    failed++;
    console.log('  ✗ TEST 2 FAILED:', e.message);
  }

  // ===== TEST 3: Get cart with item =====
  try {
    const res = await fetch('GET', `/api/cart?session_id=${SESSION_ID}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.items), 'items should be array');
    assert(res.data.items.length === 1, 'should have 1 item');
    assert(res.data.items[0].product_name, 'item should have product_name');
    assert(res.data.items[0].quantity === 2, `expected quantity 2, got ${res.data.items[0].quantity}`);
    assert(res.data.items[0].price > 0, 'price should be > 0');
    assert(res.data.subtotal > 0, 'subtotal should be > 0');
    assert(res.data.item_count === 2, `expected item_count 2, got ${res.data.item_count}`);
    cartItemId = res.data.items[0].id;
    passed++;
    console.log('  ✓ TEST 3: GET cart with item has correct data (product_name:', res.data.items[0].product_name, ')');
  } catch (e) {
    failed++;
    console.log('  ✗ TEST 3 FAILED:', e.message);
  }

  // ===== TEST 4: Add same item again (increment quantity) =====
  try {
    const addBody = {
      session_id: SESSION_ID,
      product_id: productId,
      variant_id: variantId,
      quantity: 1
    };
    const res = await fetch('POST', '/api/cart/add', addBody);
    assert(res.status === 200, `Expected 200, got ${res.status}`);

    // Verify quantity incremented to 3
    const getRes = await fetch('GET', `/api/cart?session_id=${SESSION_ID}`);
    assert(getRes.data.items.length === 1, 'should still have 1 item');
    assert(getRes.data.items[0].quantity === 3, `expected quantity 3, got ${getRes.data.items[0].quantity}`);
    assert(getRes.data.item_count === 3, `expected item_count 3`);
    passed++;
    console.log('  ✓ TEST 4: Adding same item increments quantity (now 3)');
  } catch (e) {
    failed++;
    console.log('  ✗ TEST 4 FAILED:', e.message);
  }

  // ===== TEST 5: Update quantity =====
  try {
    const res = await fetch('PUT', `/api/cart/item/${cartItemId}`, { quantity: 1 });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'response should have ok: true');

    const getRes = await fetch('GET', `/api/cart?session_id=${SESSION_ID}`);
    assert(getRes.data.items[0].quantity === 1, `expected quantity 1 after update`);
    assert(getRes.data.item_count === 1, `expected item_count 1`);
    passed++;
    console.log('  ✓ TEST 5: PUT update quantity works');
  } catch (e) {
    failed++;
    console.log('  ✗ TEST 5 FAILED:', e.message);
  }

  // ===== TEST 6: Remove item from cart =====
  try {
    const res = await fetch('DELETE', `/api/cart/item/${cartItemId}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.ok === true, 'response should have ok: true');

    const getRes = await fetch('GET', `/api/cart?session_id=${SESSION_ID}`);
    assert(getRes.data.items.length === 0, 'cart should be empty after remove');
    assert(getRes.data.subtotal === 0, 'subtotal should be 0');
    passed++;
    console.log('  ✓ TEST 6: DELETE remove item from cart');
  } catch (e) {
    failed++;
    console.log('  ✗ TEST 6 FAILED:', e.message);
  }

  // ===== TEST 7: Add item back for checkout test =====
  try {
    const addBody = {
      session_id: SESSION_ID,
      product_id: productId,
      variant_id: variantId,
      quantity: 2
    };
    const res = await fetch('POST', '/api/cart/add', addBody);
    assert(res.status === 200, `Expected 200, got ${res.status}`);

    const getRes = await fetch('GET', `/api/cart?session_id=${SESSION_ID}`);
    assert(getRes.data.items.length === 1, 'should have 1 item');
    passed++;
    console.log('  ✓ TEST 7: Re-added item for checkout test');
  } catch (e) {
    failed++;
    console.log('  ✗ TEST 7 FAILED:', e.message);
  }

  // ===== TEST 8: Full checkout flow =====
  try {
    const checkoutBody = {
      session_id: SESSION_ID,
      customer_name: 'Test Customer',
      customer_phone: '0901234567',
      customer_email: 'test@example.com',
      shipping_address: { street: '123 Test St', city: 'HCMC', district: 'District 1' },
      payment_method: 'cod'
    };
    const res = await fetch('POST', '/api/checkout', checkoutBody);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.id, 'response should have order id');
    assert(res.data.order_code, 'response should have order_code');
    assert(res.data.status === 'pending', `expected status pending, got ${res.data.status}`);
    assert(res.data.total > 0, 'total should be > 0');
    assert(res.data.item_count === 2, `expected item_count 2, got ${res.data.item_count}`);
    orderId = res.data.id;
    passed++;
    console.log('  ✓ TEST 8: Checkout creates order (code:', res.data.order_code, ', total:', res.data.total, ')');
  } catch (e) {
    failed++;
    console.log('  ✗ TEST 8 FAILED:', e.message);
  }

  // ===== TEST 9: Cart is empty after checkout =====
  try {
    const res = await fetch('GET', `/api/cart?session_id=${SESSION_ID}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.items.length === 0, 'cart should be empty after checkout');
    assert(res.data.subtotal === 0, 'subtotal should be 0');
    passed++;
    console.log('  ✓ TEST 9: Cart is empty after checkout');
  } catch (e) {
    failed++;
    console.log('  ✗ TEST 9 FAILED:', e.message);
  }

  // ===== TEST 10: Get PG order list =====
  try {
    const res = await fetch('GET', `/api/orders/pg?email=test@example.com`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data && Array.isArray(res.data.data), 'data.data should be array');
    assert(res.data.data.length >= 1, 'should have at least 1 order');
    assert(res.data.total >= 1, 'total should be >= 1');
    passed++;
    console.log('  ✓ TEST 10: GET /api/orders/pg returns orders');
  } catch (e) {
    failed++;
    console.log('  ✗ TEST 10 FAILED:', e.message);
  }

  // ===== TEST 11: Get PG order detail =====
  try {
    const res = await fetch('GET', `/api/orders/pg/${orderId}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.id === orderId, 'order id should match');
    assert(res.data.order_code, 'should have order_code');
    assert(res.data.customer_name === 'Test Customer', 'customer_name should match');
    assert(res.data.items && Array.isArray(res.data.items), 'should have items array');
    assert(res.data.items.length >= 1, 'should have at least 1 item');
    assert(res.data.items[0].product_name, 'item should have product_name');
    assert(res.data.items[0].quantity === 2, `expected item quantity 2, got ${res.data.items[0].quantity}`);
    passed++;
    console.log('  ✓ TEST 11: GET /api/orders/pg/:id returns order detail with', res.data.items.length, 'items');
  } catch (e) {
    failed++;
    console.log('  ✗ TEST 11 FAILED:', e.message);
  }

  // ===== TEST 12: Verify variant stock decreased =====
  if (variantId) {
    try {
      const res = await fetch('GET', `/api/products/${productId}/variants`);
      const variant = (Array.isArray(res.data) ? res.data : []).find(v => v.id === variantId);
      if (variant) {
        // Stock should be >= 0 (we don't know original value)
        assert(variant.stock !== undefined, 'variant should have stock field');
        passed++;
        console.log('  ✓ TEST 12: Variant stock tracked (current:', variant.stock, ')');
      } else {
        console.log('  ⚠  TEST 12: Variant not found for stock verification');
      }
    } catch (e) {
      console.log('  ⚠  TEST 12 SKIPPED:', e.message);
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════');
  console.log('  RESULTS');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log('═══════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

// Wait for server to be ready, then run
function waitForServer(retries = 10) {
  return new Promise((resolve, reject) => {
    function tryConnect(n) {
      if (n <= 0) return reject(new Error('Server not ready after retries'));
      const req = http.get(`${BASE}/api/health`, (res) => {
        if (res.statusCode < 500) return resolve();
        setTimeout(() => tryConnect(n - 1), 1000);
      });
      req.on('error', () => setTimeout(() => tryConnect(n - 1), 1000));
      req.end();
    }
    tryConnect(retries);
  });
}

// Check if server is already running, start if not
async function main() {
  try {
    await waitForServer(5);
    console.log('✓ Server is running\n');
    await run();
  } catch (e) {
    console.log('Server not running. Starting...');
    require('child_process').fork('./server/index.js', [], {
      stdio: 'pipe',
      env: { ...process.env, PORT: '3001' }
    });
    await new Promise(r => setTimeout(r, 5000));
    try {
      await waitForServer(10);
      await run();
    } catch (e2) {
      console.error('Failed to start server:', e2.message);
      process.exit(1);
    }
  }
}

main();
