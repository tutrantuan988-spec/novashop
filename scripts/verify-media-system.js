/**
 * Verification script for Image Upload + Media System
 * 
 * Tests:
 * 1. Product images and variant_images tables exist
 * 2. Can insert and query images
 * 3. Image API endpoints work (GET product images)
 * 4. PG product list returns image field
 * 
 * Usage: node scripts/verify-media-system.js
 */

const BASE = process.env.VITE_API_URL || 'http://localhost:3001';
const { query } = require('../server/db/postgres');

let passed = 0;
let failed = 0;

function test(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name} ${detail}`);
    failed++;
  }
}

async function run() {
  console.log('\n═══ IMAGE UPLOAD + MEDIA SYSTEM VERIFICATION ═══\n');

  // === TASK 1: TABLES ===
  console.log('📋 TASK 1 — Database Tables\n');

  try {
    // Check product_images table
    const piCols = await query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'product_images' 
      ORDER BY ordinal_position
    `);
    const piNames = piCols.rows.map(r => r.column_name);
    test('product_images table exists', piCols.rows.length > 0,
      `(${piCols.rows.length} columns)`);
    test('product_images has id column', piNames.includes('id'));
    test('product_images has product_id FK', piNames.includes('product_id'));
    test('product_images has image_url', piNames.includes('image_url'));
    test('product_images has public_id', piNames.includes('public_id'));
    test('product_images has is_primary', piNames.includes('is_primary'));
    test('product_images has sort_order', piNames.includes('sort_order'));

    // Check variant_images table
    const viCols = await query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'variant_images' 
      ORDER BY ordinal_position
    `);
    const viNames = viCols.rows.map(r => r.column_name);
    test('variant_images table exists', viCols.rows.length > 0,
      `(${viCols.rows.length} columns)`);
    test('variant_images has id column', viNames.includes('id'));
    test('variant_images has variant_id FK', viNames.includes('variant_id'));
    test('variant_images has image_url', viNames.includes('image_url'));
    test('variant_images has public_id', viNames.includes('public_id'));

    // Check indexes
    const indexes = await query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'product_images' AND indexname LIKE '%product_id%'
    `);
    test('product_images has product_id index', indexes.rows.length > 0);

    const vIndexes = await query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = 'variant_images' AND indexname LIKE '%variant_id%'
    `);
    test('variant_images has variant_id index', vIndexes.rows.length > 0);

    // Check FK constraints
    const fks = await query(`
      SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('product_images', 'variant_images')
    `);
    const fkTables = fks.rows.map(r => `${r.table_name}.${r.column_name} → ${r.foreign_table_name}`);
    test('FK constraints exist on media tables', fks.rows.length >= 2,
      `Found: ${fkTables.join(', ')}`);
  } catch (err) {
    console.log(`  ❌ DB Schema error: ${err.message}`);
    failed++;
  }

  // === TASK 2: CLOUDINARY SERVICE ===
  console.log('\n📋 TASK 2 — Cloudinary Service\n');

  try {
    const cloudinary = require('../server/services/cloudinary');
    test('cloudinary service exports uploadImage', typeof cloudinary.uploadImage === 'function');
    test('cloudinary service exports deleteImage', typeof cloudinary.deleteImage === 'function');
    test('cloudinary service exports deleteImages', typeof cloudinary.deleteImages === 'function');
    test('cloudinary service has config', !!(cloudinary.config || cloudinary.configured || cloudinary.cloudinaryConfig),
      'config object found');
    
    // Check env vars
    test('CLOUDINARY_CLOUD_NAME configured', !!process.env.CLOUDINARY_CLOUD_NAME);
    test('CLOUDINARY_API_KEY configured', !!process.env.CLOUDINARY_API_KEY);
    test('CLOUDINARY_API_SECRET configured', !!process.env.CLOUDINARY_API_SECRET);
  } catch (err) {
    console.log(`  ❌ Cloudinary service error: ${err.message}`);
    failed++;
  }

  // === TASK 3: IMAGE API ===
  console.log('\n📋 TASK 3 — Image API Endpoints\n');

  try {
    // Test GET product images endpoint with a real product
    const prodResult = await query(`
      SELECT id, name_vi FROM products WHERE status != 'deleted' LIMIT 1
    `);

    if (prodResult.rows.length > 0) {
      const productId = prodResult.rows[0].id;
      
      // GET /api/products/:id/images
      const http = require('http');
      const getRes = await new Promise((resolve, reject) => {
        http.get(`${BASE}/api/products/${productId}/images`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, body: data }));
        }).on('error', reject);
      });
      
      test('GET /api/products/:id/images returns 200', getRes.status === 200,
        `(HTTP ${getRes.status})`);
      
      let images = [];
      try { images = JSON.parse(getRes.body); } catch {}
      test('GET images returns array', Array.isArray(images));

      // PG product list includes image field
      const listRes = await new Promise((resolve, reject) => {
        http.get(`${BASE}/api/products?limit=3`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, body: data }));
        }).on('error', reject);
      });
      
      test('GET /api/products returns 200', listRes.status === 200,
        `(HTTP ${listRes.status})`);
      
      let listData;
      try { listData = JSON.parse(listRes.body); } catch {}
      const hasImageField = listData?.data?.length > 0 && 'image' in listData.data[0];
      test('Product list includes image field', !!hasImageField);

      // PG product detail includes image field
      const detailRes = await new Promise((resolve, reject) => {
        http.get(`${BASE}/api/products/${productId}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, body: data }));
        }).on('error', reject);
      });
      
      let detailData;
      try { detailData = JSON.parse(detailRes.body); } catch {}
      const detailHasImage = detailData && 'image' in detailData;
      test('Product detail includes image field', !!detailHasImage);

      // Validate image_url format if images exist
      if (images.length > 0) {
        const validUrls = images.every(img => 
          typeof img.image_url === 'string' && img.image_url.startsWith('http')
        );
        test('Image URLs are valid HTTP URLs', validUrls);
        
        const hasPublicIds = images.every(img => typeof img.public_id === 'string');
        test('Images have public_id', hasPublicIds);
        
        test('Images have sort_order', images.every(img => 'sort_order' in img));
        test('Images have is_primary flag', images.every(img => 'is_primary' in img));
      } else {
        console.log('  ⚠️  No product images in DB — upload test images via admin UI');
      }
    } else {
      console.log('  ⚠️  No products in DB — create a product first');
    }
  } catch (err) {
    console.log(`  ❌ Image API error: ${err.message}`);
    failed++;
  }

  // === TASK 4: FRONTEND COMPONENTS ===
  console.log('\n📋 TASK 4 — Frontend Components\n');

  try {
    const fs = require('fs');
    const path = require('path');

    // Check ImageManager component
    const imPath = path.join(__dirname, '..', 'src', 'components', 'ImageManager.jsx');
    test('ImageManager.jsx exists', fs.existsSync(imPath));
    
    const imContent = fs.existsSync(imPath) ? fs.readFileSync(imPath, 'utf8') : '';
    test('ImageManager has react-dropzone', imContent.includes('useDropzone'));
    test('ImageManager has upload handler', imContent.includes('onDrop'));
    test('ImageManager has delete handler', imContent.includes('handleDelete'));
    test('ImageManager has set-primary handler', imContent.includes('handleSetPrimary'));
    test('ImageManager has drag-to-reorder', imContent.includes('onDragStart'));
    test('ImageManager validates file type', imContent.includes('ACCEPTED_MIME'));
    test('ImageManager validates file size', imContent.includes('MAX_FILE_SIZE'));

    // Check AddProductPage integration
    const appPath = path.join(__dirname, '..', 'src', 'pages', 'AddProductPage.jsx');
    const appContent = fs.existsSync(appPath) ? fs.readFileSync(appPath, 'utf8') : '';
    test('AddProductPage imports ImageManager', appContent.includes('ImageManager'));
    test('AddProductPage renders ImageManager in edit mode', appContent.includes('productId={editId}'));

    // Check ProductDetailPage has image gallery
    const pdpPath = path.join(__dirname, '..', 'src', 'pages', 'ProductDetailPage.jsx');
    const pdpContent = fs.existsSync(pdpPath) ? fs.readFileSync(pdpPath, 'utf8') : '';
    test('ProductDetailPage fetches PG images', pdpContent.includes('product/${result.id}/images'));
    test('ProductDetailPage has gallery images', pdpContent.includes('galleryImages'));

    // Check CartPage shows product images
    const cartPath = path.join(__dirname, '..', 'src', 'pages', 'CartPage.jsx');
    const cartContent = fs.existsSync(cartPath) ? fs.readFileSync(cartPath, 'utf8') : '';
    test('CartPage shows product_image', cartContent.includes('item.product_image'));

    // Check ProductCard shows image
    const cardPath = path.join(__dirname, '..', 'src', 'components', 'ProductCard.jsx');
    const cardContent = fs.existsSync(cardPath) ? fs.readFileSync(cardPath, 'utf8') : '';
    test('ProductCard shows product.image', cardContent.includes('product.image'));
  } catch (err) {
    console.log(`  ❌ Frontend check error: ${err.message}`);
    failed++;
  }

  // === TASK 5: SECURITY VALIDATION ===
  console.log('\n📋 TASK 5 — Security + Cleanup\n');

  try {
    // Check multer file filter
    const serverIndex = require('fs').readFileSync(
      require('path').join(__dirname, '..', 'server', 'index.js'), 'utf8'
    );
    test('Multer file filter exists', serverIndex.includes('fileFilter'));
    test('Multer rejects non-image files', serverIndex.includes('image/jpeg') && serverIndex.includes('image/png') && serverIndex.includes('image/webp'));
    test('Multer file size limit set', serverIndex.includes('fileSize'));
    test('Multer limit is 5MB', serverIndex.includes('5 * 1024 * 1024'));

    // Check cleanup on product DELETE
    test('Product DELETE cleans Cloudinary images', serverIndex.includes('deleteImages'));
    test('Variant DELETE cleans variant image', serverIndex.includes('variant_images'));
  } catch (err) {
    console.log(`  ❌ Security check error: ${err.message}`);
    failed++;
  }

  // === SUMMARY ===
  console.log('\n═══════════════════════════════════════════');
  console.log('           FINAL REPORT');
  console.log('═══════════════════════════════════════════');
  console.log(`  PRODUCT MEDIA TABLES:  ${failed > 0 ? 'FAIL' : 'PASS'}`);
  console.log(`  CLOUDINARY UPLOAD:     ${failed > 0 ? 'FAIL' : 'PASS'}`);
  console.log(`  IMAGE API:             ${failed > 0 ? 'FAIL' : 'PASS'}`);
  console.log(`  IMAGE MANAGER UI:      ${failed > 0 ? 'FAIL' : 'PASS'}`);
  console.log(`  STORE IMAGE RENDERING: ${failed > 0 ? 'FAIL' : 'PASS'}`);
  console.log(`  SECURITY VALIDATION:   ${failed > 0 ? 'FAIL' : 'PASS'}`);
  console.log('───────────────────────────────────────────');
  console.log(`  ${passed} passed, ${failed} failed`);
  console.log(`  OVERALL:              ${failed > 0 ? '❌ FAIL' : '✅ PASS'}`);
  console.log('═══════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
