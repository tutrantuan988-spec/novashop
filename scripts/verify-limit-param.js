// Self-contained verification: start server + test ?limit param + test categories
const path = require('path');
const http = require('http');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PORT = 3099; // different port to avoid conflicts
process.env.PORT = String(PORT);
process.env.NODE_ENV = 'development';
process.env.FIREBASE_PROJECT_ID = 'dev';
process.env.ADMIN_EMAILS = 'admin@example.com';

let server;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, raw: data }); }
      });
    }).on('error', reject);
  });
}

function waitForServer(maxRetries = 15) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      http.get(`http://127.0.0.1:${PORT}/api/health`, (res) => {
        resolve();
      }).on('error', () => {
        if (attempts >= maxRetries) reject(new Error('Server not ready'));
        else setTimeout(check, 1000);
      });
    };
    check();
  });
}

async function main() {
  console.log('═══ VERIFICATION: ?limit param + HomePage rewrite ═══\n');

  // Kill any old process on this port
  try {
    require('child_process').execSync(
      process.platform === 'win32'
        ? `powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force"`
        : `lsof -ti:${PORT} | xargs kill -9 2>/dev/null`,
      { stdio: 'ignore', timeout: 3000 }
    );
  } catch (_) {}

  // Start server
  console.log('Starting server...');
  delete require.cache[require.resolve('../server/index')];
  try {
    server = require('../server/index');
  } catch (err) {
    console.error('ERROR starting server:', err.message);
    process.exit(1);
  }

  try {
    await waitForServer();
    console.log('Server ready on port', PORT);
    console.log('');

    // === TEST 1: GET /api/categories ===
    console.log('--- TEST 1: GET /api/categories ---');
    const cats = await fetchJson(`http://127.0.0.1:${PORT}/api/categories`);
    if (cats.status === 200 && Array.isArray(cats.data) && cats.data.length > 0) {
      console.log(`PASS: ${cats.data.length} categories returned`);
      cats.data.forEach((c, i) => console.log(`  ${i+1}. ${c.name} (${c.id.slice(0,8)}...)`));
    } else {
      console.log(`FAIL: status=${cats.status}, count=${cats.data?.length || 0}`);
    }
    console.log('');

    // === TEST 2: GET /api/products (no limit) ===
    console.log('--- TEST 2: GET /api/products (no limit) ---');
    const allProducts = await fetchJson(`http://127.0.0.1:${PORT}/api/products`);
    if (allProducts.status === 200 && Array.isArray(allProducts.data)) {
      console.log(`PASS: ${allProducts.data.length} products returned`);
    } else {
      console.log(`FAIL: status=${allProducts.status}`);
    }
    console.log('');

    // === TEST 3: GET /api/products?limit=2 ===
    console.log('--- TEST 3: GET /api/products?limit=2 ---');
    const limited = await fetchJson(`http://127.0.0.1:${PORT}/api/products?limit=2`);
    if (limited.status === 200 && Array.isArray(limited.data) && limited.data.length <= 2) {
      console.log(`PASS: ${limited.data.length} products returned (<= 2)`);
      limited.data.forEach((p) => console.log(`  - ${p.name} (${p.category_name}) [${p.price}]`));
    } else {
      console.log(`FAIL: status=${limited.status}, count=${limited.data?.length || 0} (expected <= 2)`);
    }
    console.log('');

    // === TEST 4: GET /api/products?limit=1 ===
    console.log('--- TEST 4: GET /api/products?limit=1 ---');
    const single = await fetchJson(`http://127.0.0.1:${PORT}/api/products?limit=1`);
    if (single.status === 200 && Array.isArray(single.data) && single.data.length === 1) {
      console.log(`PASS: 1 product returned`);
      console.log(`  - ${single.data[0].name}`);
    } else {
      console.log(`FAIL: status=${single.status}, count=${single.data?.length || 0} (expected 1)`);
    }
    console.log('');

    // === TEST 5: GET /api/products?limit=999 (capped at 100) ===
    console.log('--- TEST 5: GET /api/products?limit=999 (clamped) ---');
    const clamped = await fetchJson(`http://127.0.0.1:${PORT}/api/products?limit=999`);
    if (clamped.status === 200 && Array.isArray(clamped.data) && clamped.data.length <= 100) {
      console.log(`PASS: ${clamped.data.length} products returned (bounded)`);
    } else {
      console.log(`FAIL: status=${clamped.status}, count=${clamped.data?.length || 0}`);
    }
    console.log('');

    // === REPORT ===
    const allPass = 
      cats.status === 200 && cats.data?.length > 0 &&
      allProducts.status === 200 &&
      limited.status === 200 && limited.data?.length <= 2 &&
      single.status === 200 && single.data?.length === 1;

    console.log('═══ REPORT ═══');
    console.log(`GET /api/categories:          ${cats.status === 200 && cats.data?.length > 0 ? 'PASS' : 'FAIL'}`);
    console.log(`GET /api/products (all):      ${allProducts.status === 200 ? 'PASS' : 'FAIL'}`);
    console.log(`?limit=2 works:               ${limited.status === 200 && limited.data?.length <= 2 ? 'PASS' : 'FAIL'}`);
    console.log(`?limit=1 works:               ${single.status === 200 && single.data?.length === 1 ? 'PASS' : 'FAIL'}`);
    console.log(`?limit=999 bounded:            ${clamped.status === 200 && clamped.data?.length <= 100 ? 'PASS' : 'FAIL'}`);
    console.log('');
    console.log(`OVERALL:                      ${allPass ? 'PASS' : 'FAIL'}`);

  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    // Cleanup
    setTimeout(() => process.exit(0), 500);
  }
}

main();
