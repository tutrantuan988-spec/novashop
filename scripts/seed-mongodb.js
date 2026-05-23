const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const { connectDatabase, mongoose } = require('./models');
const Category = require('./models/Category');
const Product = require('./models/Product');

const CATEGORIES = [
  { name: 'Thời trang', slug: 'fashion', description: 'Quần áo, giày dép và phụ kiện thời trang', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80', sortOrder: 1 },
  { name: 'Điện tử', slug: 'electronics', description: 'Điện thoại, laptop, tai nghe, phụ kiện công nghệ', image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=600&q=80', sortOrder: 2 },
  { name: 'Gia dụng', slug: 'home-living', description: 'Đồ gia dụng, nội thất, trang trí nhà cửa', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=80', sortOrder: 3 }
];

const PRODUCTS = [
  // Fashion
  { name: 'Áo thun nam Premium Cotton', slug: 'ao-thun-nam-premium-cotton', brand: 'Uniqlo', price: 185000, oldPrice: 210000, stock: 45, sku: 'FASH-AT-PREM', description: 'Áo thun nam chất liệu cotton premium, form regular fit, thoáng mát thấm hút mồ hôi.', shortDescription: 'Áo thun cotton premium', size: 'S/M/L/XL', suitable: 'Nam mọi độ tuổi', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80', badge: 'Bán chạy', rating: 4.8, reviewCount: 128, isFeatured: true },
  { name: 'Quần jean nam Slim Fit', slug: 'quan-jean-nam-slim-fit', brand: 'Zara', price: 95000, oldPrice: 110000, stock: 78, sku: 'FASH-QJ-SLIM', description: 'Quần jean nam form slim fit, chất denim co giãn thoải mái.', shortDescription: 'Jean slim fit co giãn', size: '29/30/31/32/33', suitable: 'Nam thanh niên', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80', badge: 'Sale', rating: 4.6, reviewCount: 256, isFeatured: true },
  { name: 'Giày sneaker Nike Air Max', slug: 'giay-sneaker-nike-air-max', brand: 'Nike', price: 450000, oldPrice: 520000, stock: 18, sku: 'FASH-GS-NIKE', description: 'Giày sneaker Nike Air Max chính hãng, đế khí êm ái, thiết kế thể thao hiện đại.', shortDescription: 'Sneaker Nike Air Max', size: '39/40/41/42/43', suitable: 'Nam nữ', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', badge: 'Mới', rating: 4.9, reviewCount: 96, isFeatured: true },
  { name: 'Đầm sơ mi nữ linen', slug: 'dam-so-mi-nu-linen', brand: 'Mango', price: 420000, oldPrice: 520000, stock: 85, sku: 'FASH-DS-LINEN', description: 'Đầm sơ mi nữ chất liệu linen cao cấp, thiết kế thanh lịch.', shortDescription: 'Đầm linen thanh lịch', size: 'S/M/L/XL', suitable: 'Nữ công sở', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80', badge: 'Mới', rating: 4.7, reviewCount: 189, isFeatured: true },
  { name: 'Túi xách nữ da cao cấp', slug: 'tui-xach-nu-da-cao-cap', brand: 'Zara', price: 890000, oldPrice: 1200000, stock: 40, sku: 'FASH-TX-DA', description: 'Túi xách nữ da bò thật, thiết kế thời trang.', shortDescription: 'Túi da bò cao cấp', size: 'Medium', suitable: 'Nữ', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80', badge: 'Cao cấp', rating: 4.5, reviewCount: 87, isFeatured: true },
  { name: 'Đồng hồ nam thời trang', slug: 'dong-ho-nam-thoi-trang', brand: 'Adidas', price: 1500000, oldPrice: 2200000, stock: 30, sku: 'FASH-DH-NAME', description: 'Đồng hồ nam dây da cao cấp, mặt kính Sapphire, chống nước 50m.', shortDescription: 'Đồng hồ nam sang trọng', size: 'One Size', suitable: 'Nam', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80', badge: 'Hot', rating: 4.8, reviewCount: 312, isFeatured: true },
  // Electronics
  { name: 'Samsung Galaxy A54 5G 128GB', slug: 'samsung-galaxy-a54-5g', brand: 'Samsung', price: 7200000, oldPrice: 8500000, stock: 62, sku: 'ELEC-SAM-A54', description: 'Điện thoại Samsung Galaxy A54 5G, màn hình Super AMOLED 6.4 inch, camera 50MP.', shortDescription: 'Samsung A54 5G chính hãng', size: '128GB/256GB', suitable: 'Mọi đối tượng', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80', badge: 'Bán chạy', rating: 4.7, reviewCount: 234, isFeatured: true },
  { name: 'Tai nghe Bluetooth JBL', slug: 'tai-nghe-bluetooth-jbl', brand: 'JBL', price: 580000, oldPrice: 680000, stock: 55, sku: 'ELEC-TN-JBL', description: 'Tai nghe Bluetooth JBL chính hãng, âm bass mạnh mẽ, pin 12 giờ.', shortDescription: 'Tai nghe JBL bass mạnh', size: 'One Size', suitable: 'Mọi đối tượng', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', badge: 'Bán chạy', rating: 4.5, reviewCount: 178, isFeatured: true },
  { name: 'Sạc dự phòng Xiaomi 20000mAh', slug: 'sac-du-phong-xiaomi-20000mah', brand: 'Xiaomi', price: 450000, oldPrice: 520000, stock: 100, sku: 'ELEC-SP-XMI', description: 'Sạc dự phòng Xiaomi 20000mAh, sạc nhanh 22.5W, 2 cổng USB.', shortDescription: 'Sạc dự phòng 20000mAh', size: '20000mAh', suitable: 'Mọi đối tượng', image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80', badge: 'Bán chạy', rating: 4.9, reviewCount: 145, isFeatured: true },
  { name: 'Laptop Dell XPS 15 i7 2024', slug: 'laptop-dell-xps-15-i7', brand: 'Dell', price: 32990000, oldPrice: 38990000, stock: 10, sku: 'ELEC-DL-XPS15', description: 'Laptop Dell XPS 15, Intel Core i7-13700H, RAM 16GB, SSD 512GB.', shortDescription: 'Dell XPS 15 cao cấp', size: '16GB/512GB', suitable: 'Dân văn phòng, lập trình', image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80', badge: 'Cao cấp', rating: 4.8, reviewCount: 567, isFeatured: true },
  // Home & Living
  { name: 'Nồi chiên không dầu Sunhouse 6L', slug: 'noi-chien-khong-dau-sunhouse', brand: 'Sunhouse', price: 1200000, oldPrice: 1500000, stock: 30, sku: 'HOME-NCF-SH6', description: 'Nồi chiên không dầu Sunhouse 6 lít, công nghệ Rapid Air.', shortDescription: 'Nồi chiên không dầu 6L', size: '6L', suitable: 'Gia đình', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=80', badge: 'Sale', rating: 4.6, reviewCount: 98, isFeatured: true },
  { name: 'Đèn LED trang trí thông minh', slug: 'den-led-trang-tri-thong-minh', brand: 'Phillips', price: 250000, oldPrice: 350000, stock: 80, sku: 'HOME-DEN-LED', description: 'Đèn LED trang trí điều khiển từ xa, đổi màu RGB, hẹn giờ.', shortDescription: 'Đèn LED RGB thông minh', size: '5m/10m', suitable: 'Mọi không gian', image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80', badge: 'Hot', rating: 4.7, reviewCount: 423, isFeatured: true },
  { name: 'Bộ nồi chảo chống dính 5 món', slug: 'bo-noi-chao-chong-dinh-5mon', brand: 'Lock&Lock', price: 650000, oldPrice: 890000, stock: 45, sku: 'HOME-NC-5M', description: 'Bộ nồi chảo chống dính cao cấp, đáy từ, dùng cho bếp từ và gas.', shortDescription: 'Bộ nồi chảo 5 món', size: '5 món', suitable: 'Gia đình', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=80', badge: 'Bán chạy', rating: 4.6, reviewCount: 89, isFeatured: true },
  { name: 'Thảm trải sàn chống trượt', slug: 'tham-trai-san-chong-truot', brand: 'Kangaroo', price: 450000, oldPrice: 620000, stock: 35, sku: 'HOME-TS-CT', description: 'Thảm trải sàn polyester mềm mại, chống trượt, dễ vệ sinh.', shortDescription: 'Thảm trải sàn cao cấp', size: '160x230cm', suitable: 'Phòng khách', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80', badge: 'Mới', rating: 4.5, reviewCount: 156, isFeatured: false },
  // Beauty
  { name: 'Serum Vitamin C dưỡng da 20%', slug: 'serum-vitamin-c-duong-da', brand: 'Innisfree', price: 850000, oldPrice: 980000, stock: 8, sku: 'BEAUTY-SRM-VC', description: 'Serum Vitamin C 20% chống oxy hóa, làm sáng da, mờ thâm nám.', shortDescription: 'Serum VC sáng da', size: '30ml', suitable: 'Mọi loại da', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80', badge: 'Bán chạy', rating: 4.8, reviewCount: 234, isFeatured: true },
  { name: 'Nước hoa nam Dior Sauvage 100ml', slug: 'nuoc-hoa-nam-dior-sauvage', brand: 'Dior', price: 750000, oldPrice: 880000, stock: 65, sku: 'BEAUTY-NH-DS', description: 'Nước hoa Dior Sauvage EDT 100ml, hương gỗ phương Đông hiện đại.', shortDescription: 'Nước hoa Dior Sauvage', size: '100ml', suitable: 'Nam', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80', badge: 'Cao cấp', rating: 4.9, reviewCount: 67, isFeatured: true },
  { name: 'Kem dưỡng Laneige Water Sleep Mask', slug: 'kem-duong-laneige-water-sleep', brand: 'Laneige', price: 420000, oldPrice: 550000, stock: 100, sku: 'BEAUTY-KD-LN', description: 'Mặt nạ ngủ dưỡng ẩm Laneige, cấp nước sâu, phục hồi da.', shortDescription: 'Mặt nạ ngủ Laneige', size: '70ml', suitable: 'Mọi loại da', image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80', badge: 'Bán chạy', rating: 4.7, reviewCount: 201, isFeatured: true },
  { name: 'Sữa rửa mặt Innisfree Jeju Volcanic', slug: 'srm-innisfree-jeju-volcanic', brand: 'Innisfree', price: 150000, oldPrice: 210000, stock: 150, sku: 'BEAUTY-SRM-JV', description: 'Sữa rửa mặt tẩy tế bào chết với hạt núi lửa Jeju, làm sạch sâu.', shortDescription: 'Sữa rửa mặt Jeju', size: '150ml', suitable: 'Da dầu, hỗn hợp', image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=600&q=80', badge: 'Tiết kiệm', rating: 4.4, reviewCount: 112, isFeatured: false }
];

async function seed() {
  await connectDatabase();
  console.log('[Seed] Clearing existing data...');
  await Category.deleteMany({});
  await Product.deleteMany({});

  console.log('[Seed] Creating categories...');
  const cats = await Category.insertMany(CATEGORIES);
  console.log(`[Seed] Created ${cats.length} categories`);

  const catMap = {};
  cats.forEach((c) => { catMap[c.slug] = c._id; });

  const productsWithCat = PRODUCTS.map((p) => {
    let catSlug = 'home-living';
    // Manual mapping by brand/category keywords
    if (['uniqlo', 'zara', 'nike', 'adidas', 'mango', 'h&m'].some((b) => p.brand.toLowerCase().includes(b))) catSlug = 'fashion';
    if (['samsung', 'xiaomi', 'dell', 'jbl', 'sony', 'apple'].some((b) => p.brand.toLowerCase().includes(b))) catSlug = 'electronics';
    if (['sunhouse', 'lock', 'phillips', 'kangaroo'].some((b) => p.brand.toLowerCase().includes(b))) catSlug = 'home-living';
    if (['innisfree', 'laneige', 'dior', 'loreal'].some((b) => p.brand.toLowerCase().includes(b))) catSlug = 'home-living';
    // Fallback by slug keywords
    if (['ao-thun', 'quan-jean', 'giay', 'dam', 'tui-xach', 'dong-ho'].some((s) => p.slug.includes(s))) catSlug = 'fashion';
    if (['samsung', 'tai-nghe', 'sac-du', 'laptop'].some((s) => p.slug.includes(s))) catSlug = 'electronics';
    if (['noi-chien', 'den-led', 'noi-chao', 'tham'].some((s) => p.slug.includes(s))) catSlug = 'home-living';
    if (['serum', 'nuoc-hoa', 'kem-duong', 'srm'].some((s) => p.slug.includes(s))) catSlug = 'home-living';
    return { ...p, category: catMap[catSlug] };
  });

  console.log('[Seed] Creating products...');
  const prods = await Product.insertMany(productsWithCat);
  console.log(`[Seed] Created ${prods.length} products`);

  console.log('[Seed] Done!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
