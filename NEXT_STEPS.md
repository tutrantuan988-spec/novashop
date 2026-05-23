# Phase 1 Security - Next Steps

**Current Status:** Core infrastructure complete (70%)  
**Next Phase:** Endpoint-specific integration

---

## 🎯 Immediate Next Steps

### 1. Add Audit Logging to Admin Endpoints (High Priority)

**Why:** Track all administrative actions for security and compliance

**How to implement:**

```javascript
// Import at top of server/index.js
const { auditLog, AUDIT_EVENTS } = require('./middleware/auditLog');

// Example: Product Creation
app.post('/api/products', 
  adminLimiter, 
  requireAdmin, 
  requireFirestore,
  auditLog({
    event: AUDIT_EVENTS.PRODUCT_CREATE,
    resource: 'product',
    getResourceId: (req) => req.body.product?.id || 'new',
    getChanges: (req) => ({ after: req.body.product })
  }),
  validate(schemas.ProductBody), 
  async (req, res) => {
    // ... existing code
  }
);

// Example: Product Update
app.put('/api/products/:id', 
  adminLimiter, 
  requireAdmin, 
  requireFirestore,
  auditLog({
    event: AUDIT_EVENTS.PRODUCT_UPDATE,
    resource: 'product',
    getResourceId: (req) => req.params.id,
    getChanges: (req) => ({ after: req.body.product })
  }),
  validate(schemas.ProductBody),
  async (req, res) => {
    // ... existing code
  }
);

// Example: Product Deletion
app.delete('/api/products/:id', 
  adminLimiter, 
  requireAdmin, 
  requireFirestore,
  auditLog({
    event: AUDIT_EVENTS.PRODUCT_DELETE,
    resource: 'product',
    getResourceId: (req) => req.params.id
  }),
  async (req, res) => {
    // ... existing code
  }
);
```

**Endpoints to update:**
- ✅ `POST /api/products` - Product creation
- ✅ `PUT /api/products/:id` - Product updates
- ✅ `DELETE /api/products/:id` - Product deletion
- ⏳ `PUT /api/orders/:id` - Order updates
- ⏳ `POST /api/coupons` - Coupon creation
- ⏳ `PUT /api/coupons/:id` - Coupon updates
- ⏳ `DELETE /api/coupons/:id` - Coupon deletion
- ⏳ All other admin actions

---

### 2. Add Input Sanitization to User Input Endpoints (High Priority)

**Why:** Prevent XSS attacks and injection vulnerabilities

**How to implement:**

```javascript
// Import at top of server/index.js
const { sanitizeProduct, sanitizeOrder, sanitizeReview } = require('./middleware/sanitize');

// Example: Product Creation (Admin)
app.post('/api/products', 
  adminLimiter, 
  requireAdmin, 
  requireFirestore,
  (req, res, next) => {
    if (req.body.product) {
      req.body.product = sanitizeProduct(req.body.product);
    }
    next();
  },
  auditLog({ /* ... */ }),
  validate(schemas.ProductBody), 
  async (req, res) => {
    // ... existing code
  }
);

// Example: Review Creation (User)
app.post('/api/products/:id/reviews',
  requireFirestore,
  (req, res, next) => {
    if (req.body.review) {
      req.body.review = sanitizeReview(req.body.review);
    }
    next();
  },
  validate(schemas.ReviewBody),
  async (req, res) => {
    // ... existing code
  }
);

// Example: Order Creation (User)
app.post('/api/orders',
  checkoutLimiter,
  checkoutHardLimiter,
  idempotencyMiddleware({ adminDb }),
  (req, res, next) => {
    if (req.body.order) {
      req.body.order = sanitizeOrder(req.body.order);
    }
    next();
  },
  validate(schemas.OrderBody),
  async (req, res) => {
    // ... existing code
  }
);
```

**Endpoints to update:**
- ⏳ `POST /api/products` - Sanitize product data
- ⏳ `PUT /api/products/:id` - Sanitize product updates
- ⏳ `POST /api/products/:id/reviews` - Sanitize reviews
- ⏳ `POST /api/orders` - Sanitize order data
- ⏳ `POST /api/contact` - Sanitize contact form
- ⏳ Any other user input endpoints

---

### 3. Test Everything (Critical)

**Manual Testing Checklist:**

