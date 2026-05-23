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
  // === Thời trang ===
  { slug: 'thoi-trang', name_vi: 'Thời trang', name_en: 'Fashion', description_vi: 'Quần áo, giày dép và phụ kiện thời trang nam nữ', is_featured: true, show_in_menu: true, show_in_homepage: true, display_order: 1 },
  { slug: 'thoi-trang-nam', name_vi: 'Thời trang nam', name_en: 'Men Fashion', description_vi: 'Áo sơ mi, quần tây, áo thun, vest nam', show_in_menu: true, display_order: 2 },
  { slug: 'thoi-trang-nu', name_vi: 'Thời trang nữ', name_en: 'Women Fashion', description_vi: 'Đầm, chân váy, áo kiểu nữ thời trang', show_in_menu: true, display_order: 3 },
  { slug: 'phu-kien-thoi-trang', name_vi: 'Phụ kiện thời trang', name_en: 'Fashion Accessories', description_vi: 'Túi xách, đồng hồ, kính mát, trang sức', show_in_menu: true, show_in_homepage: true, display_order: 4 },
  // === Điện tử ===
  { slug: 'dien-tu', name_vi: 'Điện tử', name_en: 'Electronics', description_vi: 'Điện thoại, laptop, tai nghe, phụ kiện công nghệ', is_featured: true, show_in_menu: true, show_in_homepage: true, display_order: 5 },
  { slug: 'dien-thoai-may-tinh-bang', name_vi: 'Điện thoại & Máy tính bảng', name_en: 'Phones & Tablets', description_vi: 'Điện thoại thông minh, máy tính bảng chính hãng', show_in_menu: true, show_in_homepage: true, display_order: 6 },
  { slug: 'laptop-may-tinh', name_vi: 'Laptop & Máy tính', name_en: 'Laptops & Computers', description_vi: 'Laptop, PC, màn hình, linh kiện máy tính', show_in_menu: true, display_order: 7 },
  { slug: 'phu-kien-cong-nghe', name_vi: 'Phụ kiện công nghệ', name_en: 'Tech Accessories', description_vi: 'Tai nghe, sạc dự phòng, ốp lưng, cáp', show_in_menu: true, show_in_homepage: true, display_order: 8 },
  // === Gia dụng ===
  { slug: 'do-gia-dung', name_vi: 'Gia dụng & Nhà cửa', name_en: 'Home & Living', description_vi: 'Đồ gia dụng, nội thất, trang trí nhà cửa', is_featured: true, show_in_menu: true, show_in_homepage: true, display_order: 9 },
  { slug: 'nha-bep', name_vi: 'Nhà bếp', name_en: 'Kitchen', description_vi: 'Dụng cụ nấu bếp, chén bát, nồi chảo', show_in_menu: true, display_order: 10 },
  { slug: 'trang-tri-noi-that', name_vi: 'Trang trí & Nội thất', name_en: 'Decor & Furniture', description_vi: 'Đèn trang trí, thảm, gối, nội thất thông minh', show_in_menu: true, display_order: 11 },
  // === Sức khỏe & Làm đẹp ===
  { slug: 'suc-khoe-lam-dep', name_vi: 'Sức khỏe & Làm đẹp', name_en: 'Health & Beauty', description_vi: 'Mỹ phẩm, chăm sóc da, nước hoa, thực phẩm chức năng', is_featured: true, show_in_menu: true, show_in_homepage: true, display_order: 12 },
  { slug: 'my-pham', name_vi: 'Mỹ phẩm', name_en: 'Cosmetics', description_vi: 'Trang điểm, dưỡng da, chăm sóc tóc', show_in_menu: true, display_order: 13 },
  { slug: 'nuoc-hoa', name_vi: 'Nước hoa', name_en: 'Perfume', description_vi: 'Nước hoa nam nữ cao cấp', show_in_menu: true, display_order: 14 }
];

