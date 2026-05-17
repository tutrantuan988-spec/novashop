/**
 * Product Import Utility — Inspired by Microsoft MarkItDown
 * 
 * Chuyển đổi file Excel/CSV/PDF thành sản phẩm trong Firestore
 * 
 * @usage
 * ```bash
 * # Export file mẫu
 * node server/utils/productImport.js --generate-template --format csv
 * 
 * # Import từ CSV
 * node server/utils/productImport.js --file products.csv --format csv
 * 
 * # Import từ Excel (cần cài: npm install xlsx)
 * node server/utils/productImport.js --file products.xlsx --format excel
 * 
 * # Chạy thử (không ghi vào DB)
 * node server/utils/productImport.js --file products.csv --format csv --dry-run
 * ```
 */
const fs = require('fs');
const path = require('path');

// Lazy require optional packages
let XLSX = null;
try { XLSX = require('xlsx'); } catch {}

// ===== Helpers =====
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parsePrice(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    return parseInt(value.replace(/[^\d]/g, ''), 10) || 0;
  }
  return 0;
}

function validateProduct(product, index) {
  const errors = [];
  if (!product.name) errors.push(`Dòng ${index + 1}: Thiếu tên sản phẩm`);
  if (!product.price || product.price <= 0) {
    errors.push(`Dòng ${index + 1}: "${product.name || '?'}" - Giá không hợp lệ`);
  }
  if (!product.category) {
    errors.push(`Dòng ${index + 1}: "${product.name || '?'}" - Thiếu danh mục`);
  }
  return errors;
}

// ===== CSV Parser (handle quoted fields) =====
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(content) {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('File CSV không có dữ liệu');

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/['"]/g, ''));
  const products = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const product = {};
    headers.forEach((header, idx) => {
      const value = values[idx] || '';
      const key = header.replace(/[\s_-]+/g, '');
      switch (key) {
        case 'price':
        case 'originalprice':
          product[key === 'originalprice' ? 'originalPrice' : 'price'] = parsePrice(value);
          break;
        case 'stock':
          product.stock = parseInt(value, 10) || 0;
          break;
        case 'images':
          product.images = value ? value.split(';').filter(Boolean) : [];
          break;
        case 'tags':
          product.tags = value ? value.split(';').filter(Boolean) : [];
          break;
        default:
          product[key] = value;
      }
    });
    products.push(product);
  }

  return products;
}

// ===== Excel Parser =====
function parseExcel(filePath) {
  if (!XLSX) throw new Error('Thiếu package "xlsx". Chạy: npm install xlsx');

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  return data.map((row) => {
    const product = {};
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = key.toLowerCase().replace(/[\s-]/g, '');
      switch (normalizedKey) {
        case 'tensanpham':
        case 'name':
          product.name = String(value);
          break;
        case 'gia':
        case 'price':
          product.price = parsePrice(value);
          break;
        case 'giagoc':
        case 'originalprice':
          product.originalPrice = parsePrice(value);
          break;
        case 'danhmuc':
        case 'category':
          product.category = String(value).toLowerCase();
          break;
        case 'thuonghieu':
        case 'brand':
          product.brand = String(value);
          break;
        case 'soluong':
        case 'stock':
          product.stock = parseInt(value, 10) || 0;
          break;
        case 'mota':
        case 'description':
          product.description = String(value);
          break;
        case 'hinhanh':
        case 'images':
          product.images = String(value).split(/[;\n]/).filter(Boolean);
          break;
        case 'tags':
          product.tags = String(value).split(/[;\n]/).filter(Boolean);
          break;
      }
    }
    return product;
  });
}

// ===== Import products vào Firestore =====
async function importToFirestore(products, options = {}) {
  const { dryRun = false, db = null } = options;

  let firestoreDb = db;
  if (!firestoreDb) {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
        : null;

      if (!serviceAccount) {
        throw new Error('Cần FIREBASE_SERVICE_ACCOUNT_JSON để kết nối Firestore');
      }

      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    firestoreDb = admin.firestore();
  }

  const results = { success: 0, errors: [], total: products.length };

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const validationErrors = validateProduct(product, i);

    if (validationErrors.length > 0) {
      results.errors.push(...validationErrors);
      continue;
    }

    const productDoc = {
      name: product.name,
      slug: product.slug || slugify(product.name),
      price: product.price,
      originalPrice: product.originalPrice || 0,
      stock: product.stock || 0,
      category: product.category,
      brand: product.brand || '',
      description: product.description || '',
      images: product.images || [],
      tags: product.tags || [],
      rating: 0,
      sold: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (dryRun) {
      console.log(`  [DRY RUN] ${productDoc.name} (${productDoc.price.toLocaleString()}₫)`);
      results.success++;
      continue;
    }

    try {
      await firestoreDb.collection('products').add(productDoc);
      console.log(`  ✅ ${productDoc.name}`);
      results.success++;
    } catch (err) {
      console.error(`  ❌ "${product.name}": ${err.message}`);
      results.errors.push(`${product.name}: ${err.message}`);
    }
  }

  return results;
}

