const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  try {
    const Stripe = require('stripe');
    return Stripe(secretKey);
  } catch (err) {
    console.warn('[Stripe] Init failed:', err.message);
    return null;
  }
}
const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { sendOrderCreatedEmails, sendOrderPaidEmails } = require('./email');
const {
  reserveInventory,
  releaseInventory,
  InsufficientStockError
} = require('./utils/inventoryTransaction');
const { connectDatabase } = require('./models');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const {
  isVnpayConfigured,
  buildVnpayUrl,
  verifyVnpayReturn,
  isMomoConfigured,
  createMomoPayment,
  verifyMomoIpn
} = require('./payments');
const { schemas, validate } = require('./validation');
const { buildHealth } = require('./health');
const { swaggerSetup } = require('./swagger');
const { requestLogger } = require('./logger');

// Firebase Admin (optional — chỉ init nếu có service account hoặc default credentials)
let adminDb = null;
try {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    initializeApp({ credential: cert(JSON.parse(serviceAccountJson)), projectId });
    adminDb = getFirestore();
    console.log('[Firebase Admin] Initialized with service account JSON');
  } else if (projectId) {
    initializeApp({ projectId });
    adminDb = getFirestore();
    console.log('[Firebase Admin] Initialized for project:', projectId);
  }

  if (adminDb) {
    // Probe credentials async — nếu không có default credentials thì disable adminDb
    adminDb.collection('_probe').limit(1).get().catch((err) => {
      console.warn('[Firebase Admin] Credentials probe failed, disabling Firestore:', err.message);
      adminDb = null;
    });
  } else {
    console.warn('[Firebase Admin] No project ID — price validation will fall back to client values');
  }
} catch (err) {
  console.warn('[Firebase Admin] Init failed:', err.message);
}

const app = express();
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.PUBLIC_API_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!IS_PRODUCTION || !origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin không được phép'));
  },
  credentials: true
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://checkout.stripe.com", "https://*.clerk.accounts.dev"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.firebaseapp.com", "https://*.googleusercontent.com"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://*.clerk.accounts.dev", "https://*.googleapis.com", "https://*.firebaseio.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://checkout.stripe.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: IS_PRODUCTION ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false
}));

// Request logging
app.use(requestLogger);

// Swagger API docs
swaggerSetup(app);

// Health check — đăng ký trước rate limiter
app.get('/api/health', async (_req, res) => {
  const report = await buildHealth(adminDb);
  res.status(report.status === 'healthy' ? 200 : 503).json(report);
});

// Dynamic SEO files (sử dụng domain từ CLIENT_URL)
const siteDomain = process.env.CLIENT_URL ? new URL(process.env.CLIENT_URL).hostname : 'localhost';
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: ${process.env.CLIENT_URL || 'https://' + siteDomain}/sitemap.xml`);
});
app.get('/sitemap.xml', (_req, res) => {
  const base = process.env.CLIENT_URL || `https://${siteDomain}`;
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc><priority>1.0</priority></url>
  <url><loc>${base}/thanh-toan</loc><priority>0.6</priority></url>
  <url><loc>${base}/tai-khoan</loc><priority>0.5</priority></url>
  <url><loc>${base}/chinh-sach/doi-tra</loc><priority>0.6</priority></url>
  <url><loc>${base}/chinh-sach/van-chuyen</loc><priority>0.6</priority></url>
  <url><loc>${base}/chinh-sach/bao-mat</loc><priority>0.6</priority></url>
  <url><loc>${base}/chinh-sach/dieu-khoan</loc><priority>0.6</priority></url>
  <url><loc>${base}/chinh-sach/faq</loc><priority>0.6</priority></url>
  <url><loc>${base}/chinh-sach/lien-he</loc><priority>0.6</priority></url>
