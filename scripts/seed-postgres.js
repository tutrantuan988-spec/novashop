#!/usr/bin/env node

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const sampleProducts = [
  {
    slug: 'ao-thun-nam-premium-cotton',
    nameVi: 'Áo thun nam Premium Cotton',
    shortDescriptionVi: 'Áo thun cotton premium, thoáng mát, thấm hút mồ hôi',
    descriptionVi: 'Áo thun nam chất liệu cotton premium, form regular fit, thoáng mát thấm hút mồ hôi tốt. Thiết kế đơn giản dễ phối đồ, phù hợp mặc hàng ngày.',
    basePrice: 185000,
    salePrice: 210000,
    status: 'active',
    isFeatured: true,
    isBestseller: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    badgeVi: 'Bán chạy',
    badgeColor: '#ef4444',
    stock: 45,
    categorySlug: 'thoi-trang'
  },
  {
    slug: 'quan-jean-nam-slim-fit',
    nameVi: 'Quần jean nam Slim Fit',
    shortDescriptionVi: 'Jean slim fit co giãn, thoải mái vận động',
    descriptionVi: 'Quần jean nam form slim fit, chất denim co giãn thoải mái, phù hợp nhiều phong cách từ casual đến semi-formal.',
    basePrice: 95000,
    salePrice: 110000,
    status: 'active',
    isFeatured: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
    badgeVi: 'Sale',
    badgeColor: '#f59e0b',
    stock: 78,
    categorySlug: 'thoi-trang-nam'
  },
  {
    slug: 'giay-sneaker-nike-air-max',
    nameVi: 'Giày sneaker Nike Air Max',
    shortDescriptionVi: 'Sneaker Nike chính hãng, đế khí êm ái',
    descriptionVi: 'Giày sneaker Nike Air Max chính hãng, đế khí êm ái, thiết kế thể thao hiện đại. Phù hợp chạy bộ, tập gym và dạo phố.',
    basePrice: 450000,
    salePrice: 520000,
    status: 'active',
    isFeatured: true,
    isNew: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    badgeVi: 'Mới',
    badgeColor: '#10b981',
    stock: 18,
    categorySlug: 'giay-dep'
  },
  {
    slug: 'dien-thoai-samsung-galaxy-a54',
    nameVi: 'Samsung Galaxy A54 5G 128GB',
    shortDescriptionVi: 'Màn hình Super AMOLED, camera 50MP',
    descriptionVi: 'Điện thoại Samsung Galaxy A54 5G, màn hình Super AMOLED 6.4 inch, camera 50MP, pin 5000mAh. Hiệu năng mạnh mẽ, thiết kế sang trọng.',
    basePrice: 7200000,
    salePrice: 8500000,
    status: 'active',
    isFeatured: true,
    isBestseller: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500',
    badgeVi: 'Bán chạy',
    badgeColor: '#ef4444',
    stock: 62,
    categorySlug: 'dien-tu'
  },
  {
    slug: 'tai-nghe-bluetooth-jbl',
    nameVi: 'Tai nghe Bluetooth JBL',
    shortDescriptionVi: 'Âm bass mạnh mẽ, pin 12 giờ',
    descriptionVi: 'Tai nghe Bluetooth JBL chính hãng, âm bass mạnh mẽ, pin 12 giờ liên tục. Thiết kế gọn nhẹ, kết nối Bluetooth 5.3 ổn định.',
    basePrice: 580000,
    salePrice: 680000,
    status: 'active',
    isFeatured: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    badgeVi: 'Bán chạy',
    badgeColor: '#ef4444',
    stock: 55,
    categorySlug: 'dien-tu'
  },
  {
    slug: 'sac-du-phong-xiaomi-20000mah',
    nameVi: 'Sạc dự phòng Xiaomi 20000mAh',
    shortDescriptionVi: 'Sạc nhanh 22.5W, 2 cổng USB',
    descriptionVi: 'Sạc dự phòng Xiaomi 20000mAh, sạc nhanh 22.5W, 2 cổng USB, thiết kế nhỏ gọn tiện lợi mang theo.',
    basePrice: 450000,
    salePrice: 520000,
    status: 'active',
    isFeatured: false,
    isBestseller: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500',
    badgeVi: 'Tiết kiệm',
    badgeColor: '#10b981',
    stock: 100,
    categorySlug: 'dien-tu'
  },
  {
    slug: 'noi-chien-khong-dau-sunhouse',
    nameVi: 'Nồi chiên không dầu Sunhouse 6L',
    shortDescriptionVi: 'Công nghệ Rapid Air, chiên không dầu mỡ',
    descriptionVi: 'Nồi chiên không dầu Sunhouse 6 lít, công nghệ Rapid Air, chiên nướng không dầu mỡ. Bảng điều khiển cảm ứng, hẹn giờ thông minh.',
    basePrice: 1200000,
    salePrice: 1500000,
    status: 'active',
    isFeatured: true,
    isBestseller: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
    badgeVi: 'Sale',
    badgeColor: '#f59e0b',
    stock: 30,
    categorySlug: 'do-gia-dung'
  },
  {
    slug: 'den-led-trang-tri-thong-minh',
    nameVi: 'Đèn LED trang trí thông minh',
    shortDescriptionVi: 'Đổi màu RGB, điều khiển từ xa',
    descriptionVi: 'Đèn LED trang trí điều khiển từ xa, đổi màu RGB, hẹn giờ, tương thích smart home. Tạo không gian ấm cúng và hiện đại.',
    basePrice: 250000,
    salePrice: 350000,
    status: 'active',
    isFeatured: true,
    isNew: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500',
    badgeVi: 'Hot',
    badgeColor: '#f59e0b',
    stock: 50,
    categorySlug: 'trang-tri-noi-that'
  },
  {
    slug: 'serum-vitamin-c-duong-da',
    nameVi: 'Serum Vitamin C dưỡng da 20%',
    shortDescriptionVi: 'Chống oxy hóa, làm sáng da, mờ thâm',
    descriptionVi: 'Serum Vitamin C 20% chống oxy hóa, làm sáng da, mờ thâm nám, cấp ẩm sâu. Phù hợp mọi loại da, dùng sáng tối.',
    basePrice: 850000,
    salePrice: 980000,
    status: 'active',
    isFeatured: true,
    isBestseller: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500',
    badgeVi: 'Bán chạy',
    badgeColor: '#ef4444',
    stock: 8,
    categorySlug: 'my-pham'
  },
  {
    slug: 'nuoc-hoa-nam-dior-sauvage',
    nameVi: 'Nước hoa nam Dior Sauvage 100ml',
    shortDescriptionVi: 'Hương gỗ phương Đông, lưu hương 12h',
    descriptionVi: 'Nước hoa Dior Sauvage EDT 100ml, hương thơm gỗ phương Đông hiện đại, kết hợp bergamot, pepper và ambroxan. Lưu hương 8-12h.',
    basePrice: 750000,
    salePrice: 880000,
    status: 'active',
    isFeatured: false,
    isNew: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500',
    badgeVi: 'Cao cấp',
    badgeColor: '#8b5cf6',
    stock: 65,
    categorySlug: 'nuoc-hoa'
  },
  {
    slug: 'kem-duong-laneige-water-sleep',
    nameVi: 'Kem dưỡng Laneige Water Sleep Mask',
    shortDescriptionVi: 'Mặt nạ ngủ cấp nước sâu, phục hồi da',
    descriptionVi: 'Mặt nạ ngủ dưỡng ẩm Laneige, cấp nước sâu, phục hồi da sau một đêm. Công thức Hydro Ionized Water giữ ẩm 24h.',
    basePrice: 420000,
    salePrice: 550000,
    status: 'active',
    isFeatured: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500',
    badgeVi: 'Bán chạy',
    badgeColor: '#ef4444',
    stock: 100,
    categorySlug: 'my-pham'
  },
  {
    slug: 'srm-innisfree-jeju-volcanic',
    nameVi: 'Sữa rửa mặt Innisfree Jeju Volcanic',
    shortDescriptionVi: 'Tẩy tế bào chết, làm sạch sâu lỗ chân lông',
    descriptionVi: 'Sữa rửa mặt tẩy tế bào chết Innisfree với hạt núi lửa Jeju, làm sạch sâu, se khít lỗ chân lông. Phù hợp da dầu và hỗn hợp.',
    basePrice: 150000,
    salePrice: 210000,
    status: 'active',
    isFeatured: false,
    isBestseller: true,
    primaryImageUrl: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500',
    badgeVi: 'Tiết kiệm',
    badgeColor: '#10b981',
    stock: 150,
    categorySlug: 'my-pham'
  }
];

