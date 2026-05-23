# Phase 1 Security Integration Plan

**Date:** May 17, 2026  
**Status:** Ready for Implementation  
**Risk Level:** MEDIUM (backward compatible, but touches critical auth code)

---

## Overview

This document outlines the step-by-step plan to integrate all new security middleware into the NovaShop server without breaking existing functionality.

---

## Prerequisites ✅

- [x] All new middleware files created
- [x] Dependencies installed (jsonwebtoken, dompurify, jsdom)
- [x] Logger utility exists and working
- [x] Backward compatibility maintained in all middleware

---

## Integration Steps

### Step 1: Add Environment Validation on Startup

**File:** `server/index.js`  
**Location:** After dotenv.config(), before any other initialization  
**Risk:** LOW - Only validates, doesn't change behavior

```javascript
// Add after line 3 (after dotenv.config)
const { validateAndLog } = require('./utils/validateEnv');

// Validate environment variables on startup
try {
  validateAndLog(process.env, { strict: false });
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  if (IS_PRODUCTION) {
    process.exit(1); // Fail fast in production
  }
}
```

**Impact:**
- Validates all environment variables on startup
- Fails fast if critical variables missing in production
- Provides clear error messages for misconfiguration

---

### Step 2: Add Correlation ID Middleware

**File:** `server/index.js`  
**Location:** After helmet(), before request logging  
**Risk:** LOW - Non-breaking addition

```javascript
// Add import at top
const { correlationId } = require('./middleware/correlationId');

// Add after helmet() middleware (around line 135)
app.use(correlationId);
```

**Impact:**
- Adds unique correlation ID to each request
- Enables request tracking across logs
- Improves debugging capabilities

---

### Step 3: Add Prototype Pollution Protection

**File:** `server/index.js`  
**Location:** After express.json(), before routes  
**Risk:** LOW - Security enhancement, no breaking changes

```javascript
// Add import at top
const { prototypePollutionProtection } = require('./middleware/sanitize');

// Add after express.json() middleware (around line 290)
app.use(prototypePollutionProtection);
```

**Impact:**
- Prevents prototype pollution attacks
- Cleans dangerous keys from request objects
- No impact on legitimate requests

---

### Step 4: Replace Legacy Admin Authentication (CRITICAL)

**File:** `server/index.js`  
**Location:** Replace existing requireAdmin function  
**Risk:** MEDIUM - Critical auth code, but backward compatible

**Current Code (lines 334-352):**
```javascript
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
```

**New Code:**
```javascript
// Import new auth middleware at top
const { requireAuth, requireAdmin: requireAdminNew, requireAdminLegacy } = require('./middleware/auth');

// Option 1: Use new auth (recommended)
// Replace all instances of requireAdmin with requireAdminNew
// This requires JWT tokens

// Option 2: Use legacy auth during migration (safer)
// Keep using requireAdminLegacy which maintains exact same behavior
// This allows gradual migration

// For now, we'll use Option 2 (legacy) to maintain compatibility
// Then gradually migrate to Option 1
```

**Migration Strategy:**
1. **Phase 1a (This PR):** Keep using legacy auth, but import new middleware
2. **Phase 1b (Next PR):** Add JWT login endpoint, allow both auth methods
3. **Phase 1c (Future PR):** Deprecate legacy auth, require JWT

**Impact:**
- No immediate breaking changes
- Prepares for JWT migration
- Maintains backward compatibility

---

### Step 5: Add Audit Logging to Admin Actions

**File:** `server/index.js`  
**Location:** Add to admin endpoints  
**Risk:** LOW - Non-breaking addition

```javascript
// Add import at top
const { auditLog, AUDIT_EVENTS } = require('./middleware/auditLog');

// Store adminDb in app.locals for audit logging
app.locals.adminDb = adminDb;

// Add audit logging to admin endpoints
// Example for product creation:
app.post('/api/products', 
  adminLimiter, 
  requireAdmin, 
  requireFirestore,
  auditLog({
    event: AUDIT_EVENTS.PRODUCT_CREATE,
    resource: 'product',
    getResourceId: (req) => req.body.product?.id,
    getChanges: (req) => ({ after: req.body.product })
  }),
  validate(schemas.ProductBody), 
  async (req, res) => {
    // ... existing code
  }
);
```

**Impact:**
- Tracks all admin actions for compliance
- Enables security incident investigation
- No impact on request performance (async logging)

---

### Step 6: Add Input Sanitization to User Input Endpoints

**File:** `server/index.js`  
**Location:** Add to endpoints that accept user input  
**Risk:** LOW - Prevents XSS, no breaking changes

```javascript
// Add import at top
const { sanitizeProduct, sanitizeOrder, sanitizeReview } = require('./middleware/sanitize');

// Add sanitization to product creation
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
  validate(schemas.ProductBody), 
  async (req, res) => {
    // ... existing code
  }
);

// Add sanitization to review creation
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
```