// ===== Generate Template =====
function generateTemplate(format = 'csv') {
  const headers = ['Name', 'Price', 'OriginalPrice', 'Category', 'Brand', 'Stock', 'Description', 'Images', 'Tags'];
  const sampleData = [
    ['Royal Canin Adult Dog Food 2kg', '285000', '320000', 'dog-food', 'Royal Canin', '50', 'Thức ăn cao cấp cho chó trưởng thành', '', 'dog;premium'],
    ['Whiskas Adult Ocean Fish 1.2kg', '115000', '135000', 'cat-food', 'Whiskas', '100', 'Thức ăn cho mèo vị cá biển', '', 'cat;fish'],
    ['Vòng cổ da cao cấp', '85000', '100000', 'accessories', '', '30', 'Vòng cổ da thật cho chó mèo', '', 'accessories;leather'],
  ];

  if (format === 'csv') {
    let csv = headers.join(',') + '\n';
    csv += sampleData
      .map((row) => row.map((v) => (v.includes(',') ? `"${v}"` : v)).join(','))
      .join('\n');
    return csv;
  }

  if (format === 'excel' && XLSX) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  return 'Unsupported format. Use "csv" or "excel".';
}

// ===== CLI Entry Point =====
async function main() {
  const args = process.argv.slice(2);
  const options = {
    file: null,
    format: 'csv',
    dryRun: false,
    generateTemplate: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--file':
        options.file = args[++i];
        break;
      case '--format':
        options.format = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--generate-template':
        options.generateTemplate = true;
        break;
      default:
        console.error(`❌ Unknown option: ${args[i]}`);
        process.exit(1);
    }
  }

  if (options.generateTemplate) {
    const ext = options.format === 'excel' ? 'xlsx' : 'csv';
    const filename = `product-import-template.${ext}`;
    const template = generateTemplate(options.format);
    fs.writeFileSync(filename, template);
    console.log(`\n✅ Đã tạo file mẫu: ${filename}`);
    console.log('\n📝 Điền thông tin sản phẩm vào file, sau đó chạy:');
    console.log(`   node server/utils/productImport.js --file ${filename} --format ${options.format}`);
    console.log('\n🔍 Chạy thử (không ghi DB):');
    console.log(`   node server/utils/productImport.js --file ${filename} --format ${options.format} --dry-run`);
    return;
  }

  if (!options.file) {
    console.log('\n📋 Usage:');
    console.log('  Import sản phẩm:');
    console.log('    node server/utils/productImport.js --file products.csv --format csv');
    console.log('    node server/utils/productImport.js --file products.xlsx --format excel');
    console.log('\n  Tạo file mẫu:');
    console.log('    node server/utils/productImport.js --generate-template --format csv');
    console.log('\n  Chạy thử:');
    console.log('    node server/utils/productImport.js --file products.csv --dry-run');
    return;
  }

  if (!fs.existsSync(options.file)) {
    console.error(`❌ File không tồn tại: ${options.file}`);
    process.exit(1);
  }

  console.log(`\n📂 File: ${options.file}`);
  console.log(`📊 Format: ${options.format}`);

  let products = [];
  switch (options.format) {
    case 'csv': {
      const content = fs.readFileSync(options.file, 'utf-8');
      products = parseCSV(content);
      break;
    }
    case 'excel': {
      products = parseExcel(options.file);
      break;
    }
    default:
      console.error(`❌ Format không hỗ trợ: ${options.format}`);
      process.exit(1);
  }

  console.log(`📦 Tìm thấy ${products.length} sản phẩm\n`);

  if (products.length === 0) {
    console.log('Không có sản phẩm nào để import');
    return;
  }

  // Preview
  console.log('--- Preview (5 sản phẩm đầu) ---');
  products.slice(0, 5).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} — ${(p.price || 0).toLocaleString()}₫ [${p.category || 'N/A'}]`);
  });
  if (products.length > 5) {
    console.log(`  ... và ${products.length - 5} sản phẩm khác`);
  }

  // Dry run
  if (options.dryRun) {
    console.log('\n🔍 DRY RUN — Không ghi vào database');
    const results = await importToFirestore(products, { dryRun: true });
    if (results.errors.length > 0) {
      console.log('\n⚠️ Lỗi validation:');
      results.errors.forEach((e) => console.log(`  - ${e}`));
    }
    console.log(`\n✅ Sẵn sàng import: ${results.success}/${results.total} sản phẩm`);
    console.log('Bỏ --dry-run để import thật');
    return;
  }

  // Real import
  console.log('\n🚀 Importing...');
  const results = await importToFirestore(products);
  console.log(`\n📊 Kết quả: ${results.success}/${results.total} thành công`);
  if (results.errors.length > 0) {
    console.log(`⚠️ ${results.errors.length} lỗi (hiển thị 5 lỗi đầu):`);
    results.errors.slice(0, 5).forEach((e) => console.log(`  - ${e}`));
  }
}

// Run khi gọi trực tiếp từ CLI
if (require.main === module) {
  main().catch((err) => {
    console.error('\n❌ Fatal:', err.message);
    process.exit(1);
  });
}

module.exports = {
  parseCSV,
  parseExcel,
  importToFirestore,
  generateTemplate,
  validateProduct,
  slugify,
};
