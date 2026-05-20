#!/usr/bin/env node

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const sampleProducts = [
  {
    slug: 'ao-thun-nam-co-ban',
    nameVi: 'Áo Thun Nam Cơ Bản',
    shortDescriptionVi: 'Áo thun cotton 100%, thoáng mát, dễ phối đồ',
    descriptionVi: 'Áo thun nam cơ bản được làm từ chất liệu cotton 100% cao cấp, mang lại cảm giác thoải mái và thoáng mát khi mặc. Thiết kế đơn giản, dễ dàng phối hợp với nhiều loại trang phục khác nhau.',
    basePrice: 199000,
    salePrice: 149000,
    status: 'active',
    isFeatured: true,
    isBestseller: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    badgeVi: 'Bán chạy',
    badgeColor: '#ef4444',
    stock: 150,
    categorySlug: 'thoi-trang-nam'
  },
  {
    slug: 'ao-so-mi-nu-sieu',
    nameVi: 'Áo Sơ Mi Nữ Siêu Mỏng',
    shortDescriptionVi: 'Chất liệu lụa mềm mại, thiết kế thanh lịch',
    descriptionVi: 'Áo sơ mi nữ với chất liệu lụa cao cấp, mềm mại và thoáng mát. Thiết kế thanh lịch phù hợp cho cả công sở và dạo phố.',
    basePrice: 350000,
    salePrice: 280000,
    status: 'active',
    isFeatured: true,
    isNew: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
    badgeVi: 'Mới',
    badgeColor: '#10b981',
    stock: 80,
    categorySlug: 'thoi-trang-nu'
  },
  {
    slug: 'giay-sneaker-unisex',
    nameVi: 'Giày Sneaker Unisex',
    shortDescriptionVi: 'Thiết kế hiện đại, đế cao su non êm ái',
    descriptionVi: 'Giày sneaker unisex với thiết kế hiện đại, phù hợp cho cả nam và nữ. Đế cao su non mang lại sự êm ái khi di chuyển cả ngày dài.',
    basePrice: 550000,
    salePrice: 450000,
    status: 'active',
    isFeatured: true,
    isBestseller: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    badgeVi: 'Hot',
    badgeColor: '#f59e0b',
    stock: 120,
    categorySlug: 'giay-dep'
  },
  {
    slug: 'tai-nghe-khong-day-pro',
    nameVi: 'Tai Nghe Không Dây Pro',
    shortDescriptionVi: 'Chống ồn chủ động, pin 30 giờ',
    descriptionVi: 'Tai nghe không dây cao cấp với công nghệ chống ồn chủ động ANC, thời lượng pin lên đến 30 giờ. Âm thanh Hi-Res, kết nối Bluetooth 5.3 ổn định.',
    basePrice: 1200000,
    salePrice: 999000,
    status: 'active',
    isFeatured: true,
    isNew: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    badgeVi: 'Mới',
    badgeColor: '#10b981',
    stock: 60,
    categorySlug: 'dien-tu'
  },
  {
    slug: 'son-moi-duong-am',
    nameVi: 'Son Môi Dưỡng Ẩm',
    shortDescriptionVi: 'Màu sắc tự nhiên, dưỡng ẩm 24h',
    descriptionVi: 'Son môi với công thức dưỡng ẩm chuyên sâu, giữ màu suốt 24 giờ. Thành phần thiên nhiên an toàn, không chứa chì và paraben.',
    basePrice: 250000,
    salePrice: 199000,
    status: 'active',
    isFeatured: false,
    isBestseller: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500',
    badgeVi: 'Bán chạy',
    badgeColor: '#ef4444',
    stock: 200,
    categorySlug: 'my-pham'
  },
  {
    slug: 'balo-laptop-chong-nuoc',
    nameVi: 'Balo Laptop Chống Nước',
    shortDescriptionVi: 'Ngăn laptop 15.6 inch, chống nước IPX4',
    descriptionVi: 'Balo laptop với ngăn đệm riêng cho laptop 15.6 inch, chất liệu chống nước IPX4. Nhiều ngăn tiện lợi, quai đeo êm ái giảm tải.',
    basePrice: 450000,
    salePrice: 350000,
    status: 'active',
    isFeatured: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
    badgeVi: '',
    badgeColor: '',
    stock: 90,
    categorySlug: 'phu-kien'
  },
  {
    slug: 'nuoc-hoa-nam-cau-mong',
    nameVi: 'Nước Hoa Nam Cầu Mong',
    shortDescriptionVi: 'Hương gỗ phương Đông, lưu hương 12h',
    descriptionVi: 'Nước hoa nam với hương thơm gỗ phương Đông đặc trưng, kết hợp giữa cedarwood, vetiver và amber. Lưu hương lên đến 12 giờ.',
    basePrice: 850000,
    salePrice: 699000,
    status: 'active',
    isFeatured: false,
    isNew: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500',
    badgeVi: 'Mới',
    badgeColor: '#10b981',
    stock: 45,
    categorySlug: 'nuoc-hoa'
  },
  {
    slug: 'dong-ho-thong-minh',
    nameVi: 'Đồng Hồ Thông Minh',
    shortDescriptionVi: 'Theo dõi sức khỏe, chống nước IP68',
    descriptionVi: 'Đồng hồ thông minh với đầy đủ tính năng theo dõi sức khỏe: nhịp tim, SpO2, giấc ngủ. Màn hình AMOLED 1.4 inch, chống nước IP68.',
    basePrice: 1500000,
    salePrice: 1290000,
    status: 'active',
    isFeatured: true,
    isBestseller: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    badgeVi: 'Hot',
    badgeColor: '#f59e0b',
    stock: 35,
    categorySlug: 'dien-tu'
  },
  {
    slug: 'quan-jean-nam-ong',
    nameVi: 'Quần Jean Nam Ống Rộng',
    shortDescriptionVi: 'Chất denim co giãn, phong cách streetwear',
    descriptionVi: 'Quần jean nam ống rộng với chất denim co giãn thoải mái. Phong cách streetwear hiện đại, phù hợp cho các bạn trẻ năng động.',
    basePrice: 420000,
    salePrice: 329000,
    status: 'active',
    isFeatured: false,
    primaryImageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
    badgeVi: '',
    badgeColor: '',
    stock: 110,
    categorySlug: 'thoi-trang-nam'
  },
  {
    slug: 'kem-chong-nang',
    nameVi: 'Kem Chống Nắng SPF50+',
    shortDescriptionVi: 'Bảo vệ toàn diện, không bết dính',
    descriptionVi: 'Kem chống nắng phổ rộng SPF50+ PA++++, bảo vệ da khỏi tia UVA/UVB. Kết cấu mỏng nhẹ, không bết dính, phù hợp cho mọi loại da.',
    basePrice: 320000,
    salePrice: 259000,
    status: 'active',
    isFeatured: true,
    isBestseller: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500',
    badgeVi: 'Bán chạy',
    badgeColor: '#ef4444',
    stock: 180,
    categorySlug: 'my-pham'
  },
  {
    slug: 'day-chuyen-bac-nu',
    nameVi: 'Dây Chuyền Bạc Nữ',
    shortDescriptionVi: 'Bạc 925 Ý, thiết kế tinh tế',
    descriptionVi: 'Dây chuyền bạc 925 Ý cao cấp với thiết kế tinh tế, sang trọng. Mặt dây chuyền hình hoa mai mang ý nghĩa may mắn, tài lộc.',
    basePrice: 680000,
    salePrice: 550000,
    status: 'active',
    isFeatured: false,
    isNew: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500',
    badgeVi: 'Mới',
    badgeColor: '#10b981',
    stock: 55,
    categorySlug: 'phu-kien'
  },
  {
    slug: 'dep-le-nam-deo',
    nameVi: 'Dép Lê Nam Đế Cao',
    shortDescriptionVi: 'Đế EVA siêu nhẹ, chống trơn trượt',
    descriptionVi: 'Dép lê nam với đế EVA siêu nhẹ, êm ái khi di chuyển. Thiết kế chống trơn trượt, phù hợp đi biển, đi chơi hàng ngày.',
    basePrice: 180000,
    salePrice: 129000,
    status: 'active',
    isFeatured: false,
    primaryImageUrl: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=500',
    badgeVi: '',
    badgeColor: '',
    stock: 200,
    categorySlug: 'giay-dep'
  }
];

