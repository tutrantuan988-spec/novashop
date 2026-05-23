# NovaShop - Professional Development Roadmap
## Architecture Review & Strategic Improvements

**Document Version:** 1.0  
**Last Updated:** May 17, 2026  
**Project:** TRỌNG ĐỊNH STORE (NovaShop) - Pet Food E-commerce Platform

---

## Executive Summary

NovaShop is a feature-rich e-commerce platform for pet food and accessories with a modern tech stack. This roadmap identifies critical architectural improvements, technical debt, and strategic priorities to transform the platform into a production-ready, scalable system.

### Current State Assessment

**Strengths:**
- Modern React 19 + Vite frontend with code splitting
- Comprehensive feature set (cart, checkout, admin, payments)
- Multiple payment gateway integrations (Stripe, MoMo, VNPay)
- AI/RAG chatbot integration (OpenAI + Pinecone)
- Multi-database support (Firestore, MongoDB, PostgreSQL)
- Docker containerization ready

**Critical Issues:**
- **Database Architecture Chaos**: Three different databases (Firestore, MongoDB, PostgreSQL) with inconsistent usage
- **Authentication Complexity**: Dual auth system (Clerk + localStorage) creates maintenance burden
- **Missing Core Features**: No proper inventory management, order fulfillment workflow, or analytics
- **Performance Concerns**: No caching layer, inefficient database queries
- **Security Gaps**: Weak admin authentication, no rate limiting on critical endpoints
- **Technical Debt**: Inconsistent error handling, missing tests, no CI/CD pipeline

---

## 1. CRITICAL PRIORITIES (Q2 2026)

### 1.1 Database Architecture Consolidation ⚠️ URGENT

**Problem:** Currently using 3 databases simultaneously (Firestore, MongoDB, PostgreSQL) causing:
- Data inconsistency
- Complex maintenance
- Performance overhead
- Increased infrastructure costs

**Solution:** Migrate to single source of truth

**Recommended Approach:**
```
PostgreSQL (Primary) + Redis (Cache)
├── Prisma ORM for type-safe queries
├── Redis for session/cart caching
└── Remove Firestore & MongoDB dependencies
```

**Migration Plan:**
1. **Phase 1 (Week 1-2):** Audit data usage patterns
   - Map all Firestore collections to Prisma models
   - Identify MongoDB-specific features
   - Document data relationships

2. **Phase 2 (Week 3-4):** Implement PostgreSQL schema
   - Extend existing Prisma schema (already defined)
   - Add missing indexes and constraints
   - Create migration scripts

3. **Phase 3 (Week 5-6):** Data migration
   - Write migration scripts (Firestore → PostgreSQL)
   - Migrate MongoDB data to PostgreSQL
   - Validate data integrity

4. **Phase 4 (Week 7-8):** Code refactoring
   - Replace Firestore SDK calls with Prisma
   - Remove Mongoose models
   - Update API endpoints
   - Add comprehensive tests

**Impact:**
- ✅ Reduced infrastructure costs (1 database vs 3)
- ✅ Improved data consistency
- ✅ Better query performance with proper indexing
- ✅ Simplified codebase maintenance

**Estimated Effort:** 8 weeks, 2 developers

---

### 1.2 Authentication & Authorization Overhaul

**Problem:** 
- Dual auth system (Clerk + localStorage) is confusing
- Weak admin authentication (email-based check only)
- No proper RBAC (Role-Based Access Control)
- JWT tokens not properly validated

**Solution:** Unified authentication with proper RBAC

**Implementation:**
```typescript
// Recommended Stack
- Clerk (Production) for user authentication
- JWT + Redis for session management
- Prisma-based RBAC with permissions table
- Remove localStorage auth fallback
```

**Action Items:**
1. **Implement proper RBAC:**
   ```sql
   -- Add to Prisma schema
   model Permission {
     id     String @id @default(cuid())
     name   String @unique
     description String?
   }
   
   model RolePermission {
     roleId       String
     permissionId String
     role         OrganizationMember @relation(...)
     permission   Permission @relation(...)
     @@id([roleId, permissionId])
   }
   ```

2. **Secure admin endpoints:**
   - Replace `requireAdmin` middleware with permission-based checks
   - Add audit logging for admin actions
   - Implement 2FA for admin accounts

