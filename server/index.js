const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Validate environment variables on startup
const { validateAndLog } = require('./utils/validateEnv');
try {
  validateAndLog(process.env, { strict: false });
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  if (IS_PRODUCTION) {
    console.error('Exiting due to invalid configuration in production');
    process.exit(1);
  }
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

// Import new security middleware
const { correlationId } = require('./middleware/correlationId');
const { prototypePollutionProtection } = require('./middleware/sanitize');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { requireAdminLegacy } = require('./middleware/auth');
const { auditLog, AUDIT_EVENTS } = require('./middleware/auditLog');

// Import reusable audit and sanitization middleware
const {
  auditProductCreate,
  auditProductUpdate,
  auditProductDelete,
  auditOrderCreate,
  auditOrderUpdate,
  auditOrderStatusChange,
  auditOrderRefund,
  auditCouponCreate,
  auditCouponUpdate,
  auditCouponDelete
} = require('./middleware/auditMiddleware');

const {
  sanitizeProductBody,
  sanitizeOrderBody,
  sanitizeReviewBody,
  sanitizeContactBody,
  sanitizeChatBody,
  sanitizeReturnBody,
  sanitizeAddressBody
} = require('./middleware/sanitizeMiddleware');

// Import enhanced rate limiters
const {
  authStrictLimiter,
  adminStrictLimiter,
  paymentLimiter,
  sensitiveDataLimiter,
  uploadLimiter,
  contactStrictLimiter,
  reviewStrictLimiter,
  trackingLimiter
} = require('./middleware/rateLimiters');

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
const { emit, subscribeToEvents } = require('./services/eventBus');
const {
  reserveInventory,
  releaseInventory,
  InsufficientStockError
} = require('./utils/inventoryTransaction');
const { generateGuestToken, verifyGuestToken } = require('./utils/guestToken');
const {
  authLimiter,
  checkoutHardLimiter,
  publicReadLimiter,
  reviewLimiter,
  sanitizeText,
  idempotencyMiddleware
} = require('./middleware/security');
const algoliaSync = require('./utils/algoliaSync');
const { connectDatabase } = require('./models');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const agentRoutes = require('./routes/agents');
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

function hasRealEnv(name) {
  const value = process.env[name];
  return !!value && value !== 'your_key_here' && value !== '{}';
}

// Firebase Admin (optional — chỉ init nếu có service account hoặc default credentials)
let adminDb = null;
try {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccountFile = process.env.FIREBASE_SERVICE_ACCOUNT_FILE || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (serviceAccountFile && serviceAccountFile !== 'your_key_here') {
    const serviceAccountPath = path.isAbsolute(serviceAccountFile)
      ? serviceAccountFile
      : path.resolve(__dirname, '..', serviceAccountFile);
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    initializeApp({ credential: cert(serviceAccount), projectId: projectId || serviceAccount.project_id });
    adminDb = getFirestore();
    console.log('[Firebase Admin] Initialized with service account file');
  } else if (serviceAccountJson && serviceAccountJson !== 'your_key_here') {
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
      app.locals.adminDb = null;
    });
    
    // Store in app.locals for middleware access
    app.locals.adminDb = adminDb;
  } else {
    console.warn('[Firebase Admin] No project ID — price validation will fall back to client values');
  }
} catch (err) {
  console.warn('[Firebase Admin] Init failed:', err.message);
}

const app = express();

// Store adminDb in app.locals for middleware access
app.locals.adminDb = null; // Will be set after Firebase initialization

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
  contentSecurityPolicy: IS_PRODUCTION ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  } : false,
  crossOriginEmbedderPolicy: false,
  hsts: IS_PRODUCTION ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false
}));

// Add correlation ID to all requests for tracking
app.use(correlationId);

// Request logging middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

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

app.use(express.json({ limit: '12mb' })); // Higher limit for base64 image upload (P9)
app.use(prototypePollutionProtection); // Prevent prototype pollution attacks
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

