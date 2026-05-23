const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const projectRoot = path.resolve(__dirname, '..');
const nodeExe = process.execPath;
const serverScript = path.join(projectRoot, 'server', 'index.js');

const RESULTS = {};

function report(step, pass, detail) {
  RESULTS[step] = { pass, detail };
  console.log(`  ${pass ? '✓' : '✗'} ${step}: ${detail}`);
}

function api(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: 3001,
      path: urlPath,
      method,
      headers: { 'Content-Type': 'application/json', 'Connection': 'close' }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('Request timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function waitForServer(url, maxRetries = 15) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await api('GET', url);
      return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return false;
}

async function main() {
  console.log('Starting server process...');
  
  const server = spawn(nodeExe, [serverScript], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '3001', NODE_ENV: 'test' }
  });

  server.stdout.on('data', d => process.stdout.write(`[server] ${d}`));
  server.stderr.on('data', d => process.stderr.write(`[server-err] ${d}`));

  // Wait for server to be ready
  console.log('Waiting for server...');
  const ready = await waitForServer('/api/health');
  if (!ready) {
    console.log('FAIL: Server did not start within 15s');
    server.kill();
    process.exit(1);
  }
  console.log('✓ Server is ready');

  // STEP 1: Get first product
  console.log('\n--- STEP 1: Get product ID ---');
  let productId;
  try {
    const resp = await api('GET', '/api/products');
    if (Array.isArray(resp.body) && resp.body.length > 0) {
      productId = resp.body[0].id;
      report('GET products', true, `Found ${resp.body.length} products`);
    } else {
      report('GET products', false, `No products: ${JSON.stringify(resp.body).slice(0,200)}`);
      server.kill();
      process.exit(1);
    }
  } catch (e) {
    report('GET products', false, e.message);
    server.kill();
    process.exit(1);
  }
  console.log(`  Product ID: ${productId}`);

  // STEP 2: List variants (should be empty or have some)
  console.log('\n--- STEP 2: List variants ---');
  try {
    const resp = await api('GET', `/api/products/${productId}/variants`);
    if (Array.isArray(resp.body)) {
      report('GET variants', true, `Count: ${resp.body.length}`);
    } else {
      report('GET variants', false, `Unexpected: ${JSON.stringify(resp.body).slice(0,100)}`);
    }
  } catch (e) {
    report('GET variants', false, e.message);
  }

  // STEP 3: Create variant with auto SKU
  console.log('\n--- STEP 3: Create variant (auto SKU) ---');
  let variantId;
  try {
    const resp = await api('POST', `/api/products/${productId}/variants`, {
      sku: '',
      stock: 10,
      price_override: 280000,
      attribute_values: { size: 'L', color: 'Đỏ', material: 'Cotton' }
    });
    if (resp.body && resp.body.id && resp.body.sku) {
      variantId = resp.body.id;
      report('POST variant', true, `SKU=${resp.body.sku}, ID=${resp.body.id.slice(0,8)}...`);
    } else {
      report('POST variant', false, `Response: ${JSON.stringify(resp.body).slice(0,200)}`);
      server.kill();
      process.exit(1);
    }
  } catch (e) {
    report('POST variant', false, e.message);
    server.kill();
    process.exit(1);
  }

  // STEP 4: List variants (should have 1+)
  console.log('\n--- STEP 4: Verify variant in list ---');
  try {
    const resp = await api('GET', `/api/products/${productId}/variants`);
    if (Array.isArray(resp.body) && resp.body.length >= 1) {
      report('Verify variant in list', true, `Count: ${resp.body.length}`);
    } else {
      report('Verify variant in list', false, `Expected >=1, got: ${JSON.stringify(resp.body).slice(0,100)}`);
    }
  } catch (e) {
    report('Verify variant in list', false, e.message);
  }

  // STEP 5: Update variant
  console.log('\n--- STEP 5: Update variant ---');
  try {
    const resp = await api('PUT', `/api/products/${productId}/variants/${variantId}`, {
      price_override: 250000,
      stock: 8
    });
    if (resp.status < 400 && resp.body) {
      report('PUT variant', true, `Status ${resp.status}, response received`);
    } else {
      report('PUT variant', false, `Status ${resp.status}: ${JSON.stringify(resp.body).slice(0,100)}`);
    }
  } catch (e) {
    report('PUT variant', false, e.message);
  }

  // STEP 6: Delete variant
  console.log('\n--- STEP 6: Delete variant ---');
  try {
    const resp = await api('DELETE', `/api/products/${productId}/variants/${variantId}`);
    if (resp.body && resp.body.ok) {
      report('DELETE variant', true, 'ok: true');
    } else {
      report('DELETE variant', false, `Response: ${JSON.stringify(resp.body).slice(0,100)}`);
    }
  } catch (e) {
    report('DELETE variant', false, e.message);
  }

  // STEP 7: Verify deletion
  console.log('\n--- STEP 7: Verify deletion ---');
  try {
    const resp = await api('GET', `/api/products/${productId}/variants`);
    if (Array.isArray(resp.body)) {
      const stillExists = resp.body.find(v => v.id === variantId);
      report('Verify deletion', !stillExists, stillExists ? 'Still found!' : 'Gone from list');
    }
  } catch (e) {
    report('Verify deletion', false, e.message);
  }

  // Cleanup
  server.kill();

  // Final report
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('║        PRODUCT VARIANTS VERIFICATION REPORT        ║');
  console.log('═══════════════════════════════════════════════════════');
  const checks = [
    'variant-create-get-list',
    'variant-auto-sku',
    'variant-update',
    'variant-delete',
    'variant-verify-deletion'
  ];
  for (const [key, val] of Object.entries(RESULTS)) {
    const status = val.pass ? 'PASS' : 'FAIL';
    console.log(`║ ${val.pass ? '✓' : '✗'} ${key.padEnd(40)} ${status.padEnd(6)}║`);
  }
  const allPass = Object.values(RESULTS).every(v => v.pass);
  console.log('═══════════════════════════════════════════════════════');
  console.log(`║ OVERALL:${allPass ? ' PASS' : ' FAIL'}${' '.repeat(40)}║`);
  console.log('═══════════════════════════════════════════════════════');
  process.exit(allPass ? 0 : 1);
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
