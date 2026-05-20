require('dotenv').config({ path: '.env.local' });
const { query } = require('../server/db/postgres');

async function main() {
  await new Promise(r => setTimeout(r, 1000));

  // 1. Delete all pet-related categories (thu-cung and children)
  console.log('🗑️  Deleting pet categories...');
  await query(`DELETE FROM categories WHERE slug IN (
    'thu-cung', 'phu-kien-thu-cung', 'thuc-an-cho-cho', 'thuc-an-cho-meo',
    'do-choi', 've-sinh-grooming', 'vitamin-bo-sung', 'snack-banh-thuong'
  )`);

  // 2. Delete pet-related attributes
  await query(`DELETE FROM attributes WHERE slug IN (
    'pet-weight', 'pet-breed', 'pet-age', 'pet-flavor', 'pet-size', 'pet-type'
  )`);

  // 3. Delete pet-related products
  await query(`DELETE FROM products WHERE category_id IN (
    SELECT id FROM categories WHERE slug IN (
      'thu-cung', 'phu-kien-thu-cung', 'thuc-an-cho-cho', 'thuc-an-cho-meo',
      'do-choi', 've-sinh-grooming', 'vitamin-bo-sung', 'snack-banh-thuong'
    )
  )`);

  console.log('✅ Pet categories removed');

  // 4. Add new industry categories
  const newCategories = [
    // Thể thao & Dã ngoại
    { slug: 'the-thao', name_vi: 'Thể thao & Dã ngoại', description_vi: 'Dụng cụ thể thao, đồ dã ngoại, gym, yoga', display_order: 60, icon: 'dumbbell', image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop' },
    { slug: 'dung-cu-the-thao', name_vi: 'Dụng cụ thể thao', description_vi: 'Tạ, dây kháng lực, bóng tập', parent_slug: 'the-thao', display_order: 61 },
    { slug: 'do-da-ngoai', name_vi: 'Đồ dã ngoại', description_vi: 'Lều, túi ngủ, balo du lịch', parent_slug: 'the-thao', display_order: 62 },
    { slug: 'giay-the-thao', name_vi: 'Giày thể thao', description_vi: 'Giày chạy bộ, gym, bóng đá', parent_slug: 'the-thao', display_order: 63 },

    // Sách & Văn phòng phẩm
    { slug: 'sach', name_vi: 'Sách & Văn phòng phẩm', description_vi: 'Sách hay, văn phòng phẩm, dụng cụ học tập', display_order: 70, icon: 'book-open', image_url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=300&fit=crop' },
    { slug: 'sach-van-hoc', name_vi: 'Sách văn học', description_vi: 'Tiểu thuyết, truyện ngắn, thơ', parent_slug: 'sach', display_order: 71 },
    { slug: 'sach-kinh-te', name_vi: 'Sách kinh tế', description_vi: 'Kinh doanh, khởi nghiệp, tài chính', parent_slug: 'sach', display_order: 72 },
    { slug: 'van-phong-pham', name_vi: 'Văn phòng phẩm', description_vi: 'Bút, sổ, giấy, dụng cụ văn phòng', parent_slug: 'sach', display_order: 73 },

    // Mẹ & Bé
    { slug: 'me-be', name_vi: 'Mẹ & Bé', description_vi: 'Đồ dùng mẹ bầu, bé sơ sinh, đồ chơi trẻ em', display_order: 80, icon: 'baby', image_url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=300&fit=crop' },
    { slug: 'do-dung-be-so-sinh', name_vi: 'Đồ dùng bé sơ sinh', description_vi: 'Tã, bình sữa, xe đẩy, nôi', parent_slug: 'me-be', display_order: 81 },
    { slug: 'quan-ao-tre-em', name_vi: 'Quần áo trẻ em', description_vi: 'Quần áo, giày dép cho bé', parent_slug: 'me-be', display_order: 82 },
    { slug: 'do-dung-me-bau', name_vi: 'Đồ dùng mẹ bầu', description_vi: 'Quần áo, vitamin, dụng cụ cho mẹ', parent_slug: 'me-be', display_order: 83 },

    // Ô tô & Xe máy
    { slug: 'oto-xe-may', name_vi: 'Ô tô & Xe máy', description_vi: 'Phụ tùng, phụ kiện, chăm sóc xe', display_order: 90, icon: 'car', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop' },
    { slug: 'phu-tung-oto', name_vi: 'Phụ tùng ô tô', description_vi: 'Dầu nhớt, lọc, phanh, lốp', parent_slug: 'oto-xe-may', display_order: 91 },
    { slug: 'phu-kien-xe-may', name_vi: 'Phụ kiện xe máy', description_vi: 'Mũ bảo hiểm, găng tay, áo mưa', parent_slug: 'oto-xe-may', display_order: 92 },
    { slug: 'cham-soc-xe', name_vi: 'Chăm sóc xe', description_vi: 'Rửa xe, đánh bóng, vệ sinh nội thất', parent_slug: 'oto-xe-may', display_order: 93 },

    // Thực phẩm & Đồ uống
    { slug: 'thuc-pham', name_vi: 'Thực phẩm & Đồ uống', description_vi: 'Đặc sản, đồ ăn vặt, nước giải khát', display_order: 100, icon: 'utensils', image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop' },
    { slug: 'dac-san', name_vi: 'Đặc sản vùng miền', description_vi: 'Đặc sản 3 miền, quà tặng', parent_slug: 'thuc-pham', display_order: 101 },
    { slug: 'do-an-vat', name_vi: 'Đồ ăn vặt', description_vi: 'Snack, bánh kẹo, hạt khô', parent_slug: 'thuc-pham', display_order: 102 },
    { slug: 'nuoc-giai-khat', name_vi: 'Nước giải khát', description_vi: 'Trà, cà phê, nước ngọt, sinh tố', parent_slug: 'thuc-pham', display_order: 103 },

    // Nông nghiệp & Vật tư
    { slug: 'nong-nghiep', name_vi: 'Nông nghiệp & Vật tư', description_vi: 'Giống cây, phân bón, dụng cụ làm vườn', display_order: 110, icon: 'sprout', image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop' },
    { slug: 'giong-cay', name_vi: 'Giống cây trồng', description_vi: 'Hạt giống, cây con, hoa kiểng', parent_slug: 'nong-nghiep', display_order: 111 },
    { slug: 'phan-bon', name_vi: 'Phân bón & Thuốc', description_vi: 'Phân hữu cơ, thuốc trừ sâu', parent_slug: 'nong-nghiep', display_order: 112 },
    { slug: 'dung-cu-lam-vuon', name_vi: 'Dụng cụ làm vườn', description_vi: 'Cuốc, xẻng, vòi tưới, kéo cắt cành', parent_slug: 'nong-nghiep', display_order: 113 },
  ];

  // Get parent IDs
  const parentMap = {};
  for (const cat of newCategories) {
    if (!cat.parent_slug) {
      const result = await query(
        `INSERT INTO categories (id, slug, name_vi, name_en, description_vi, display_order, image_url, is_active, show_in_menu, show_in_homepage)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, true, true)
         RETURNING id`,
        [cat.slug, cat.name_vi, cat.slug, cat.description_vi, cat.display_order, cat.image_url || '']
      );
      parentMap[cat.slug] = result.rows[0].id;
      console.log(`  ✅ Created parent: ${cat.name_vi}`);
    }
  }

  for (const cat of newCategories) {
    if (cat.parent_slug && parentMap[cat.parent_slug]) {
      await query(
        `INSERT INTO categories (slug, name_vi, name_en, description_vi, parent_id, display_order, is_active, show_in_menu, show_in_homepage)
         VALUES ($1, $2, $3, $4, $5, $6, true, true, false)`,
        [cat.slug, cat.name_vi, cat.slug, cat.description_vi, parentMap[cat.parent_slug], cat.display_order]
      );
      console.log(`  ✅ Created child: ${cat.name_vi} (parent: ${cat.parent_slug})`);
    }
  }

  console.log('\n✅ Done! New categories added.');

  // Verify
  const result = await query('SELECT slug, name_vi FROM categories ORDER BY display_order');
  console.log('\n📋 All categories:');
  result.rows.forEach(c => console.log(`  ${c.slug} | ${c.name_vi}`));

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