app.get('/api/integrations/status', adminLimiter, requireAdmin, (_req, res) => {
  res.json({
    firestore: {
      configured: !!adminDb,
      label: 'Firestore database',
      action: adminDb ? null : 'Kiem tra FIREBASE_PROJECT_ID va FIREBASE_SERVICE_ACCOUNT_FILE'
    },
    cloudinary: {
      configured: hasRealEnv('CLOUDINARY_CLOUD_NAME') && hasRealEnv('CLOUDINARY_API_KEY') && hasRealEnv('CLOUDINARY_API_SECRET'),
      label: 'Cloudinary upload',
      action: 'Dien CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
    },
    resend: {
      configured: hasRealEnv('RESEND_API_KEY') && hasRealEnv('EMAIL_FROM') && hasRealEnv('ADMIN_NOTIFICATION_EMAIL'),
      label: 'Resend email',
      action: 'Dien RESEND_API_KEY, EMAIL_FROM, ADMIN_NOTIFICATION_EMAIL'
    },
    stripe: {
      configured: hasRealEnv('STRIPE_SECRET_KEY') && hasRealEnv('VITE_STRIPE_PUBLISHABLE_KEY') && hasRealEnv('STRIPE_WEBHOOK_SECRET'),
      label: 'Stripe payments',
      action: 'Dien VITE_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET'
    },
    momo: {
      configured: isMomoConfigured(),
      label: 'MoMo payments',
      action: 'Dien MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY'
    },
    vnpay: {
      configured: isVnpayConfigured(),
      label: 'VNPay payments',
      action: 'Dien VNP_TMN_CODE va VNP_HASH_SECRET'
    },
    ghn: {
      configured: hasRealEnv('GHN_API_TOKEN') && hasRealEnv('GHN_SHOP_ID'),
      label: 'GHN shipping',
      action: 'Dien GHN_API_TOKEN va GHN_SHOP_ID'
    },
    algolia: {
      configured: algoliaSync.isAlgoliaConfigured(),
      label: 'Algolia search',
      action: 'Dien ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY, VITE_ALGOLIA_SEARCH_KEY'
    },
    aiRag: {
      configured: hasRealEnv('OPENAI_API_KEY') && hasRealEnv('PINECONE_API_KEY'),
      label: 'AI RAG chatbot',
      action: 'Dien OPENAI_API_KEY va PINECONE_API_KEY'
    },
    sentry: {
      configured: hasRealEnv('SENTRY_DSN') && hasRealEnv('VITE_SENTRY_DSN'),
      label: 'Sentry monitoring',
      action: 'Dien SENTRY_DSN va VITE_SENTRY_DSN'
    }
  });
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

app.post('/api/orders', 
  checkoutLimiter, 
  checkoutHardLimiter, 
  idempotencyMiddleware({ adminDb }), 
  sanitizeOrderBody,
  validate(schemas.OrderBody),
  auditOrderCreate,
  async (req, res) => {
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

// =========================
// Guest Checkout (P4)
// =========================
app.post('/api/checkout/guest', 
  checkoutLimiter, 
  checkoutHardLimiter, 
  idempotencyMiddleware({ adminDb }), 
  sanitizeOrderBody,
  async (req, res) => {
  try {
    const { order } = req.body || {};
    if (!order?.customer?.email || !order?.customer?.phone || !order?.customer?.name) {
      return res.status(400).json({ error: 'Vui lòng cung cấp email, sđt, tên người nhận' });
    }
    if (!Array.isArray(order.items) || order.items.length === 0) {
      return res.status(400).json({ error: 'Đơn hàng chưa có sản phẩm' });
    }

    if (!adminDb) {
      // Dev fallback
      const id = `GUEST-${Date.now()}`;
      const total = order.items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
      const token = generateGuestToken({ orderId: id, email: order.customer.email });
      return res.json({ id, total, guestToken: token, trackUrl: `/track-order?token=${token}` });
    }

    const validatedItems = await buildCheckoutItems(order.items);
    const subtotal = validatedItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = Number(order.shipping) || 0;
    const total = subtotal + shipping;
    const isStripeMethod = order.paymentMethod === 'stripe';

    const ref = await adminDb.collection('orders').add({
      ...order,
      isGuest: true,
      items: validatedItems,
      subtotal,
      shipping,
      total,
      status: 'pending',
      paymentStatus: isStripeMethod ? 'unpaid' : 'pending',
      inventoryReserved: false,
      createdAt: new Date()
    });

    if (!isStripeMethod) {
      try {
        await reserveInventory(adminDb, validatedItems.map((it) => ({
          productId: it.id,
          variantId: it.variantId || null,
          quantity: it.quantity,
          name: it.name
        })), {
          orderId: ref.id,
          userId: null,
          type: 'sale',
          note: `Guest order ${ref.id}`
        });
        await ref.update({ inventoryReserved: true });
      } catch (invErr) {
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

    const guestToken = generateGuestToken({
      orderId: ref.id,
      email: order.customer.email
    });

    await sendOrderCreatedEmails({
      ...order,
      id: ref.id,
      items: validatedItems,
      subtotal,
      shipping,
      total,
      status: 'pending',
      trackUrl: `${CLIENT_URL}/track-order?token=${guestToken}`
    });

    res.json({
      id: ref.id,
      total,
      guestToken,
      trackUrl: `/track-order?token=${guestToken}`
    });
  } catch (error) {
    console.error('Guest checkout error:', error);
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

app.get('/api/track-order', trackingLimiter, async (req, res) => {
  try {
    const token = String(req.query.token || '');
    if (!token) return res.status(400).json({ error: 'Thiếu token' });
    const payload = verifyGuestToken(token);
    if (!adminDb) return res.status(503).json({ error: 'Database không khả dụng' });
    const snap = await adminDb.collection('orders').doc(payload.orderId).get();
    if (!snap.exists) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    const order = snap.data();
    if (payload.email && order.customer?.email !== payload.email) {
      return res.status(403).json({ error: 'Token không khớp với đơn hàng' });
    }
    res.json({ id: snap.id, ...order });
  } catch (error) {
    console.error('Track order error:', error.message);
    res.status(401).json({ error: error.message || 'Token không hợp lệ' });
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
app.post('/api/create-payment-intent', 
  paymentLimiter,
  validate(schemas.PaymentIntentBody),
  async (req, res) => {
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

app.post('/api/products', 
  adminStrictLimiter, 
  requireAdmin, 
  requireFirestore, 
  sanitizeProductBody,
  validate(schemas.ProductBody),
  auditProductCreate,
  async (req, res) => {
  try {
    const { product } = req.body;
    if (!product?.name || !product?.price) {
      return res.status(400).json({ error: 'Thiếu thông tin sản phẩm' });
    }
    const id = String(product.id || Date.now());
    const originalPrice = Number(product.originalPrice ?? product.oldPrice ?? 0) || 0;
    const doc = {
      ...product,
      id,
      originalPrice,
      oldPrice: originalPrice,
      status: product.status || (Number(product.stock) > 0 ? 'active' : 'out_of_stock'),
      createdAt: new Date()
    };
    await adminDb.collection('products').doc(id).set(doc);
    algoliaSync.indexProduct(id, doc).catch(() => {});
    res.json(doc);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/products/:id', 
  adminStrictLimiter, 
  requireAdmin, 
  requireFirestore, 
  sanitizeProductBody,
  validate(schemas.ProductPatch),
  auditProductUpdate,
  async (req, res) => {
  try {
    const { patch } = req.body;
    const productId = String(req.params.id);
    const normalizedPatch = { ...patch };
    if (patch.originalPrice !== undefined || patch.oldPrice !== undefined) {
      const originalPrice = Number(patch.originalPrice ?? patch.oldPrice ?? 0) || 0;
      normalizedPatch.originalPrice = originalPrice;
      normalizedPatch.oldPrice = originalPrice;
    }
    await adminDb.collection('products').doc(productId).update({
      ...normalizedPatch,
      updatedAt: new Date()
    });
    // Sync Algolia với data mới
    adminDb.collection('products').doc(productId).get().then((snap) => {
      if (snap.exists) algoliaSync.indexProduct(productId, snap.data()).catch(() => {});
    });
    res.json({ ok: true });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', 
  adminStrictLimiter, 
  requireAdmin, 
  requireFirestore,
  auditProductDelete,
  async (req, res) => {
  try {
    const productId = String(req.params.id);
    await adminDb.collection('products').doc(productId).delete();
    algoliaSync.removeProduct(productId).catch(() => {});
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Algolia bulk reindex (admin)
app.post('/api/admin/algolia/reindex', 
  adminStrictLimiter, 
  requireAdmin, 
  requireFirestore, 
  async (_req, res) => {
  try {
    const snap = await adminDb.collection('products').get();
    const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const result = await algoliaSync.bulkSync(products);
    res.json({ total: products.length, ...result });
  } catch (error) {
    console.error('Algolia reindex error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Public search fallback (Firestore) - dùng nếu chưa config Algolia
app.get('/api/search', publicReadLimiter, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const limit = Math.min(50, Number(req.query.limit) || 20);
    if (!adminDb) return res.json({ hits: [], total: 0 });
    if (!q) return res.json({ hits: [], total: 0 });

    const snap = await adminDb.collection('products').limit(200).get();
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const filtered = all.filter((p) => {
      const haystack = `${p.name || ''} ${p.brand || ''} ${p.description || ''} ${p.category || ''}`.toLowerCase();
      return haystack.includes(q);
    }).slice(0, limit);

    res.json({ hits: filtered, total: filtered.length });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// Product Variants API (P2)
// =========================
app.get('/api/products/:productId/variants', async (req, res) => {
  try {
    if (!adminDb) return res.json([]);
    const snap = await adminDb
      .collection('products')
      .doc(String(req.params.productId))
      .collection('variants')
      .get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (error) {
    console.error('List variants error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products/:productId/variants', 
  adminStrictLimiter, 
  requireAdmin, 
  requireFirestore, 
  validate(schemas.VariantBody),
  async (req, res) => {
  try {
    const { variant } = req.body || {};
    if (!variant?.sku || typeof variant.price !== 'number') {
      return res.status(400).json({ error: 'sku và price là bắt buộc' });
    }
    const productRef = adminDb.collection('products').doc(String(req.params.productId));
    const productSnap = await productRef.get();
    if (!productSnap.exists) return res.status(404).json({ error: 'Sản phẩm không tồn tại' });

    const data = {
      sku: String(variant.sku),
      attributes: variant.attributes || {},
      price: Number(variant.price) || 0,
      originalPrice: Number(variant.originalPrice) || 0,
      stock: Number(variant.stock) || 0,
      images: Array.isArray(variant.images) ? variant.images : [],
      status: variant.status === 'inactive' ? 'inactive' : 'active',
      createdAt: new Date()
    };
    const ref = await productRef.collection('variants').add(data);
    res.json({ id: ref.id, ...data });
  } catch (error) {
    console.error('Create variant error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:productId/variants/:variantId', 
  adminStrictLimiter, 
  requireAdmin, 
  requireFirestore, 
  validate(schemas.VariantBody),
  async (req, res) => {
  try {
    const { variant } = req.body || {};
    if (!variant) return res.status(400).json({ error: 'variant payload missing' });
    const update = {
      ...(variant.sku !== undefined && { sku: String(variant.sku) }),
      ...(variant.attributes !== undefined && { attributes: variant.attributes || {} }),
      ...(variant.price !== undefined && { price: Number(variant.price) || 0 }),
      ...(variant.originalPrice !== undefined && { originalPrice: Number(variant.originalPrice) || 0 }),
      ...(variant.stock !== undefined && { stock: Number(variant.stock) || 0 }),
      ...(variant.images !== undefined && { images: Array.isArray(variant.images) ? variant.images : [] }),
      ...(variant.status !== undefined && { status: variant.status === 'inactive' ? 'inactive' : 'active' }),
      updatedAt: new Date()
    };
    await adminDb
      .collection('products').doc(String(req.params.productId))
      .collection('variants').doc(String(req.params.variantId))
      .update(update);
    res.json({ ok: true });
  } catch (error) {
    console.error('Update variant error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:productId/variants/:variantId', 
  adminStrictLimiter, 
  requireAdmin, 
  requireFirestore, 
  async (req, res) => {
  try {
    await adminDb
      .collection('products').doc(String(req.params.productId))
      .collection('variants').doc(String(req.params.variantId))
      .delete();
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete variant error:', error);
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

app.patch('/api/orders/:id/status', 
  adminStrictLimiter, 
  requireAdmin, 
  requireFirestore, 
  validate(schemas.OrderStatusBody),
  auditOrderStatusChange,
  async (req, res) => {
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

    // Notification (P12)
    try {
      const { createNotification: notify } = require('./utils/notificationService');
      const userId = order.customer?.userId || order.userId || order.customer?.email;
      if (userId) {
        const titleMap = {
          confirmed: 'Đơn hàng đã được xác nhận',
          packing: 'Đơn hàng đang được đóng gói',
          shipped: 'Đơn hàng đã giao cho vận chuyển',
          delivering: 'Đơn hàng đang được giao tới bạn',
          delivered: 'Đơn hàng đã giao thành công',
          cancelled: 'Đơn hàng đã bị hủy',
          refunded: 'Đơn hàng đã được hoàn tiền'
        };
        await notify(adminDb, userId, 'order_status', {
          title: titleMap[status] || `Trạng thái đơn ${orderId}: ${status}`,
          body: `Đơn hàng <strong>#${orderId}</strong> hiện đang ở trạng thái: <strong>${status}</strong>.`,
          targetUrl: `/tai-khoan/don-hang/${orderId}`,
          email: order.customer?.email,
          ctaLabel: 'Xem đơn hàng'
        });
      }
    } catch (e) {
      console.warn('[Notification] order status notify failed:', e.message);
    }

    res.json({ ok: true, inventoryReleased: shouldRelease });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/orders/:id/shipping', 
  adminStrictLimiter, 
  requireAdmin, 
  requireFirestore, 
  validate(schemas.ShippingInfoBody),
  auditOrderUpdate,
  async (req, res) => {
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

app.post('/api/coupons', 
  adminStrictLimiter, 
  requireAdmin, 
  requireFirestore, 
  validate(schemas.CouponBody),
  auditCouponCreate,
  async (req, res) => {
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

app.patch('/api/coupons/:code', 
  adminStrictLimiter, 
  requireAdmin, 
  requireFirestore, 
  validate(schemas.CouponPatch),
  auditCouponUpdate,
  async (req, res) => {
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

app.delete('/api/coupons/:code', 
  adminStrictLimiter, 
  requireAdmin, 
  requireFirestore,
  auditCouponDelete,
  async (req, res) => {
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

app.post('/api/products/:id/reviews', 
  reviewStrictLimiter,
  requireFirestore, 
  sanitizeReviewBody,
  validate(schemas.ReviewBody),
  async (req, res) => {
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

app.delete('/api/products/:id/reviews/:reviewId', 
  adminStrictLimiter, 
  requireAdmin, 
  requireFirestore, 
  async (req, res) => {
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
// Address Management (P13)
// =========================
app.get('/api/addresses', async (req, res) => {
  try {
    if (!adminDb) return res.json([]);
    const userId = String(req.query.userId || '');
    if (!userId) return res.status(400).json({ error: 'Thiếu userId' });
    const snap = await adminDb
      .collection('addresses')
      .where('userId', '==', userId)
      .orderBy('isDefault', 'desc')
      .limit(20)
      .get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (error) {
    console.error('List addresses error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/addresses', 
  checkoutLimiter, 
  sanitizeAddressBody,
  validate(schemas.AddressBody),
  async (req, res) => {
  try {
    if (!adminDb) return res.status(503).json({ error: 'Database không khả dụng' });
    const { address } = req.body || {};
    if (!address?.userId || !address?.recipientName || !address?.phone) {
      return res.status(400).json({ error: 'Thiếu userId, recipientName hoặc phone' });
    }
    const data = {
      userId: String(address.userId),
      label: address.label || 'Khác',
      recipientName: address.recipientName,
      phone: address.phone,
      province: address.province || '',
      district: address.district || '',
      ward: address.ward || '',
      street: address.street || '',
      isDefault: !!address.isDefault,
      createdAt: new Date()
    };
    // Nếu set default → unset all others
    if (data.isDefault) {
      const existing = await adminDb.collection('addresses').where('userId', '==', data.userId).get();
      const batch = adminDb.batch();
      existing.docs.forEach((d) => batch.update(d.ref, { isDefault: false }));
      await batch.commit();
    }
    const ref = await adminDb.collection('addresses').add(data);
    res.json({ id: ref.id, ...data });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/addresses/:id', 
  sanitizeAddressBody,
  validate(schemas.AddressBody),
  async (req, res) => {
  try {
    if (!adminDb) return res.status(503).json({ error: 'Database không khả dụng' });
    const { address } = req.body || {};
    if (!address?.userId) return res.status(400).json({ error: 'Thiếu userId' });
    const ref = adminDb.collection('addresses').doc(String(req.params.id));
    const snap = await ref.get();
    if (!snap.exists || snap.data().userId !== address.userId) {
      return res.status(403).json({ error: 'Bạn không có quyền sửa địa chỉ này' });
    }
    await ref.update({
      ...address,
      updatedAt: new Date()
    });
    res.json({ ok: true });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/addresses/:id', async (req, res) => {
  try {
    if (!adminDb) return res.status(503).json({ error: 'Database không khả dụng' });
    const userId = String(req.query.userId || '');
    if (!userId) return res.status(400).json({ error: 'Thiếu userId' });
    const ref = adminDb.collection('addresses').doc(String(req.params.id));
    const snap = await ref.get();
    if (!snap.exists || snap.data().userId !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa địa chỉ này' });
    }
    await ref.delete();
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/addresses/:id/default', async (req, res) => {
  try {
    if (!adminDb) return res.status(503).json({ error: 'Database không khả dụng' });
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'Thiếu userId' });
    // Unset all default
    const existing = await adminDb.collection('addresses').where('userId', '==', String(userId)).get();
    const batch = adminDb.batch();
    existing.docs.forEach((d) => batch.update(d.ref, { isDefault: d.id === req.params.id }));
    await batch.commit();
    res.json({ ok: true });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// Returns & Refunds (P7)
// =========================
const { issueStripeRefund } = require('./utils/refundService');

// User tạo return request
app.post('/api/returns', 
  checkoutLimiter, 
  sanitizeReturnBody,
  validate(schemas.ReturnRequestBody),
  async (req, res) => {
  try {
    if (!adminDb) return res.status(503).json({ error: 'Database không khả dụng' });
    const { returnRequest } = req.body || {};
    if (!returnRequest?.orderId || !returnRequest?.userId) {
      return res.status(400).json({ error: 'Thiếu orderId hoặc userId' });
    }
    if (!Array.isArray(returnRequest.items) || returnRequest.items.length === 0) {
      return res.status(400).json({ error: 'Phải có ít nhất 1 sản phẩm trả' });
    }
    if (!['return', 'exchange'].includes(returnRequest.type)) {
      return res.status(400).json({ error: 'type phải là return hoặc exchange' });
    }

    const orderSnap = await adminDb.collection('orders').doc(String(returnRequest.orderId)).get();
    if (!orderSnap.exists) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    const order = orderSnap.data();

    // Validate: đơn phải đã giao + trong 7 ngày
    if (order.status !== 'delivered' && order.status !== 'completed') {
      return res.status(400).json({ error: 'Chỉ đổi/trả được khi đơn đã giao thành công' });
    }
    const deliveredTs = order.deliveredAt?.toMillis?.() || order.deliveredAt?.getTime?.()
      || order.paidAt?.toMillis?.() || order.paidAt?.getTime?.() || Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - deliveredTs > sevenDaysMs) {
      return res.status(400).json({ error: 'Đã quá thời hạn đổi/trả 7 ngày' });
    }

    // Tính refund amount (best-effort dựa trên items)
    let refundAmount = 0;
    for (const it of returnRequest.items) {
      const orderItem = (order.items || []).find((oi) => String(oi.id) === String(it.productId) && (oi.variantId || null) === (it.variantId || null));
      if (orderItem) {
        refundAmount += (Number(orderItem.price) || 0) * (Number(it.quantity) || 0);
      }
    }

    const data = {
      orderId: String(returnRequest.orderId),
      userId: String(returnRequest.userId),
      items: returnRequest.items.map((it) => ({
        productId: String(it.productId),
        variantId: it.variantId || null,
        quantity: Number(it.quantity) || 1,
        reason: sanitizeText(it.reason),
        images: Array.isArray(it.images) ? it.images.slice(0, 5) : []
      })),
      type: returnRequest.type,
      status: 'pending',
      refundAmount: refundAmount > 0 ? refundAmount : null,
      refundMethod: returnRequest.refundMethod === 'store_credit' ? 'store_credit' : 'original',
      adminNote: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const ref = await adminDb.collection('return_requests').add(data);
    res.json({ id: ref.id, ...data });
  } catch (error) {
    console.error('Create return request error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List returns (admin: all, user: own)
app.get('/api/returns', async (req, res) => {
  try {
    if (!adminDb) return res.json([]);
    const adminEmail = req.header('x-admin-email');
    const userId = req.query.userId;
    let query = adminDb.collection('return_requests').orderBy('createdAt', 'desc');
    if (userId && !isAdminEmail(adminEmail)) {
      query = query.where('userId', '==', String(userId));
    }
    const snap = await query.limit(100).get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (error) {
    console.error('List returns error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin approve → auto refund + release inventory
app.put('/api/returns/:id/approve', 
  adminStrictLimiter, 
  requireAdmin, 
  requireFirestore, 
  sanitizeReturnBody,
  validate(schemas.ReturnApproveBody),
  auditOrderRefund,
  async (req, res) => {
  try {
    const { adminNote = '', refundAmount: customAmount } = req.body || {};
    const retRef = adminDb.collection('return_requests').doc(String(req.params.id));
    const retSnap = await retRef.get();
    if (!retSnap.exists) return res.status(404).json({ error: 'Yêu cầu đổi/trả không tồn tại' });
    const ret = retSnap.data();

    if (ret.status !== 'pending') {
      return res.status(400).json({ error: 'Yêu cầu đã được xử lý trước đó' });
    }

    const orderSnap = await adminDb.collection('orders').doc(ret.orderId).get();
    if (!orderSnap.exists) return res.status(404).json({ error: 'Đơn hàng gốc không tồn tại' });
    const order = orderSnap.data();

    // Restock items
    const releaseItems = ret.items.map((it) => ({
      productId: it.productId,
      variantId: it.variantId || null,
      quantity: it.quantity
    }));
    await releaseInventory(adminDb, releaseItems, {
      orderId: ret.orderId,
      userId: req.adminEmail,
      type: 'return',
      note: `Return ${req.params.id} approved`
    });

    // Try Stripe refund nếu paymentIntent có sẵn
    let refundResult = { ok: false, skipped: true };
    const amount = Number(customAmount) > 0 ? Number(customAmount) : (ret.refundAmount || 0);
    const stripeClient = getStripe();
    if (order.paymentIntentId && stripeClient && amount > 0 && ret.refundMethod === 'original') {
      refundResult = await issueStripeRefund(stripeClient, {
        paymentIntentId: order.paymentIntentId,
        amount,
        reason: 'requested_by_customer',
        metadata: { returnId: req.params.id, orderId: ret.orderId }
      });
    }

    await retRef.update({
      status: 'approved',
      adminNote: sanitizeText(adminNote),
      refundAmount: amount || ret.refundAmount,
      refundResult,
      updatedAt: new Date()
    });

    res.json({ ok: true, refundResult });
  } catch (error) {
    console.error('Approve return error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin reject
app.put('/api/returns/:id/reject', 
  adminStrictLimiter, 
  requireAdmin, 
  requireFirestore, 
  sanitizeReturnBody,
  validate(schemas.ReturnRejectBody),
  async (req, res) => {
  try {
    const { adminNote = '' } = req.body || {};
    await adminDb.collection('return_requests').doc(String(req.params.id)).update({
      status: 'rejected',
      adminNote: sanitizeText(adminNote),
      updatedAt: new Date()
    });
    res.json({ ok: true });
  } catch (error) {
    console.error('Reject return error:', error);
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

app.post('/api/payments/vnpay/create', 
  paymentLimiter,
  checkoutLimiter, 
  requireFirestore, 
  validate(schemas.VnpayCreateBody), 
  async (req, res) => {
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
app.post('/api/payments/momo/create', 
  paymentLimiter,
  checkoutLimiter, 
  requireFirestore, 
  validate(schemas.MomoCreateBody), 
  async (req, res) => {
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
const NOVASHOP_SYSTEM_PROMPT = `Bạn là Nova — trợ lý AI của TRỌNG ĐỊNH STORE, chuyên gia tư vấn dinh dưỡng và chăm sóc thú cưng.
Tính cách: thân thiện, am hiểu sâu, tự tin trả lời mọi câu hỏi về thú cưng và sản phẩm shop.
Ngôn ngữ: tiếng Việt tự nhiên, gần gũi. Dùng markdown (bold, bullet) khi cần, KHÔNG dùng heading ##.
Độ dài: 80–200 từ. Trả lời đầy đủ, không cắt ngắn khi chưa cần thiết.

QUAN TRỌNG — VỀ LIÊN HỆ HOTLINE/EMAIL:
Chỉ gợi ý số điện thoại 0369712958 hoặc email tutrantuan988@gmail.com khi:
- Khách đã hỏi đi hỏi lại nhiều lần (3+ lần) mà vẫn chưa giải quyết được, HOẶC
- Vấn đề cần xử lý trực tiếp (khiếu nại, đơn hàng cụ thể, đổi trả đang xử lý)
KHÔNG đưa số điện thoại ngay từ đầu hay khi chỉ hỏi thông thường.

━━━ THÔNG TIN SHOP ━━━
Tên: TRỌNG ĐỊNH STORE
Slogan: Yêu thương thú cưng — Chất lượng đảm bảo
Website: trongdinhstore.vn
Hotline/Zalo: 0369712958 (8h–22h hàng ngày)
Email: tutrantuan988@gmail.com
TikTok: @nclonf

━━━ CATALOG SẢN PHẨM ĐẦY ĐỦ ━━━

[THỨC ĂN CHÓ]
• Royal Canin Medium Adult 4kg — 890.000đ (sale từ 1.050.000đ) ⭐4.8
  Chuyên cho chó giống vừa 11–25kg, hỗ trợ tiêu hóa và khớp, giảm còn từ 1.050.000đ
• Royal Canin Mini Puppy 2kg — 520.000đ ⭐4.9
  Chó con giống nhỏ <10kg từ 2–10 tháng, tăng cường miễn dịch, DHA não bộ
• Pedigree Adult Beef & Vegetables 1.5kg — 185.000đ ⭐4.6
  Chó trưởng thành, canxi + vitamin, bổ sung rau củ, phổ biến nhất phân khúc bình dân
• Pedigree Puppy Chicken 480g — 68.000đ ⭐4.5
  Chó con 2–12 tháng, vị gà, hỗ trợ phát triển não, giá rẻ nhất cho puppy
• SmartHeart Adult Beef 3kg — 245.000đ ⭐4.4
  Nhập khẩu Thái Lan, vị thịt bò, mọi giống chó trưởng thành, tốt/rẻ
• Pedigree DentaStix 7 que — 55.000đ ⭐4.7
  Snack gặm sạch răng, giảm mảng bám, vị thịt bò, chó từ 10kg

[THỨC ĂN MÈO]
• Whiskas Adult Tuna 1.2kg — 155.000đ ⭐4.7
  Mèo trưởng thành >1 năm, vị cá ngừ, giảm búi lông, bán chạy nhất shop
• Me-O Adult Seafood 1.3kg — 125.000đ ⭐4.5
  Nhập Thái Lan, hải sản, tăng canxi + taurine, giá tốt nhất trong phân khúc
• Royal Canin Indoor 27 2kg — 580.000đ ⭐4.9
  Mèo trong nhà 1–7 tuổi, giảm mùi phân, kiểm soát cân nặng, cao cấp nhất
• Fancy Feast Grilled Chicken 85g — 25.000đ/hộp ⭐4.8
  Pate thịt gà Mỹ, bổ sung nước, mèo biếng ăn rất thích
• Catsrang Adult Fish 1.5kg — 195.000đ ⭐4.6
  Nhập Hàn Quốc, omega-3, lông bóng mượt
• Nekko Creamy Chicken 4 gói — 35.000đ ⭐4.7
  Súp kem vị gà, snack thưởng, mèo từ 3 tháng, cực kỳ phổ biến

[PHỤ KIỆN]
• Vòng cổ da cao cấp — 125.000đ | Dây dắt chó size M — 95.000đ
• Bát inox chống trượt — 75.000đ | Đồ chơi bóng cao su — 48.000đ
• Nhà cây mèo 3 tầng — 680.000đ | Khay vệ sinh mèo — 145.000đ
• Lồng vận chuyển thú cưng — 350.000đ | Bàn chải lông chó mèo — 65.000đ

━━━ CHÍNH SÁCH ━━━
**Vận chuyển:**
- Freeship đơn ≥ 300.000đ (toàn quốc, không ngoại lệ)
- Phí ship: 30.000đ cố định cho đơn dưới ngưỡng
- Hà Nội nội thành: giao trong ngày nếu đặt trước 14h
- Tỉnh lân cận HN: 1–2 ngày | Tỉnh xa/miền Nam: 3–5 ngày
- Đối tác: GHN, GHTK, J&T Express, Viettel Post

**Đổi trả:**
- 7 ngày đổi/trả kể từ ngày nhận hàng
- Điều kiện: còn nguyên tem nhãn, chưa qua sử dụng, có hóa đơn
- Hàng lỗi sản xuất: đổi mới 100%, shop chịu toàn bộ phí vận chuyển 2 chiều
- Hàng hết hạn/kém chất lượng: hoàn tiền 200% giá trị

**Thanh toán:**
- COD toàn quốc — kiểm hàng trước khi thanh toán (khuyến nghị)
- Chuyển khoản MBBank: STK 0369712958 — TRAN TUAN TU
- Thẻ Visa/Mastercard/JCB qua Stripe (thanh toán online bảo mật)
- Momo (liên hệ để nhận QR)

**Cam kết chất lượng:**
- 100% hàng chính hãng, có tem nhập khẩu và HSD rõ ràng
- Quay video đóng gói toàn bộ đơn hàng, lưu 30 ngày
- Đóng gói chống ẩm, chống va đập, seal niêm phong

━━━ KIẾN THỨC CHĂM SÓC THÚ CƯNG ━━━
**Dinh dưỡng chó:**
- Puppy <6 tháng: ăn 3–4 bữa/ngày, thức ăn puppy giàu DHA+protein
- Adult 1–7 tuổi: 2 bữa/ngày, khẩu phần 2–3% cân nặng/ngày
- Senior >7 tuổi: giảm protein, tăng chất xơ, bổ sung glucosamine
- Chó nhỏ: cần kibble size nhỏ, không dùng thức ăn chó lớn
- Tuyệt đối KHÔNG cho ăn: hành tây, tỏi, chocolate, nho, xylitol, avocado, macadamia

**Dinh dưỡng mèo:**
- Mèo là carnivore hoàn toàn — cần taurine (thiếu → mù, suy tim)
- Uống ít nước tự nhiên → nên mix pate/wet food để bổ sung nước
- Mèo indoor: ít vận động → ăn ít hơn 10–15%, kiểm soát cân nặng
- Hairball: bổ sung chất xơ, chải lông thường xuyên, dùng thức ăn anti-hairball
- Tuyệt đối KHÔNG cho ăn: hành, tỏi, sữa bò (lactose), chocolate, rượu bia, xương sống nhỏ

**Chọn thức ăn theo nhu cầu:**
- Chó/mèo biếng ăn: dùng pate kết hợp, thêm topping nước luộc gà (không muối)
- Dị ứng da: chọn thức ăn protein đơn (1 loại thịt), tránh ngũ cốc
- Thừa cân: giảm 20% khẩu phần, thêm rau luộc, tăng vận động
- Chó/mèo con: KHÔNG dùng thức ăn người lớn, thiếu DHA ảnh hưởng não

━━━ SO SÁNH SẢN PHẨM NỔI BẬT ━━━
Royal Canin vs Pedigree (cho chó):
- Royal Canin: nhập khẩu Pháp, formula theo giống+tuổi, giá cao nhưng chất lượng tốt nhất
- Pedigree: phổ thông, giá thấp, phù hợp ngân sách, chất lượng khá tốt cho chó không kén ăn

Whiskas vs Me-O vs Royal Canin (cho mèo):
- Royal Canin Indoor: tốt nhất cho mèo nhà, kiểm soát cân và mùi, giá cao
- Whiskas: cân bằng giữa chất lượng và giá, được mèo ưa thích
- Me-O: giá rẻ nhất, nhập Thái, phù hợp mèo ăn tạp, ngân sách eo hẹp

━━━ HƯỚNG DẪN TƯ VẤN THÔNG MINH ━━━
1. Khách hỏi thức ăn → hỏi thêm: loài, tuổi, cân nặng, vấn đề sức khỏe → tư vấn sản phẩm phù hợp CỤ THỂ với giá
2. Khách phân vân → so sánh cost/ngày (ví dụ: Royal Canin 4kg chỉ tốn ~7.400đ/ngày cho chó 10kg)
3. Khách hỏi sản phẩm cụ thể → cho ngay thông tin giá, rating, ưu điểm, link trang sản phẩm
4. Khách hỏi kiến thức thú cưng → trả lời đầy đủ như chuyên gia, không cần đẩy về hotline
5. Vấn đề đơn hàng/khiếu nại/kỹ thuật → MỚI gợi ý liên hệ trực tiếp
6. Cuối câu trả lời → gợi ý 1 sản phẩm liên quan hoặc câu hỏi follow-up tự nhiên
7. KHÔNG bao giờ nói "mình không rõ" với thông tin có sẵn trong catalog trên
8. KHÔNG đề cập số điện thoại/email trong câu trả lời thông thường`;

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn gửi tin nhắn quá nhanh. Vui lòng thử lại sau 1 phút.' }
});

app.post('/api/chat', 
  chatLimiter, 
  sanitizeChatBody,
  validate(schemas.ChatBody),
  async (req, res) => {
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
          ...validMessages.slice(-10)
        ],
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.9
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

// Product Import API (MarkItDown pattern)
app.use('/api/import', require('./routes/import'));

// Context Cache API (Context7 pattern) — for AI Chatbot context persistence
app.post('/api/context', publicReadLimiter, async (req, res) => {
  try {
    if (!adminDb) return res.json({ ok: true, skipped: true });
    const { userId, sessionId, context } = req.body || {};
    if (!userId || !sessionId) {
      return res.status(400).json({ error: 'userId và sessionId bắt buộc' });
    }
    await adminDb.collection('context_sessions').doc(`${userId}_${sessionId}`).set({
      userId,
      sessionId,
      context: context || {},
      updatedAt: new Date()
    }, { merge: true });
    res.json({ ok: true });
  } catch (error) {
    console.error('Context save error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/context/:userId/:sessionId', publicReadLimiter, async (req, res) => {
  try {
    if (!adminDb) return res.json({});
    const { userId, sessionId } = req.params;
    const snap = await adminDb.collection('context_sessions').doc(`${userId}_${sessionId}`).get();
    res.json(snap.exists ? snap.data() : {});
  } catch (error) {
    console.error('Context load error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/context/:userId/:sessionId', publicReadLimiter, async (req, res) => {
  try {
    if (!adminDb) return res.json({ ok: true, skipped: true });
    const { userId, sessionId } = req.params;
    await adminDb.collection('context_sessions').doc(`${userId}_${sessionId}`).delete();
    res.json({ ok: true });
  } catch (error) {
    console.error('Context delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Agent System API
app.use('/api/agents', agentRoutes);

// MongoDB API routes
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);

// Sentry (P11) — initialize on first load
const { initSentry, captureException } = require('./utils/sentry');
initSentry();

// Global error handler — catch unexpected errors and return JSON
app.use((err, req, res, _next) => {
  console.error('[Server Error]', err);
  captureException(err, { url: req.url, method: req.method });
  if (res.headersSent) return;
  res.status(500).json({ error: 'Lỗi máy chủ nội bộ', message: IS_PRODUCTION ? undefined : err.message });
});

// =========================
// Image Upload (P9)
// =========================
const { processAndUpload, isCloudinaryConfigured } = require('./utils/imageUpload');

app.get('/api/upload/config', (_req, res) => {
  res.json({ cloudinaryConfigured: isCloudinaryConfigured() });
});

app.post('/api/upload/image', 
  uploadLimiter,
  adminStrictLimiter, 
  requireAdmin, 
  validate(schemas.ImageUploadBody),
  async (req, res) => {
  try {
    const { dataUrl, folder, publicId } = req.body || {};
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'dataUrl (base64) là bắt buộc' });
    }
    // Strip data URL prefix
    const matches = dataUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'dataUrl phải là base64 image' });
    }
    const buffer = Buffer.from(matches[1], 'base64');
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'Ảnh quá lớn (>10MB)' });
    }
    const result = await processAndUpload(buffer, { folder, publicId });
    if (result.error) return res.status(500).json(result);
    res.json(result);
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// GHN Shipping (P14)
// =========================
const ghn = require('./utils/ghnService');

app.post('/api/shipping/calculate', publicReadLimiter, async (req, res) => {
  try {
    const result = await ghn.calculateShippingFee(req.body || {});
    res.json(result);
  } catch (error) {
    console.error('GHN calc error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shipping/create', 
  adminStrictLimiter, 
  requireAdmin, 
  async (req, res) => {
  try {
    const result = await ghn.createShipment(req.body?.order || {});
    if (result.ok && req.body?.order?.id && adminDb) {
      // Lưu tracking info vào order
      await adminDb.collection('orders').doc(String(req.body.order.id)).update({
        shippingInfo: {
          carrier: 'GHN',
          trackingCode: result.data?.order_code || '',
          carrierOrderCode: result.data?.order_code || '',
          estimatedDelivery: result.data?.expected_delivery_time || null,
          updatedAt: new Date()
        }
      });
    }
    res.json(result);
  } catch (error) {
    console.error('GHN create error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/shipping/track/:orderCode', publicReadLimiter, async (req, res) => {
  try {
    const result = await ghn.getTrackingStatus(req.params.orderCode);
    res.json(result);
  } catch (error) {
    console.error('GHN track error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// Cart Sync (P6 prerequisite)
// =========================
// Sync entire user cart - replaces existing items để abandoned tracking hoạt động
app.post('/api/cart/sync', publicReadLimiter, async (req, res) => {
  try {
    if (!adminDb) return res.json({ ok: true, skipped: true });
    const { userId, email, items } = req.body || {};
    if (!userId || !email) {
      return res.status(400).json({ error: 'userId và email là bắt buộc' });
    }
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items phải là array' });
    }

    // Xóa các cart_items cũ của user
    const existingSnap = await adminDb
      .collection('cart_items')
      .where('userId', '==', String(userId))
      .where('checkedOut', '==', false)
      .get();

    const batch = adminDb.batch();
    existingSnap.docs.forEach((d) => batch.delete(d.ref));

    // Thêm items mới
    const now = new Date();
    items.forEach((it) => {
      const ref = adminDb.collection('cart_items').doc();
      batch.set(ref, {
        userId: String(userId),
        email: String(email),
        productId: String(it.id || it.productId),
        variantId: it.variantId || null,
        name: it.name || '',
        price: Number(it.price) || 0,
        image: it.image || '',
        quantity: Number(it.quantity) || 1,
        checkedOut: false,
        reminderSent: 0,
        addedAt: now
      });
    });
    await batch.commit();
    res.json({ ok: true, count: items.length });
  } catch (error) {
    console.error('Cart sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark cart as checked out (gọi sau khi tạo order thành công)
app.post('/api/cart/checkout', publicReadLimiter, async (req, res) => {
  try {
    if (!adminDb) return res.json({ ok: true, skipped: true });
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId bắt buộc' });
    const snap = await adminDb
      .collection('cart_items')
      .where('userId', '==', String(userId))
      .where('checkedOut', '==', false)
      .get();
    const batch = adminDb.batch();
    snap.docs.forEach((d) => batch.update(d.ref, { checkedOut: true, checkedOutAt: new Date() }));
    await batch.commit();
    res.json({ ok: true, count: snap.size });
  } catch (error) {
    console.error('Cart checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =========================
// Notifications (P12)
// =========================
const { createNotification } = require('./utils/notificationService');

app.get('/api/notifications', async (req, res) => {
  try {
    if (!adminDb) return res.json([]);
    const userId = String(req.query.userId || '');
    if (!userId) return res.status(400).json({ error: 'Thiếu userId' });
    const snap = await adminDb
      .collection('notifications')
      .where('userId', '==', userId)
      .get();
    const notifications = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.getTime?.() || new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.getTime?.() || new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 50);
    res.json(notifications);
  } catch (error) {
    console.error('List notifications error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    if (!adminDb) return res.status(503).json({ error: 'Database không khả dụng' });
    await adminDb.collection('notifications').doc(String(req.params.id)).update({
      isRead: true,
      readAt: new Date()
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notifications/mark-all-read', async (req, res) => {
  try {
    if (!adminDb) return res.status(503).json({ error: 'Database không khả dụng' });
    const userId = String(req.body?.userId || '');
    if (!userId) return res.status(400).json({ error: 'Thiếu userId' });
    const snap = await adminDb
      .collection('notifications')
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .limit(200)
      .get();
    const batch = adminDb.batch();
    snap.docs.forEach((d) => batch.update(d.ref, { isRead: true, readAt: new Date() }));
    await batch.commit();
    res.json({ ok: true, count: snap.size });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================
// Contact form (POST /api/contact)
// =========================
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau 1 giờ.' }
});

// =========================
// AI Chatbot RAG (POST /api/chat-rag)
// =========================
const chatRagLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau 1 phút.' }
});

// =========================
// Subscription Management (SaaS)
// =========================
const { createSubscriptionCheckout, handleSubscriptionWebhook, cancelSubscription, getSubscriptionStatus } = require('./services/subscription');

app.post('/api/subscription/checkout', async (req, res) => {
  try {
    const { tenantId, tier } = req.body || {};
    
    if (!tenantId || !tier) {
      return res.status(400).json({ error: 'Thiếu tenantId hoặc tier' });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe không khả dụng' });
    }

    const checkout = await createSubscriptionCheckout(tenantId, tier, stripe, adminDb);
    res.json(checkout);
  } catch (error) {
    logger.error('[Subscription] Checkout error:', error);
    res.status(500).json({ error: error.message || 'Không thể tạo checkout session' });
  }
});

app.post('/api/subscription/cancel', async (req, res) => {
  try {
    const { tenantId } = req.body || {};
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Thiếu tenantId' });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe không khả dụng' });
    }

    const result = await cancelSubscription(tenantId, stripe, adminDb);
    res.json(result);
  } catch (error) {
    logger.error('[Subscription] Cancel error:', error);
    res.status(500).json({ error: error.message || 'Không thể hủy subscription' });
  }
});

app.get('/api/subscription/status/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const status = await getSubscriptionStatus(tenantId, adminDb);
    if (!status) {
      return res.status(404).json({ error: 'Tenant không tồn tại' });
    }
    
    res.json(status);
  } catch (error) {
    logger.error('[Subscription] Status error:', error);
    res.status(500).json({ error: 'Không thể lấy subscription status' });
  }
});

// Stripe webhook for subscription events
app.post('/api/subscription/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe không khả dụng' });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.warn('[Subscription] Webhook secret not configured');
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }

    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    await handleSubscriptionWebhook(event, stripe, adminDb);

    res.json({ received: true });
  } catch (error) {
    logger.error('[Subscription] Webhook error:', error);
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
});

app.post('/api/chat-rag', chatRagLimiter, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body || {};
    
    if (!message || String(message).trim().length < 2) {
      return res.status(400).json({ error: 'Tin nhắn quá ngắn' });
    }

    const safeMessage = sanitizeText(String(message));

    // Check if OpenAI and Pinecone are configured
    if (!process.env.OPENAI_API_KEY || !process.env.PINECONE_API_KEY) {
      // Fallback: simple rule-based response
      const responses = [
        'Xin chào! Tôi có thể giúp gì cho bạn về sản phẩm thú cưng?',
        'Bạn đang tìm kiếm thức ăn cho chó hay mèo?',
        'Chúng tôi có nhiều thương hiệu như Royal Canin, Pedigree, Whiskas, Me-O.',
        'Bạn có thể hỏi về giá, thành phần, hoặc cách chọn thức ăn phù hợp.',
        'Gọi hotline 0369712958 để được tư vấn trực tiếp.'
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      return res.json({ response: randomResponse, fallback: true });
    }

    // RAG with Pinecone
    const { createEmbedding } = require('./services/embeddings');
    const { queryEmbeddings } = require('./services/pinecone');
    const OpenAI = require('openai');
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Create embedding for user message
    const queryEmbedding = await createEmbedding(safeMessage);
    
    // Query Pinecone for relevant documents
    const relevantDocs = await queryEmbeddings(queryEmbedding, 3);
    
    // Build context from retrieved documents
    const context = relevantDocs
      .map(doc => doc.metadata?.text || '')
      .filter(Boolean)
      .join('\n\n');

    // Build system prompt with context
    const systemPrompt = `Bạn là trợ lý AI cho NovaShop - cửa hàng thức ăn thú cưng.
Sử dụng thông tin sau đây để trả lời câu hỏi của khách hàng:

${context}

Nếu không có thông tin, hãy trả lời lịch sự và gợi ý khách hàng gọi hotline 0369712958.
Luôn trả lời bằng tiếng Việt.`;

    // Call OpenAI Chat API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10),
        { role: 'user', content: safeMessage }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Xin lỗi, tôi không thể trả lời lúc này.';
    
    logger.info('[Chatbot] Message processed', { messageLength: safeMessage.length, hasContext: !!context });

    res.json({ response: aiResponse, fallback: false });
  } catch (error) {
    logger.error('[Chatbot] Error:', error);
    res.status(500).json({ 
      error: 'Không thể xử lý tin nhắn. Vui lòng thử lại sau.',
      fallback: true 
    });
  }
});

app.post('/api/contact', 
  contactStrictLimiter, 
  sanitizeContactBody,
  validate(schemas.ContactBody),
  async (req, res) => {
  try {
    const { name, email, phone, subject, message, recaptchaToken } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ tên, email và nội dung' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email không hợp lệ' });
    }
    if (String(message).length < 10) {
      return res.status(400).json({ error: 'Nội dung phải có ít nhất 10 ký tự' });
    }

    // Google reCAPTCHA v3 verification — chống spam
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    if (recaptchaSecret && recaptchaToken) {
      try {
        const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            secret: recaptchaSecret,
            response: recaptchaToken
          })
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success || (verifyData.score !== undefined && verifyData.score < 0.5)) {
          console.warn('[reCAPTCHA] Verification failed:', verifyData.score, verifyData['error-codes']);
          return res.status(400).json({ error: 'Xác thực bảo mật thất bại. Vui lòng thử lại.' });
        }
      } catch (recaptchaErr) {
        // Fail open — không block user nếu Google API lỗi
        console.warn('[reCAPTCHA] Verification error:', recaptchaErr.message);
      }
    }

    const safeName = sanitizeText(String(name));
    const safeEmail = sanitizeText(String(email));
    const safePhone = sanitizeText(String(phone || ''));
    const safeSubject = sanitizeText(String(subject || 'Liên hệ'));
    const safeMessage = sanitizeText(String(message));

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAILS?.split(',')[0] || 'admin@novashop.vn';
    const fromEmail = process.env.EMAIL_FROM || 'NovaShop <onboarding@resend.dev>';
    const contactResend = process.env.RESEND_API_KEY ? new (require('resend')).Resend(process.env.RESEND_API_KEY) : null;

    if (contactResend && adminEmail) {
      await contactResend.emails.send({
        from: fromEmail,
        to: adminEmail,
        subject: `[Liên hệ] ${safeSubject} - ${safeName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#14213d;">
            <div style="background:#14213d;color:#fff;padding:24px;border-radius:16px 16px 0 0;">
              <h1 style="margin:0;font-size:22px;">Tin nhắn liên hệ mới</h1>
            </div>
            <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 16px 16px;">
              <p><strong>Họ tên:</strong> ${safeName}</p>
              <p><strong>Email:</strong> ${safeEmail}</p>
              <p><strong>SĐT:</strong> ${safePhone || 'Không có'}</p>
              <p><strong>Chủ đề:</strong> ${safeSubject}</p>
              <p><strong>Nội dung:</strong></p>
              <p style="white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:8px;">${safeMessage}</p>
              <p style="color:#64748b;font-size:12px;margin-top:16px;">Gửi lúc: ${new Date().toLocaleString('vi-VN')}</p>
            </div>
          </div>
        `
      });
    } else {
      console.log('[Contact] Resend not configured — logged to console only');
      console.log(`  Name: ${safeName}, Email: ${safeEmail}, Subject: ${safeSubject}`);
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Contact form error:', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Không thể gửi tin nhắn. Vui lòng thử lại sau.' });
  }
});

// Global error handlers (must be after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

// SPA fallback — mọi route không phải API trả về index.html
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.resolve(__dirname, '../dist/index.html'));
});

// Catch-all 404 for API routes (this is now redundant with notFoundHandler, but keeping for compatibility)
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint không tồn tại' });
});

async function startServer() {
  await connectDatabase();
  
  // Khởi tạo Agent System (orchestrator)
  try {
    const orchestrator = require('./services/agent-orchestrator-init');
    await orchestrator.initialize();
    logger.info('[AgentSystem] All agents initialized successfully');
  } catch (err) {
    logger.warn('[AgentSystem] Could not initialize agent system:', err.message);
  }
  
  app.listen(PORT, () => {
    logger.info(`TRỌNG ĐỊNH STORE API server running on http://localhost:${PORT}`);
  });

  // Start event bus subscription (microservices)
  try {
    subscribeToEvents();
    logger.info('[EventBus] Event subscription started');
  } catch (err) {
    logger.warn('[EventBus] Could not start event subscription:', err.message);
  }

  // Start abandoned cart job (P6)
  try {
    const { startAbandonedCartJob } = require('./jobs/abandonedCartJob');
    startAbandonedCartJob(adminDb);
    logger.info('[Jobs] Abandoned cart job started');
  } catch (err) {
    logger.warn('[Jobs] Could not start abandoned cart job:', err.message);
  }
}

startServer();
