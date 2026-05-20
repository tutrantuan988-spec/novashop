#!/usr/bin/env node

/**
 * PostgreSQL Seed Script — Phase 3: Data Migration
 *
 * Seeds PostgreSQL with static product data from src/data/ directory.
 * This ensures the database has initial categories, attributes, and products
 * even before Firestore migration is run.
 *
 * Usage: node scripts/seedPostgres.js
 * Usage (dry run): node scripts/seedPostgres.js --dry-run
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const { query, getClient, initializePool, shutdown } = require('../server/db/postgres');
const catalogService = require('../backend/src/services/catalogService');
const categoryService = require('../backend/src/services/categoryService');
const attributeService = require('../backend/src/services/attributeService');

const isDryRun = process.argv.includes('--dry-run');

// Static product data (same shape as src/data/categoryProducts.js)
const STATIC_CATEGORIES = [
  // === Thú cưng (existing) ===
  { slug: 'thuc-an-cho-cho', name_vi: 'Thức ăn cho chó', name_en: 'Dog Food', description_vi: 'Thức ăn hạt, pate, snack chính hãng cho bé cún', is_featured: true, show_in_menu: true, show_in_homepage: true, display_order: 1 },
  { slug: 'thuc-an-cho-meo', name_vi: 'Thức ăn cho mèo', name_en: 'Cat Food', description_vi: 'Thức ăn dinh dưỡng cho bé mèo khỏe mạnh', is_featured: true, show_in_menu: true, show_in_homepage: true, display_order: 2 },
  { slug: 'phu-kien-thu-cung', name_vi: 'Phụ kiện thú cưng', name_en: 'Pet Accessories', description_vi: 'Vòng cổ, bát ăn, đồ chơi, cây leo mèo...', is_featured: true, show_in_menu: true, show_in_homepage: true, display_order: 3 },
  { slug: 'do-choi', name_vi: 'Đồ chơi', name_en: 'Toys', description_vi: 'Đồ chơi cho chó mèo các loại', show_in_menu: true, display_order: 4 },
  { slug: 've-sinh-grooming', name_vi: 'Vệ sinh & Grooming', name_en: 'Hygiene & Grooming', description_vi: 'Sản phẩm vệ sinh và chăm sóc lông', show_in_menu: true, display_order: 5 },
  { slug: 'vitamin-bo-sung', name_vi: 'Vitamin & Bổ sung', name_en: 'Vitamins & Supplements', description_vi: 'Vitamin và thực phẩm bổ sung', show_in_menu: true, display_order: 6 },
  { slug: 'snack-banh-thuong', name_vi: 'Snack & Bánh thưởng', name_en: 'Snacks & Treats', description_vi: 'Bánh thưởng và snack cho thú cưng', show_in_menu: true, display_order: 7 },
  // === Thời trang ===
  { slug: 'thoi-trang', name_vi: 'Thời trang', name_en: 'Fashion', description_vi: 'Thời trang nam nữ, phụ kiện thời trang cao cấp', is_featured: true, show_in_menu: true, show_in_homepage: true, display_order: 8 },
  { slug: 'thoi-trang-nam', name_vi: 'Thời trang nam', name_en: 'Men Fashion', description_vi: 'Áo sơ mi, quần tây, áo thun, vest nam', show_in_menu: true, display_order: 9 },
  { slug: 'thoi-trang-nu', name_vi: 'Thời trang nữ', name_en: 'Women Fashion', description_vi: 'Đầm, chân váy, áo kiểu nữ thời trang', show_in_menu: true, display_order: 10 },
  { slug: 'phu-kien-thoi-trang', name_vi: 'Phụ kiện thời trang', name_en: 'Fashion Accessories', description_vi: 'Túi xách, đồng hồ, kính mát, trang sức', show_in_menu: true, show_in_homepage: true, display_order: 11 },
  // === Điện tử ===
  { slug: 'dien-tu', name_vi: 'Điện tử', name_en: 'Electronics', description_vi: 'Điện thoại, laptop, tai nghe, phụ kiện công nghệ', is_featured: true, show_in_menu: true, show_in_homepage: true, display_order: 12 },
  { slug: 'dien-thoai-may-tinh-bang', name_vi: 'Điện thoại & Máy tính bảng', name_en: 'Phones & Tablets', description_vi: 'Điện thoại thông minh, máy tính bảng chính hãng', show_in_menu: true, show_in_homepage: true, display_order: 13 },
  { slug: 'laptop-may-tinh', name_vi: 'Laptop & Máy tính', name_en: 'Laptops & Computers', description_vi: 'Laptop, PC, màn hình, linh kiện máy tính', show_in_menu: true, display_order: 14 },
  { slug: 'phu-kien-cong-nghe', name_vi: 'Phụ kiện công nghệ', name_en: 'Tech Accessories', description_vi: 'Tai nghe, sạc dự phòng, ốp lưng, cáp', show_in_menu: true, show_in_homepage: true, display_order: 15 },
  // === Gia dụng ===
  { slug: 'do-gia-dung', name_vi: 'Gia dụng & Nhà cửa', name_en: 'Home & Living', description_vi: 'Đồ gia dụng, nội thất, trang trí nhà cửa', is_featured: true, show_in_menu: true, show_in_homepage: true, display_order: 16 },
  { slug: 'nha-bep', name_vi: 'Nhà bếp', name_en: 'Kitchen', description_vi: 'Dụng cụ nấu bếp, chén bát, nồi chảo', show_in_menu: true, display_order: 17 },
  { slug: 'trang-tri-noi-that', name_vi: 'Trang trí & Nội thất', name_en: 'Decor & Furniture', description_vi: 'Đèn trang trí, thảm, gối, nội thất thông minh', show_in_menu: true, display_order: 18 },
  // === Sức khỏe & Làm đẹp ===
  { slug: 'suc-khoe-lam-dep', name_vi: 'Sức khỏe & Làm đẹp', name_en: 'Health & Beauty', description_vi: 'Mỹ phẩm, chăm sóc da, nước hoa, thực phẩm chức năng', is_featured: true, show_in_menu: true, show_in_homepage: true, display_order: 19 },
  { slug: 'my-pham', name_vi: 'Mỹ phẩm', name_en: 'Cosmetics', description_vi: 'Trang điểm, dưỡng da, chăm sóc tóc', show_in_menu: true, display_order: 20 },
  { slug: 'nuoc-hoa', name_vi: 'Nước hoa', name_en: 'Perfume', description_vi: 'Nước hoa nam nữ cao cấp', show_in_menu: true, display_order: 21 }
];

const STATIC_ATTRIBUTES = [
  { slug: 'brand', name_vi: 'Thương hiệu', type: 'select', is_filterable: true, is_searchable: true, options: [
    { value: 'royal-canin', label_vi: 'Royal Canin', label_en: 'Royal Canin' },
    { value: 'pedigree', label_vi: 'Pedigree', label_en: 'Pedigree' },
    { value: 'whiskas', label_vi: 'Whiskas', label_en: 'Whiskas' },
    { value: 'me-o', label_vi: 'Me-O', label_en: 'Me-O' },
    { value: 'smartheart', label_vi: 'SmartHeart', label_en: 'SmartHeart' },
    { value: 'orijen', label_vi: 'Orijen', label_en: 'Orijen' },
    { value: 'acana', label_vi: 'Acana', label_en: 'Acana' },
    { value: 'taste-of-the-wild', label_vi: 'Taste of the Wild', label_en: 'Taste of the Wild' },
    { value: 'hills', label_vi: "Hill's Science Diet", label_en: "Hill's Science Diet" },
    { value: 'purina', label_vi: 'Purina Pro Plan', label_en: 'Purina Pro Plan' },
    { value: 'fancy-feast', label_vi: 'Fancy Feast', label_en: 'Fancy Feast' },
    { value: 'catsrang', label_vi: 'Catsrang', label_en: 'Catsrang' },
    { value: 'nekko', label_vi: 'Nekko', label_en: 'Nekko' },
    { value: 'petmate', label_vi: 'Petmate', label_en: 'Petmate' },
    { value: 'petcare', label_vi: 'PetCare', label_en: 'PetCare' },
    { value: 'catree', label_vi: 'CatTree', label_en: 'CatTree' },
    { value: 'flexi', label_vi: 'Flexi', label_en: 'Flexi' },
    { value: 'biopet', label_vi: 'BioPet', label_en: 'BioPet' },
    { value: 'petvita', label_vi: 'PetVita', label_en: 'PetVita' },
    { value: 'jerkypet', label_vi: 'JerkyPet', label_en: 'JerkyPet' },
    { value: 'petkit', label_vi: 'Petkit', label_en: 'Petkit' },
    { value: 'kong', label_vi: 'KONG', label_en: 'KONG' },
    { value: 'catry', label_vi: 'Catry', label_en: 'Catry' },
    { value: 'trixie', label_vi: 'Trixie', label_en: 'Trixie' },
    // Fashion brands
    { value: 'zara', label_vi: 'Zara', label_en: 'Zara' },
    { value: 'h&m', label_vi: 'H&M', label_en: 'H&M' },
    { value: 'uniqlo', label_vi: 'Uniqlo', label_en: 'Uniqlo' },
    { value: 'nike', label_vi: 'Nike', label_en: 'Nike' },
    { value: 'adidas', label_vi: 'Adidas', label_en: 'Adidas' },
    { value: 'mango', label_vi: 'Mango', label_en: 'Mango' },
    // Electronics brands
    { value: 'apple', label_vi: 'Apple', label_en: 'Apple' },
    { value: 'samsung', label_vi: 'Samsung', label_en: 'Samsung' },
    { value: 'xiaomi', label_vi: 'Xiaomi', label_en: 'Xiaomi' },
    { value: 'dell', label_vi: 'Dell', label_en: 'Dell' },
    { value: 'hp', label_vi: 'HP', label_en: 'HP' },
    { value: 'lenovo', label_vi: 'Lenovo', label_en: 'Lenovo' },
    { value: 'sony', label_vi: 'Sony', label_en: 'Sony' },
    { value: 'jbl', label_vi: 'JBL', label_en: 'JBL' },
    // Home brands
    { value: 'locknlock', label_vi: 'Lock&Lock', label_en: 'Lock&Lock' },
    { value: 'sunhouse', label_vi: 'Sunhouse', label_en: 'Sunhouse' },
    { value: 'phillips', label_vi: 'Phillips', label_en: 'Phillips' },
    { value: 'kangaroo', label_vi: 'Kangaroo', label_en: 'Kangaroo' },
    // Beauty brands
    { value: 'loreal', label_vi: "L'Oreal", label_en: "L'Oreal" },
    { value: 'innisfree', label_vi: 'Innisfree', label_en: 'Innisfree' },
    { value: 'thefaceshop', label_vi: 'The Face Shop', label_en: 'The Face Shop' },
    { value: 'laneige', label_vi: 'Laneige', label_en: 'Laneige' },
    { value: 'sulwhasoo', label_vi: 'Sulwhasoo', label_en: 'Sulwhasoo' }
  ] },
  { slug: 'weight', name_vi: 'Trọng lượng', type: 'select', is_filterable: true, options: [
    { value: '500g', label_vi: '500g' },
    { value: '1kg', label_vi: '1kg' },
    { value: '1.1kg', label_vi: '1.1kg' },
    { value: '1.2kg', label_vi: '1.2kg' },
    { value: '1.3kg', label_vi: '1.3kg' },
    { value: '1.5kg', label_vi: '1.5kg' },
    { value: '2kg', label_vi: '2kg' },
    { value: '3kg', label_vi: '3kg' },
    { value: '4kg', label_vi: '4kg' },
    { value: '8kg', label_vi: '8kg' },
    { value: '85g', label_vi: '85g' },
    { value: '150g', label_vi: '150g' },
    { value: '200g', label_vi: '200g' },
    { value: '300g', label_vi: '300g' },
    { value: '400g', label_vi: '400g' },
    { value: '480g', label_vi: '480g' },
    { value: '500ml', label_vi: '500ml' }
  ] },
  { slug: 'badge', name_vi: 'Nhãn', type: 'select', is_filterable: true, options: [
    { value: 'ban-chay', label_vi: 'Bán chạy' },
    { value: 'sale', label_vi: 'Sale' },
    { value: 'moi', label_vi: 'Mới' },
    { value: 'tiet-kiem', label_vi: 'Tiết kiệm' },
    { value: 'cao-cap', label_vi: 'Cao cấp' },
    { value: 'snack', label_vi: 'Snack' },
    { value: 'pate', label_vi: 'Pate' },
    { value: 'hot', label_vi: 'Hot' }
  ] },
  { slug: 'size', name_vi: 'Kích thước', type: 'select', is_variant: true, is_filterable: true, options: [
    { value: 's', label_vi: 'S' },
    { value: 'm', label_vi: 'M' },
    { value: 'l', label_vi: 'L' }
  ] },
  { slug: 'color', name_vi: 'Màu sắc', type: 'select', is_variant: true, is_filterable: true, options: [
    { value: 'do', label_vi: 'Đỏ' },
    { value: 'xanh', label_vi: 'Xanh' },
    { value: 'den', label_vi: 'Đen' },
    { value: 'trang', label_vi: 'Trắng' },
    { value: 'hong', label_vi: 'Hồng' },
    { value: 'tim', label_vi: 'Tím' },
    { value: 'xam', label_vi: 'Xám' },
    { value: 'nau', label_vi: 'Nâu' }
  ] },
  // === Fashion-specific attributes ===
  { slug: 'chat-lieu', name_vi: 'Chất liệu', type: 'select', is_filterable: true, is_searchable: true, options: [
    { value: 'cotton', label_vi: 'Cotton' },
    { value: 'jean', label_vi: 'Jean' },
    { value: 'lanh', label_vi: 'Lanh' },
    { value: 'lua', label_vi: 'Lụa' },
    { value: 'polyester', label_vi: 'Polyester' },
    { value: 'theu', label_vi: 'Thêu' },
    { value: 'kaki', label_vi: 'Kaki' },
    { value: 'da', label_vi: 'Da' }
  ] },
  { slug: 'kich-thuoc', name_vi: 'Kích thước', type: 'select', is_variant: true, is_filterable: true, options: [
    { value: 's', label_vi: 'S' },
    { value: 'm', label_vi: 'M' },
    { value: 'l', label_vi: 'L' },
    { value: 'xl', label_vi: 'XL' },
    { value: 'xxl', label_vi: 'XXL' },
    { value: 'xxxl', label_vi: 'XXXL' }
  ] },
  { slug: 'gioi-tinh', name_vi: 'Giới tính', type: 'select', is_filterable: true, options: [
    { value: 'nam', label_vi: 'Nam' },
    { value: 'nu', label_vi: 'Nữ' },
    { value: 'unisex', label_vi: 'Unisex' }
  ] },
  // === Electronics-specific attributes ===
  { slug: 'thuong-hieu-dt', name_vi: 'Thương hiệu điện tử', type: 'select', is_filterable: true, is_searchable: true, options: [
    { value: 'apple', label_vi: 'Apple' },
    { value: 'samsung', label_vi: 'Samsung' },
    { value: 'xiaomi', label_vi: 'Xiaomi' },
    { value: 'dell', label_vi: 'Dell' },
    { value: 'hp', label_vi: 'HP' },
    { value: 'lenovo', label_vi: 'Lenovo' },
    { value: 'sony', label_vi: 'Sony' },
    { value: 'jbl', label_vi: 'JBL' }
  ] },
  { slug: 'dung-luong', name_vi: 'Dung lượng', type: 'select', is_filterable: true, options: [
    { value: '64gb', label_vi: '64GB' },
    { value: '128gb', label_vi: '128GB' },
    { value: '256gb', label_vi: '256GB' },
    { value: '512gb', label_vi: '512GB' },
    { value: '1tb', label_vi: '1TB' }
  ] },
  { slug: 'mau-sac', name_vi: 'Màu sắc (điện tử)', type: 'select', is_filterable: true, options: [
    { value: 'bac', label_vi: 'Bạc' },
    { value: 'xam', label_vi: 'Xám' },
    { value: 'den', label_vi: 'Đen' },
    { value: 'trang', label_vi: 'Trắng' },
    { value: 'vang', label_vi: 'Vàng' },
    { value: 'xanh-duong', label_vi: 'Xanh dương' }
  ] },
  // === Home-specific attributes ===
  { slug: 'chat-lieu-gia-dung', name_vi: 'Chất liệu (gia dụng)', type: 'select', is_filterable: true, options: [
    { value: 'inox', label_vi: 'Inox' },
    { value: 'go', label_vi: 'Gỗ' },
    { value: 'thuy-tinh', label_vi: 'Thủy tinh' },
    { value: 'nhua', label_vi: 'Nhựa' },
    { value: 'gom-su', label_vi: 'Gốm sứ' },
    { value: 'gang', label_vi: 'Gang' }
  ] },
  // === Beauty-specific attributes ===
  { slug: 'loai-da', name_vi: 'Loại da', type: 'select', is_filterable: true, options: [
    { value: 'thuong', label_vi: 'Da thường' },
    { value: 'kho', label_vi: 'Da khô' },
    { value: 'dau', label_vi: 'Da dầu' },
    { value: 'hon-hop', label_vi: 'Da hỗn hợp' },
    { value: 'nhay-cam', label_vi: 'Da nhạy cảm' }
  ] },
  { slug: 'dung-tich', name_vi: 'Dung tích', type: 'select', is_filterable: true, options: [
    { value: '30ml', label_vi: '30ml' },
    { value: '50ml', label_vi: '50ml' },
    { value: '100ml', label_vi: '100ml' },
    { value: '150ml', label_vi: '150ml' },
    { value: '200ml', label_vi: '200ml' },
    { value: '500ml', label_vi: '500ml' }
  ] }
];

const FASHION_BRANDS = ['zara', 'h&m', 'uniqlo', 'nike', 'adidas', 'mango'];
const ELECTRONIC_BRANDS = ['apple', 'samsung', 'xiaomi', 'dell', 'sony', 'jbl'];
const HOME_BRANDS = ['locknlock', 'sunhouse', 'thuydinh', 'phillips', 'kangaroo'];
const BEAUTY_BRANDS = ['loreal', 'innisfree', 'thefaceshop', 'laneige', 'sulwhasoo'];

const STATIC_PRODUCTS = [
  // === Dog Food ===
  {
    slug: 'royal-canin-medium-adult-4kg', name_vi: 'Royal Canin Medium Adult 4kg',
    description_vi: 'Thức ăn hạt cao cấp cho chó trưởng thành giống vừa (11-25kg). Công thức dinh dưỡng cân bằng, hỗ trợ tiêu hóa và khớp.',
    base_price: 890000, sale_price: 1050000, primary_image_url: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc8e5?auto=format&fit=crop&w=600&q=80',
    category_slug: 'thuc-an-cho-cho', badge_vi: 'Bán chạy', is_featured: true, is_bestseller: true,
    brand: 'royal-canin', weight: '4kg', stock: 45
  },
  {
    slug: 'royal-canin-mini-puppy-2kg', name_vi: 'Royal Canin Mini Puppy 2kg',
    description_vi: 'Dinh dưỡng chuyên biệt cho chó con giống nhỏ (dưới 10kg) dưới 10 tháng tuổi. Tăng cường miễn dịch tự nhiên.',
    base_price: 520000, sale_price: 620000, primary_image_url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=600&q=80',
    category_slug: 'thuc-an-cho-cho', badge_vi: 'Mới', is_new: true, is_featured: true,
    brand: 'royal-canin', weight: '2kg', stock: 32
  },
  {
    slug: 'pedigree-adult-beef-1-5kg', name_vi: 'Pedigree Adult Beef & Vegetables 1.5kg',
    description_vi: 'Thức ăn hạt vị thịt bò và rau củ cho chó trưởng thành. Bổ sung canxi và vitamin cho xương chắc khỏe.',
    base_price: 185000, sale_price: 220000, primary_image_url: 'https://images.unsplash.com/photo-1585846416120-3a7354ed7d65?auto=format&fit=crop&w=600&q=80',
    category_slug: 'thuc-an-cho-cho', badge: 'Giảm giá',
    brand: 'pedigree', weight: '1.5kg', stock: 78, is_bestseller: true
  },
  {
    slug: 'pedigree-puppy-chicken-480g', name_vi: 'Pedigree Puppy Chicken 480g',
    description_vi: 'Công thức gà tây dinh dưỡng cho chó con đang phát triển. Hỗ trợ tăng trưởng và phát triển não bộ.',
    base_price: 68000, sale_price: 85000, primary_image_url: 'https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&w=600&q=80',
    category_slug: 'thuc-an-cho-cho',
    brand: 'pedigree', weight: '480g', stock: 120
  },
  {
    slug: 'smartheart-adult-beef-3kg', name_vi: 'SmartHeart Adult Beef 3kg',
    description_vi: 'Thức ăn hạt vị thịt bò nhập khẩu Thái Lan. Dinh dưỡng đầy đủ cho chó trưởng thành mọi giống.',
    base_price: 245000, sale_price: 290000, primary_image_url: 'https://images.unsplash.com/photo-1535930749574-1399327ce1f4?auto=format&fit=crop&w=600&q=80',
    category_slug: 'thuc-an-cho-cho', badge: 'Tiết kiệm',
    brand: 'smartheart', weight: '3kg', stock: 55
  },
  {
    slug: 'pedigree-denta-stix-7pcs', name_vi: 'Pedigree DentaStix 7 que',
    description_vi: 'Que gặm sạch răng, giảm mảng bám. Hương vị thịt bò hấp dẫn, an toàn cho chó.',
    base_price: 55000, sale_price: 72000, primary_image_url: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80',
    category_slug: 'thuc-an-cho-cho', badge: 'Snack',
    brand: 'pedigree', weight: '200g', stock: 200
  },
  // === Cat Food ===
  {
    slug: 'whiskas-adult-tuna-1-2kg', name_vi: 'Whiskas Adult Tuna 1.2kg',
    description_vi: 'Thức ăn hạt vị cá ngừ cho mèo trưởng thành. Công thức giúp lông bóng mượt và giảm búi lông.',
    base_price: 155000, sale_price: 185000, primary_image_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
    category_slug: 'thuc-an-cho-meo', badge_vi: 'Bán chạy', is_featured: true, is_bestseller: true,
    brand: 'whiskas', weight: '1.2kg', stock: 65
  },
  {
    slug: 'me-o-adult-seafood-1-3kg', name_vi: 'Me-O Adult Seafood 1.3kg',
    description_vi: 'Thức ăn hạt hải sản nhập khẩu Thái Lan. Tăng cường canxi và taurine cho mắt sáng.',
    base_price: 125000, sale_price: 150000, primary_image_url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80',
    category_slug: 'thuc-an-cho-meo', badge: 'Tiết kiệm',
    brand: 'me-o', weight: '1.3kg', stock: 90
  },
  {
    slug: 'royal-canin-indoor-2kg', name_vi: 'Royal Canin Indoor 27 2kg',
    description_vi: 'Thức ăn chuyên biệt cho mèo nuôi trong nhà. Giảm mùi phân và kiểm soát cân nặng.',
    base_price: 580000, sale_price: 690000, primary_image_url: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=600&q=80',
    category_slug: 'thuc-an-cho-meo', badge: 'Cao cấp', is_featured: true,
    brand: 'royal-canin', weight: '2kg', stock: 28
  },
  {
    slug: 'fancy-feast-grilled-85g', name_vi: 'Fancy Feast Grilled Chicken 85g',
    description_vi: 'Pate thịt gà nướng thơm ngon, bổ sung nước cho mèo. Xuất xứ Mỹ.',
    base_price: 25000, sale_price: 32000, primary_image_url: 'https://images.unsplash.com/photo-1519052537078-e6302a4968ef?auto=format&fit=crop&w=600&q=80',
    category_slug: 'thuc-an-cho-meo', badge: 'Pate',
    brand: 'fancy-feast', weight: '85g', stock: 300
  },
  {
    slug: 'catsrang-adult-fish-1-5kg', name_vi: 'Catsrang Adult Fish 1.5kg',
    description_vi: 'Thức ăn hạt vị cá nhập khẩu Hàn Quốc. Giàu omega-3 giúp lông bóng mượt.',
    base_price: 195000, sale_price: 235000, primary_image_url: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=600&q=80',
    category_slug: 'thuc-an-cho-meo',
    brand: 'catsrang', weight: '1.5kg', stock: 42
  },
  {
    slug: 'nekko-creamy-chicken-4pcs', name_vi: 'Nekko Creamy Chicken 4 gói',
    description_vi: 'Súp thưởng kem vị gà, bổ sung nước cho mèo. Tiện lợi, dễ cho ăn.',
    base_price: 35000, sale_price: 45000, primary_image_url: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=600&q=80',
    category_slug: 'thuc-an-cho-meo', badge: 'Snack',
    brand: 'nekko', weight: '200g', stock: 250
  },
  // === Pet Accessories ===
  {
    slug: 'vong-co-da-cao-cap', name_vi: 'Vòng cổ da cao cấp cho chó',
    description_vi: 'Vòng cổ da tự nhiên, mềm mại không gây kích ứng. Khóa kim loại chắc chắn.',
    base_price: 125000, sale_price: 160000, primary_image_url: 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&w=600&q=80',
    category_slug: 'phu-kien-thu-cung', badge: 'Hot',
    brand: 'petmate', weight: '150g', stock: 60
  },
  {
    slug: 'bat-an-inox-chong-truot', name_vi: 'Bát ăn inox chống trượt',
    description_vi: 'Bát inox 304 cao cấp, đế cao su chống trượt. Dễ vệ sinh, an toàn cho sức khỏe.',
    base_price: 85000, sale_price: 110000, primary_image_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80',
    category_slug: 'phu-kien-thu-cung',
    brand: 'petkit', weight: '400g', stock: 120
  },
  {
    slug: 'do-choi-xuong-gam-caosu', name_vi: 'Đồ chơi xương gặm cao su',
    description_vi: 'Xương cao su tự nhiên bền bỉ, giúp làm sạch răng và giảm stress cho chó.',
    base_price: 95000, sale_price: 120000, primary_image_url: 'https://images.unsplash.com/photo-1585846416120-3a7354ed7d65?auto=format&fit=crop&w=600&q=80',
    category_slug: 'phu-kien-thu-cung', badge: 'Bán chạy',
    brand: 'kong', weight: '300g', stock: 85
  },
  // === Thời trang ===
  {
    slug: 'ao-so-mi-nam-cotton-cao-cap', name_vi: 'Áo sơ mi nam cotton cao cấp',
    description_vi: 'Áo sơ mi nam chất liệu cotton 100% nhập khẩu, form slim fit, thoáng mát, thấm hút mồ hôi tốt.',
    base_price: 350000, sale_price: 450000, primary_image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
    category_slug: 'thoi-trang', badge_vi: 'Bán chạy', is_featured: true, is_bestseller: true,
    brand: 'zara', weight: '300g', stock: 120
  },
  {
    slug: 'dam-su-nu-thoi-trang', name_vi: 'Đầm sơ mi nữ thời trang',
    description_vi: 'Đầm sơ mi nữ công sở chất liệu linen cao cấp, thiết kế thanh lịch, phù hợp mọi vóc dáng.',
    base_price: 420000, sale_price: 520000, primary_image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
    category_slug: 'thoi-trang', badge_vi: 'Mới', is_featured: true, is_new: true,
    brand: 'mango', weight: '250g', stock: 85
  },
  {
    slug: 'tui-xach-nu-da-cao-cap', name_vi: 'Túi xách nữ da cao cấp',
    description_vi: 'Túi xách nữ da bò thật, thiết kế thời trang, phụ kiện không thể thiếu cho phái đẹp.',
    base_price: 890000, sale_price: 1200000, primary_image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
    category_slug: 'phu-kien-thoi-trang', badge_vi: 'Cao cấp', is_featured: true,
    brand: 'zara', weight: '500g', stock: 40
  },
  {
    slug: 'dong-ho-nam-thoi-trang', name_vi: 'Đồng hồ nam thời trang',
    description_vi: 'Đồng hồ nam dây da cao cấp, mặt kính Sapphire, chống nước 50m, phong cách lịch lãm.',
    base_price: 1500000, sale_price: 2200000, primary_image_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80',
    category_slug: 'phu-kien-thoi-trang', badge_vi: 'Hot', is_featured: true, is_bestseller: true,
    brand: 'uniqlo', weight: '200g', stock: 30
  },
  // === Điện tử ===
  {
    slug: 'iphone-15-pro-max-256gb', name_vi: 'iPhone 15 Pro Max 256GB',
    description_vi: 'Điện thoại thông minh Apple iPhone 15 Pro Max, chip A17 Pro, camera 48MP, Titanium thiết kế.',
    base_price: 27990000, sale_price: 33990000, primary_image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
    category_slug: 'dien-thoai-may-tinh-bang', badge_vi: 'Mới', is_featured: true, is_new: true,
    brand: 'apple', weight: '500g', stock: 15
  },
  {
    slug: 'samsung-galaxy-s24-ultra', name_vi: 'Samsung Galaxy S24 Ultra 256GB',
    description_vi: 'Điện thoại Samsung Galaxy S24 Ultra, màn hình Dynamic AMOLED 2X, camera 200MP, bút S Pen.',
    base_price: 25990000, sale_price: 30990000, primary_image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80',
    category_slug: 'dien-thoai-may-tinh-bang', badge_vi: 'Bán chạy', is_featured: true, is_bestseller: true,
    brand: 'samsung', weight: '500g', stock: 20
  },
  {
    slug: 'laptop-dell-xps-15', name_vi: 'Laptop Dell XPS 15 Intel i7 2024',
    description_vi: 'Laptop Dell XPS 15, Intel Core i7-13700H, RAM 16GB, SSD 512GB, màn hình 15.6 inch OLED.',
    base_price: 32990000, sale_price: 38990000, primary_image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
    category_slug: 'laptop-may-tinh', badge_vi: 'Cao cấp', is_featured: true,
    brand: 'dell', weight: '2.5kg', stock: 10
  },
  {
    slug: 'tai-nghe-jbl-tune-720bt', name_vi: 'Tai nghe JBL TUNE 720BT Wireless',
    description_vi: 'Tai nghe Bluetooth chụp tai JBL, âm bass mạnh mẽ, thời lượng pin 40h, gập gọn.',
    base_price: 890000, sale_price: 1290000, primary_image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    category_slug: 'phu-kien-cong-nghe', badge_vi: 'Bán chạy', is_featured: true, is_bestseller: true,
    brand: 'jbl', weight: '250g', stock: 60
  },
  // === Gia dụng ===
  {
    slug: 'noi-chao-chong-dinh-sunhouse', name_vi: 'Nồi chảo chống dính Sunhouse bộ 5 món',
    description_vi: 'Bộ nồi chảo chống dính cao cấp Sunhouse, đáy từ, dùng được cho bếp từ, bếp gas, bền bỉ.',
    base_price: 650000, sale_price: 890000, primary_image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=80',
    category_slug: 'nha-bep', badge_vi: 'Bán chạy', is_featured: true, is_bestseller: true,
    brand: 'sunhouse', weight: '3kg', stock: 45
  },
  {
    slug: 'den-trang-tri-led-thong-minh', name_vi: 'Đèn trang trí LED thông minh',
    description_vi: 'Đèn LED trang trí điều khiển từ xa, đổi màu RGB, hẹn giờ, tạo không gian ấm cúng.',
    base_price: 250000, sale_price: 350000, primary_image_url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80',
    category_slug: 'trang-tri-noi-that', badge_vi: 'Hot', is_featured: true,
    brand: 'phillips', weight: '500g', stock: 80
  },
  {
    slug: 'thom-trai-dep-chong-truot', name_vi: 'Thảm trải sàn chống trượt cao cấp',
    description_vi: 'Thảm trải sàn phòng khách chất liệu polyester mềm mại, chống trượt, dễ vệ sinh.',
    base_price: 450000, sale_price: 620000, primary_image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
    category_slug: 'trang-tri-noi-that', badge_vi: 'Mới',
    brand: 'kangaroo', weight: '2kg', stock: 35
  },
  // === Sức khỏe & Làm đẹp ===
  {
    slug: 'kem-duong-da-laneige-water-sleep', name_vi: 'Kem dưỡng da mặt Laneige Water Sleep Mask',
    description_vi: 'Mặt nạ ngủ dưỡng ẩm Laneige, cấp nước sâu, phục hồi da sau một đêm, cho làn da căng mọng.',
    base_price: 420000, sale_price: 550000, primary_image_url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
    category_slug: 'my-pham', badge_vi: 'Bán chạy', is_featured: true, is_bestseller: true,
    brand: 'laneige', weight: '70g', stock: 100
  },
  {
    slug: 'srm-da-innisfree-jeju-volcanic', name_vi: 'Sữa rửa mặt Innisfree Jeju Volcanic Scrub',
    description_vi: 'Sữa rửa mặt tẩy tế bào chết Innisfree với hạt núi lửa Jeju, làm sạch sâu, se khít lỗ chân lông.',
    base_price: 150000, sale_price: 210000, primary_image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=600&q=80',
    category_slug: 'my-pham', badge_vi: 'Tiết kiệm', is_featured: true,
    brand: 'innisfree', weight: '150ml', stock: 150
  },
  {
    slug: 'nuoc-hoa-nam-chanel-bleu', name_vi: 'Nước hoa nam Chanel Bleu De Chanel 100ml',
    description_vi: 'Nước hoa cao cấp Chanel Bleu De Chanel, hương thơm gỗ phương Đông hiện đại, lưu hương 8-12h.',
    base_price: 2800000, sale_price: 3500000, primary_image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80',
    category_slug: 'nuoc-hoa', badge_vi: 'Cao cấp', is_featured: true,
    brand: 'sony', weight: '100ml', stock: 25
  }
];

async function seed() {
  console.log('\n🚀 === PHASE 3: SEED POSTGRESQL ===\n');

  try {
    await initializePool();
    console.log('✅ PostgreSQL pool initialized');
  } catch (err) {
    console.error('❌ Cannot connect to PostgreSQL:', err.message);
    console.log('   Make sure DATABASE_URL is set and PostgreSQL is running.');
    console.log('   Run: docker-compose -f docker-compose.postgres.yml up -d');
    process.exit(1);
  }

  const stats = { categories: 0, attributes: 0, products: 0, skipped: 0 };

  try {
    // === Step 1: Seed Categories ===
    console.log('\n📁 Step 1: Seeding Categories...');
    const catMap = {}; // slug → id

    for (const cat of STATIC_CATEGORIES) {
      if (isDryRun) {
        console.log(`   [DRY-RUN] Would create: ${cat.slug} (${cat.name_vi})`);
        stats.skipped++;
        continue;
      }

      // Check if exists by slug
      const existing = await query('SELECT id FROM categories WHERE slug = $1', [cat.slug]);
      if (existing.rows.length > 0) {
        catMap[cat.slug] = existing.rows[0].id;
        console.log(`   ⏩ Skipped (exists): ${cat.slug}`);
        stats.skipped++;
        continue;
      }

      const created = await categoryService.createCategory(cat);
      catMap[cat.slug] = created.id;
      console.log(`   ✅ Created: ${created.slug} (${created.name_vi})`);
      stats.categories++;
    }

    // === Step 2: Seed Attribute Groups & Attributes ===
    console.log('\n🏷️ Step 2: Seeding Attributes...');

    // Create default attribute group
    let defaultGroupId = null;
    const groupResult = await query("SELECT id FROM attribute_groups WHERE slug = 'default'");
    if (groupResult.rows.length > 0) {
      defaultGroupId = groupResult.rows[0].id;
    } else if (!isDryRun) {
      const group = await attributeService.createAttributeGroup({
        name_vi: 'Mặc định', name_en: 'Default', slug: 'default', display_order: 1
      });
      defaultGroupId = group.id;
      console.log(`   ✅ Created attribute group: default`);
    }

    const attrMap = {}; // slug → id

    for (const attr of STATIC_ATTRIBUTES) {
      if (isDryRun) {
        console.log(`   [DRY-RUN] Would create: ${attr.slug}`);
        stats.skipped++;
        continue;
      }

      const existing = await query('SELECT id FROM attributes WHERE slug = $1', [attr.slug]);
      if (existing.rows.length > 0) {
        attrMap[attr.slug] = existing.rows[0].id;
        console.log(`   ⏩ Skipped (exists): ${attr.slug}`);
        stats.skipped++;
        continue;
      }

      const created = await attributeService.createAttribute({
        ...attr,
        group_id: defaultGroupId
      });
      attrMap[attr.slug] = created.id;
      console.log(`   ✅ Created: ${created.slug} (${created.name_vi})`);
      stats.attributes++;
    }

    // === Step 3: Assign attributes to categories ===
    console.log('\n🔗 Step 3: Assigning Attributes to Categories...');
    if (!isDryRun) {
      for (const catSlug of Object.keys(catMap)) {
        const catId = catMap[catSlug];
        const isFashion = ['thoi-trang', 'thoi-trang-nam', 'thoi-trang-nu', 'phu-kien-thoi-trang'].includes(catSlug);
        const isElectronics = ['dien-tu', 'dien-thoai-may-tinh-bang', 'laptop-may-tinh', 'phu-kien-cong-nghe'].includes(catSlug);
        const isHome = ['do-gia-dung', 'nha-bep', 'trang-tri-noi-that'].includes(catSlug);
        const isBeauty = ['suc-khoe-lam-dep', 'my-pham', 'nuoc-hoa'].includes(catSlug);
        const isPet = ['thuc-an-cho-cho', 'thuc-an-cho-meo', 'phu-kien-thu-cung', 'do-choi', 've-sinh-grooming', 'vitamin-bo-sung', 'snack-banh-thuong'].includes(catSlug);

        let attrsToAssign = [];
        if (isPet) {
          attrsToAssign = ['brand', 'weight', 'badge'];
        } else if (isFashion) {
          attrsToAssign = ['chat-lieu', 'kich-thuoc', 'gioi-tinh', 'color', 'badge'];
        } else if (isElectronics) {
          attrsToAssign = ['thuong-hieu-dt', 'dung-luong', 'mau-sac', 'badge'];
        } else if (isHome) {
          attrsToAssign = ['chat-lieu-gia-dung', 'weight', 'color'];
        } else if (isBeauty) {
          attrsToAssign = ['loai-da', 'dung-tich', 'thuong-hieu-dt', 'badge'];
        }

        let order = 1;
        for (const attrSlug of attrsToAssign) {
          if (attrMap[attrSlug]) {
            await categoryService.assignAttributeToCategory(catId, attrMap[attrSlug], {
              is_required: order === 1,
              display_order: order
            });
            order++;
          }
        }
        console.log(`   ✅ Assigned attributes to: ${catSlug}`);
      }
    }

    // === Step 4: Seed Products ===
    console.log('\n📦 Step 4: Seeding Products...');

    for (const prod of STATIC_PRODUCTS) {
      if (isDryRun) {
        console.log(`   [DRY-RUN] Would create: ${prod.slug}`);
        stats.skipped++;
        continue;
      }

      // Check if exists
      const existing = await query('SELECT id FROM products WHERE slug = $1', [prod.slug]);
      if (existing.rows.length > 0) {
        console.log(`   ⏩ Skipped (exists): ${prod.slug}`);
        stats.skipped++;
        continue;
      }

      const categoryId = catMap[prod.category_slug] || null;

      // Build attributes array
      const attributes = [];
      if (attrMap.brand && prod.brand) {
        attributes.push({ attribute_id: attrMap.brand, value_text: prod.brand });
      }
      if (attrMap.weight && prod.weight) {
        attributes.push({ attribute_id: attrMap.weight, value_text: prod.weight });
      }
      if (attrMap.badge && prod.badge_vi) {
        attributes.push({ attribute_id: attrMap.badge, value_text: prod.badge_vi });
      }

      const productData = {
        slug: prod.slug,
        name_vi: prod.name_vi,
        description_vi: prod.description_vi,
        base_price: prod.base_price,
        sale_price: prod.sale_price || null,
        category_id: categoryId,
        primary_image_url: prod.primary_image_url || null,
        status: 'active',
        is_featured: prod.is_featured || false,
        is_new: prod.is_new || false,
        is_bestseller: prod.is_bestseller || false,
      badge_vi: prod.badge_vi || prod.badge || null,
      brand: prod.brand || null,
      track_inventory: true,
      low_stock_threshold: 10
    };

      try {
        await catalogService.createProduct(productData, attributes);
        console.log(`   ✅ Created: ${prod.slug} (${prod.name_vi})`);
        stats.products++;

        // Initialize inventory with stock — create a default variant first
        const productResult = await query('SELECT id FROM products WHERE slug = $1', [prod.slug]);
        if (productResult.rows.length > 0 && prod.stock > 0) {
          const productId = productResult.rows[0].id;
          // Check if default inventory location exists
          const locResult = await query("SELECT id FROM inventory_locations WHERE is_default = true LIMIT 1");
          const locId = locResult.rows.length > 0 ? locResult.rows[0].id : null;

          if (locId) {
            // Create a default variant for this product
            const defaultSku = `DEFAULT-${prod.slug}`;
            const existingVar = await query('SELECT id FROM product_variants WHERE sku = $1', [defaultSku]);
            let variantId;

            if (existingVar.rows.length > 0) {
              variantId = existingVar.rows[0].id;
            } else {
              const variantData = {
                product_id: productId,
                sku: defaultSku,
                name_vi: prod.name_vi,
                price: prod.base_price,
                sale_price: prod.sale_price || null,
                is_active: true,
                is_default: true,
                stock_quantity: prod.stock
              };
              const varResult = await query(
                `INSERT INTO product_variants (product_id, sku, name_vi, price, sale_price, is_active, is_default, stock_quantity)
                 VALUES ($1, $2, $3, $4, $5, true, true, $6)
                 RETURNING id`,
                [productId, defaultSku, prod.name_vi, prod.base_price, prod.sale_price || null, prod.stock]
              );
              variantId = varResult.rows[0].id;
            }

            // Now initialize inventory for the variant
            const inventoryService = require('../backend/src/services/inventoryService');
            await inventoryService.initializeInventoryForVariant(variantId, locId, prod.stock);
          }
        }
      } catch (err) {
        console.error(`   ❌ Failed: ${prod.slug}: ${err.message}`);
      }
    }

  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    await shutdown();
    process.exit(1);
  }

  // === Summary ===
  console.log('\n===== SEED SUMMARY =====');
  console.log(`   Categories created: ${stats.categories}`);
  console.log(`   Attributes created: ${stats.attributes}`);
  console.log(`   Products created:   ${stats.products}`);
  console.log(`   Skipped (exists):   ${stats.skipped}`);
  console.log(isDryRun ? '\n⚠️ DRY RUN — no changes made' : '\n✅ Seeding completed!');
  console.log('');

  await shutdown();
  process.exit(0);
}

seed();