</urlset>`);
});

// Webhook cần raw body — đăng ký TRƯỚC json parser
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    const stripe = getStripe();
    if (stripe && webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = JSON.parse(req.body.toString());
      if (!stripe) console.warn('[Webhook] Stripe not configured');
      if (!webhookSecret) console.warn('[Webhook] No STRIPE_WEBHOOK_SECRET — signature not verified');
    }
  } catch (err) {
    console.error('[Webhook] Signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    console.log('[Webhook] checkout.session.completed for order:', orderId);
    if (orderId && adminDb) {
      try {
        // Idempotency: chống xử lý webhook 2 lần
        const processedRef = adminDb.collection('processed_webhooks').doc(event.id);
        const processedSnap = await processedRef.get();
        if (processedSnap.exists) {
          console.log('[Webhook] Already processed:', event.id);
          return res.json({ received: true });
        }

        const orderRef = adminDb.collection('orders').doc(orderId);
        const orderSnap = await orderRef.get();
        const order = orderSnap.exists ? orderSnap.data() : null;
        const paidOrder = order ? { ...order, id: orderId } : null;

        await orderRef.update({
          status: 'paid',
          paymentStatus: 'paid',
          stripeSessionId: session.id,
          paymentIntentId: session.payment_intent || null,
          paidAt: new Date()
        });

        // Reserve inventory atomically — chỉ khi order chưa được reserve
        if (order?.items?.length && !order.inventoryReserved) {
          try {
            const reserveItems = order.items.map((it) => ({
              productId: it.id || it.productId,
              variantId: it.variantId || null,
              quantity: Number(it.quantity) || 1,
              name: it.name
            }));
            await reserveInventory(adminDb, reserveItems, {
              orderId,
              userId: order.customer?.userId || order.userId || null,
              type: 'sale',
              note: `Stripe payment ${session.id}`
            });
            await orderRef.update({ inventoryReserved: true });
          } catch (invErr) {
            // Đã thanh toán nhưng hết hàng → flag để admin xử lý refund
            console.error('[Webhook] Inventory reserve failed:', invErr.message);
            await orderRef.update({
              status: 'paid_oversold',
              inventoryError: invErr.message,
              insufficientItems: invErr.insufficientItems || []
            });
          }
        }

        await processedRef.set({
          eventId: event.id,
          eventType: event.type,
          orderId,
          processedAt: new Date()
        });

        if (paidOrder) {
          await sendOrderPaidEmails({
            ...paidOrder,
            status: 'paid',
            paymentStatus: 'paid'
          });
        }
      } catch (err) {
        console.error('[Webhook] Update order failed:', err.message);
      }
    }
  }

  res.json({ received: true });
});

app.use(express.json());
app.use(express.static(path.resolve(__dirname, '../dist')));

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.' }
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau 1 phút.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }
});

// General API rate limiting (excludes webhook registered earlier)
app.use('/api', apiLimiter);

function isAdminEmail(email) {
  const admins = (process.env.ADMIN_EMAILS || 'admin@example.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(String(email || '').toLowerCase());
}

function readBearerToken(req) {
  const header = req.header('authorization') || '';
  if (!header.toLowerCase().startsWith('bearer ')) return '';
  return header.slice(7).trim();
}

function safeTokenEqual(actual, expected) {
  const actualBuffer = Buffer.from(String(actual || ''));
  const expectedBuffer = Buffer.from(String(expected || ''));
  return actualBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function requireAdmin(req, res, next) {
  const email = req.header('x-admin-email');
  if (!isAdminEmail(email)) {
    return res.status(403).json({ error: 'Bạn không có quyền admin' });
  }
  const expectedToken = process.env.ADMIN_API_TOKEN;
  if (!expectedToken && IS_PRODUCTION) {
    return res.status(503).json({ error: 'ADMIN_API_TOKEN chưa được cấu hình trên server production' });
  }
  if (expectedToken) {
    const token = readBearerToken(req);
    if (!safeTokenEqual(token, expectedToken)) {
      return res.status(403).json({ error: 'Token admin không hợp lệ' });
    }
  }
  req.adminEmail = email;
  next();
}

function requireFirestore(req, res, next) {
  if (!adminDb) {
    return res.status(503).json({ error: 'Firestore không khả dụng — máy chủ chưa cấu hình credentials' });
  }
  next();
}

app.get('/api/admin/config', (_req, res) => {
  res.json({
    tokenRequired: IS_PRODUCTION || !!process.env.ADMIN_API_TOKEN,
    tokenConfigured: !!process.env.ADMIN_API_TOKEN
  });
});

app.get('/api/admin/verify', adminLimiter, requireAdmin, (req, res) => {
  res.json({ ok: true, adminEmail: req.adminEmail });
});

async function buildCheckoutItems(items) {
  if (!adminDb) {
    // Dev fallback: trust client-provided data (no stock/price validation)
    return items.map((item) => ({
      id: String(item.id),
      name: item.name || `Product ${item.id}`,
      price: Number(item.price) || 0,
      image: item.image || '',
      quantity: Number(item.quantity) || 1
    }));
  }
  const validated = [];
  for (const item of items) {
    const quantity = Number(item.quantity) || 1;
    if (!item.id || quantity < 1) throw new Error('Sản phẩm không hợp lệ');
    const snap = await adminDb.collection('products').doc(String(item.id)).get();
    if (!snap.exists) throw new Error(`Sản phẩm ${item.id} không tồn tại`);
    const product = snap.data();
    const stock = Number(product.stock) || 0;
    if (stock < quantity) {
      throw new Error(`${product.name || 'Sản phẩm'} không đủ tồn kho`);
    }
    validated.push({
      id: String(item.id),
      name: product.name,
      price: Number(product.price) || 0,
      image: product.image,
      quantity
    });
  }
  return validated;
}

// In-memory order fallback for dev mode when Firestore unavailable
const devOrders = [];
let devOrderId = 1000;

app.post('/api/orders', checkoutLimiter, validate(schemas.OrderBody), async (req, res) => {
  try {
    const { order } = req.body;
    if (!order?.customer?.name || !order?.customer?.phone || !order?.customer?.address) {
      return res.status(400).json({ error: 'Thông tin giao hàng không hợp lệ' });
    }
    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
      return res.status(400).json({ error: 'Đơn hàng chưa có sản phẩm' });
    }

    // If Firestore unavailable, use simple fallback (no stock validation)
    if (!adminDb) {
      const subtotal = order.items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
      const shipping = Number(order.shipping) || 0;
      const total = subtotal + shipping;
      devOrderId++;
      const id = String(devOrderId);
      const saved = {
        id,
        ...order,
        subtotal,
        shipping,
        total,
        status: 'pending',
        paymentStatus: order.paymentMethod === 'stripe' ? 'unpaid' : 'pending',
        createdAt: new Date()
      };
      devOrders.unshift(saved);
      console.log('[DEV] Order created:', id, saved.customer?.email);
      return res.json({ id, total, order: saved });
    }

    const validatedItems = await buildCheckoutItems(order.items);
    const subtotal = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let shipping = Number(order.shipping) || 0;
    let discount = 0;
    let appliedCoupon = null;

    if (order.coupon) {
      const code = String(order.coupon).trim().toUpperCase();
      const couponSnap = await adminDb.collection('coupons').doc(code).get();
      if (couponSnap.exists) {
        const coupon = couponSnap.data();
        const expires = coupon.expiresAt?.toDate ? coupon.expiresAt.toDate() : null;
        const expired = expires && expires < new Date();
        const overLimit = coupon.usageLimit > 0 && (coupon.usageCount || 0) >= coupon.usageLimit;
        const meetsMin = !coupon.minSubtotal || subtotal >= coupon.minSubtotal;
        if (coupon.active && !expired && !overLimit && meetsMin) {
          const calc = calculateCouponDiscount(coupon, subtotal);
          discount = calc.discount;
          if (calc.freeShipping) shipping = 0;
          appliedCoupon = code;
          await couponSnap.ref.update({ usageCount: (coupon.usageCount || 0) + 1 });
        }
      }
    }

    const total = Math.max(0, subtotal - discount) + shipping;

    const isStripeMethod = order.paymentMethod === 'stripe';

    const ref = await adminDb.collection('orders').add({
      ...order,
      coupon: appliedCoupon,
      items: validatedItems,
      subtotal,
      discount,
      shipping,
      total,
      status: 'pending',
      paymentStatus: isStripeMethod ? 'unpaid' : 'pending',
      inventoryReserved: false,
      createdAt: new Date()
    });

    // Reserve stock NGAY cho COD / bank-transfer (vì coi như đơn sẽ ship).
    // Với Stripe: đợi webhook checkout.session.completed → reserve khi paid
    // (tránh giữ stock vô ích nếu user không hoàn tất thanh toán).
    if (!isStripeMethod) {
      try {
        const reserveItems = validatedItems.map((it) => ({
          productId: it.id,
          variantId: it.variantId || null,
          quantity: it.quantity,
          name: it.name
        }));
        await reserveInventory(adminDb, reserveItems, {
          orderId: ref.id,
          userId: order.customer?.userId || order.userId || null,
          type: 'sale',
          note: `Order ${ref.id} (${order.paymentMethod || 'cod'})`
        });
        await ref.update({ inventoryReserved: true });
      } catch (invErr) {
        // Rollback order doc nếu reserve fail
        await ref.delete();
        if (invErr instanceof InsufficientStockError) {
          return res.status(409).json({
            error: invErr.message,
            code: invErr.code,
            insufficientItems: invErr.insufficientItems
          });
        }
        throw invErr;
      }
    }

    const savedOrder = {
      ...order,
      id: ref.id,
      items: validatedItems,
      subtotal,
      discount,
      shipping,
      total,
      status: 'pending',
      paymentStatus: isStripeMethod ? 'unpaid' : 'pending'
    };

    await sendOrderCreatedEmails(savedOrder);

    res.json({ id: ref.id, subtotal, discount, shipping, total });
  } catch (error) {
    console.error('Create order error:', error);
    if (error instanceof InsufficientStockError) {
      return res.status(409).json({
        error: error.message,
        code: error.code,
        insufficientItems: error.insufficientItems
      });
    }
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/create-checkout-session', checkoutLimiter, validate(schemas.CheckoutSessionBody), async (req, res) => {
  try {
    const { items, orderId, customerEmail } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items không hợp lệ' });
    }

    const validatedItems = await buildCheckoutItems(items);

    const lineItems = validatedItems.map((item) => ({
      price_data: {
        currency: 'vnd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : []
        },
        unit_amount: Math.round(Number(item.price) || 0)
      },
      quantity: Number(item.quantity) || 1
    }));

    if (lineItems.some((item) => item.price_data.unit_amount <= 0)) {
      return res.status(400).json({ error: 'Giá sản phẩm không hợp lệ cho thanh toán Stripe' });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe chưa được cấu hình trên server' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${CLIENT_URL}/thanh-toan/thanh-cong?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/thanh-toan`,
      metadata: {
        orderId: String(orderId || ''),
        customerEmail: String(customerEmail || '')
      },
      ...(customerEmail ? { customer_email: customerEmail } : {})
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// Stripe PaymentIntent (for inline card form)
// =========================
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, orderId, currency = 'vnd' } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Số tiền không hợp lệ' });
    }
    const stripe = getStripe();
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe chưa được cấu hình trên server' });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency.toLowerCase(),
      metadata: { orderId: String(orderId || '') },
      automatic_payment_methods: { enabled: true }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('PaymentIntent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// Products API
// =========================
app.get('/api/products', async (_req, res) => {
  try {
    if (!adminDb) {
      if (IS_PRODUCTION) {
        return res.status(503).json({ error: 'Firestore không khả dụng — máy chủ chưa cấu hình credentials' });
      }
      return res.json([]);
    }
    const snap = await adminDb.collection('products').orderBy('createdAt', 'desc').get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', adminLimiter, requireAdmin, requireFirestore, validate(schemas.ProductBody), async (req, res) => {
  try {
    const { product } = req.body;
    if (!product?.name || !product?.price) {
      return res.status(400).json({ error: 'Thiếu thông tin sản phẩm' });
    }
    const id = String(product.id || Date.now());
    await adminDb.collection('products').doc(id).set({
      ...product,
      id,
      createdAt: new Date()
    });
    res.json({ id, ...product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/products/:id', adminLimiter, requireAdmin, requireFirestore, validate(schemas.ProductPatch), async (req, res) => {
  try {
    const { patch } = req.body;
    await adminDb.collection('products').doc(String(req.params.id)).update({
      ...patch,
      updatedAt: new Date()
    });
    res.json({ ok: true });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', adminLimiter, requireAdmin, requireFirestore, async (req, res) => {
  try {
    await adminDb.collection('products').doc(String(req.params.id)).delete();
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// Orders API
// =========================
app.get('/api/orders', adminLimiter, requireAdmin, requireFirestore, async (_req, res) => {
  try {
    const snap = await adminDb.collection('orders').orderBy('createdAt', 'desc').get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics/summary', adminLimiter, requireAdmin, requireFirestore, async (req, res) => {
  try {
    const days = Math.min(180, Math.max(7, Number(req.query.days) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const snap = await adminDb.collection('orders').orderBy('createdAt', 'desc').get();
    const orders = snap.docs.map((d) => {
      const data = d.data();
      const created = data.createdAt?.toDate ? data.createdAt.toDate()
        : data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000)
        : new Date(data.createdAt || Date.now());
      return { id: d.id, ...data, createdAt: created };
    });

    const recent = orders.filter((o) => o.createdAt >= since);

    // Revenue per day
    const revenueByDay = {};
    for (let i = 0; i < days; i += 1) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      revenueByDay[key] = { date: key, revenue: 0, orders: 0 };
    }
    for (const o of recent) {
      const key = o.createdAt.toISOString().slice(0, 10);
      if (!revenueByDay[key]) revenueByDay[key] = { date: key, revenue: 0, orders: 0 };
      revenueByDay[key].orders += 1;
      if (o.paymentStatus === 'paid' || o.status === 'paid' || o.status === 'delivered') {
        revenueByDay[key].revenue += Number(o.total) || 0;
      }
    }
    const revenueSeries = Object.values(revenueByDay).sort((a, b) => a.date.localeCompare(b.date));

    // Status breakdown
    const statusBreakdown = {};
    for (const o of orders) {
      const s = o.status || 'pending';
      statusBreakdown[s] = (statusBreakdown[s] || 0) + 1;
    }

    // Payment method breakdown
    const paymentBreakdown = {};
    for (const o of orders) {
      const m = o.paymentMethod || 'cod';
      paymentBreakdown[m] = (paymentBreakdown[m] || 0) + 1;
    }

    // Top products
    const productMap = {};
    for (const o of orders) {
      if (!Array.isArray(o.items)) continue;
      const isPaid = o.paymentStatus === 'paid' || o.status === 'paid' || o.status === 'delivered';
      for (const item of o.items) {
        const key = String(item.id || item.name);
        if (!productMap[key]) {
          productMap[key] = { id: key, name: item.name, image: item.image, quantity: 0, revenue: 0 };
        }
        productMap[key].quantity += Number(item.quantity) || 0;
        if (isPaid) productMap[key].revenue += (Number(item.price) || 0) * (Number(item.quantity) || 0);
      }
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity)
      .slice(0, 5);

    // Top customers
    const customerMap = {};
    for (const o of orders) {
      const email = o.customer?.email || 'guest';
      if (!customerMap[email]) {
        customerMap[email] = { email, name: o.customer?.name || '', orders: 0, revenue: 0 };
      }
      customerMap[email].orders += 1;
      if (o.paymentStatus === 'paid' || o.status === 'paid' || o.status === 'delivered') {
        customerMap[email].revenue += Number(o.total) || 0;
      }
    }
    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Headline KPIs
    const totalOrders = orders.length;
    const paidOrders = orders.filter((o) => o.paymentStatus === 'paid' || o.status === 'paid' || o.status === 'delivered').length;
    const totalRevenue = orders.reduce((sum, o) => {
      if (o.paymentStatus === 'paid' || o.status === 'paid' || o.status === 'delivered') {
        return sum + (Number(o.total) || 0);
      }
      return sum;
    }, 0);
    const avgOrderValue = paidOrders ? Math.round(totalRevenue / paidOrders) : 0;
    const conversionRate = totalOrders ? Math.round((paidOrders / totalOrders) * 1000) / 10 : 0;

    res.json({
      days,
      kpis: { totalOrders, paidOrders, totalRevenue, avgOrderValue, conversionRate },
      revenueSeries,
      statusBreakdown,
      paymentBreakdown,
      topProducts,
      topCustomers
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/:id/summary', async (req, res) => {
  try {
    let o;
    const id = String(req.params.id);

    if (!adminDb) {
      o = devOrders.find((d) => String(d.id) === id);
      if (!o) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    } else {
      const snap = await adminDb.collection('orders').doc(id).get();
      if (!snap.exists) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
      o = { id: snap.id, ...snap.data() };
    }
    res.json({
      id: o.id || id,
      total: o.total,
      subtotal: o.subtotal,
      discount: o.discount,
      shipping: o.shipping,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      coupon: o.coupon || null
    });
  } catch (error) {
    console.error('Order summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/mine', async (req, res) => {
  try {
    const email = String(req.query.email || '').toLowerCase();
    if (!email) return res.status(400).json({ error: 'Thiếu email' });

    if (!adminDb) {
      const orders = devOrders.filter((o) => String(o.customer?.email || '').toLowerCase() === email);
      return res.json(orders);
    }

    const snap = await adminDb.collection('orders').orderBy('createdAt', 'desc').get();
    const orders = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((o) => String(o.customer?.email || '').toLowerCase() === email);
    res.json(orders);
  } catch (error) {
    console.error('List my orders error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/orders/:id/status', adminLimiter, requireAdmin, requireFirestore, validate(schemas.OrderStatusBody), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Thiếu trạng thái' });
    const orderId = req.params.id;
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }
    const order = orderSnap.data();

    // Trả stock atomically khi cancel / refund (chỉ nếu đơn đã reserve trước đó)
    const releaseStatuses = ['cancelled', 'refunded'];
    const wasReserved = order.inventoryReserved && !order.inventoryReleased;
    const shouldRelease = releaseStatuses.includes(status) && wasReserved;

    if (shouldRelease && Array.isArray(order.items) && order.items.length) {
      try {
        const releaseItems = order.items.map((it) => ({
          productId: it.id || it.productId,
          variantId: it.variantId || null,
          quantity: Number(it.quantity) || 0
        }));
        await releaseInventory(adminDb, releaseItems, {
          orderId,
          userId: req.adminEmail || null,
          type: status === 'refunded' ? 'return' : 'restock',
          note: `Order ${orderId} → ${status}`
        });
        await orderRef.update({
          status,
          inventoryReleased: true,
          updatedAt: new Date()
        });
      } catch (relErr) {
        console.error('[Order status] Release inventory failed:', relErr.message);
        return res.status(500).json({ error: 'Không thể trả tồn kho: ' + relErr.message });
      }
    } else {
      await orderRef.update({
        status,
        updatedAt: new Date()
      });
    }

    res.json({ ok: true, inventoryReleased: shouldRelease });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/orders/:id/shipping', adminLimiter, requireAdmin, requireFirestore, validate(schemas.ShippingInfoBody), async (req, res) => {
  try {
    const { shippingInfo } = req.body;
    await adminDb.collection('orders').doc(req.params.id).update({
      shippingInfo: shippingInfo || {},
      updatedAt: new Date()
    });
    res.json({ ok: true });
  } catch (error) {
    console.error('Update order shipping error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// Coupons API
// =========================
function normalizeCoupon(raw) {
  return {
    code: String(raw.code || '').trim().toUpperCase(),
    type: raw.type === 'shipping' ? 'shipping' : (raw.type === 'fixed' ? 'fixed' : 'percent'),
    value: Number(raw.value) || 0,
    minSubtotal: Number(raw.minSubtotal) || 0,
    maxDiscount: Number(raw.maxDiscount) || 0,
    usageLimit: Number(raw.usageLimit) || 0,
    usageCount: Number(raw.usageCount) || 0,
    expiresAt: raw.expiresAt ? new Date(raw.expiresAt) : null,
    active: raw.active !== false
  };
}

function calculateCouponDiscount(coupon, subtotal) {
  if (coupon.type === 'shipping') return { discount: 0, freeShipping: true };
  if (coupon.type === 'fixed') {
    return { discount: Math.min(subtotal, coupon.value), freeShipping: false };
  }
  // percent
  let discount = Math.round((subtotal * coupon.value) / 100);
  if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  return { discount, freeShipping: false };
}

app.get('/api/coupons', adminLimiter, requireAdmin, requireFirestore, async (_req, res) => {
  try {
    const snap = await adminDb.collection('coupons').orderBy('code').get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (error) {
    console.error('List coupons error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/coupons', adminLimiter, requireAdmin, requireFirestore, validate(schemas.CouponBody), async (req, res) => {
  try {
    const data = normalizeCoupon(req.body.coupon || {});
    if (!data.code) return res.status(400).json({ error: 'Thiếu mã coupon' });
    if (data.type !== 'shipping' && data.value <= 0) {
      return res.status(400).json({ error: 'Giá trị giảm phải lớn hơn 0' });
    }
    const ref = adminDb.collection('coupons').doc(data.code);
    const existing = await ref.get();
    if (existing.exists) return res.status(400).json({ error: 'Mã đã tồn tại' });
    await ref.set({ ...data, createdAt: new Date() });
    res.json({ id: data.code, ...data });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/coupons/:code', adminLimiter, requireAdmin, requireFirestore, validate(schemas.CouponPatch), async (req, res) => {
  try {
    const code = String(req.params.code).toUpperCase();
    const patch = normalizeCoupon({ code, ...req.body.patch });
    delete patch.code;
    delete patch.usageCount;
    await adminDb.collection('coupons').doc(code).update({
      ...patch,
      updatedAt: new Date()
    });
    res.json({ ok: true });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/coupons/:code', adminLimiter, requireAdmin, requireFirestore, async (req, res) => {
  try {
    await adminDb.collection('coupons').doc(String(req.params.code).toUpperCase()).delete();
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/coupons/validate', requireFirestore, validate(schemas.ValidateCouponBody), async (req, res) => {
  try {
    const code = String(req.body.code || '').trim().toUpperCase();
    const subtotal = Number(req.body.subtotal) || 0;
    if (!code) return res.status(400).json({ error: 'Vui lòng nhập mã' });
    const snap = await adminDb.collection('coupons').doc(code).get();
    if (!snap.exists) return res.status(404).json({ error: 'Mã không hợp lệ' });
    const coupon = snap.data();
    if (!coupon.active) return res.status(400).json({ error: 'Mã đã ngừng áp dụng' });
    if (coupon.expiresAt) {
      const expires = coupon.expiresAt.toDate ? coupon.expiresAt.toDate() : new Date(coupon.expiresAt);
      if (expires < new Date()) return res.status(400).json({ error: 'Mã đã hết hạn' });
    }
    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ error: 'Mã đã hết lượt sử dụng' });
    }
    if (coupon.minSubtotal > 0 && subtotal < coupon.minSubtotal) {
      return res.status(400).json({
        error: `Đơn tối thiểu ${coupon.minSubtotal.toLocaleString('vi-VN')}đ để dùng mã này`
      });
    }
    const { discount, freeShipping } = calculateCouponDiscount(coupon, subtotal);
    res.json({
      code,
      type: coupon.type,
      value: coupon.value,
      discount,
      freeShipping,
      message: 'Áp dụng mã thành công'
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// Reviews API
// =========================
app.get('/api/products/:id/reviews', requireFirestore, async (req, res) => {
  try {
    const snap = await adminDb
      .collection('products')
      .doc(String(req.params.id))
      .collection('reviews')
      .orderBy('createdAt', 'desc')
      .get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (error) {
    console.error('List reviews error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products/:id/reviews', requireFirestore, validate(schemas.ReviewBody), async (req, res) => {
  try {
    const productId = String(req.params.id);
    const { review } = req.body;
    if (!review?.rating || !review?.userEmail || !review?.userName) {
      return res.status(400).json({ error: 'Thiếu thông tin đánh giá' });
    }
    const rating = Math.min(5, Math.max(1, Number(review.rating)));
    const productRef = adminDb.collection('products').doc(productId);
    const productSnap = await productRef.get();
    if (!productSnap.exists) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }

    const reviewsRef = productRef.collection('reviews');
    const existing = await reviewsRef
      .where('userEmail', '==', String(review.userEmail).toLowerCase())
      .limit(1)
      .get();
    if (!existing.empty) {
      return res.status(400).json({ error: 'Bạn đã đánh giá sản phẩm này rồi' });
    }

    const newRef = await reviewsRef.add({
      rating,
      title: String(review.title || '').slice(0, 120),
      content: String(review.content || '').slice(0, 1000),
      userEmail: String(review.userEmail).toLowerCase(),
      userName: String(review.userName).slice(0, 80),
      createdAt: new Date()
    });

    // Aggregate rating & reviewCount on product
    const allSnap = await reviewsRef.get();
    const ratings = allSnap.docs.map((d) => Number(d.data().rating) || 0);
    const reviewCount = ratings.length;
    const avgRating = reviewCount ? ratings.reduce((a, b) => a + b, 0) / reviewCount : 0;
    await productRef.update({
      rating: Math.round(avgRating * 10) / 10,
      reviewCount,
      updatedAt: new Date()
    });

    res.json({ id: newRef.id, rating, reviewCount, avgRating });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id/reviews/:reviewId', adminLimiter, requireAdmin, requireFirestore, async (req, res) => {
  try {
    const productRef = adminDb.collection('products').doc(String(req.params.id));
    await productRef.collection('reviews').doc(String(req.params.reviewId)).delete();
    const allSnap = await productRef.collection('reviews').get();
    const ratings = allSnap.docs.map((d) => Number(d.data().rating) || 0);
    const reviewCount = ratings.length;
    const avgRating = reviewCount ? ratings.reduce((a, b) => a + b, 0) / reviewCount : 0;
    await productRef.update({
      rating: Math.round(avgRating * 10) / 10,
      reviewCount,
      updatedAt: new Date()
    });
    res.json({ ok: true, reviewCount, avgRating });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// VNPay
// =========================
async function markOrderPaid(orderId, paymentExtras = {}) {
  if (!adminDb || !orderId) return null;
  try {
    const ref = adminDb.collection('orders').doc(String(orderId));
    const snap = await ref.get();
    if (!snap.exists) return null;
    const order = snap.data();
    await ref.update({
      status: 'paid',
      paymentStatus: 'paid',
      paidAt: new Date(),
      ...paymentExtras
    });
    if (order?.items?.length) {
      const batch = adminDb.batch();
      for (const item of order.items) {
        if (!item.id) continue;
        const productRef = adminDb.collection('products').doc(String(item.id));
        const productSnap = await productRef.get();
        if (!productSnap.exists) continue;
        const currentStock = Number(productSnap.data().stock) || 0;
        const nextStock = Math.max(0, currentStock - (Number(item.quantity) || 1));
        batch.update(productRef, { stock: nextStock });
      }
      await batch.commit();
    }
    sendOrderPaidEmails({
      ...order,
      id: orderId,
      status: 'paid',
      paymentStatus: 'paid'
    }).catch((err) => console.warn('[Email] paid notification failed:', err.message));
    return order;
  } catch (err) {
    console.error('[markOrderPaid] failed:', err.message);
    return null;
  }
}

app.post('/api/payments/vnpay/create', checkoutLimiter, requireFirestore, validate(schemas.VnpayCreateBody), async (req, res) => {
  try {
    if (!isVnpayConfigured()) return res.status(500).json({ error: 'VNPay chưa được cấu hình' });
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Thiếu orderId' });
    const ref = adminDb.collection('orders').doc(String(orderId));
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    const order = snap.data();
    const ipAddr = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1').toString().split(',')[0].trim();
    const apiBase = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
    const url = buildVnpayUrl({
      orderId,
      amount: order.total,
      ipAddr,
      returnUrl: `${apiBase}/api/payments/vnpay/return`,
      orderInfo: `Thanh toan don hang ${orderId}`
    });
    res.json({ url });
  } catch (error) {
    console.error('VNPay create error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/payments/vnpay/return', async (req, res) => {
  try {
    const result = verifyVnpayReturn(req.query);
    if (!result.ok) {
      return res.redirect(`${CLIENT_URL}/thanh-toan/that-bai?reason=invalid-signature`);
    }
    if (result.success) {
      await markOrderPaid(result.orderId, {
        paymentMethod: 'vnpay',
        vnpayTransactionNo: result.transactionNo,
        vnpayBankCode: result.bankCode
      });
      return res.redirect(`${CLIENT_URL}/thanh-toan/thanh-cong?orderId=${result.orderId}&method=vnpay`);
    }
    res.redirect(`${CLIENT_URL}/thanh-toan/that-bai?orderId=${result.orderId}&code=${req.query.vnp_ResponseCode}`);
  } catch (error) {
    console.error('VNPay return error:', error);
    res.redirect(`${CLIENT_URL}/thanh-toan/that-bai?reason=server-error`);
  }
});

// =========================
// MoMo
// =========================
app.post('/api/payments/momo/create', checkoutLimiter, requireFirestore, validate(schemas.MomoCreateBody), async (req, res) => {
  try {
    if (!isMomoConfigured()) return res.status(500).json({ error: 'MoMo chưa được cấu hình' });
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Thiếu orderId' });
    const ref = adminDb.collection('orders').doc(String(orderId));
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    const order = snap.data();
    const apiBase = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
    const result = await createMomoPayment({
      orderId,
      amount: order.total,
      returnUrl: `${CLIENT_URL}/thanh-toan/momo-return`,
      ipnUrl: `${apiBase}/api/payments/momo/ipn`,
      orderInfo: `Thanh toan don hang ${orderId}`
    });
    res.json({ url: result.payUrl, qrCodeUrl: result.qrCodeUrl });
  } catch (error) {
    console.error('MoMo create error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments/momo/ipn', express.json(), async (req, res) => {
  try {
    const result = verifyMomoIpn(req.body);
    if (!result.ok) {
      return res.status(400).json({ message: 'Invalid signature' });
    }
    if (result.success) {
      await markOrderPaid(result.orderId, {
        paymentMethod: 'momo',
        momoTransId: result.transId
      });
    }
    res.json({ message: 'OK' });
  } catch (error) {
    console.error('MoMo IPN error:', error);
    res.status(500).json({ message: error.message });
  }
});

// =========================
// AI Chat (Claude) API
// =========================
const NOVASHOP_SYSTEM_PROMPT = `Bạn là Nova — trợ lý AI của TRỌNG ĐỊNH STORE, một shop thương mại điện tử Việt Nam.
Bạn thân thiện, nhiệt tình, trả lời bằng tiếng Việt tự nhiên như nhân viên shop thật.
Giữ câu trả lời ngắn gọn, dưới 150 từ. Dùng emoji vừa phải.

=== THÔNG TIN SHOP ===
TÊN SHOP: TRỌNG ĐỊNH STORE
SLOGAN: Mua sắm thông minh, chất lượng đảm bảo
WEBSITE: trongdinhstore.vn

DANH MỤC SẢN PHẨM:
- Thức ăn cho chó: thức ăn hạt, pate, snack, dinh dưỡng bổ sung
- Thức ăn cho mèo: thức ăn hạt, pate, snack, cát vệ sinh
- Phụ kiện thú cưng: đồ chơi, bát ăn, vòng cổ, dây dắt

CHÍNH SÁCH VẬN CHUYỂN:
- Freeship đơn từ 300.000đ (toàn quốc)
- Phí ship: 30.000đ cố định cho đơn dưới 300.000đ
- Nội thành HN: giao trong ngày nếu đặt trước 14h
- Tỉnh lân cận: 1–2 ngày | Tỉnh xa: 3–5 ngày
- Đối tác giao hàng: GHN, GHTK, J&T Express, Viettel Post

CHÍNH SÁCH ĐỔI TRẢ:
- 7 ngày đổi/trả kể từ ngày nhận hàng
- Điều kiện: còn nguyên tem nhãn, chưa qua sử dụng
- Hàng lỗi sản xuất: đổi mới 100%, shop chịu phí ship
- Liên hệ qua Zalo hoặc hotline để tạo yêu cầu đổi trả

CHÍNH SÁCH THANH TOÁN:
- COD (trả tiền mặt khi nhận hàng) — toàn quốc
- Chuyển khoản MBBank: TK 0369712958, chủ TK TRAN TUAN TU
- Đồng kiểm hàng trước khi thanh toán COD

CAM KẾT CHẤT LƯỢNG:
- 100% thức ăn chính hãng, có nguồn gốc rõ ràng
- Hàng nhái/kém chất lượng → hoàn tiền 200% giá trị

HỖ TRỢ KHÁCH HÀNG:
- Zalo: phản hồi trong 5 phút (8h–22h hàng ngày)
- Hotline: 0369712958 (8h–20h)
- Chat AI: 24/7
- Email: tutrantuan988@gmail.com
- TikTok: @nclonf

ĐÓNG GÓI:
- Thức ăn hạt bọc kín, chống ẩm, có seal niêm phong
- Pate/snack đóng thùng carton chắc chắn, chống va đập
- Quay video đóng gói lưu lại cho đơn hàng

=== HƯỚNG DẪN TRẢ LỜI ===
- Không biết thông tin → nói "Mình sẽ chuyển câu hỏi này đến nhân viên hỗ trợ nhé!"
- Không trả lời về chính trị, tôn giáo, hay nội dung không liên quan shop
- Nếu khách muốn mua hàng → hỏi họ cần thức ăn cho chó hay mèo, loại nào để tư vấn
- Cuối mỗi câu khó → gợi ý "Bạn có thể nhắn Zalo 0369712958 để được hỗ trợ trực tiếp"`;

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn gửi tin nhắn quá nhanh. Vui lòng thử lại sau 1 phút.' }
});

app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Thiếu nội dung tin nhắn' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'AI chat chưa được cấu hình. Vui lòng liên hệ admin.'
      });
    }

    const validMessages = messages.filter((m) => m.role && m.content).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '')
    }));

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: NOVASHOP_SYSTEM_PROMPT },
          ...validMessages
        ],
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      console.error('[Groq] HTTP', response.status, errBody);
      return res.status(502).json({
        error: 'Lỗi khi gọi AI. Bạn thử lại sau nhé!',
        message: IS_PRODUCTION ? undefined : `Groq HTTP ${response.status}`
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    res.json({ message: text });
  } catch (error) {
    console.error('[Groq] Chat error:', error.message);
    res.status(500).json({
      error: 'Lỗi khi gọi AI. Bạn thử lại sau nhé!',
      message: IS_PRODUCTION ? undefined : error.message
    });
  }
});

// MongoDB API routes
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);

// Global error handler — catch unexpected errors and return JSON
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Lỗi máy chủ nội bộ', message: IS_PRODUCTION ? undefined : err.message });
});

// SPA fallback — mọi route không phải API trả về index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.resolve(__dirname, '../dist/index.html'));
});

// Catch-all 404 for API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint không tồn tại' });
});

async function startServer() {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`TRỌNG ĐỊNH STORE API server running on http://localhost:${PORT}`);
  });
}

startServer();
