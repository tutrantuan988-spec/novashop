# 🔒 Security Best Practices — TRỌNG ĐỊNH STORE
> Inspired by everything-claude-code security/ directory

## 1. Environment Variables
```bash
# ✅ Đúng: Dùng .env.local cho tất cả secrets
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
FIREBASE_SERVICE_ACCOUNT_JSON={}

# ❌ Sai: Hardcode trong code
const API_KEY = "sk_live_xxx"  # NEVER!
```

## 2. Firebase Security Rules
```javascript
// Firestore rules mẫu
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chỉ admin mới được ghi vào products
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null 
        && request.auth.token.email in ['tutrantuan988@gmail.com'];
    }
    // User chỉ đọc được order của mình
    match /orders/{orderId} {
      allow read: if request.auth != null 
        && (resource.data.userId == request.auth.uid 
        || request.auth.token.email in ['tutrantuan988@gmail.com']);
    }
  }
}
```

## 3. API Security Checklist
- [ ] Rate limiting enabled cho public endpoints
- [ ] Input sanitization với `sanitizeText()`
- [ ] Idempotency key cho POST/PUT requests
- [ ] CORS whitelist chỉ cho phép domain production
- [ ] Helmet headers enabled (XSS, CSP, etc.)
- [ ] Admin endpoints protected với Bearer token
- [ ] Guest token HMAC-signed (không JWT cho guest)

## 4. Stripe Security
```javascript
// ✅ Đúng: Verify webhook signature
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

// ✅ Đúng: Idempotency
const paymentIntent = await stripe.paymentIntents.create({
  amount: 1000,
  currency: 'vnd',
}, { idempotencyKey: req.headers['idempotency-key'] });
```

## 5. Rate Limiting
```javascript
// Admin endpoints: strict limit
app.use('/api/admin', authLimiter);

// Public endpoints: moderate limit  
app.use('/api/products', publicReadLimiter);

// Auth endpoints: strict + slow
app.use('/api/auth', authLimiter);
```

## 6. Data Validation
```javascript
// ✅ Đúng: Validate với Zod
const orderSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^(0[0-9]{9})$/),
  email: z.string().email().optional(),
});

// ❌ Sai: Trust user input trực tiếp
db.collection('users').add(req.body); // NEVER!
```