const sampleCategories = [
  { slug: 'thoi-trang-nam', nameVi: 'Thời Trang Nam', nameEn: "Men's Fashion", descriptionVi: 'Quần áo, giày dép và phụ kiện cho nam', isActive: true, isFeatured: true, showInMenu: true },
  { slug: 'thoi-trang-nu', nameVi: 'Thời Trang Nữ', nameEn: "Women's Fashion", descriptionVi: 'Quần áo, giày dép và phụ kiện cho nữ', isActive: true, isFeatured: true, showInMenu: true },
  { slug: 'dien-tu', nameVi: 'Điện Tử', nameEn: 'Electronics', descriptionVi: 'Thiết bị điện tử, công nghệ', isActive: true, isFeatured: true, showInMenu: true },
  { slug: 'my-pham', nameVi: 'Mỹ Phẩm', nameEn: 'Cosmetics', descriptionVi: 'Mỹ phẩm và chăm sóc sắc đẹp', isActive: true, isFeatured: true, showInMenu: true },
  { slug: 'giay-dep', nameVi: 'Giày Dép', nameEn: 'Footwear', descriptionVi: 'Giày, dép, sandal cho mọi lứa tuổi', isActive: true, isFeatured: false, showInMenu: true },
  { slug: 'phu-kien', nameVi: 'Phụ Kiện', nameEn: 'Accessories', descriptionVi: 'Balo, ví, đồng hồ, trang sức', isActive: true, isFeatured: false, showInMenu: true },
  { slug: 'nuoc-hoa', nameVi: 'Nước Hoa', nameEn: 'Perfume', descriptionVi: 'Nước hoa nam và nữ', isActive: true, isFeatured: false, showInMenu: true }
];