**Impact:**
- Prevents XSS attacks
- Sanitizes HTML in user-generated content
- No breaking changes (only removes dangerous content)

---

### Step 7: Add Global Error Handler

**File:** `server/index.js`  
**Location:** At the very end, after all routes  
**Risk:** LOW - Improves error handling

```javascript
// Add import at top
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Add at the very end, after all routes
app.use(notFoundHandler);
app.use(errorHandler);
```

**Impact:**
- Standardizes error responses
- Prevents internal error leakage
- Improves debugging with correlation IDs

---

### Step 8: Enhance Rate Limiting (Optional)

**File:** `server/middleware/security.js`  
**Location:** Add new rate limiters  
**Risk:** LOW - Additional protection

```javascript
// Add new rate limiters for unprotected endpoints
const productListLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 100, // 100 requests per minute
  message: { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 50,
  message: { error: 'Quá nhiều tìm kiếm. Vui lòng thử lại sau.' }
});
```

**Impact:**
- Prevents API abuse
- Protects against scraping
- No impact on normal users

---

### Step 9: Update CSP Headers (High Priority)

**File:** `server/index.js`  
**Location:** Update helmet configuration  
**Risk:** MEDIUM - May break inline scripts

**Current Code (lines 115-130):**
```javascript
app.use(helmet({
  contentSecurityPolicy: IS_PRODUCTION ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      // ...
    }
  } : false,
  // ...
}));
```

**New Code:**
```javascript
app.use(helmet({
  contentSecurityPolicy: IS_PRODUCTION ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"], // Remove unsafe-inline and unsafe-eval
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  } : {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Keep in dev
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: IS_PRODUCTION ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false
}));
```

**Impact:**
- Removes unsafe-inline and unsafe-eval in production
- Enables CSP in development for testing
- **REQUIRES FRONTEND CHANGES** - inline scripts must be moved to external files

**Action Required:**
- Test in staging first
- Coordinate with frontend team
- May need to implement nonce-based CSP if inline scripts are required

---

## Testing Checklist

### Unit Tests (TODO)
- [ ] Test auth middleware with JWT tokens
- [ ] Test auth middleware with legacy tokens
- [ ] Test RBAC permission checks
- [ ] Test input sanitization
- [ ] Test audit logging
- [ ] Test error handler

### Integration Tests (TODO)
- [ ] Test admin endpoints with legacy auth
- [ ] Test admin endpoints with JWT auth
- [ ] Test backward compatibility
- [ ] Test audit log creation
- [ ] Test sanitization on real requests
- [ ] Test error responses

### Manual Testing
- [ ] Verify admin login still works
- [ ] Verify product creation works
- [ ] Verify order creation works
- [ ] Verify review creation works
- [ ] Check audit logs are created
- [ ] Check correlation IDs in logs
- [ ] Test error responses
- [ ] Verify no XSS vulnerabilities

---

## Rollback Plan

If issues are discovered after deployment:

1. **Immediate Rollback:**
   ```bash
   git revert <commit-hash>
   npm install
   npm run start
   ```

2. **Partial Rollback:**
   - Comment out specific middleware causing issues
   - Keep other improvements in place

3. **Emergency Fix:**
   - Revert to legacy auth completely
   - Remove new middleware
   - Deploy hotfix

---

## Environment Variables Required

### New Required Variables
```env
JWT_SECRET=<32+ character random string>
JWT_EXPIRES_IN=7d
```

### Existing Variables (Now Validated)
```env
NODE_ENV=production
PORT=3001
CLIENT_URL=https://novashop.vn
ADMIN_EMAILS=admin@novashop.vn
ADMIN_API_TOKEN=<existing token>
```

---

## Migration Timeline

### Week 1 (Current)
- [x] Create all middleware files
- [ ] Integrate middleware into server
- [ ] Test in development
- [ ] Deploy to staging

### Week 2
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Performance testing
- [ ] Security testing
- [ ] Deploy to production

### Week 3
- [ ] Add JWT login endpoint
- [ ] Update frontend to use JWT
- [ ] Gradual migration from legacy auth

### Week 4
- [ ] Deprecate legacy auth
- [ ] Remove ADMIN_API_TOKEN requirement
- [ ] Full JWT migration complete

---

## Success Criteria

- [ ] All middleware integrated without breaking changes
- [ ] Admin authentication still works
- [ ] All existing endpoints functional
- [ ] Audit logs being created
- [ ] Input sanitization working
- [ ] Error handling improved
- [ ] No performance degradation
- [ ] Zero downtime deployment

---

## Notes

- **Backward Compatibility:** All changes maintain backward compatibility
- **Gradual Migration:** JWT auth will be added gradually, not forced immediately
- **Feature Flags:** Consider adding feature flags for new middleware
- **Monitoring:** Monitor error rates and performance after deployment
- **Documentation:** Update API documentation after deployment

---

**Last Updated:** May 17, 2026  
**Next Review:** After Step 4 completion  
**Responsible:** Development Team
