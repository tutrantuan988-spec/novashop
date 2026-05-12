const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const COLORS = ['#1f2937', '#111827', '#0f172a', '#374151', '#1e3a5f', '#2d5a27', '#5b3a29', '#7c2d12'];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const sampleProducts = [
  { slug: 'ao-thun-premium', name: 'Áo Thun Premium Cotton', category: 'Thời trang', price: 450000, oldPrice: 600000, badge: 'Mới', description: 'Áo thun cao cấp 100% cotton, form regular fit, thoáng mát và bền màu.', stock: 50, colors: ['#1f2937', '#7c2d12'], sizes: ['S', 'M', 'L', 'XL'], image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80' },
  { slug: 'tai-nghe-wireless', name: 'Tai Nghe Wireless Pro', category: 'Công nghệ', price: 1200000, oldPrice: 1500000, badge: 'Bán chạy', description: 'Tai nghe không dây chống ồn chủ động, pin 30 giờ, âm thanh Hi-Res.', stock: 30, colors: ['#111827', '#f3f4f6'], sizes: [], image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80' },
  { slug: 'balo-du-lich', name: 'Balo Du Lịch Chống Nước', category: 'Du lịch', price: 850000, oldPrice: 1100000, badge: 'Mới', description: 'Balo 35L chống nước, nhiều ngăn, quai đeo êm ái, phù hợp đi phượt.', stock: 25, colors: ['#1e3a5f', '#2d5a27'], sizes: [], image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80' },
  { slug: 'giay-the-thao', name: 'Giày Thể Thao Ultra Light', category: 'Thể thao', price: 1350000, oldPrice: 1800000, badge: 'Hot', description: 'Giày chạy bộ siêu nhẹ, đế Boost, thoáng khí, hỗ trợ cổ chân.', stock: 40, colors: ['#f3f4f6', '#111827', '#7c2d12'], sizes: ['39', '40', '41', '42', '43'], image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80' },
  { slug: 'dong-ho-smart', name: 'Đồng Hồ Smart Watch V2', category: 'Công nghệ', price: 2500000, oldPrice: 3200000, badge: 'Mới', description: 'Smartwatch theo dõi sức khỏe, GPS, chống nước 5ATM, pin 7 ngày.', stock: 20, colors: ['#111827', '#1e3a5f'], sizes: [], image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80' },
  { slug: 'tui-xach-da', name: 'Túi Xách Da Cao Cấp', category: 'Phụ kiện', price: 1800000, oldPrice: 2400000, badge: 'Limited', description: 'Túi xách da bò thật, thiết kế tối giản, đựng laptop 14 inch.', stock: 15, colors: ['#5b3a29', '#1f2937'], sizes: [], image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80' },
  { slug: 'may-xay-sinh-to', name: 'Máy Xay Sinh Tố Công Suất Cao', category: 'Gia dụng', price: 950000, oldPrice: 1200000, badge: 'Bán chạy', description: 'Máy xay 1000W, 6 lưỡi dao, cối thủy tinh 1.5L, 3 chế độ xay.', stock: 35, colors: ['#f3f4f6', '#1f2937'], sizes: [], image: 'https://images.unsplash.com/photo-1570222094114-28a9d88a7b7e?auto=format&fit=crop&w=900&q=80' },
  { slug: 'ao-khoac-gio', name: 'Áo Khoác Gió Chống Nước', category: 'Thời trang', price: 750000, oldPrice: 950000, badge: 'Mới', description: 'Áo khoác gió siêu nhẹ, chống nước, gấp gọn, phù hợp đi mưa.', stock: 45, colors: ['#1e3a5f', '#2d5a27', '#1f2937'], sizes: ['M', 'L', 'XL', 'XXL'], image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80' }
];

const sampleCoupons = [
  { code: 'NOVASHOP', type: 'percent', value: 10, minSubtotal: 0, maxDiscount: 100000, usageLimit: 100, active: true },
  { code: 'FREESHIP', type: 'shipping', value: 0, minSubtotal: 500000, usageLimit: 50, active: true },
  { code: 'SALE50K', type: 'fixed', value: 50000, minSubtotal: 300000, usageLimit: 200, active: true },
  { code: 'VIP20', type: 'percent', value: 20, minSubtotal: 1000000, maxDiscount: 300000, usageLimit: 20, active: true },
  { code: 'WELCOME', type: 'fixed', value: 100000, minSubtotal: 0, usageLimit: 1, active: true }
];

function getRandomItems(products, count) {
  const shuffled = [...products].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map((p) => ({
    id: String(p.id),
    name: p.name,
    price: p.price,
    image: p.image,
    quantity: Math.floor(Math.random() * 3) + 1
  }));
}

function createSampleOrder(products, index) {
  const items = getRandomItems(products, Math.floor(Math.random() * 3) + 1);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal > 500000 ? 0 : 30000;
  const total = subtotal + shipping;
  const statuses = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
  const methods = ['cod', 'stripe', 'momo', 'vnpay'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const createdAt = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);

  return {
    customer: {
      name: `Khách hàng ${index + 1}`,
      phone: `0909${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
      email: `customer${index + 1}@example.com`,
      address: `${Math.floor(Math.random() * 200) + 1} Lê Lợi, Q.${Math.floor(Math.random() * 12) + 1}, TP.HCM`
    },
    items,
    paymentMethod: methods[Math.floor(Math.random() * methods.length)],
    shipping,
    subtotal,
    discount: 0,
    total,
    status,
    paymentStatus: status === 'pending' ? 'pending' : 'paid',
    createdAt
  };
}

async function seed() {
  // Init Firebase Admin
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.error('[Seed] VITE_FIREBASE_PROJECT_ID hoặc FIREBASE_PROJECT_ID chưa được cấu hình');
    process.exit(1);
  }

  try {
    initializeApp({ projectId });
  } catch (err) {
    if (err.message?.includes('already exists')) {
      console.log('[Seed] Firebase app already initialized, using existing');
    } else {
      throw err;
    }
  }

  const db = getFirestore();
  console.log('[Seed] Connected to Firestore project:', projectId);

  // Seed Products
  const productsRef = db.collection('products');
  const existingProducts = await productsRef.limit(1).get();
  if (!existingProducts.empty) {
    console.log('[Seed] Products already exist, skipping product seed');
  } else {
    console.log('[Seed] Seeding', sampleProducts.length, 'products...');
    const batch = db.batch();
    for (const p of sampleProducts) {
      const id = String(Date.now() + Math.floor(Math.random() * 10000));
      const ref = productsRef.doc(id);
      batch.set(ref, {
        ...p,
        id,
        rating: 0,
        reviewCount: 0,
        featured: Math.random() > 0.5,
        active: true,
        createdAt: new Date()
      });
    }
    await batch.commit();
    console.log('[Seed] Products seeded successfully');
  }

  // Seed Coupons
  const couponsRef = db.collection('coupons');
  const existingCoupons = await couponsRef.limit(1).get();
  if (!existingCoupons.empty) {
    console.log('[Seed] Coupons already exist, skipping coupon seed');
  } else {
    console.log('[Seed] Seeding', sampleCoupons.length, 'coupons...');
    for (const c of sampleCoupons) {
      await couponsRef.doc(c.code).set({
        ...c,
        usageCount: 0,
        expiresAt: null,
        createdAt: new Date()
      });
    }
    console.log('[Seed] Coupons seeded successfully');
  }

  // Seed Sample Orders
  const ordersRef = db.collection('orders');
  const existingOrders = await ordersRef.limit(1).get();
  if (!existingOrders.empty) {
    console.log('[Seed] Orders already exist, skipping order seed');
  } else {
    // Get seeded products for order items
    const productsSnap = await productsRef.get();
    const products = productsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (products.length === 0) {
      console.log('[Seed] No products found, skipping order seed');
    } else {
      const orderCount = 15;
      console.log('[Seed] Seeding', orderCount, 'sample orders...');
      for (let i = 0; i < orderCount; i++) {
        const order = createSampleOrder(products, i);
        await ordersRef.add(order);
      }
      console.log('[Seed] Orders seeded successfully');
    }
  }

  console.log('[Seed] Done!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Failed:', err.message);
  process.exit(1);
});
