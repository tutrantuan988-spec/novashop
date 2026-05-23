const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { requireAdmin } = require('../middleware/auth');

// Apply admin protection to all import routes
router.use(requireAdmin);

// =============================================
//  MarkItDown-style Product Import API
//  Pattern from: microsoft/markitdown
//  Cho phép import sản phẩm từ CSV/Excel
// =============================================

const upload = multer({
  dest: path.join(os.tmpdir(), 'imports'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.csv', '.xlsx', '.xls'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file CSV, XLSX, XLS'));
    }
  }
});

/**
 * POST /api/import/products
 * Import sản phẩm từ file CSV/Excel
 * Body: multipart/form-data với field 'file'
 * Query: ?dryRun=true (chỉ validate, không import)
 *       ?format=csv|excel (tự động detect từ extension)
 */
router.post('/products', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng upload file CSV hoặc Excel' });
    }

    const dryRun = req.query.dryRun === 'true';
    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    // Parse file — markitdown-inspired conversion
    let products;
    if (ext === '.csv') {
      products = await parseCSV(filePath);
    } else if (['.xlsx', '.xls'].includes(ext)) {
      products = await parseExcel(filePath);
    }

  // Clean up temp file
  try { fs.unlinkSync(filePath); } catch (e) {
    console.warn('Could not delete temp file:', e.message);
  }

    // Validate
    const { valid, errors, warnings } = validateProducts(products);
    
    if (!valid && errors.length > 0) {
      return res.status(422).json({
        error: 'Dữ liệu không hợp lệ',
        errors,
        warnings,
        totalRows: products.length,
        validRows: products.length - errors.length
      });
    }

    if (dryRun) {
      return res.json({
        message: 'Dry-run thành công',
        totalRows: products.length,
        validRows: products.length - errors.length,
        warnings,
        sample: products.slice(0, 3)
      });
    }

    // Import vào Firestore (dùng firebase-admin — consistent với project)
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        admin.initializeApp({
          credential: admin.credential.cert(
            JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
          )
        });
      } else {
        admin.initializeApp();
      }
    }
    const firestore = admin.firestore();

    const batch = firestore.batch();
    const productsRef = firestore.collection('products');
    let imported = 0;

    for (const product of products) {
      if (!product.name) continue;
      const docRef = productsRef.doc();
      batch.set(docRef, {
        ...product,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        importBatch: Date.now().toString()
      });
      imported++;
    }

    await batch.commit();

    res.json({
      message: `Import thành công ${imported} sản phẩm`,
      imported,
      warnings
    });

  } catch (err) {
    console.error('Import error:', err);
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {
      console.error('Failed to cleanup temp file:', e.message);
    }
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/import/template
 * Tạo file template mẫu để download
 */
router.get('/template', (req, res) => {
  const format = req.query.format || 'csv';
  const headers = [
    'name', 'price', 'originalPrice', 'category', 
    'description', 'image', 'images', 'stock', 
    'brand', 'weight', 'specifications'
  ];
  
  const sampleRow = [
    'Áo thun nam Premium Cotton size L',
    '285000',
    '350000',
    'thoi-trang',
    'Áo thun cotton cao cấp, form regular fit',
    'https://example.com/image.jpg',
    'https://example.com/img1.jpg|https://example.com/img2.jpg',
    '100',
    'Premium Fashion',
    '250g',
    '{"material":"Cotton 100%","size":"L"}'
  ];

  if (format === 'csv') {
    const csv = '\uFEFF' + headers.join(',') + '\n' + sampleRow.join(',') + '\n';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="product-import-template.csv"');
    return res.send(csv);
  }

  // XLSX template
  try {
    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="product-import-template.xlsx"');
    res.send(buf);
  } catch (e) {
    res.status(500).json({ error: 'Cần cài package xlsx: npm install xlsx' });
  }
});

// ===== Helpers =====

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('File CSV trống hoặc chỉ có header');

  const headers = parseCSVLine(lines[0]);
  const products = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || values.every(v => !v.trim())) continue;
    
    const product = {};
    headers.forEach((h, idx) => {
      const val = values[idx] || '';
      product[h.trim()] = val.trim();
    });
    products.push(product);
  }

  return products;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseExcel(filePath) {
  try {
    const XLSX = require('xlsx');
    const wb = XLSX.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws);
    return data.map(row => {
      const product = {};
      Object.keys(row).forEach(key => {
        product[key.trim()] = String(row[key] ?? '').trim();
      });
      return product;
    });
  } catch (e) {
    throw new Error(`Lỗi parse Excel: ${e.message}. Cần cài: npm install xlsx`);
  }
}

function validateProducts(products) {
  const errors = [];
  const warnings = [];
  const valid = [];

  products.forEach((p, i) => {
    const rowNum = i + 2; // +2 vì header row 1 + 0-index
    const issues = [];

    if (!p.name) issues.push(`Dòng ${rowNum}: Thiếu tên sản phẩm (name)`);
    if (!p.price || isNaN(Number(p.price))) issues.push(`Dòng ${rowNum}: Giá không hợp lệ (price)`);
    if (p.stock && isNaN(Number(p.stock))) warnings.push(`Dòng ${rowNum}: stock không phải số`);

    if (issues.length > 0) {
      errors.push(...issues);
    } else {
      valid.push({
        name: p.name,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : Number(p.price),
        category: p.category || 'uncategorized',
        description: p.description || '',
        image: p.image || '',
        images: p.images ? p.images.split('|').filter(Boolean) : [],
        stock: p.stock ? Number(p.stock) : 0,
        brand: p.brand || '',
        weight: p.weight || '',
        specifications: p.specifications ? tryParseJSON(p.specifications) : {},
        rating: 0,
        reviewCount: 0,
        active: true
      });
    }
  });

  return { valid, errors, warnings };
}

function tryParseJSON(str) {
  try { return JSON.parse(str); } catch { return {}; }
}

module.exports = router;
