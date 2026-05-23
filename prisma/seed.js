const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

const categories = [
  { name: 'Thời trang', slug: 'thoi-trang', description: 'Quần áo, giày dép và phụ kiện thời trang nam nữ', imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80' },
  { name: 'Điện tử', slug: 'dien-tu', description: 'Điện thoại, laptop, tai nghe và phụ kiện công nghệ', imageUrl: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=900&q=80' },
  { name: 'Gia dụng', slug: 'gia-dung', description: 'Đồ gia dụng, nội thất, trang trí nhà cửa thông minh', imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80' },
  { name: 'Làm đẹp', slug: 'lam-dep', description: 'Mỹ phẩm, dưỡng da, nước hoa và chăm sóc cá nhân', imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80' },
];

const products = [
  { categorySlug: 'thoi-trang', name: 'Áo thun nam Premium Cotton', slug: 'ao-thun-nam-premium-cotton', description: 'Áo thun nam chất liệu cotton premium, form regular fit, thoáng mát thấm hút mồ hôi.', price: 185000, comparePrice: 210000, stock: 45, sku: 'FASH-AT-PREM-CTN', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'Premium', size: 'M', badge: 'Bán chạy', rating: 4.8, reviewCount: 124 } },
  { categorySlug: 'thoi-trang', name: 'Quần jean nam Slim Fit', slug: 'quan-jean-nam-slim-fit', description: 'Quần jean nam form slim fit, chất denim co giãn thoải mái, phù hợp nhiều phong cách.', price: 95000, comparePrice: 110000, stock: 78, sku: 'FASH-QJ-SLIM-DNM', imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'Denim Co', size: '32', badge: 'Sale', rating: 4.5, reviewCount: 89 } },
  { categorySlug: 'thoi-trang', name: 'Giày sneaker Nike Air Max', slug: 'giay-sneaker-nike-air-max', description: 'Giày sneaker Nike Air Max chính hãng, đế khí êm ái, thiết kế thể thao hiện đại.', price: 450000, comparePrice: 520000, stock: 18, sku: 'FASH-GS-NIKE-AMX', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'Nike', size: '42', badge: 'Mới', rating: 4.9, reviewCount: 42 } },
  { categorySlug: 'dien-tu', name: 'Điện thoại Samsung Galaxy A54', slug: 'dien-thoai-samsung-galaxy-a54', description: 'Điện thoại Samsung Galaxy A54 5G, màn hình Super AMOLED 6.4 inch, camera 50MP.', price: 720000, comparePrice: 850000, stock: 62, sku: 'ELEC-DT-SAM-A54', imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'Samsung', storage: '128GB', badge: 'Bán chạy', rating: 4.6, reviewCount: 156 } },
  { categorySlug: 'dien-tu', name: 'Tai nghe Bluetooth JBL', slug: 'tai-nghe-bluetooth-jbl', description: 'Tai nghe Bluetooth JBL chính hãng, âm bass mạnh mẽ, pin 12 giờ liên tục.', price: 58000, comparePrice: 68000, stock: 55, sku: 'ELEC-TN-JBL-BT', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'JBL', badge: 'Bán chạy', rating: 4.3, reviewCount: 72 } },
  { categorySlug: 'dien-tu', name: 'Sạc dự phòng Xiaomi 20000mAh', slug: 'sac-du-phong-xiaomi-20000mah', description: 'Sạc dự phòng Xiaomi 20000mAh, sạc nhanh 22.5W, 2 cổng USB, thiết kế nhỏ gọn.', price: 45000, comparePrice: 52000, stock: 100, sku: 'ELEC-SP-XMI-20K', imageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'Xiaomi', capacity: '20000mAh', badge: 'Bán chạy', rating: 4.5, reviewCount: 138 } },
  { categorySlug: 'gia-dung', name: 'Nồi chiên không dầu Sunhouse', slug: 'noi-chien-khong-dau-sunhouse', description: 'Nồi chiên không dầu Sunhouse 6 lít, công nghệ Rapid Air, chiên nướng không dầu mỡ.', price: 120000, comparePrice: 150000, stock: 30, sku: 'HOME-NCF-SH-6L', imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'Sunhouse', capacity: '6L', badge: 'Sale', rating: 4.3, reviewCount: 41 } },
  { categorySlug: 'gia-dung', name: 'Đèn LED trang trí thông minh', slug: 'den-led-trang-tri-thong-minh', description: 'Đèn LED trang trí điều khiển từ xa, đổi màu RGB, hẹn giờ, tương thích smart home.', price: 85000, comparePrice: 95000, stock: 50, sku: 'HOME-DEN-LED-SMT', imageUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'SmartLight', badge: 'Mới', rating: 4.5, reviewCount: 33 } },
  { categorySlug: 'lam-dep', name: 'Serum Vitamin C dưỡng da', slug: 'serum-vitamin-c-duong-da', description: 'Serum Vitamin C 20% chống oxy hóa, làm sáng da, mờ thâm nám, cấp ẩm sâu.', price: 850000, comparePrice: 980000, stock: 8, sku: 'BEAUTY-SRM-VC20', imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'SkinLab', volume: '30ml', badge: 'Bán chạy', rating: 4.8, reviewCount: 47 } },
  { categorySlug: 'lam-dep', name: 'Nước hoa nam Dior Sauvage', slug: 'nuoc-hoa-nam-dior-sauvage', description: 'Nước hoa nam Dior Sauvage EDT 100ml, hương thơm gỗ phương Đông hiện đại, lưu hương 8-12h.', price: 75000, comparePrice: 88000, stock: 65, sku: 'BEAUTY-NH-DS-100', imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80', metadata: { brand: 'Dior', volume: '100ml', rating: 4.4, reviewCount: 86 } },
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
    update: { name: 'NovaShop Multi-Category Store', subscriptionTier: 'PROFESSIONAL', subscriptionStatus: 'active' },
    create: { name: 'NovaShop Multi-Category Store', slug: 'novashop', subscriptionTier: 'PROFESSIONAL', subscriptionStatus: 'active' },
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
    update: { themeColor: '#ff7a1a', currency: 'VND', locale: 'vi', timezone: 'Asia/Ho_Chi_Minh', metadata: { storeName: 'NovaShop Multi-Category Store', supportEmail: 'support@novashop.vn', supportPhone: '0900000000' } },
    create: { organizationId: organization.id, themeColor: '#ff7a1a', currency: 'VND', locale: 'vi', timezone: 'Asia/Ho_Chi_Minh', metadata: { storeName: 'NovaShop Multi-Category Store', supportEmail: 'support@novashop.vn', supportPhone: '0900000000' } },
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

  const orderProducts = [productBySlug.get('ao-thun-nam-premium-cotton'), productBySlug.get('dien-thoai-samsung-galaxy-a54')];
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
    where: { productId: productBySlug.get('ao-thun-nam-premium-cotton').id, userId: reviewUser.id },
  });
  if (!existingReview) {
    await prisma.review.create({
      data: { productId: productBySlug.get('ao-thun-nam-premium-cotton').id, userId: reviewUser.id, rating: 5, title: 'Sản phẩm chất lượng cao', content: 'Sản phẩm rất tốt, hàng chính hãng, đóng gói kỹ, chất lượng đúng mô tả.', isVerified: true, isActive: true },
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