```bash
# 1. Start the server
npm run server

# 2. Test admin endpoints
# - Login as admin
# - Create a product
# - Update a product
# - Delete a product
# - Check audit logs in Firestore

# 3. Test user endpoints
# - Create an order
# - Submit a review
# - Check that XSS is prevented

# 4. Test error handling
# - Try invalid requests
# - Check error responses have correlation IDs
# - Verify no internal errors leaked

# 5. Check logs
# - Verify correlation IDs in logs
# - Verify audit logs created
# - Verify error logs formatted correctly
```

**Automated Testing (TODO):**

```bash
# Create test files
mkdir -p tests/unit/middleware
mkdir -p tests/integration

# Write unit tests
# tests/unit/middleware/auth.test.js
# tests/unit/middleware/rbac.test.js
# tests/unit/middleware/sanitize.test.js
# tests/unit/middleware/auditLog.test.js

# Write integration tests
# tests/integration/security.test.js
# tests/integration/admin-endpoints.test.js

# Run tests
npm test
```

---

### 4. Add JWT Login Endpoint (Optional - Future)

**Why:** Enable JWT-based authentication for better security

**How to implement:**

```javascript
// Import at top
const { generateToken } = require('./middleware/auth');

// Add login endpoint
app.post('/api/admin/login', 
  adminLimiter,
  auditLog({
    event: AUDIT_EVENTS.AUTH_LOGIN,
    resource: 'authentication'
  }),
  async (req, res) => {
    const { email, password } = req.body;
    
    // Validate admin email
    if (!isAdminEmail(email)) {
      return res.status(403).json({ 
        error: 'Bạn không có quyền admin' 
      });
    }
    
    // Verify password (implement your password verification)
    // For now, check against ADMIN_API_TOKEN as password
    const expectedToken = process.env.ADMIN_API_TOKEN;
    if (!expectedToken || password !== expectedToken) {
      return res.status(401).json({ 
        error: 'Mật khẩu không đúng' 
      });
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: email,
      email: email,
      role: 'admin'
    });
    
    res.json({ 
      token,
      user: {
        email,
        role: 'admin'
      }
    });
  }
);
```

**Note:** This is optional for now. Legacy auth still works.

---

## 📋 Checklist

### Core Infrastructure (Complete)
- [x] Install dependencies
- [x] Create middleware files
- [x] Add environment validation
- [x] Add correlation IDs
- [x] Add prototype pollution protection
- [x] Add global error handler
- [x] Store adminDb in app.locals

### Endpoint Integration (In Progress)
- [ ] Add audit logging to admin endpoints
- [ ] Add input sanitization to user input endpoints
- [ ] Test all endpoints manually
- [ ] Verify audit logs created
- [ ] Verify XSS prevention works

### Testing (TODO)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Run all tests
- [ ] Achieve 80% coverage

### Documentation (In Progress)
- [x] Security audit
- [x] Progress tracking
- [x] Integration plan
- [x] Integration summary
- [x] Next steps guide
- [ ] Migration guide for frontend
- [ ] API documentation updates

### Deployment (TODO)
- [ ] Deploy to staging
- [ ] Performance testing
- [ ] Security testing
- [ ] Deploy to production

---

## 🚨 Important Reminders

1. **Backward Compatibility:** All changes must maintain backward compatibility
2. **Testing:** Test thoroughly before deploying to production
3. **Monitoring:** Monitor error rates and performance after deployment
4. **Rollback Plan:** Be ready to rollback if issues occur
5. **Documentation:** Keep documentation up to date

---

## 📞 Need Help?

### Common Issues

**Issue:** Server won't start
- **Solution:** Check environment variables, ensure JWT_SECRET is set (or use legacy auth)

**Issue:** Audit logs not created
- **Solution:** Verify adminDb is initialized, check Firestore connection

**Issue:** Input sanitization too aggressive
- **Solution:** Adjust sanitization rules in `server/middleware/sanitize.js`

**Issue:** Error responses not formatted correctly
- **Solution:** Ensure error handler is last middleware, check error classes

---

## 📚 Reference Documents

- `SECURITY_AUDIT.md` - Complete vulnerability analysis
- `PHASE1_PROGRESS.md` - Detailed progress tracking
- `INTEGRATION_PLAN.md` - Step-by-step integration guide
- `PHASE1_INTEGRATION_SUMMARY.md` - Current status summary
- `NEXT_STEPS.md` - This document

---

**Last Updated:** May 17, 2026  
**Next Review:** May 18, 2026
