// Self-contained product CRUD verification
const http = require('http');
const fs = require('fs');
process.env.PORT = 3001;

const BASE = 'http://127.0.0.1:3001';

function httpRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: '127.0.0.1',
      port: 3001,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(opts, (res) => {
      let respData = '';
      res.on('data', chunk => respData += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(respData) }); }
        catch { resolve({ status: res.statusCode, data: respData }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('========================================');
  console.log('PRODUCT CRUD VERIFICATION');
  console.log('========================================\n');

  // Load server
  require('../server/index.js');
  console.log('Waiting 5s for server startup...');
  await new Promise(r => setTimeout(r, 5000));

  // STEP 1: POST /api/products (Thời trang)
  console.log('--- TASK 1: POST /api/products ---');
  try {
    const product1 = {
      name: "Áo thun basic",
      slug: "ao-thun-basic",
      price: 299000,
      category_id: "ff0d5643-2246-441e-a0de-682159e813ff",
      status: "active",
      attributes: { size: "M", color: "Đen", material: "Cotton" }
    };
    const res1 = await httpRequest('POST', '/api/products', product1);
    console.log(`Status: ${res1.status}`);
    console.log(JSON.stringify(res1.data, null, 2));
    if (res1.status === 201 && res1.data.id) {
      console.log('TASK 1: PASS ✓ (id returned)\n');
    } else {
      console.log('TASK 1: FAIL ✗ (no id in response)\n');
      process.exit(1);
    }
  } catch (e) {
    console.log(`TASK 1: FAIL ✗ - ${e.message}\n`);
    process.exit(1);
  }

  // STEP 2: POST product 2 (Điện tử)
  console.log('--- TASK 2a: Seed Product 2 (Điện tử) ---');
  try {
    const product2 = {
      name: "Laptop Gaming X1",
      slug: "laptop-gaming-x1",
      price: 25000000,
      category_id: "7a3702d2-73a5-46cc-9e6e-5a9907ac9bd9",
      status: "active",
      attributes: { ram: "16GB", cpu: "Intel i7", storage: "512GB SSD" }
    };
    const res2 = await httpRequest('POST', '/api/products', product2);
    console.log(`Status: ${res2.status}`);
    if (res2.status === 201 && res2.data.id) {
      console.log('Product 2: PASS ✓\n');
    } else {
      console.log('Product 2: FAIL ✗\n');
      process.exit(1);
    }
  } catch (e) {
    console.log(`Product 2: FAIL ✗ - ${e.message}\n`);
    process.exit(1);
  }

  // STEP 3: POST product 3 (Thú cưng)
  console.log('--- TASK 2b: Seed Product 3 (Thú cưng) ---');
  try {
    const product3 = {
      name: "Thức ăn hạt Royal",
      slug: "thuc-an-hat-royal",
      price: 450000,
      category_id: "8d2c556e-8b36-4df4-beb2-d1b77c73a69e",
      status: "active",
      attributes: { breed: "Mọi giống", weight: "2kg", ingredients: "Thịt gà, rau củ" }
    };
    const res3 = await httpRequest('POST', '/api/products', product3);
    console.log(`Status: ${res3.status}`);
    if (res3.status === 201 && res3.data.id) {
      console.log('Product 3: PASS ✓\n');
    } else {
      console.log('Product 3: FAIL ✗\n');
      process.exit(1);
    }
  } catch (e) {
    console.log(`Product 3: FAIL ✗ - ${e.message}\n`);
    process.exit(1);
  }

  // STEP 4: GET /api/products (verify 3 products with different categories)
  console.log('--- TASK 2c: GET /api/products (verify 3 products) ---');
  try {
    const list = await httpRequest('GET', '/api/products');
    console.log(`Status: ${list.status}`);
    console.log(`Count: ${Array.isArray(list.data) ? list.data.length : 'N/A'} products`);

    if (Array.isArray(list.data) && list.data.length >= 3) {
      const recent3 = list.data.slice(0, 3);
      const cats = recent3.map(p => p.category_name).filter(Boolean);
      const uniqueCats = [...new Set(cats)];
      console.log(`Categories found: ${JSON.stringify(cats)}`);
      
      if (uniqueCats.length >= 2) {
        console.log('TASK 2: PASS ✓ (multiple categories present)\n');
      } else {
        console.log('TASK 2: Partial - only 1 category type\n');
      }
    } else {
      console.log('TASK 2: FAIL ✗ (less than 3 products)\n');
      process.exit(1);
    }
  } catch (e) {
    console.log(`TASK 2: FAIL ✗ - ${e.message}\n`);
    process.exit(1);
  }

  // STEP 5: GET /api/products/:id (single product)
  console.log('--- TASK 2d: GET /api/products/:id ---');
  try {
    const list = await httpRequest('GET', '/api/products');
    if (Array.isArray(list.data) && list.data.length > 0) {
      const firstId = list.data[0].id;
      const single = await httpRequest('GET', `/api/products/${firstId}`);
      console.log(`Status: ${single.status}`);
      if (single.status === 200 && single.data.id === firstId) {
        console.log('GET /:id: PASS ✓\n');
      } else {
        console.log('GET /:id: FAIL ✗\n');
      }
    }
  } catch (e) {
    console.log(`GET /:id: FAIL ✗ - ${e.message}\n`);
  }

  // STEP 6: Category filter test
  console.log('--- TASK 2e: Category filter ---');
  try {
    const filtered = await httpRequest('GET', `/api/products?category_id=ff0d5643-2246-441e-a0de-682159e813ff`);
    console.log(`Status: ${filtered.status}`);
    console.log(`Filtered count: ${Array.isArray(filtered.data) ? filtered.data.length : 'N/A'}`);
    if (Array.isArray(filtered.data) && filtered.data.length >= 1) {
      console.log('Category filter: PASS ✓\n');
    } else {
      console.log('Category filter: FAIL ✗\n');
    }
  } catch (e) {
    console.log(`Category filter: FAIL ✗ - ${e.message}\n`);
  }

  console.log('========================================');
  console.log('VERIFICATION COMPLETE');
  console.log('========================================');
  process.exit(0);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
