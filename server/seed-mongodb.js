const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const { connectDatabase, mongoose } = require('./models');
const Category = require('./models/Category');
const Product = require('./models/Product');

const CATEGORIES = [
  { name: 'Thức ăn cho chó', slug: 'dog-food', description: 'Thức ăn hạt, pate, snack cho chó', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80', sortOrder: 1 },
  { name: 'Thức ăn cho mèo', slug: 'cat-food', description: 'Thức ăn hạt, pate, snack cho mèo', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80', sortOrder: 2 },
  { name: 'Phụ kiện thú cưng', slug: 'pet-accessories', description: 'Đồ chơi, vòng cổ, bát ăn, cây leo', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80', sortOrder: 3 }
];

const PRODUCTS = [
  // Dog food
  { name: 'Royal Canin Medium Adult 4kg', slug: 'royal-canin-medium-adult-4kg', brand: 'Royal Canin', price: 890000, oldPrice: 1050000, stock: 45, sku: 'RC-MA-4KG', description: 'Thức ăn hạt cao cấp cho chó trưởng thành giống vừa. Công thức dinh dưỡng cân bằng.', shortDescription: 'Thức ăn hạt cao cấp cho chó giống vừa', weight: '4kg', suitable: 'Chó trưởng thành 12 tháng+', image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc8e5?auto=format&fit=crop&w=600&q=80', badge: 'Bán chạy', rating: 4.8, reviewCount: 128, isFeatured: true },
  { name: 'Royal Canin Mini Puppy 2kg', slug: 'royal-canin-mini-puppy-2kg', brand: 'Royal Canin', price: 520000, oldPrice: 620000, stock: 32, sku: 'RC-MP-2KG', description: 'Dinh dưỡng chuyên biệt cho chó con giống nhỏ dưới 10 tháng tuổi.', shortDescription: 'Dinh dưỡng cho chó con giống nhỏ', weight: '2kg', suitable: 'Chó con 2-10 tháng', image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=600&q=80', badge: 'Mới', rating: 4.9, reviewCount: 96, isFeatured: true },
  { name: 'Pedigree Adult Beef & Vegetables 1.5kg', slug: 'pedigree-adult-beef-1-5kg', brand: 'Pedigree', price: 185000, oldPrice: 220000, stock: 78, sku: 'PD-ABV-1.5KG', description: 'Thức ăn hạt vị thịt bò và rau củ. Bổ sung canxi và vitamin.', shortDescription: 'Hạt vị thịt bò và rau củ', weight: '1.5kg', suitable: 'Chó trưởng thành', image: 'https://images.unsplash.com/photo-1585846416120-3a7354ed7d65?auto=format&fit=crop&w=600&q=80', badge: 'Giảm giá', rating: 4.6, reviewCount: 256, isFeatured: true },
  { name: 'Pedigree Puppy Chicken 480g', slug: 'pedigree-puppy-chicken-480g', brand: 'Pedigree', price: 68000, oldPrice: 85000, stock: 120, sku: 'PD-PC-480G', description: 'Công thức gà dinh dưỡng cho chó con đang phát triển.', shortDescription: 'Hạt gà cho chó con', weight: '480g', suitable: 'Chó con 2-12 tháng', image: 'https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&w=600&q=80', badge: '', rating: 4.5, reviewCount: 189, isFeatured: false },
  { name: 'SmartHeart Adult Beef 3kg', slug: 'smartheart-adult-beef-3kg', brand: 'SmartHeart', price: 245000, oldPrice: 290000, stock: 55, sku: 'SH-AB-3KG', description: 'Thức ăn hạt vị thịt bò nhập khẩu Thái Lan.', shortDescription: 'Hạt thịt bò Thái Lan', weight: '3kg', suitable: 'Chó trưởng thành', image: 'https://images.unsplash.com/photo-1535930749574-1399327ce1f4?auto=format&fit=crop&w=600&q=80', badge: 'Tiết kiệm', rating: 4.4, reviewCount: 87, isFeatured: false },
  { name: 'Pedigree DentaStix 7 que', slug: 'pedigree-denta-stix-7pcs', brand: 'Pedigree', price: 55000, oldPrice: 72000, stock: 200, sku: 'PD-DS-7', description: 'Que gặm sạch răng, giảm mảng bám. Hương vị thịt bò.', shortDescription: 'Que gặm sạch răng', weight: '180g (7 que)', suitable: 'Chó từ 10kg', image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80', badge: 'Snack', rating: 4.7, reviewCount: 312, isFeatured: true },
  // Cat food
  { name: 'Whiskas Adult Tuna 1.2kg', slug: 'whiskas-adult-tuna-1-2kg', brand: 'Whiskas', price: 155000, oldPrice: 185000, stock: 65, sku: 'WK-AT-1.2KG', description: 'Thức ăn hạt vị cá ngừ cho mèo trưởng thành. Giúp lông bóng mượt.', shortDescription: 'Hạt vị cá ngừ cho mèo', weight: '1.2kg', suitable: 'Mèo trưởng thành 1 năm+', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80', badge: 'Bán chạy', rating: 4.7, reviewCount: 234, isFeatured: true },
  { name: 'Me-O Adult Seafood 1.3kg', slug: 'me-o-adult-seafood-1-3kg', brand: 'Me-O', price: 125000, oldPrice: 150000, stock: 90, sku: 'MO-AS-1.3KG', description: 'Thức ăn hạt hải sản nhập khẩu Thái Lan. Tăng cường canxi.', shortDescription: 'Hạt hải sản Thái Lan', weight: '1.3kg', suitable: 'Mèo trưởng thành', image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80', badge: 'Tiết kiệm', rating: 4.5, reviewCount: 178, isFeatured: true },
  { name: 'Royal Canin Indoor 27 2kg', slug: 'royal-canin-indoor-2kg', brand: 'Royal Canin', price: 580000, oldPrice: 690000, stock: 28, sku: 'RC-I27-2KG', description: 'Thức ăn chuyên biệt cho mèo nuôi trong nhà. Giảm mùi phân.', shortDescription: 'Hạt cho mèo indoor', weight: '2kg', suitable: 'Mèo indoor 1-7 tuổi', image: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=600&q=80', badge: 'Cao cấp', rating: 4.9, reviewCount: 145, isFeatured: true },
  { name: 'Fancy Feast Grilled Chicken 85g', slug: 'fancy-feast-grilled-85g', brand: 'Fancy Feast', price: 25000, oldPrice: 32000, stock: 300, sku: 'FF-GC-85G', description: 'Pate thịt gà nướng thơm ngon, bổ sung nước cho mèo.', shortDescription: 'Pate gà nướng Mỹ', weight: '85g/hộp', suitable: 'Mèo trưởng thành', image: 'https://images.unsplash.com/photo-1519052537078-e6302a4968ef?auto=format&fit=crop&w=600&q=80', badge: 'Pate', rating: 4.8, reviewCount: 567, isFeatured: true },
  { name: 'Catsrang Adult Fish 1.5kg', slug: 'catsrang-adult-fish-1-5kg', brand: 'Catsrang', price: 195000, oldPrice: 235000, stock: 42, sku: 'CR-AF-1.5KG', description: 'Thức ăn hạt vị cá nhập khẩu Hàn Quốc. Giàu omega-3.', shortDescription: 'Hạt cá Hàn Quốc', weight: '1.5kg', suitable: 'Mèo trưởng thành', image: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=600&q=80', badge: '', rating: 4.6, reviewCount: 98, isFeatured: false },
  { name: 'Nekko Creamy Chicken 4 gói', slug: 'nekko-creamy-chicken-4pcs', brand: 'Nekko', price: 35000, oldPrice: 45000, stock: 250, sku: 'NK-CC-4', description: 'Súp thưởng kem vị gà, bổ sung nước cho mèo.', shortDescription: 'Súp thưởng kem gà', weight: '15g x 4 gói', suitable: 'Mèo từ 3 tháng', image: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=600&q=80', badge: 'Snack', rating: 4.7, reviewCount: 423, isFeatured: false },
  // Accessories
  { name: 'Vòng cổ da cao cấp cho chó', slug: 'vong-co-da-cho-cho', brand: 'Petmate', price: 125000, oldPrice: 160000, stock: 60, sku: 'PM-VC-01', description: 'Vòng cổ da tự nhiên, mềm mại không gây kích ứng. Khóa kim loại chắc chắn.', shortDescription: 'Vòng cổ da cao cấp', weight: '', size: 'S/M/L', suitable: 'Chó mọi giống', image: 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&w=600&q=80', badge: 'Hot', rating: 4.6, reviewCount: 89, isFeatured: true },
  { name: 'Bát ăn inox chống trượt', slug: 'bat-an-inox-chong-truot', brand: 'Petkit', price: 85000, oldPrice: 110000, stock: 120, sku: 'PK-BA-01', description: 'Bát inox 304 cao cấp, đế cao su chống trượt. Dễ vệ sinh.', shortDescription: 'Bát inox cao cấp', weight: '', size: '350ml/750ml', suitable: 'Chó & mèo', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80', badge: '', rating: 4.5, reviewCount: 156, isFeatured: false },
  { name: 'Đồ chơi xương gặm cao su', slug: 'do-choi-xuong-gam-caosu', brand: 'KONG', price: 95000, oldPrice: 120000, stock: 85, sku: 'KG-XG-01', description: 'Xương cao su tự nhiên bền bỉ, giúp làm sạch răng và giảm stress.', shortDescription: 'Xương gặm cao su', weight: '', size: 'S/M/L', suitable: 'Chó mọi giống', image: 'https://images.unsplash.com/photo-1585846416120-3a7354ed7d65?auto=format&fit=crop&w=600&q=80', badge: 'Bán chạy', rating: 4.8, reviewCount: 234, isFeatured: true },
  { name: 'Cây leo mèo 3 tầng gỗ tự nhiên', slug: 'cat-tree-3-tang-go-tu-nhien', brand: 'Catry', price: 850000, oldPrice: 1200000, stock: 15, sku: 'CT-CT-01', description: 'Cây leo mèo 3 tầng bằng gỗ tự nhiên, có cột cào móng và nhà ngủ.', shortDescription: 'Cây leo mèo 3 tầng gỗ', weight: '', size: '50x40x120cm', suitable: 'Mèo mọi giống', image: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=600&q=80', badge: 'Cao cấp', rating: 4.9, reviewCount: 67, isFeatured: true },
  { name: 'Dây dắt chó phản quang 1.5m', slug: 'day-dat-cho-cho-phan-quang', brand: 'Trixie', price: 75000, oldPrice: 95000, stock: 95, sku: 'TX-DD-01', description: 'Dây dắt nylon phản quang an toàn đi đêm. Khóa chốt kim loại.', shortDescription: 'Dây dắt phản quang', weight: '', size: '1.5m x 2cm', suitable: 'Chó mọi giống', image: 'https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&w=600&q=80', badge: '', rating: 4.4, reviewCount: 112, isFeatured: false },
  { name: 'Khay vệ sinh mèo kín có nắp', slug: 'cat-litter-box-khep-kin', brand: 'Petkit', price: 195000, oldPrice: 260000, stock: 48, sku: 'PK-KV-01', description: 'Khay vệ sinh có nắp đậy kín, ngăn mùi hiệu quả. Cửa lật dễ dàng.', shortDescription: 'Khay vệ sinh có nắp', weight: '', size: '45x35x40cm', suitable: 'Mèo mọi giống', image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80', badge: 'Tiết kiệm', rating: 4.7, reviewCount: 201, isFeatured: false }
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
    let catSlug = 'pet-accessories';
    if (['dog-food', 'cat-food', 'pet-accessories'].some((s) => p.slug.includes(s))) {
      catSlug = ['dog-food', 'cat-food', 'pet-accessories'].find((s) => p.slug.includes(s)) || 'pet-accessories';
    }
    // Manual mapping for some
    if (['royal-canin', 'pedigree', 'smartheart'].some((b) => p.brand.toLowerCase().includes(b))) catSlug = 'dog-food';
    if (['whiskas', 'me-o', 'catsrang', 'nekko', 'fancy'].some((b) => p.brand.toLowerCase().includes(b))) catSlug = 'cat-food';
    if (['vong-co', 'bat-an', 'xuong', 'cat-tree', 'day-dat', 'khay'].some((s) => p.slug.includes(s))) catSlug = 'pet-accessories';
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
