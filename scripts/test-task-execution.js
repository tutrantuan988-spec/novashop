const http = require('http');

function apiGet(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3001${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data: data }); }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== TASK 1: API Health Check ===');
  try {
    const health = await apiGet('/api/health');
    console.log(`Status: ${health.status}`);
    console.log(`Body: ${JSON.stringify(health.data, null, 2)}`);
    console.log('TASK 1: PASS ✓\n');
  } catch (e) {
    console.log(`Connection failed: ${e.message}`);
    console.log('Server not ready yet, waiting 5 more seconds...');
    await new Promise(r => setTimeout(r, 5000));
    try {
      const health = await apiGet('/api/health');
      console.log(`Status: ${health.status}`);
      console.log(`Body: ${JSON.stringify(health.data, null, 2)}`);
      console.log('TASK 1: PASS ✓\n');
    } catch (e2) {
      console.log(`TASK 1: FAIL ✗ - ${e2.message}`);
      return;
    }
  }

  console.log('=== TASK 2: Category Schema API ===');
  const categoryIds = [
    { slug: 'Thời trang', id: 'ff0d5643-2246-441e-a0de-682159e813ff' },
    { slug: 'Điện tử', id: '7a3702d2-73a5-46cc-9e6e-5a9907ac9bd9' },
    { slug: 'Thú cưng', id: '8d2c556e-8b36-4df4-beb2-d1b77c73a69e' }
  ];

  let allPassed = true;
  const expected = {
    'ff0d5643-2246-441e-a0de-682159e813ff': ['size', 'color', 'material'],
    '7a3702d2-73a5-46cc-9e6e-5a9907ac9bd9': ['ram', 'cpu', 'storage'],
    '8d2c556e-8b36-4df4-beb2-d1b77c73a69e': ['breed', 'weight', 'ingredients']
  };

  for (const cat of categoryIds) {
    try {
      const res = await apiGet(`/api/categories/${cat.id}/schema`);
      if (res.status === 200 && res.data.category && res.data.fields) {
        const fieldKeys = res.data.fields.map(f => f.key).sort();
        const expectedKeys = expected[cat.id].sort();
        const match = JSON.stringify(fieldKeys) === JSON.stringify(expectedKeys);
        console.log(`${cat.slug}: ${match ? 'PASS ✓' : 'FAIL ✗'}`);
        if (!match) {
          console.log(`  Expected: ${expectedKeys}`);
          console.log(`  Got: ${fieldKeys}`);
          allPassed = false;
        }
      } else {
        console.log(`${cat.slug}: FAIL ✗ (HTTP ${res.status})`);
        allPassed = false;
      }
    } catch (e) {
      console.log(`${cat.slug}: FAIL ✗ - ${e.message}`);
      allPassed = false;
    }
  }

  console.log(`\nTASK 2: ${allPassed ? 'PASS ✓' : 'FAIL ✗'}`);
  process.exit(allPassed ? 0 : 1);
}

const server = require('../server/index.js');
console.log('Server required, waiting 5s for startup...');
setTimeout(main, 5000);