3. **Remove localStorage auth:**
   - Force Clerk authentication in production
   - Remove `LocalAuthProvider` component
   - Update documentation

**Impact:**
- ✅ Enterprise-grade security
- ✅ Granular permission control
- ✅ Audit trail for compliance
- ✅ Reduced attack surface

**Estimated Effort:** 3 weeks, 1 developer

---

### 1.3 Inventory Management System

**Problem:** 
- No real-time inventory tracking
- Race conditions in stock updates
- No inventory reservation during checkout
- Manual stock adjustments only

**Solution:** Implement atomic inventory management

**Features:**
1. **Real-time Stock Tracking:**
   ```typescript
   // Atomic stock operations
   - Reserve stock on checkout initiation
   - Release stock on payment failure/timeout
   - Commit stock on payment success
   - Track inventory transactions
   ```

2. **Low Stock Alerts:**
   - Email notifications when stock < threshold
   - Admin dashboard alerts
   - Automatic "Out of Stock" badge

3. **Inventory Audit Trail:**
   ```sql
   model InventoryTransaction {
     id          String @id @default(cuid())
     productId   String
     variantId   String?
     quantity    Int
     type        String // sale, return, adjustment, restock
     orderId     String?
     userId      String?
     note        String?
     createdAt   DateTime @default(now())
   }
   ```

**Implementation:**
- Use PostgreSQL row-level locking for atomic updates
- Implement background job for expired reservations
- Add inventory dashboard in admin panel

**Impact:**
- ✅ Prevent overselling
- ✅ Accurate stock levels
- ✅ Better demand forecasting
- ✅ Reduced customer complaints

**Estimated Effort:** 4 weeks, 1 developer

---

## 2. HIGH PRIORITY (Q3 2026)

### 2.1 Performance Optimization

**Current Issues:**
- No caching layer
- N+1 query problems
- Large bundle sizes
- Slow admin dashboard

**Solutions:**

#### 2.1.1 Implement Redis Caching
```typescript
// Cache Strategy
- Product catalog: 1 hour TTL
- User sessions: 7 days TTL
- Cart data: 24 hours TTL
- Search results: 30 minutes TTL
```

**Implementation:**
```javascript
// server/services/cache.js
const redis = require('ioredis');
const client = new redis(process.env.REDIS_URL);

async function getCached(key, fetchFn, ttl = 3600) {
  const cached = await client.get(key);
  if (cached) return JSON.parse(cached);
  
  const fresh = await fetchFn();
  await client.setex(key, ttl, JSON.stringify(fresh));
  return fresh;
}
```

#### 2.1.2 Database Query Optimization
- Add missing indexes (see section 3.2)
- Implement query result pagination
- Use `select` to fetch only needed fields
- Add database query monitoring (pg_stat_statements)

#### 2.1.3 Frontend Optimization
```javascript
// Current bundle size: ~2.5MB
// Target: <500KB initial bundle

Actions:
1. Lazy load all routes (already done ✓)
2. Code split vendor libraries
3. Optimize images (WebP, lazy loading)
4. Remove unused dependencies:
   - @google/generative-ai (if not used)
   - Multiple AI SDKs (consolidate)
5. Implement service worker for offline support
```

**Impact:**
- ✅ 50% faster page loads
- ✅ Reduced server costs
- ✅ Better user experience
- ✅ Improved SEO rankings

**Estimated Effort:** 3 weeks, 1 developer

---

### 2.2 Order Fulfillment Workflow

**Problem:** 
- Manual order processing
- No shipping integration
- No order tracking for customers
- No automated notifications

**Solution:** Automated order fulfillment pipeline

**Workflow:**
```
Order Created → Payment Confirmed → Inventory Reserved
     ↓
Auto-assign to warehouse → Print packing slip
     ↓
Generate shipping label (GHN API) → Update tracking
     ↓
Ship order → Send tracking email
     ↓
Delivery confirmed → Release payment
```

**Features:**
1. **Shipping Integration:**
   - GHN (Giao Hàng Nhanh) API integration (already configured)
   - Automatic shipping fee calculation
   - Real-time tracking updates
   - Webhook for delivery status

2. **Order Status Automation:**
   ```typescript
   enum OrderStatus {
     PENDING = 'pending',
     PAID = 'paid',
     PROCESSING = 'processing',
     PACKED = 'packed',
     SHIPPED = 'shipped',
     DELIVERED = 'delivered',
     CANCELLED = 'cancelled',
     REFUNDED = 'refunded'
   }
   ```

