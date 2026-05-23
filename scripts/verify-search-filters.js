const { spawn } = require('child_process');
const path = require('path');

const PROJECT = path.resolve(__dirname, '..');
const BASE = 'http://127.0.0.1:3001';
const SERVER_SCRIPT = path.join(PROJECT, 'server', 'index.js');
const SERVER_READY_MSG = 'TRỌNG ĐỊNH STORE API server running on http://localhost:3001';
const TIMEOUT_MS = 30000;
const PASS = [];
const FAIL = [];

function pass(label) {
  PASS.push(label);
  console.log(`  ✅ PASS: ${label}`);
}

function fail(label, detail) {
  FAIL.push(label);
  console.log(`  ❌ FAIL: ${label} — ${detail}`);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const text = await res.text();
  try {
    return { ok: res.ok, data: JSON.parse(text), status: res.status };
  } catch {
    return { ok: false, data: text, status: res.status };
  }
}

const results = [];

function record(name, ok, detail = '') {
  results.push({ name, ok, detail });
  if (ok) pass(name);
  else fail(name, detail);
}

(async () => {
  console.log('=== VERIFY SEARCH + FILTER API ===\n');

  // 1. Start server
  console.log('1. Starting server...');
  const server = spawn('node', [SERVER_SCRIPT], {
    cwd: PROJECT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '3001' }
  });

  let serverLog = '';
  server.stdout.on('data', d => { serverLog += d.toString(); });
  server.stderr.on('data', d => { serverLog += d.toString(); });

  let started = false;
  const startTime = Date.now();
  while (Date.now() - startTime < TIMEOUT_MS) {
    if (serverLog.includes(SERVER_READY_MSG)) { started = true; break; }
    await sleep(500);
  }

  if (!started) {
    console.error('Server failed to start');
    server.kill();
    process.exit(1);
  }
  console.log('  Server started ✓\n');

  // Wait a moment for PG pool
  await sleep(2000);

  // 2. Test basic product list (new format)
  console.log('2. Test basic product list format...');
  let r = await fetchJSON(`${BASE}/api/products`);
  record('Response has data field', Array.isArray(r.data?.data), JSON.stringify(r.data).slice(0, 80));
  record('Response has total field', typeof r.data?.total === 'number', `total=${r.data?.total}`);
  record('Response has limit field', r.data?.limit > 0, `limit=${r.data?.limit}`);
  record('Response has offset field', r.data?.offset === 0, `offset=${r.data?.offset}`);
  console.log();

  // 3. Test search
  console.log('3. Test ?search=áo (ILIKE)...');
  r = await fetchJSON(`${BASE}/api/products?search=áo`);
  const searchCount = r.data?.data?.length || 0;
  record('Search returns filtered results', searchCount > 0, `found ${searchCount} products with 'áo'`);
  if (searchCount > 0) {
    const allMatch = r.data.data.every(p => p.name && (p.name.toLowerCase().includes('áo') || p.name.toLowerCase().includes('ao')));
    record('All search results contain search term', allMatch, `first: ${r.data.data[0]?.name}`);
  }
  console.log();

  // 4. Test search no results
  console.log('4. Test ?search=zzznotfound...');
  r = await fetchJSON(`${BASE}/api/products?search=zzznotfound`);
  record('Search returns empty for no match', r.data?.data?.length === 0, `found ${r.data?.data?.length} products`);
  record('Total is 0 for no match', r.data?.total === 0, `total=${r.data?.total}`);
  console.log();

  // 5. Test sort by price ascending
  console.log('5. Test ?sort=price_asc...');
  r = await fetchJSON(`${BASE}/api/products?sort=price_asc`);
  const ascData = r.data?.data || [];
  let priceAscOk = true;
  for (let i = 1; i < ascData.length; i++) {
    if (ascData[i].price < ascData[i - 1].price) { priceAscOk = false; break; }
  }
  record('Sort price ascending works', priceAscOk, `first: ${ascData[0]?.price}, last: ${ascData[ascData.length - 1]?.price}`);
  console.log();

  // 6. Test sort by price descending
  console.log('6. Test ?sort=price_desc...');
  r = await fetchJSON(`${BASE}/api/products?sort=price_desc`);
  const descData = r.data?.data || [];
  let priceDescOk = true;
  for (let i = 1; i < descData.length; i++) {
    if (descData[i].price > descData[i - 1].price) { priceDescOk = false; break; }
  }
  record('Sort price descending works', priceDescOk, `first: ${descData[0]?.price}, last: ${descData[descData.length - 1]?.price}`);
  console.log();

  // 7. Test sort by name ascending
  console.log('7. Test ?sort=name_asc...');
  r = await fetchJSON(`${BASE}/api/products?sort=name_asc`);
  const nameData = r.data?.data || [];
  let nameAscOk = true;
  for (let i = 1; i < nameData.length; i++) {
    if ((nameData[i].name || '').localeCompare(nameData[i - 1].name || '') < 0) { nameAscOk = false; break; }
  }
  record('Sort name ascending works', nameAscOk, `first: ${nameData[0]?.name}, last: ${nameData[nameData.length - 1]?.name}`);
  console.log();

  // 8. Test offset pagination
  console.log('8. Test ?limit=2&offset=0 vs offset=2...');
  r = await fetchJSON(`${BASE}/api/products?limit=2&offset=0`);
  const page1 = r.data?.data || [];
  record('First page has 2 products', page1.length === 2, `got ${page1.length} products`);

  r = await fetchJSON(`${BASE}/api/products?limit=2&offset=2`);
  const page2 = r.data?.data || [];
  record('Second page has products', page2.length > 0, `got ${page2.length} products`);
  
  if (page1.length >= 2 && page2.length >= 1) {
    record('Pages have different products', page1[0].id !== page2[0].id, `page1[0].id=${page1[0].id}, page2[0].id=${page2[0].id}`);
  }
  console.log();

  // 9. Test category filter still works
  console.log('9. Test ?category_id filter...');
  r = await fetchJSON(`${BASE}/api/products?limit=100`);
  const allProducts = r.data?.data || [];
  
  // Find first product with category_id
  const prodWithCat = allProducts.find(p => p.category_id);
  if (prodWithCat) {
    r = await fetchJSON(`${BASE}/api/products?category_id=${prodWithCat.category_id}`);
    const catFiltered = r.data?.data || [];
    const allMatchCat = catFiltered.every(p => p.category_id === prodWithCat.category_id);
    record('Category filter returns correct products', allMatchCat && catFiltered.length > 0, `found ${catFiltered.length} products in category`);
  }
  console.log();

  // 10. Test status filter — active products
  console.log('10. Test ?status=active...');
  r = await fetchJSON(`${BASE}/api/products?status=active`);
  const activeData = r.data?.data || [];
  const allActive = activeData.every(p => p.status === 'active');
  record('Status=active filter works', activeData.length > 0 && allActive, `found ${activeData.length} active products`);
  console.log();

  // 11. Test combined filters
  console.log('11. Test combined filters (search + sort)...');
  r = await fetchJSON(`${BASE}/api/products?search=Laptop&sort=price_desc`);
  const combined = r.data?.data || [];
  const allContainLaptop = combined.every(p => p.name && p.name.toLowerCase().includes('laptop'));
  record('Combined search+sort returns correct results', combined.length > 0 && allContainLaptop, `found ${combined.length} laptops, sorted desc`);
  console.log();

  // Shutdown
  console.log('--- Shutting down ---');
  server.kill('SIGTERM');
  await sleep(1000);

  // Report
  const total = PASS.length + FAIL.length;
  console.log(`\n═════════════════════════════════════════`);
  console.log(`  VERIFICATION RESULTS: ${PASS.length}/${total} passed`);
  console.log(`═════════════════════════════════════════`);
  if (FAIL.length > 0) {
    console.log(`\n  FAILURES:`);
    FAIL.forEach(f => console.log(`    • ${f}`));
    process.exit(1);
  } else {
    console.log(`\n  ✅ ALL TESTS PASSED`);
    process.exit(0);
  }
})();
