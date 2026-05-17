const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const algoliaSync = require('./utils/algoliaSync');

const products = [
  {
    id: 'royal-canin-puppy-medium',
    slug: 'royal-canin-puppy-medium',
    name: 'Royal Canin Puppy Medium - Thuc an cho cho con co vua',
    category: 'Thuc an cho cho',
    price: 185000,
    originalPrice: 210000,
    stock: 45,
    badge: 'Ban chay',
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc101?auto=format&fit=crop&w=900&q=80',
    description: 'Thuc an hat cao cap danh cho cho con tu 2-12 thang tuoi. Cong thuc dinh duong can bang giup phat trien he mien dich va xuong khop.',
    rating: 4.8,
    reviewCount: 124,
    brand: 'Royal Canin',
    weight: '1kg',
    featured: true,
    active: true
  },
  {
    id: 'pedigree-vi-ga-rau',
    slug: 'pedigree-vi-ga-rau',
    name: 'Pedigree Vi Ga & Rau - Thuc an cho cho truong thanh',
    category: 'Thuc an cho cho',
    price: 95000,
    originalPrice: 110000,
    stock: 78,
    badge: 'Sale',
    image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=900&q=80',
    description: 'Thuc an hat Pedigree giau protein tu ga va rau cu, ho tro tieu hoa tot va long bong muot.',
    rating: 4.5,
    reviewCount: 89,
    brand: 'Pedigree',
    weight: '1.5kg',
    featured: true,
    active: true
  },
  {
    id: 'whiskas-adult-vi-ca-thu',
    slug: 'whiskas-adult-vi-ca-thu',
    name: 'Whiskas Adult Vi Ca Thu - Thuc an cho meo truong thanh',
    category: 'Thuc an cho meo',
    price: 72000,
    originalPrice: 85000,
    stock: 62,
    badge: 'Ban chay',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80',
    description: 'Thuc an hat Whiskas vi ca thu, bo sung taurine va vitamin E giup meo khoe mat va long mem muot.',
    rating: 4.6,
    reviewCount: 156,
    brand: 'Whiskas',
    weight: '1.1kg',
    featured: true,
    active: true
  },
  {
    id: 'me-o-adult-ca-ngu',
    slug: 'me-o-adult-ca-ngu',
    name: 'Me-O Adult Ca Ngu - Thuc an cho meo vi ca ngu',
    category: 'Thuc an cho meo',
    price: 58000,
    originalPrice: 68000,
    stock: 55,
    image: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=80',
    description: 'Thuc an hat Me-O nhap khau Thai Lan, giau omega-3 giup giam rung long va tang cuong mien dich.',
    rating: 4.3,
    reviewCount: 72,
    brand: 'Me-O',
    weight: '1.3kg',
    featured: false,
    active: true
  },
  {
    id: 'orijen-original-cho',
    slug: 'orijen-original-cho',
    name: 'Orijen Original - Thuc an hat cho cho vi ga & ca hoi',
    category: 'Thuc an cho cho',
    price: 450000,
    originalPrice: 520000,
    stock: 18,
    badge: 'Moi',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80',
    description: 'Thuc an sieu cao cap voi nhieu protein dong vat, phu hop cho cho ken an va can dinh duong cao.',
    rating: 4.9,
    reviewCount: 42,
    brand: 'Orijen',
    weight: '2kg',
    featured: true,
    active: true
  },
  {
    id: 'vong-co-da-cao-cap',
    slug: 'vong-co-da-cao-cap',
    name: 'Vong co da cao cap cho cho & meo - Size M',
    category: 'Phu kien thu cung',
    price: 120000,
    originalPrice: 150000,
    stock: 30,
    badge: 'Sale',
    image: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=900&q=80',
    description: 'Vong co da that cao cap, khoa kim loai chac chan, co dem mem bao ve co thu cung.',
    rating: 4.3,
    reviewCount: 41,
    brand: 'PetCare',
    weight: '150g',
    featured: false,
    active: true
  },
  {
    id: 'bat-an-inox-2-ngan',
    slug: 'bat-an-inox-2-ngan',
    name: 'Bat an inox chong truot 2 ngan cho cho meo',
    category: 'Phu kien thu cung',
    price: 85000,
    originalPrice: 95000,
    stock: 50,
    image: 'https://images.unsplash.com/photo-1585846416120-3a7354ed7d39?auto=format&fit=crop&w=900&q=80',
    description: 'Bat inox 304 cao cap 2 ngan, de cao su chong truot, de ve sinh va an toan cho thu cung.',
    rating: 4.5,
    reviewCount: 33,
    brand: 'PetCare',
    weight: '400g',
    featured: false,
    active: true
  },
  {
    id: 'nha-cay-meo-3-tang',
    slug: 'nha-cay-meo-3-tang',
    name: 'Nha cay meo 3 tang co cao mong & dem ngu',
    category: 'Do choi',
    price: 850000,
    originalPrice: 980000,
    stock: 8,
    badge: 'Ban chay',
    image: 'https://images.unsplash.com/photo-1545249390-6bdfa2aeb079?auto=format&fit=crop&w=900&q=80',
    description: 'Nha cay meo 3 tang voi cot cao mong, dem ngu mem va khung go chac chan.',
    rating: 4.8,
    reviewCount: 47,
    brand: 'CatTree',
    weight: '8kg',
    featured: true,
    active: true
  },
  {
    id: 'xit-khu-mui-bio',
    slug: 'xit-khu-mui-bio',
    name: 'Xit khu mui & diet khuan Bio - Danh cho cho meo',
    category: 'Ve sinh & Grooming',
    price: 75000,
    originalPrice: 88000,
    stock: 65,
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=900&q=80',
    description: 'Xit khu mui sinh hoc an toan cho thu cung, khong mui hoi chuong va long.',
    rating: 4.4,
    reviewCount: 86,
    brand: 'BioPet',
    weight: '500ml',
    featured: false,
    active: true
  },
  {
    id: 'snack-meo-nekko-creamy',
    slug: 'snack-meo-nekko-creamy',
    name: 'Snack meo vi ca ngu Nekko Creamy - Hop 4 goi',
    category: 'Snack & Banh thuong',
    price: 45000,
    originalPrice: 52000,
    stock: 100,
    badge: 'Ban chay',
    image: 'https://images.unsplash.com/photo-1519052537078-e6302a4968ef?auto=format&fit=crop&w=900&q=80',
    description: 'Snack kem meo Nekko nhap khau Thai Lan, vi ca ngu, phu hop meo moi lua tuoi.',
    rating: 4.5,
    reviewCount: 138,
    brand: 'Nekko',
    weight: '4x15g',
    featured: true,
    active: true
  }
];

const coupons = [
  { code: 'WELCOME10', type: 'percent', value: 10, minSubtotal: 0, maxDiscount: 50000, usageLimit: 200, active: true },
  { code: 'FREESHIP', type: 'shipping', value: 0, minSubtotal: 300000, maxDiscount: 0, usageLimit: 200, active: true },
  { code: 'PET50K', type: 'fixed', value: 50000, minSubtotal: 500000, maxDiscount: 0, usageLimit: 100, active: true }
];

const reviews = [
  {
    productId: 'royal-canin-puppy-medium',
    userName: 'Nguyen Van Hung',
    userEmail: 'hung@example.com',
    rating: 5,
    title: 'Cho rat thich',
    content: 'San pham chinh hang, dong goi can than, cho nha minh an rat hop.',
    isVerified: true,
    isActive: true
  },
  {
    productId: 'whiskas-adult-vi-ca-thu',
    userName: 'Le Minh Anh',
    userEmail: 'minhanh@example.com',
    rating: 5,
    title: 'Meo an het nhanh',
    content: 'Mui ca thom nhe, hat vua mieng va giao hang nhanh.',
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