3. **Customer Notifications:**
   - Order confirmation email (✓ already implemented)
   - Payment received email (✓ already implemented)
   - Shipping notification (NEW)
   - Delivery confirmation (NEW)
   - SMS notifications for critical updates

**Implementation:**
```javascript
// server/jobs/orderFulfillment.js
const cron = require('node-cron');

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  // Auto-process paid orders
  const paidOrders = await prisma.order.findMany({
    where: { status: 'paid', paymentStatus: 'paid' }
  });
  
  for (const order of paidOrders) {
    await processOrder(order);
  }
});
```

**Impact:**
- ✅ 80% reduction in manual work
- ✅ Faster order processing
- ✅ Better customer satisfaction
- ✅ Scalable operations

**Estimated Effort:** 5 weeks, 2 developers

---

### 2.3 Analytics & Reporting Dashboard

**Problem:** 
- No business intelligence
- Manual sales reporting
- No customer insights
- No inventory forecasting

**Solution:** Comprehensive analytics dashboard

**Metrics to Track:**
1. **Sales Analytics:**
   - Daily/weekly/monthly revenue
   - Average order value (AOV)
   - Conversion rate
   - Top-selling products
   - Revenue by category

2. **Customer Analytics:**
   - New vs returning customers
   - Customer lifetime value (CLV)
   - Churn rate
   - Geographic distribution

3. **Inventory Analytics:**
   - Stock turnover rate
   - Days of inventory remaining
   - Slow-moving products
   - Reorder recommendations

4. **Marketing Analytics:**
   - Traffic sources
   - Campaign performance
   - Coupon usage
   - Cart abandonment rate

**Implementation:**
```typescript
// Use existing AnalyticsCharts component
// Add backend aggregation queries

// server/controllers/analyticsController.js
export async function getSalesMetrics(req, res) {
  const { startDate, endDate } = req.query;
  
  const metrics = await prisma.$queryRaw`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as order_count,
      SUM(total) as revenue,
      AVG(total) as avg_order_value
    FROM orders
    WHERE created_at BETWEEN ${startDate} AND ${endDate}
      AND payment_status = 'paid'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;
  
  res.json(metrics);
}
```

**Visualization:**
- Use existing Recharts library
- Add export to CSV/Excel
- Scheduled email reports

**Impact:**
- ✅ Data-driven decisions
- ✅ Identify growth opportunities
- ✅ Optimize inventory
- ✅ Improve marketing ROI

**Estimated Effort:** 4 weeks, 1 developer

---

## 3. MEDIUM PRIORITY (Q4 2026)

### 3.1 Multi-tenant Architecture (SaaS Transformation)

**Vision:** Transform NovaShop into a SaaS platform for multiple pet stores

**Current State:** Single-tenant (one store)

**Target State:** Multi-tenant SaaS platform

**Architecture:**
```
Organization (Tenant)
├── Custom domain (e.g., store1.novashop.vn)
├── Branding (logo, colors, theme)
├── Products & inventory
├── Orders & customers
├── Subscription tier (FREE, STARTER, PRO, ENTERPRISE)
└── Settings & integrations
```

**Prisma Schema (Already Defined):**
- ✅ Organization model exists
- ✅ OrganizationMember for RBAC
- ✅ Tenant isolation in all models
- ✅ Subscription management

**Implementation Steps:**
1. **Tenant Isolation:**
   - Add `organizationId` to all queries
   - Implement tenant middleware
   - Row-level security in PostgreSQL

2. **Subdomain Routing:**
   ```javascript
   // Detect tenant from subdomain
   app.use((req, res, next) => {
     const subdomain = req.hostname.split('.')[0];
     req.tenant = await getTenantBySlug(subdomain);
     next();
   });
   ```

3. **Subscription Billing:**
   - Stripe subscription integration
   - Usage-based pricing (orders, products)
   - Feature gating by tier

4. **Tenant Onboarding:**
   - Self-service signup
   - Guided setup wizard
   - Sample data seeding

**Pricing Tiers:**
```
FREE: 10 products, 50 orders/month
STARTER: 100 products, 500 orders/month - $29/month
PROFESSIONAL: 1000 products, unlimited orders - $99/month
ENTERPRISE: Unlimited, custom features - Custom pricing
```

**Impact:**
- ✅ Recurring revenue model
- ✅ Scalable business
- ✅ Market expansion
- ✅ Competitive advantage

**Estimated Effort:** 12 weeks, 3 developers

---

### 3.2 Database Optimization & Indexing

**Missing Indexes (PostgreSQL):**
```sql
-- Product search optimization
CREATE INDEX idx_product_search ON products USING GIN (
  to_tsvector('english', name || ' ' || description)
);