const sampleCoupons = [
  { code: 'WELCOME10', discount: 50000, minOrder: 300000, maxUses: 1000, usedCount: 0, freeShipping: false, isActive: true, expiresAt: '2027-12-31' },
  { slug: 'FREESHIP', discount: 0, minOrder: 200000, maxUses: 500, usedCount: 0, freeShipping: true, isActive: true, expiresAt: '2027-12-31' },
  { code: 'SALE20', discount: 100000, minOrder: 500000, maxUses: 200, usedCount: 0, freeShipping: false, isActive: true, expiresAt: '2026-12-31' }
];

async function seed() {
  let client;
  try {
    client = await pool.connect();
    console.log('Connected to PostgreSQL');

    await client.query('BEGIN');

    console.log('\n--- Seeding Categories ---');
    for (const cat of sampleCategories) {
      const result = await client.query(
        `INSERT INTO categories (slug, name_vi, name_en, description_vi, is_active, is_featured, show_in_menu)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO UPDATE SET name_vi = EXCLUDED.name_vi
         RETURNING id, slug`,
        [cat.slug, cat.nameVi, cat.nameEn, cat.descriptionVi, cat.isActive, cat.isFeatured, cat.showInMenu]
      );
      console.log(`  ✓ ${result.rows[0].slug} (${result.rows[0].id})`);
    }

    console.log('\n--- Seeding Products ---');
    for (const prod of sampleProducts) {
      const catResult = await client.query('SELECT id FROM categories WHERE slug = $1', [prod.categorySlug]);
      if (!catResult.rows.length) {
        console.log(`  ⚠ Category ${prod.categorySlug} not found, skipping ${prod.slug}`);
        continue;
      }

      const result = await client.query(
        `INSERT INTO products (category_id, slug, name_vi, short_description_vi, description_vi,
          base_price, sale_price, status, is_featured, is_new, is_bestseller,
          primary_image_url, badge_vi, badge_color, track_inventory)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (slug) DO UPDATE SET
           name_vi = EXCLUDED.name_vi,
           base_price = EXCLUDED.base_price,
           sale_price = EXCLUDED.sale_price,
           stock = EXCLUDED.stock
         RETURNING id, slug`,
        [
          catResult.rows[0].id, prod.slug, prod.nameVi, prod.shortDescriptionVi, prod.descriptionVi,
          prod.basePrice, prod.salePrice, prod.status, prod.isFeatured, prod.isNew, prod.isBestseller,
          prod.primaryImageUrl, prod.badgeVi, prod.badgeColor, true
        ]
      );

      const productId = result.rows[0].id;
      await client.query(
        `INSERT INTO inventory (product_id, variant_id, quantity, reserved, warehouse)
         VALUES ($1, NULL, $2, 0, 'main')
         ON CONFLICT (product_id, variant_id, warehouse) DO UPDATE SET quantity = EXCLUDED.quantity`,
        [productId, prod.stock]
      );

      console.log(`  ✓ ${prod.slug} - ${prod.nameVi} (${formatVND(prod.salePrice || prod.basePrice)})`);
    }

    console.log('\n--- Seeding Coupons ---');
    for (const coupon of sampleCoupons) {
      const result = await client.query(
        `INSERT INTO coupons (code, discount, min_order, max_uses, used_count, free_shipping, is_active, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (code) DO UPDATE SET
           discount = EXCLUDED.discount,
           min_order = EXCLUDED.min_order,
           free_shipping = EXCLUDED.free_shipping
         RETURNING code, discount`,
        [coupon.code, coupon.discount, coupon.minOrder, coupon.maxUses, coupon.usedCount, coupon.freeShipping, coupon.isActive, coupon.expiresAt]
      );
      console.log(`  ✓ ${result.rows[0].code} - Giảm ${formatVND(result.rows[0].discount)}`);
    }

    await client.query('COMMIT');

    const productCount = await client.query('SELECT COUNT(*) FROM products');
    const categoryCount = await client.query('SELECT COUNT(*) FROM categories');
    const couponCount = await client.query('SELECT COUNT(*) FROM coupons');

    console.log('\n=== Seed Complete ===');
    console.log(`Categories: ${categoryCount.rows[0].count}`);
    console.log(`Products: ${productCount.rows[0].count}`);
    console.log(`Coupons: ${couponCount.rows[0].count}`);
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

seed();
