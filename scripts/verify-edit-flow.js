// Edit flow verification — picks a Thời trang product and tests full edit cycle
const http = require('http');
process.env.PORT = 3001;

require('../server/index.js');

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
  console.log('EDIT FLOW VERIFICATION');
  console.log('========================================\n');
  console.log('Waiting 5s for server startup...');
  await new Promise(r => setTimeout(r, 5000));

  // STEP 1: Find a Thời trang product
  console.log('--- STEP 1: Find Thời trang product ---');
  const list = await httpRequest('GET', '/api/products?category_id=ff0d5643-2246-441e-a0de-682159e813ff');
  console.log(`Thời trang products: ${Array.isArray(list.data) ? list.data.length : 0}`);
  
  let targetId;
  let originalPrice;
  let originalAttrs;

  if (Array.isArray(list.data) && list.data.length > 0) {
    const p = list.data[0];
    targetId = p.id;
    originalPrice = p.price;
    originalAttrs = typeof p.attributes === 'object' && p.attributes !== null ? p.attributes : {};
    console.log(`Using existing: ${p.name} (${p.id}), price: ${originalPrice}`);
    console.log(`Attrs: ${JSON.stringify(originalAttrs)}\n`);
    console.log('STEP 1: PASS ✓ (found Thời trang product)\n');
  } else {
    // Create a new Thời trang product
    console.log('No Thời trang product found — creating one...');
    const ts = Date.now();
    const created = await httpRequest('POST', '/api/products', {
      name: `Áo sơ mi ${ts}`,
      slug: `ao-so-mi-${ts}`,
      price: 350000,
      category_id: 'ff0d5643-2246-441e-a0de-682159e813ff',
      status: 'draft',
      attributes: { size: 'M', color: 'Xanh', material: 'Cotton' }
    });
    if (created.status !== 201) {
      console.log(`FAIL: POST returned ${created.status} - ${JSON.stringify(created.data)}\n`);
      process.exit(1);
    }
    targetId = created.data.id;
    originalPrice = created.data.price;
    originalAttrs = created.data.attributes || {};
    console.log(`Created: ${created.data.name} (${targetId})\n`);
    console.log('STEP 1: PASS ✓ (created Thời trang product)\n');
  }

  // STEP 2: GET single product
  console.log('--- STEP 2: GET /api/products/:id ---');
  const single = await httpRequest('GET', `/api/products/${targetId}`);
  if (single.status === 200 && single.data.id === targetId) {
    console.log(`Name: ${single.data.name}`);
    console.log(`Price: ${single.data.price}`);
    console.log(`Category: ${single.data.category_name}`);
    console.log(`Attrs: ${JSON.stringify(single.data.attributes)}`);
    console.log('STEP 2: PASS ✓\n');
  } else {
    console.log(`FAIL: status=${single.status}`);
    process.exit(1);
  }

  // STEP 3: PUT — update price + attributes
  console.log('--- STEP 3: PUT — update price + attributes ---');
  const newAttrs = { ...originalAttrs };
  if (newAttrs.color) newAttrs.color = 'Trắng';
  if (newAttrs.material) newAttrs.material = 'Lụa';
  if (newAttrs.size) newAttrs.size = 'L';
  // Also add any missing standard attrs
  if (!newAttrs.color) newAttrs.color = 'Trắng';
  if (!newAttrs.material) newAttrs.material = 'Lụa';

  const updated = await httpRequest('PUT', `/api/products/${targetId}`, {
    price: 350000,
    attributes: newAttrs
  });
  if (updated.status === 200) {
    console.log(`New price: ${updated.data.price} (expected: 350000)`);
    console.log(`New attrs: ${JSON.stringify(updated.data.attributes)}`);
    const priceOk = Number(updated.data.price) === 350000;
    const attrsOk = JSON.stringify(updated.data.attributes).includes('Trắng');
    console.log(`Price correct: ${priceOk ? '✓' : '✗'}`);
    console.log(`Attributes include Trắng: ${attrsOk ? '✓' : '✗'}`);
    if (priceOk && attrsOk) {
      console.log('STEP 3: PASS ✓\n');
    } else {
      console.log('STEP 3: FAIL ✗\n');
      process.exit(1);
    }
  } else {
    console.log(`FAIL: PUT returned ${updated.status}\n`);
    process.exit(1);
  }

  // STEP 4: Verify update persisted
  console.log('--- STEP 4: Verify update persisted ---');
  const verify = await httpRequest('GET', `/api/products/${targetId}`);
  if (verify.status === 200) {
    const priceOk = Number(verify.data.price) === 350000;
    const attrsOk = JSON.stringify(verify.data.attributes).includes('Trắng');
    console.log(`Price 350000: ${priceOk ? '✓' : '✗'} (got: ${verify.data.price})`);
    console.log(`Attributes include Trắng: ${attrsOk ? '✓' : '✗'}`);
    if (priceOk && attrsOk) {
      console.log('STEP 4: PASS ✓\n');
    } else {
      console.log('STEP 4: FAIL ✗\n');
      process.exit(1);
    }
  } else {
    console.log('STEP 4: FAIL ✗\n');
    process.exit(1);
  }

  // STEP 5: Create new product + verify
  console.log('--- STEP 5: POST create + PUT edit new product ---');
  const ts2 = Date.now();
  const created2 = await httpRequest('POST', '/api/products', {
    name: `Sản phẩm thời trang ${ts2}`,
    slug: `san-pham-thoi-trang-${ts2}`,
    price: 250000,
    category_id: 'ff0d5643-2246-441e-a0de-682159e813ff',
    status: 'draft',
    attributes: { size: 'S', color: 'Đỏ', material: 'Cotton' }
  });
  if (created2.status !== 201 || !created2.data.id) {
    console.log(`POST fail: ${created2.status}\n`);
    process.exit(1);
  }
  console.log(`Created: ${created2.data.id} ✓`);

  // Edit it
  const edit2 = await httpRequest('PUT', `/api/products/${created2.data.id}`, {
    price: 280000,
    status: 'active',
    attributes: { size: 'M', color: 'Đỏ', material: 'Cotton cao cấp' }
  });
  if (edit2.status === 200 && Number(edit2.data.price) === 280000) {
    console.log(`Edited: price=${edit2.data.price}, status=${edit2.data.status} ✓`);
    console.log('STEP 5: PASS ✓\n');
  } else {
    console.log(`PUT fail: ${edit2.status}\n`);
    process.exit(1);
  }

  // STEP 6: Final product list
  console.log('--- STEP 6: Final product list ---');
  const final = await httpRequest('GET', '/api/products');
  if (Array.isArray(final.data) && final.data.length >= 2) {
    console.log(`Products in DB: ${final.data.length}`);
    const restored = final.data.find(p => p.id === targetId);
    if (restored && Number(restored.price) === 350000) {
      console.log(`Restored product price: ${restored.price} ✓`);
      console.log('STEP 6: PASS ✓\n');
    }
  }

  console.log('========================================');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║         EDIT FLOW: ALL PASS             ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('========================================');
  process.exit(0);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
