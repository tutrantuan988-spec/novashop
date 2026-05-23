const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const algoliaSync = require('./utils/algoliaSync');

const products = [
  {
    id: 'ao-thun-nam-premium',
    slug: 'ao-thun-nam-premium',
    name: 'Ao thun nam Premium Cotton 200gsm',
    category: 'Thoi trang',
    price: 185000,
    originalPrice: 210000,
    stock: 45,
    badge: 'Ban chay',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
    description: 'Ao thun nam cotton 100%, form regular fit, chat vai mem mai thoang khi. Phu hop mac hang ngay.',
    rating: 4.8,
    reviewCount: 124,
    brand: 'Uniqlo',
    weight: '200g',
    featured: true,
    active: true
  },
  {
    id: 'quan-jean-slim-fit',
    slug: 'quan-jean-slim-fit',
    name: 'Quan jean nam Slim Fit co gian',
    category: 'Thoi trang',
    price: 95000,
    originalPrice: 110000,
    stock: 78,
    badge: 'Sale',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80',
    description: 'Quan jean slim fit co gian thoai mai, mau xanh denim classic, phu hop nhieu phong cach.',
    rating: 4.5,
    reviewCount: 89,
    brand: 'Levis',
    weight: '500g',
    featured: true,
    active: true
  },
  {
    id: 'giay-sneaker-air-max',
    slug: 'giay-sneaker-air-max',
    name: 'Giay sneaker Nike Air Max 90',
    category: 'Thoi trang',
    price: 450000,
    originalPrice: 520000,
    stock: 18,
    badge: 'Moi',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    description: 'Giay sneaker Nike Air Max 90, dem khi Air Max, thoai mai cho di chuyen hang ngay.',
    rating: 4.9,
    reviewCount: 42,
    brand: 'Nike',
    weight: '800g',
    featured: true,
    active: true
  },
  {
    id: 'dien-thoai-samsung-a54',
    slug: 'dien-thoai-samsung-a54',
    name: 'Dien thoai Samsung Galaxy A54 5G',
    category: 'Dien tu',
    price: 7200000,
    originalPrice: 8500000,
    stock: 62,
    badge: 'Ban chay',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
    description: 'Samsung Galaxy A54 5G, man hinh AMOLED 6.4 inch, camera 50MP, pin 5000mAh.',
    rating: 4.6,
    reviewCount: 156,
    brand: 'Samsung',
    weight: '202g',
    featured: true,
    active: true
  },
  {
    id: 'tai-nghe-bluetooth-jbl',
    slug: 'tai-nghe-bluetooth-jbl',
    name: 'Tai nghe Bluetooth JBL Tune 510BT',
    category: 'Dien tu',
    price: 580000,
    originalPrice: 680000,
    stock: 55,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    description: 'Tai nghe Bluetooth JBL, am thanh Pure Bass, thoi luong pin 40 gio, ket noi da diem.',
    rating: 4.3,
    reviewCount: 72,
    brand: 'JBL',
    weight: '160g',
    featured: false,
    active: true
  },
  {
    id: 'sac-du-phong-xiaomi',
    slug: 'sac-du-phong-xiaomi',
    name: 'Sac du phong Xiaomi 20000mAh',
    category: 'Dien tu',
    price: 450000,
    originalPrice: 520000,
    stock: 100,
    badge: 'Ban chay',
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff8c5?auto=format&fit=crop&w=900&q=80',
    description: 'Sac du phong Xiaomi 20000mAh, sac nhanh 22.5W, 2 cong USB-A + 1 USB-C.',
    rating: 4.5,
    reviewCount: 138,
    brand: 'Xiaomi',
    weight: '400g',
    featured: true,
    active: true
  },
  {
    id: 'noi-chien-khong-dau',
    slug: 'noi-chien-khong-dau',
    name: 'Noi chien khong dau Sunhouse 5L',
    category: 'Gia dung',
    price: 1200000,
    originalPrice: 1500000,
    stock: 30,
    badge: 'Sale',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=80',
    description: 'Noi chien khong dau Sunhouse 5L, cong nghe Rapid Air, 8 chuong trinh nau tu dong.',
    rating: 4.3,
    reviewCount: 41,
    brand: 'Sunhouse',
    weight: '4.5kg',
    featured: false,
    active: true
  },
  {
    id: 'den-led-thong-minh',
    slug: 'den-led-thong-minh',
    name: 'Den LED trang tri thong minh WiFi',
    category: 'Gia dung',
    price: 85000,
    originalPrice: 95000,
    stock: 50,
    image: 'https://images.unsplash.com/photo-1565814329452-e1432f89b67e?auto=format&fit=crop&w=900&q=80',
    description: 'Den LED thong minh dieu khien qua WiFi, 16 trieu mau, tuong thich Google Home & Alexa.',
    rating: 4.5,
    reviewCount: 33,
    brand: 'Xiaomi',
    weight: '150g',
    featured: false,
    active: true
  },
  {
    id: 'serum-vitamin-c',
    slug: 'serum-vitamin-c',
    name: 'Serum Vitamin C duong da sang',
    category: 'Lam dep',
    price: 850000,
    originalPrice: 980000,
    stock: 8,
    badge: 'Ban chay',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80',
    description: 'Serum Vitamin C 20% + Hyaluronic Acid, duong da sang, giam tham, chong lao hoa.',
    rating: 4.8,
    reviewCount: 47,
    brand: 'L\'Oreal',
    weight: '30ml',
    featured: true,
    active: true
  },
  {
    id: 'nuoc-hoa-dior-sauvage',
    slug: 'nuoc-hoa-dior-sauvage',
    name: 'Nuoc hoa nam Dior Sauvage EDT 100ml',
    category: 'Lam dep',
    price: 750000,
    originalPrice: 880000,
    stock: 65,
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80',
    description: 'Nuoc hoa Dior Sauvage EDT, huong go cay va cam quyt, nam tinh va quyen ru.',
    rating: 4.4,
    reviewCount: 86,
    brand: 'Dior',
    weight: '100ml',
    featured: false,
    active: true
  }
];