-- Order queries
CREATE INDEX idx_order_user_status ON orders (user_id, status, created_at DESC);
CREATE INDEX idx_order_payment_status ON orders (payment_status, created_at DESC);

-- Audit logs
CREATE INDEX idx_audit_org_date ON audit_logs (organization_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id);

-- Sessions
CREATE INDEX idx_session_expiry ON sessions (expires_at) WHERE expires_at > NOW();
```

**Query Optimization:**
```typescript
// Before: N+1 query problem
const orders = await prisma.order.findMany();
for (const order of orders) {
  order.items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
}

// After: Single query with join
const orders = await prisma.order.findMany({
  include: {
    items: {
      include: { product: true }
    },
    user: { select: { name: true, email: true } }
  }
});
```

**Database Monitoring:**
- Enable pg_stat_statements
- Set up slow query logging (>100ms)
- Monitor connection pool usage
- Add query performance dashboard

**Impact:**
- ✅ 10x faster queries
- ✅ Reduced database load
- ✅ Better scalability
- ✅ Lower infrastructure costs

**Estimated Effort:** 2 weeks, 1 developer

---

### 3.3 Testing Infrastructure

**Current State:** No tests ❌

**Target Coverage:** 80% code coverage

**Testing Strategy:**
```
Unit Tests (Jest)
├── Utils & helpers
├── Business logic
└── API services

Integration Tests (Supertest)
├── API endpoints
├── Database operations
└── Payment flows

E2E Tests (Playwright) ✓ Already configured
├── User flows
├── Checkout process
└── Admin operations
```

**Implementation:**
```javascript
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:integration": "jest --testMatch='**/*.integration.test.js'"
  }
}
```

**Priority Test Cases:**
1. **Critical Paths:**
   - User registration & login
   - Add to cart & checkout
   - Payment processing
   - Order creation
   - Inventory updates

2. **Edge Cases:**
   - Concurrent stock updates
   - Payment webhook failures
   - Session expiration
   - Invalid input handling

3. **Security Tests:**
   - SQL injection prevention
   - XSS protection
   - CSRF token validation
   - Rate limiting

**Impact:**
- ✅ Prevent regressions
- ✅ Faster development
- ✅ Better code quality
- ✅ Confident deployments

**Estimated Effort:** 6 weeks, 2 developers

---

## 4. LOW PRIORITY (2027)

### 4.1 Advanced Features

1. **Product Recommendations:**
   - AI-powered recommendations
   - "Customers also bought"
   - Personalized homepage

2. **Loyalty Program:**
   - Points system
   - Referral rewards
   - VIP tiers

3. **Mobile App:**
   - React Native app
   - Push notifications
   - Offline mode

4. **Advanced Search:**
   - Algolia integration (already configured)
   - Faceted search
   - Voice search

5. **Internationalization:**
   - Multi-language support (i18n already configured)
   - Multi-currency
   - Regional pricing

---

## 5. TECHNICAL DEBT CLEANUP

### 5.1 Code Quality Issues

**Problems:**
- Inconsistent error handling
- Mixed coding styles
- Unused dependencies
- Large component files

**Solutions:**
```javascript
// 1. Standardize error handling
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

// 2. Add ESLint + Prettier
// .eslintrc.js
module.exports = {
  extends: ['airbnb', 'prettier'],
  rules: {
    'react/prop-types': 'off', // Using TypeScript
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  }
};

// 3. Remove unused dependencies
npm uninstall @google/generative-ai next esbuild xlsx
// (if not actively used)

