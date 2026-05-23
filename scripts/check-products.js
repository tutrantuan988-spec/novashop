require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Pool } = require('pg');

async function checkProducts() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('🔍 Kiểm tra sản phẩm...\n');
    
    // Check tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('Product', 'products', 'Category', 'categories')
      ORDER BY table_name
    `);
    
    console.log('📊 Tables hiện có:');
    tables.rows.forEach(row => console.log('  -', row.table_name));
    console.log('');
    
    // Check Product table (Prisma old)
    try {
      const oldProducts = await pool.query('SELECT COUNT(*) as count FROM "Product"');
      console.log('📦 Sản phẩm trong bảng Product (Prisma cũ):', oldProducts.rows[0].count);
      
      const sampleOld = await pool.query('SELECT id, name, price, "categoryId" FROM "Product" LIMIT 3');
      if (sampleOld.rows.length > 0) {
        console.log('   Ví dụ:');
        sampleOld.rows.forEach(p => console.log(`   - ${p.name} (${p.price} VND)`));
      }
    } catch (e) {
      console.log('📦 Bảng Product (cũ): Không tồn tại');
    }
    console.log('');
    
    // Check products table (new)
    try {
      const newProducts = await pool.query('SELECT COUNT(*) as count FROM products');
      console.log('📦 Sản phẩm trong bảng products (PostgreSQL mới):', newProducts.rows[0].count);
      
      const sampleNew = await pool.query('SELECT id, name_vi, base_price, category_id FROM products LIMIT 3');
      if (sampleNew.rows.length > 0) {
        console.log('   Ví dụ:');
        sampleNew.rows.forEach(p => console.log(`   - ${p.name_vi} (${p.base_price} VND)`));
      }
    } catch (e) {
      console.log('📦 Bảng products (mới): Không tồn tại hoặc lỗi');
    }
    console.log('');
    
    // Check categories
    try {
      const cats = await pool.query('SELECT COUNT(*) as count FROM categories');
      console.log('📁 Danh mục trong bảng categories (mới):', cats.rows[0].count);
      
      const sampleCats = await pool.query('SELECT slug, name_vi FROM categories WHERE parent_id IS NULL LIMIT 5');
      if (sampleCats.rows.length > 0) {
        console.log('   Danh mục gốc:');
        sampleCats.rows.forEach(c => console.log(`   - ${c.name_vi} (${c.slug})`));
      }
    } catch (e) {
      console.log('📁 Bảng categories: Lỗi -', e.message);
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkProducts();