const coupons = [
  { code: 'WELCOME10', type: 'percent', value: 10, minSubtotal: 0, maxDiscount: 50000, usageLimit: 200, active: true },
  { code: 'FREESHIP', type: 'shipping', value: 0, minSubtotal: 300000, maxDiscount: 0, usageLimit: 200, active: true },
  { code: 'SALE50K', type: 'fixed', value: 50000, minSubtotal: 500000, maxDiscount: 0, usageLimit: 100, active: true }
];

const reviews = [
  {
    productId: 'ao-thun-nam-premium',
    userName: 'Nguyen Van Hung',
    userEmail: 'hung@example.com',
    rating: 5,
    title: 'Chat vai rat dep',
    content: 'Ao thun cotton mem mai, form dep, mac rat thoai mai. Se ung ho tiep!',
    isVerified: true,
    isActive: true
  },
  {
    productId: 'dien-thoai-samsung-a54',
    userName: 'Le Minh Anh',
    userEmail: 'minhanh@example.com',
    rating: 5,
    title: 'Dien thoai tot',
    content: 'Man hinh dep, camera net, pin trau. Gia hop ly cho phan khuc nay.',
    isVerified: true,
    isActive: true
  }
];

function initFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountFile = process.env.FIREBASE_SERVICE_ACCOUNT_FILE || process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!projectId) {
    throw new Error('Thieu FIREBASE_PROJECT_ID hoac VITE_FIREBASE_PROJECT_ID trong .env.local');
  }

  if (getApps().length) return;

  if (serviceAccountFile && serviceAccountFile !== 'your_key_here') {
    const serviceAccountPath = path.isAbsolute(serviceAccountFile)
      ? serviceAccountFile
      : path.resolve(__dirname, '..', serviceAccountFile);
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    initializeApp({ credential: cert(serviceAccount), projectId: projectId || serviceAccount.project_id });
    return;
  }

  if (serviceAccountJson && serviceAccountJson !== 'your_key_here') {
    initializeApp({ credential: cert(JSON.parse(serviceAccountJson)), projectId });
    return;
  }

  initializeApp({ projectId });
}

function now() {
  return new Date();
}

async function upsertProducts(db) {
  const batch = db.batch();
  const createdAt = now();

  products.forEach((product) => {
    const ref = db.collection('products').doc(product.id);
    const originalPrice = Number(product.originalPrice ?? product.oldPrice ?? 0) || 0;
    batch.set(ref, {
      ...product,
      originalPrice,
      oldPrice: originalPrice,
      gallery: product.gallery || [product.image],
      status: product.stock > 0 ? 'active' : 'out_of_stock',
      createdAt,
      updatedAt: createdAt
    }, { merge: true });
  });

  await batch.commit();
  const syncResult = await algoliaSync.bulkSync(products);
  console.log(`[Seed] Products upserted: ${products.length}`);
  if (syncResult?.ok) console.log(`[Seed] Algolia synced: ${syncResult.count}`);
  if (syncResult?.skipped) console.log('[Seed] Algolia skipped: not configured');
}

async function upsertCoupons(db) {
  const batch = db.batch();
  const createdAt = now();

  coupons.forEach((coupon) => {
    batch.set(db.collection('coupons').doc(coupon.code), {
      ...coupon,
      usageCount: 0,
      expiresAt: null,
      createdAt,
      updatedAt: createdAt
    }, { merge: true });
  });

  await batch.commit();
  console.log(`[Seed] Coupons upserted: ${coupons.length}`);
}

async function seedReviews(db) {
  for (const review of reviews) {
    const duplicate = await db.collection('reviews')
      .where('productId', '==', review.productId)
      .where('userEmail', '==', review.userEmail)
      .limit(1)
      .get();

    if (!duplicate.empty) continue;
    await db.collection('reviews').add({
      ...review,
      createdAt: now(),
      updatedAt: now()
    });
  }
  console.log(`[Seed] Reviews checked: ${reviews.length}`);
}

async function seed() {
  initFirebase();
  const db = getFirestore();
  console.log('[Seed] Firestore project:', process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID);

  await upsertProducts(db);
  await upsertCoupons(db);
  await seedReviews(db);

  console.log('[Seed] Done');
}

seed().catch((err) => {
  console.error('[Seed] Failed:', err.message);
  process.exit(1);
});