// 4. Split large components
// Before: HomePage.jsx (500+ lines)
// After:
//   HomePage.jsx (100 lines)
//   ├── HeroSection.jsx
//   ├── FeaturedProducts.jsx
//   ├── CategoryGrid.jsx
//   └── FlashSaleSection.jsx
```

**Estimated Effort:** 3 weeks, 1 developer

---

### 5.2 Security Hardening

**Critical Vulnerabilities:**

1. **SQL Injection:**
   - ✅ Using Prisma (safe by default)
   - ⚠️ Raw queries need parameterization

2. **XSS Protection:**
   ```javascript
   // Add helmet CSP
   app.use(helmet({
     contentSecurityPolicy: {
       directives: {
         defaultSrc: ["'self'"],
         scriptSrc: ["'self'", "'unsafe-inline'"], // Remove unsafe-inline
         styleSrc: ["'self'", "'unsafe-inline'"],
         imgSrc: ["'self'", "data:", "https:"],
       }
     }
   }));
   ```

3. **Rate Limiting:**
   ```javascript
   // Add stricter limits
   const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 5, // 5 attempts per 15 minutes
     message: 'Too many login attempts'
   });
   
   app.use('/api/auth', authLimiter);
   ```

4. **Secrets Management:**
   - Move secrets to environment variables ✓
   - Use AWS Secrets Manager / HashiCorp Vault
   - Rotate API keys regularly

5. **HTTPS Enforcement:**
   ```javascript
   // Force HTTPS in production
   if (process.env.NODE_ENV === 'production') {
     app.use((req, res, next) => {
       if (req.header('x-forwarded-proto') !== 'https') {
         return res.redirect(`https://${req.header('host')}${req.url}`);
       }
       next();
     });
   }
   ```

**Security Audit Checklist:**
- [ ] Dependency vulnerability scan (npm audit)
- [ ] OWASP Top 10 compliance
- [ ] Penetration testing
- [ ] Security headers (helmet)
- [ ] Input validation (zod schemas)
- [ ] Output encoding
- [ ] Session security
- [ ] File upload restrictions

**Estimated Effort:** 2 weeks, 1 developer

---

## 6. INFRASTRUCTURE & DEVOPS

### 6.1 CI/CD Pipeline

**Current State:** Manual deployments

**Target State:** Automated CI/CD

**Pipeline:**
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - run: docker build -t novashop:${{ github.sha }} .

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: kubectl apply -f k8s/
      - run: kubectl set image deployment/novashop novashop=novashop:${{ github.sha }}
```

**Deployment Strategy:**
- Blue-green deployment
- Automatic rollback on failure
- Canary releases for major changes

**Estimated Effort:** 2 weeks, 1 developer

---

### 6.2 Monitoring & Observability

**Tools:**
1. **Application Monitoring:**
   - Sentry (already configured ✓)
   - Error tracking
   - Performance monitoring

2. **Infrastructure Monitoring:**
   - Prometheus + Grafana
   - Server metrics (CPU, memory, disk)
   - Database metrics

3. **Logging:**
   - Winston (already configured ✓)
   - Centralized logging (ELK stack)
   - Log aggregation

4. **Uptime Monitoring:**
   - UptimeRobot / Pingdom
   - Health check endpoints
   - Alerting (PagerDuty / Slack)

**Dashboards:**
```
Production Dashboard
├── Request rate & latency
├── Error rate
├── Database connections
├── Cache hit rate
├── Order processing time
└── Payment success rate
```

**Estimated Effort:** 3 weeks, 1 developer

---

## 7. IMPLEMENTATION TIMELINE

### Q2 2026 (Critical Phase)
**Weeks 1-8:** Database consolidation
**Weeks 9-11:** Authentication overhaul
**Weeks 12-15:** Inventory management

### Q3 2026 (High Priority Phase)
**Weeks 1-3:** Performance optimization
**Weeks 4-8:** Order fulfillment workflow
**Weeks 9-12:** Analytics dashboard

### Q4 2026 (Medium Priority Phase)
**Weeks 1-12:** Multi-tenant architecture
**Weeks 13-14:** Database optimization
**Weeks 15-20:** Testing infrastructure

### 2027 (Enhancement Phase)
- Advanced features
- Mobile app
- International expansion

---

## 8. RESOURCE REQUIREMENTS

### Team Structure
```
Phase 1 (Q2 2026): 3 developers
├── 1 Senior Backend Engineer (database migration)
├── 1 Full-stack Engineer (auth & inventory)
└── 1 DevOps Engineer (infrastructure)

Phase 2 (Q3 2026): 3 developers
├── 2 Full-stack Engineers (features)
└── 1 QA Engineer (testing)

Phase 3 (Q4 2026): 4 developers
├── 2 Senior Full-stack Engineers (multi-tenant)
├── 1 Frontend Engineer (UI/UX)
└── 1 QA Engineer (testing)
```

