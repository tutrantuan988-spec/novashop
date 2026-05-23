// Self-contained verification: starts server + tests endpoints in one process
const http = require('http');

// Allow server to bind (prevent port conflict)
process.env.PORT = 3001;

const SERVER_PORT = 3001;
const BASE = `http://127.0.0.1:${SERVER_PORT}`;

function httpGet(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data, status: res.statusCode });
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== NOVASHOP TRANSFORMATION VERIFICATION ===');
  console.log('');

  // STEP 1: Check files
  console.log('=== STEP 1: Check pet files deleted ===');
  const fs = require('fs');
  const checks = [
    'src/pages/DogFoodPage.jsx',
    'src/pages/CatFoodPage.jsx',
    'src/pages/PetAccessoriesPage.jsx',
    'src/data/products.js',
    'src/data/categoryProducts.js'
  ];
  for (const f of checks) {
    try {
      fs.accessSync(f, fs.constants.F_OK);
      console.log(`FAIL: ${f} still exists`);
    } catch {
      console.log(`PASS: ${f} deleted`);
    }
  }

  // STEP 2: Start server
  console.log('');
  console.log('=== STEP 2: Start server ===');
  
  // Import the server - this will start listening
  const app = require('../server/index.js');
  
  // Wait for server to be ready
  await new Promise(r => setTimeout(r, 3000));
  console.log('Server started (module loaded)');

  // STEP 3: Test API endpoints
  console.log('');
  console.log('=== STEP 3a: GET /api/categories ===');
  try {
    const cats = await httpGet('/api/categories');
    console.log(JSON.stringify(cats, null, 2));
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }

  console.log('');
  console.log('=== STEP 3b: GET /api/categories/:id/schema (Thời trang) ===');
  try {
    const r = await httpGet('/api/categories/ff0d5643-2246-441e-a0de-682159e813ff/schema');
    console.log(JSON.stringify(r, null, 2));
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }

  console.log('');
  console.log('=== STEP 3c: GET /api/categories/:id/schema (Điện tử) ===');
  try {
    const r = await httpGet('/api/categories/7a3702d2-73a5-46cc-9e6e-5a9907ac9bd9/schema');
    console.log(JSON.stringify(r, null, 2));
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }

  console.log('');
  console.log('=== STEP 3d: GET /api/categories/:id/schema (Thú cưng) ===');
  try {
    const r = await httpGet('/api/categories/8d2c556e-8b36-4df4-beb2-d1b77c73a69e/schema');
    console.log(JSON.stringify(r, null, 2));
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }

  // STEP 4: Check DynamicProductForm + AddProductPage
  console.log('');
  console.log('=== STEP 4: DynamicProductForm & AddProductPage exists ===');
  try {
    fs.accessSync('src/components/DynamicProductForm.jsx', fs.constants.F_OK);
    console.log('PASS: DynamicProductForm.jsx exists');
  } catch {
    console.log('FAIL: DynamicProductForm.jsx missing');
  }
  try {
    fs.accessSync('src/pages/AddProductPage.jsx', fs.constants.F_OK);
    console.log('PASS: AddProductPage.jsx exists');
  } catch {
    console.log('FAIL: AddProductPage.jsx missing');
  }

  console.log('');
  console.log('=== FINAL REPORT ===');
  
  process.exit(0);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
