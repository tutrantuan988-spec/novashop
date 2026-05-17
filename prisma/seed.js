const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

const categories = [
  { name: 'Thức ăn cho chó', slug: 'thuc-an-cho-cho', description: 'Thức ăn hạt, pate và dinh dưỡng cho chó mọi độ tuổi', imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc101?auto=format&fit=crop&w=900&q=80' },
  { name: 'Thức ăn cho mèo', slug: 'thuc-an-cho-meo', description: 'Thức ăn hạt, pate và snack dinh dưỡng cho mèo', imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80' },
  { name: 'Phụ kiện thú cưng', slug: 'phu-kien-thu-cung', description: 'Vòng cổ, bát ăn, dây dắt, đồ chơi và nhà cây cho thú cưng', imageUrl: 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&w=900&q=80' },
  { name: 'Vệ sinh & Grooming', slug: 've-sinh-grooming', description: 'Sản phẩm vệ sinh, khử mùi, chăm sóc lông và móng', imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=900&q=80' },
];

const products = [
  { categorySlug: 'thuc-an-cho-cho', name: 'Royal Canin Medium Puppy 1kg', slug: 'royal-canin-medium-puppy-1kg', description: 'Thức ăn hạt cao cấp cho chó con giống vừa từ 2 đến 12 tháng tuổi.', price: 185000, comparePrice: 210000, stock: 45, sku: 'DOG-RC-PUPPY-1KG', imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc101?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'Royal Canin', weight: '1kg', badge: 'Bán chạy', rating: 4.8, reviewCount: 124 } },
  { categorySlug: 'thuc-an-cho-cho', name: 'Pedigree vị gà & rau 1.5kg', slug: 'pedigree-vi-ga-rau-15kg', description: 'Thức ăn hạt cho chó trưởng thành, bổ sung protein và chất xơ dễ tiêu hóa.', price: 95000, comparePrice: 110000, stock: 78, sku: 'DOG-PED-CHICKEN-15KG', imageUrl: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'Pedigree', weight: '1.5kg', badge: 'Sale', rating: 4.5, reviewCount: 89 } },
  { categorySlug: 'thuc-an-cho-cho', name: 'Orijen Original Dog 2kg', slug: 'orijen-original-dog-2kg', description: 'Thức ăn siêu cao cấp giàu protein động vật, phù hợp chó cần dinh dưỡng cao.', price: 450000, comparePrice: 520000, stock: 18, sku: 'DOG-ORI-ORIGINAL-2KG', imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'Orijen', weight: '2kg', badge: 'Mới', rating: 4.9, reviewCount: 42 } },
  { categorySlug: 'thuc-an-cho-meo', name: 'Whiskas Adult vị cá thu 1.1kg', slug: 'whiskas-adult-vi-ca-thu-11kg', description: 'Thức ăn hạt cho mèo trưởng thành, bổ sung taurine và vitamin E.', price: 72000, comparePrice: 85000, stock: 62, sku: 'CAT-WHI-MACKEREL-11KG', imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'Whiskas', weight: '1.1kg', badge: 'Bán chạy', rating: 4.6, reviewCount: 156 } },
  { categorySlug: 'thuc-an-cho-meo', name: 'Me-O Adult cá ngừ 1.3kg', slug: 'me-o-adult-ca-ngu-13kg', description: 'Thức ăn hạt nhập khẩu Thái Lan, giàu omega-3 hỗ trợ giảm rụng lông.', price: 58000, comparePrice: 68000, stock: 55, sku: 'CAT-MEO-TUNA-13KG', imageUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'Me-O', weight: '1.3kg', rating: 4.3, reviewCount: 72 } },
  { categorySlug: 'thuc-an-cho-meo', name: 'Nekko Creamy Snack cá ngừ hộp 4 gói', slug: 'nekko-creamy-snack-ca-ngu-4-goi', description: 'Snack kem cho mèo vị cá ngừ, phù hợp làm phần thưởng hằng ngày.', price: 45000, comparePrice: 52000, stock: 100, sku: 'CAT-NEK-CREAMY-4', imageUrl: 'https://images.unsplash.com/photo-1519052537078-e6302a4968ef?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'Nekko', weight: '4x15g', badge: 'Bán chạy', rating: 4.5, reviewCount: 138 } },
  { categorySlug: 'phu-kien-thu-cung', name: 'Vòng cổ da cao cấp size M', slug: 'vong-co-da-cao-cap-size-m', description: 'Vòng cổ da mềm, khóa kim loại chắc chắn, phù hợp chó mèo cỡ vừa.', price: 120000, comparePrice: 150000, stock: 30, sku: 'ACC-COLLAR-LEATHER-M', imageUrl: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'PetCare', weight: '150g', badge: 'Sale', rating: 4.3, reviewCount: 41 } },
  { categorySlug: 'phu-kien-thu-cung', name: 'Bát ăn inox chống trượt 2 ngăn', slug: 'bat-an-inox-chong-truot-2-ngan', description: 'Bát inox 304 hai ngăn, đế cao su chống trượt, dễ vệ sinh.', price: 85000, comparePrice: 95000, stock: 50, sku: 'ACC-BOWL-INOX-2', imageUrl: 'https://images.unsplash.com/photo-1585846416120-3a7354ed7d39?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'PetCare', weight: '400g', rating: 4.5, reviewCount: 33 } },
  { categorySlug: 'phu-kien-thu-cung', name: 'Nhà cây mèo 3 tầng', slug: 'nha-cay-meo-3-tang', description: 'Nhà cây mèo 3 tầng có cột cào móng, đệm ngủ mềm và khung gỗ chắc chắn.', price: 850000, comparePrice: 980000, stock: 8, sku: 'ACC-CATTREE-3F', imageUrl: 'https://images.unsplash.com/photo-1545249390-6bdfa2aeb079?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'CatTree', weight: '8kg', badge: 'Bán chạy', rating: 4.8, reviewCount: 47 } },
  { categorySlug: 've-sinh-grooming', name: 'Xịt khử mùi BioPet 500ml', slug: 'xit-khu-mui-biopet-500ml', description: 'Xịt khử mùi sinh học an toàn cho chó mèo, dùng cho chuồng và lông.', price: 75000, comparePrice: 88000, stock: 65, sku: 'GRM-BIOPET-500ML', imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'BioPet', weight: '500ml', rating: 4.4, reviewCount: 86 } },
];