### Budget Estimate
```
Development: $150,000 - $200,000
Infrastructure: $2,000/month
Third-party services: $500/month
Total Year 1: ~$180,000
```

---

## 9. RISK ASSESSMENT

### High Risk
1. **Database Migration Failure**
   - Mitigation: Comprehensive testing, rollback plan, gradual migration
   
2. **Data Loss During Migration**
   - Mitigation: Multiple backups, dry-run migrations, validation scripts

3. **Performance Degradation**
   - Mitigation: Load testing, gradual rollout, monitoring

### Medium Risk
1. **Third-party API Changes**
   - Mitigation: Version pinning, fallback mechanisms

2. **Team Capacity**
   - Mitigation: Phased approach, external contractors

### Low Risk
1. **User Adoption**
   - Mitigation: User training, documentation, support

---

## 10. SUCCESS METRICS

### Technical KPIs
- [ ] Page load time < 2 seconds
- [ ] API response time < 200ms (p95)
- [ ] 99.9% uptime
- [ ] 80% code coverage
- [ ] Zero critical security vulnerabilities

### Business KPIs
- [ ] 50% reduction in manual order processing
- [ ] 30% increase in conversion rate
- [ ] 20% reduction in cart abandonment
- [ ] 10x increase in concurrent users supported
- [ ] 90% customer satisfaction score

---

## 11. CONCLUSION

NovaShop has a solid foundation but requires significant architectural improvements to become production-ready and scalable. The roadmap prioritizes:

1. **Database consolidation** (most critical)
2. **Security & authentication** (essential)
3. **Core e-commerce features** (inventory, fulfillment)
4. **Performance & scalability** (growth enabler)
5. **SaaS transformation** (business model evolution)

**Recommended Immediate Actions:**
1. Start database consolidation planning (Week 1)
2. Implement proper authentication (Week 9)
3. Set up monitoring & alerting (Week 1)
4. Create comprehensive test suite (ongoing)
5. Document all APIs and processes (ongoing)

**Expected Outcomes:**
- Production-ready platform by Q3 2026
- 10x scalability improvement
- 50% reduction in operational costs
- Foundation for SaaS transformation
- Enterprise-grade security & reliability

---

## Appendix A: Technology Stack Recommendations

### Current Stack (Keep)
- ✅ React 19 + Vite
- ✅ Express.js
- ✅ PostgreSQL + Prisma
- ✅ Clerk authentication
- ✅ Stripe payments
- ✅ Docker

### Add
- Redis (caching & sessions)
- TypeScript (type safety)
- Jest + Playwright (testing)
- Prometheus + Grafana (monitoring)
- GitHub Actions (CI/CD)

### Remove
- Firebase Firestore (migrate to PostgreSQL)
- MongoDB (migrate to PostgreSQL)
- localStorage auth (use Clerk only)
- Unused AI SDKs (consolidate)

---

## Appendix B: Database Schema Improvements

```sql
-- Add missing constraints
ALTER TABLE products ADD CONSTRAINT check_price_positive CHECK (price >= 0);
ALTER TABLE products ADD CONSTRAINT check_stock_non_negative CHECK (stock >= 0);

-- Add soft delete
ALTER TABLE products ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN deleted_at TIMESTAMP;

-- Add audit columns
ALTER TABLE products ADD COLUMN created_by VARCHAR(255);
ALTER TABLE products ADD COLUMN updated_by VARCHAR(255);

-- Add full-text search
CREATE INDEX idx_product_fulltext ON products 
  USING GIN (to_tsvector('english', name || ' ' || description));

-- Add partitioning for orders (by month)
CREATE TABLE orders_2026_05 PARTITION OF orders
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
```

---

## Appendix C: API Documentation Standards

All APIs should follow OpenAPI 3.0 specification:

```yaml
openapi: 3.0.0
info:
  title: NovaShop API
  version: 1.0.0
paths:
  /api/products:
    get:
      summary: List products
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Product'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
```

---

**Document Prepared By:** Kiro AI Development Assistant  
**Review Status:** Draft for stakeholder review  
**Next Review Date:** June 1, 2026