const STATIC_ATTRIBUTES = [
  { slug: 'brand', name_vi: 'Thương hiệu', type: 'select', is_filterable: true, is_searchable: true, options: [
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
    { value: 'sulwhasoo', label_vi: 'Sulwhasoo', label_en: 'Sulwhasoo' },
    { value: 'dior', label_vi: 'Dior', label_en: 'Dior' }
  ] },
  { slug: 'kich-thuoc', name_vi: 'Kích thước', type: 'select', is_variant: true, is_filterable: true, options: [
    { value: 's', label_vi: 'S' },
    { value: 'm', label_vi: 'M' },
    { value: 'l', label_vi: 'L' },
    { value: 'xl', label_vi: 'XL' },
    { value: 'xxl', label_vi: 'XXL' }
  ] },
  { slug: 'badge', name_vi: 'Nhãn', type: 'select', is_filterable: true, options: [
    { value: 'ban-chay', label_vi: 'Bán chạy' },
    { value: 'sale', label_vi: 'Sale' },
    { value: 'moi', label_vi: 'Mới' },
    { value: 'tiet-kiem', label_vi: 'Tiết kiệm' },
    { value: 'cao-cap', label_vi: 'Cao cấp' },
    { value: 'hot', label_vi: 'Hot' }
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
const BEAUTY_BRANDS = ['loreal', 'innisfree', 'thefaceshop', 'laneige', 'sulwhasoo', 'dior'];

const STATIC_PRODUCTS = [
  // === Thời trang ===
  {
    slug: 'ao-thun-nam-premium-cotton', name_vi: 'Áo thun nam Premium Cotton',
    description_vi: 'Áo thun nam chất liệu cotton premium, form regular fit, thoáng mát thấm hút mồ hôi tốt.',
    base_price: 185000, sale_price: 210000, primary_image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
    category_slug: 'thoi-trang', badge_vi: 'Bán chạy', is_featured: true, is_bestseller: true,
    brand: 'uniqlo', size: 'M', stock: 45
  },
  {
    slug: 'quan-jean-nam-slim-fit', name_vi: 'Quần jean nam Slim Fit',
    description_vi: 'Quần jean nam form slim fit, chất denim co giãn thoải mái, phù hợp nhiều phong cách.',
    base_price: 95000, sale_price: 110000, primary_image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80',
    category_slug: 'thoi-trang-nam', badge_vi: 'Sale', is_featured: true,
    brand: 'zara', size: '32', stock: 78
  },
  {
    slug: 'giay-sneaker-nike-air-max', name_vi: 'Giày sneaker Nike Air Max',
    description_vi: 'Giày sneaker Nike Air Max chính hãng, đế khí êm ái, thiết kế thể thao hiện đại.',
    base_price: 450000, sale_price: 520000, primary_image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    category_slug: 'thoi-trang', badge_vi: 'Mới', is_featured: true, is_new: true,
    brand: 'nike', size: '42', stock: 18
  },
  {
    slug: 'dam-so-mi-nu-linen', name_vi: 'Đầm sơ mi nữ linen cao cấp',
    description_vi: 'Đầm sơ mi nữ chất liệu linen cao cấp, thiết kế thanh lịch, phù hợp công sở và dạo phố.',
    base_price: 420000, sale_price: 520000, primary_image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
    category_slug: 'thoi-trang-nu', badge_vi: 'Mới', is_featured: true, is_new: true,
    brand: 'mango', size: 'M', stock: 85
  },
  {
    slug: 'tui-xach-nu-da-cao-cap', name_vi: 'Túi xách nữ da cao cấp',
    description_vi: 'Túi xách nữ da bò thật, thiết kế thời trang, phụ kiện không thể thiếu cho phái đẹp.',
    base_price: 890000, sale_price: 1200000, primary_image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
    category_slug: 'phu-kien-thoi-trang', badge_vi: 'Cao cấp', is_featured: true,
    brand: 'zara', stock: 40
  },
  {
    slug: 'dong-ho-nam-thoi-trang', name_vi: 'Đồng hồ nam thời trang',
    description_vi: 'Đồng hồ nam dây da cao cấp, mặt kính Sapphire, chống nước 50m, phong cách lịch lãm.',
    base_price: 1500000, sale_price: 2200000, primary_image_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80',
    category_slug: 'phu-kien-thoi-trang', badge_vi: 'Hot', is_featured: true, is_bestseller: true,
    brand: 'adidas', stock: 30
  },
  // === Điện tử ===
  {
    slug: 'dien-thoai-samsung-galaxy-a54', name_vi: 'Samsung Galaxy A54 5G 128GB',
    description_vi: 'Điện thoại Samsung Galaxy A54 5G, màn hình Super AMOLED 6.4 inch, camera 50MP, pin 5000mAh.',
    base_price: 7200000, sale_price: 8500000, primary_image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80',
    category_slug: 'dien-thoai-may-tinh-bang', badge_vi: 'Bán chạy', is_featured: true, is_bestseller: true,
    brand: 'samsung', stock: 62
  },
  {
    slug: 'tai-nghe-bluetooth-jbl', name_vi: 'Tai nghe Bluetooth JBL',
    description_vi: 'Tai nghe Bluetooth JBL chính hãng, âm bass mạnh mẽ, pin 12 giờ liên tục.',
    base_price: 580000, sale_price: 680000, primary_image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    category_slug: 'phu-kien-cong-nghe', badge_vi: 'Bán chạy', is_featured: true, is_bestseller: true,
    brand: 'jbl', stock: 55
  },
  {
    slug: 'sac-du-phong-xiaomi-20000mah', name_vi: 'Sạc dự phòng Xiaomi 20000mAh',
    description_vi: 'Sạc dự phòng Xiaomi 20000mAh, sạc nhanh 22.5W, 2 cổng USB, thiết kế nhỏ gọn.',
    base_price: 450000, sale_price: 520000, primary_image_url: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80',
    category_slug: 'phu-kien-cong-nghe', badge_vi: 'Bán chạy', is_featured: true,
    brand: 'xiaomi', stock: 100
  },
  {
    slug: 'laptop-dell-xps-15', name_vi: 'Laptop Dell XPS 15 Intel i7 2024',
    description_vi: 'Laptop Dell XPS 15, Intel Core i7-13700H, RAM 16GB, SSD 512GB, màn hình 15.6 inch OLED.',
    base_price: 32990000, sale_price: 38990000, primary_image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
    category_slug: 'laptop-may-tinh', badge_vi: 'Cao cấp', is_featured: true,
    brand: 'dell', stock: 10
  },
  // === Gia dụng ===
  {
    slug: 'noi-chien-khong-dau-sunhouse', name_vi: 'Nồi chiên không dầu Sunhouse 6L',
    description_vi: 'Nồi chiên không dầu Sunhouse 6 lít, công nghệ Rapid Air, chiên nướng không dầu mỡ.',
    base_price: 1200000, sale_price: 1500000, primary_image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=80',
    category_slug: 'nha-bep', badge_vi: 'Sale', is_featured: true, is_bestseller: true,
    brand: 'sunhouse', stock: 30
  },
  {
    slug: 'den-led-trang-tri-thong-minh', name_vi: 'Đèn LED trang trí thông minh',
    description_vi: 'Đèn LED trang trí điều khiển từ xa, đổi màu RGB, hẹn giờ, tương thích smart home.',
    base_price: 250000, sale_price: 350000, primary_image_url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80',
    category_slug: 'trang-tri-noi-that', badge_vi: 'Hot', is_featured: true,
    brand: 'phillips', stock: 80
  },
  {
    slug: 'bo-noi-chao-chong-dinh', name_vi: 'Bộ nồi chảo chống dính 5 món',
    description_vi: 'Bộ nồi chảo chống dính cao cấp, đáy từ, dùng được cho bếp từ, bếp gas, bền bỉ.',
    base_price: 650000, sale_price: 890000, primary_image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=80',
    category_slug: 'nha-bep', badge_vi: 'Bán chạy', is_featured: true,
    brand: 'locknlock', stock: 45
  },
  {
    slug: 'tham-trai-san-chong-truot', name_vi: 'Thảm trải sàn chống trượt cao cấp',
    description_vi: 'Thảm trải sàn phòng khách chất liệu polyester mềm mại, chống trượt, dễ vệ sinh.',
    base_price: 450000, sale_price: 620000, primary_image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
    category_slug: 'trang-tri-noi-that', badge_vi: 'Mới',
    brand: 'kangaroo', stock: 35
  },
  // === Sức khỏe & Làm đẹp ===
  {
    slug: 'serum-vitamin-c-duong-da', name_vi: 'Serum Vitamin C dưỡng da 20%',
    description_vi: 'Serum Vitamin C 20% chống oxy hóa, làm sáng da, mờ thâm nám, cấp ẩm sâu.',
    base_price: 850000, sale_price: 980000, primary_image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
    category_slug: 'my-pham', badge_vi: 'Bán chạy', is_featured: true, is_bestseller: true,
    brand: 'innisfree', stock: 8
  },
  {
    slug: 'nuoc-hoa-nam-dior-sauvage', name_vi: 'Nước hoa nam Dior Sauvage 100ml',
    description_vi: 'Nước hoa cao cấp Dior Sauvage EDT 100ml, hương thơm gỗ phương Đông hiện đại, lưu hương 8-12h.',
    base_price: 750000, sale_price: 880000, primary_image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80',
    category_slug: 'nuoc-hoa', badge_vi: 'Cao cấp', is_featured: true,
    brand: 'dior', stock: 65
  },
  {
    slug: 'kem-duong-da-laneige-water-sleep', name_vi: 'Kem dưỡng da Laneige Water Sleep Mask',
    description_vi: 'Mặt nạ ngủ dưỡng ẩm Laneige, cấp nước sâu, phục hồi da sau một đêm, cho làn da căng mọng.',
    base_price: 420000, sale_price: 550000, primary_image_url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
    category_slug: 'my-pham', badge_vi: 'Bán chạy', is_featured: true,
    brand: 'laneige', stock: 100
  },
  {
    slug: 'srm-innisfree-jeju-volcanic', name_vi: 'Sữa rửa mặt Innisfree Jeju Volcanic',
    description_vi: 'Sữa rửa mặt tẩy tế bào chết Innisfree với hạt núi lửa Jeju, làm sạch sâu, se khít lỗ chân lông.',
    base_price: 150000, sale_price: 210000, primary_image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=600&q=80',
    category_slug: 'my-pham', badge_vi: 'Tiết kiệm', is_featured: true,
    brand: 'innisfree', stock: 150
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

        let attrsToAssign = [];
        if (isFashion) {
          attrsToAssign = ['chat-lieu', 'kich-thuoc', 'gioi-tinh', 'color', 'badge'];
        } else if (isElectronics) {
          attrsToAssign = ['thuong-hieu-dt', 'dung-luong', 'mau-sac', 'badge'];
        } else if (isHome) {
          attrsToAssign = ['chat-lieu-gia-dung', 'color', 'badge'];
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
      if (attrMap.kich-thuoc && prod.size) {
        attributes.push({ attribute_id: attrMap['kich-thuoc'], value_text: prod.size });
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