const sampleCategories = [
  { slug: 'thoi-trang', nameVi: 'Thời Trang', nameEn: 'Fashion', descriptionVi: 'Quần áo, giày dép và phụ kiện thời trang', isActive: true, isFeatured: true, showInMenu: true },
  { slug: 'thoi-trang-nam', nameVi: 'Thời Trang Nam', nameEn: "Men's Fashion", descriptionVi: 'Quần áo, giày dép và phụ kiện cho nam', isActive: true, isFeatured: true, showInMenu: true },
  { slug: 'dien-tu', nameVi: 'Điện Tử', nameEn: 'Electronics', descriptionVi: 'Thiết bị điện tử, công nghệ', isActive: true, isFeatured: true, showInMenu: true },
  { slug: 'my-pham', nameVi: 'Mỹ Phẩm', nameEn: 'Cosmetics', descriptionVi: 'Mỹ phẩm và chăm sóc sắc đẹp', isActive: true, isFeatured: true, showInMenu: true },
  { slug: 'giay-dep', nameVi: 'Giày Dép', nameEn: 'Footwear', descriptionVi: 'Giày, dép, sandal cho mọi lứa tuổi', isActive: true, isFeatured: false, showInMenu: true },
  { slug: 'do-gia-dung', nameVi: 'Gia Dụng', nameEn: 'Home & Living', descriptionVi: 'Đồ gia dụng, nội thất, trang trí nhà cửa', isActive: true, isFeatured: false, showInMenu: true },
  { slug: 'trang-tri-noi-that', nameVi: 'Trang trí & Nội thất', nameEn: 'Decor & Furniture', descriptionVi: 'Đèn trang trí, thảm, nội thất thông minh', isActive: true, isFeatured: false, showInMenu: true },
  { slug: 'nuoc-hoa', nameVi: 'Nước Hoa', nameEn: 'Perfume', descriptionVi: 'Nước hoa nam và nữ cao cấp', isActive: true, isFeatured: false, showInMenu: true }
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