const customers = [
  { email: 'minhanh@example.com', name: 'Lê Minh Anh', phone: '0901234567' },
  { email: 'hung@example.com', name: 'Nguyễn Văn Hùng', phone: '0912345678' },
  { email: 'thao@example.com', name: 'Trần Phương Thảo', phone: '0923456789' },
];

async function main() {
  console.log('🌱 Starting Prisma seed...');

  const organization = await prisma.organization.upsert({
    where: { slug: 'novashop' },
    update: { name: 'NovaShop Pet Store', subscriptionTier: 'PROFESSIONAL', subscriptionStatus: 'active' },
    create: { name: 'NovaShop Pet Store', slug: 'novashop', subscriptionTier: 'PROFESSIONAL', subscriptionStatus: 'active' },
  });

  const passwordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@novashop.com' },
    update: { name: 'NovaShop Admin', emailVerified: true },
    create: { email: 'admin@novashop.com', passwordHash, name: 'NovaShop Admin', emailVerified: true },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: admin.id } },
    update: { role: 'OWNER' },
    create: { organizationId: organization.id, userId: admin.id, role: 'OWNER' },
  });

  await prisma.organizationSettings.upsert({
    where: { organizationId: organization.id },
    update: { themeColor: '#ff7a1a', currency: 'VND', locale: 'vi', timezone: 'Asia/Ho_Chi_Minh', metadata: { storeName: 'NovaShop Pet Store', supportEmail: 'support@novashop.vn', supportPhone: '0900000000' } },
    create: { organizationId: organization.id, themeColor: '#ff7a1a', currency: 'VND', locale: 'vi', timezone: 'Asia/Ho_Chi_Minh', metadata: { storeName: 'NovaShop Pet Store', supportEmail: 'support@novashop.vn', supportPhone: '0900000000' } },
  });

  const categoryBySlug = new Map();
  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { organizationId_slug: { organizationId: organization.id, slug: category.slug } },
      update: category,
      create: { organizationId: organization.id, ...category },
    });
    categoryBySlug.set(saved.slug, saved);
  }

  const productBySlug = new Map();
  for (const product of products) {
    const category = categoryBySlug.get(product.categorySlug);
    const { categorySlug, ...data } = product;
    const saved = await prisma.product.upsert({
      where: { organizationId_slug: { organizationId: organization.id, slug: data.slug } },
      update: { ...data, categoryId: category.id, images: [data.imageUrl], isActive: true },
      create: { organizationId: organization.id, categoryId: category.id, ...data, images: [data.imageUrl], isActive: true },
    });
    productBySlug.set(saved.slug, saved);
  }

  const customerRecords = [];
  for (const customer of customers) {
    const saved = await prisma.customer.upsert({
      where: { organizationId_email: { organizationId: organization.id, email: customer.email } },
      update: customer,
      create: { organizationId: organization.id, ...customer, metadata: { source: 'seed', segment: 'retail' } },
    });
    customerRecords.push(saved);
  }

  const orderProducts = [productBySlug.get('royal-canin-medium-puppy-1kg'), productBySlug.get('whiskas-adult-vi-ca-thu-11kg')];
  const subtotal = orderProducts.reduce((sum, product) => sum + product.price, 0);
  const shipping = 25000;
  const order = await prisma.order.upsert({
    where: { orderNumber: 'NS-2026-0001' },
    update: { status: 'delivered', paymentStatus: 'paid', subtotal, shipping, total: subtotal + shipping },
    create: { organizationId: organization.id, userId: admin.id, orderNumber: 'NS-2026-0001', status: 'delivered', paymentStatus: 'paid', paymentMethod: 'stripe', paymentId: 'pi_seed_ns_0001', subtotal, shipping, total: subtotal + shipping, customerEmail: customerRecords[0].email, customerName: customerRecords[0].name, customerPhone: customerRecords[0].phone, shippingAddress: { street: '12 Nguyễn Huệ', ward: 'Bến Nghé', district: 'Quận 1', city: 'TP. Hồ Chí Minh' }, metadata: { source: 'seed', channel: 'online' } },
  });

  for (const product of orderProducts) {
    await prisma.orderItem.upsert({
      where: { id: `seed-${order.orderNumber}-${product.sku}` },
      update: { quantity: 1, price: product.price, total: product.price },
      create: { id: `seed-${order.orderNumber}-${product.sku}`, orderId: order.id, productId: product.id, quantity: 1, price: product.price, total: product.price },
    });
  }

  await prisma.payment.upsert({
    where: { id: 'seed-payment-ns-2026-0001' },
    update: { amount: order.total, status: 'succeeded' },
    create: { id: 'seed-payment-ns-2026-0001', organizationId: organization.id, customerId: customerRecords[0].id, orderId: order.id, amount: order.total, status: 'succeeded', paymentMethod: 'stripe', paymentId: 'pi_seed_ns_0001', paymentType: 'one_time', metadata: { provider: 'stripe', testMode: true } },
  });

  const reviewUser = await prisma.user.upsert({
    where: { email: 'minhanh@example.com' },
    update: { name: 'Lê Minh Anh', emailVerified: true },
    create: { email: 'minhanh@example.com', name: 'Lê Minh Anh', emailVerified: true },
  });

  const existingReview = await prisma.review.findFirst({
    where: { productId: productBySlug.get('whiskas-adult-vi-ca-thu-11kg').id, userId: reviewUser.id },
  });
  if (!existingReview) {
    await prisma.review.create({
      data: { productId: productBySlug.get('whiskas-adult-vi-ca-thu-11kg').id, userId: reviewUser.id, rating: 5, title: 'Mèo ăn rất hợp', content: 'Hàng chính hãng, đóng gói kỹ, mèo nhà mình ăn hết rất nhanh.', isVerified: true, isActive: true },
    });
  }

  const webhook = await prisma.webhook.upsert({
    where: { id: 'seed-webhook-order-events' },
    update: { name: 'Order Events Demo', url: 'https://example.com/webhooks/orders', events: ['order.created', 'order.paid', 'order.delivered'], isActive: true },
    create: { id: 'seed-webhook-order-events', organizationId: organization.id, name: 'Order Events Demo', url: 'https://example.com/webhooks/orders', secret: 'whsec_seed_demo', events: ['order.created', 'order.paid', 'order.delivered'], isActive: true },
  });

  await prisma.webhookLog.create({
    data: { webhookId: webhook.id, eventType: 'order.delivered', payload: { orderId: order.id, orderNumber: order.orderNumber }, statusCode: 200, response: { ok: true }, duration: 132 },
  });

  await prisma.auditLog.create({
    data: { userId: admin.id, organizationId: organization.id, action: 'SEED', entityType: 'Organization', entityId: organization.id, changes: { categories: categories.length, products: products.length, customers: customers.length } },
  });

  console.log(`✅ Seeded ${categories.length} categories`);
  console.log(`✅ Seeded ${products.length} products`);
  console.log(`✅ Seeded ${customers.length} customers`);
  console.log('✅ Seeded 1 order, payment, review, webhook, webhook log and audit log');
  console.log('🎉 Prisma seed completed successfully');
}

main()
  .catch((error) => {
    console.error('❌ Prisma seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
