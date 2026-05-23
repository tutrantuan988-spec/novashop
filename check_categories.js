const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });
const { query } = require('./server/db/postgres');

async function check() {
  try {
    const res = await query(`
      SELECT c.name_vi as category_name, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name_vi
      ORDER BY c.name_vi;
    `);
    
    console.table(res.rows);
    
    const totalRes = await query(`SELECT COUNT(*) as total_products FROM products`);
    console.log(`\nTotal Products: ${totalRes.rows[0].total_products}`);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
check();
