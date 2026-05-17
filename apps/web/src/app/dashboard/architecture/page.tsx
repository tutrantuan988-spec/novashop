"use client";

import { useMemo, useState } from "react";

const STACKS = {
  "React + Express + PostgreSQL": {
    short: "MERN-SQL",
    frontend: "React + Vite + TailwindCSS + React Query + Zustand",
    backend: "Node.js + Express + TypeScript + Zod",
    database: "PostgreSQL + Prisma ORM + Redis cache",
    auth: "JWT access token + HttpOnly refresh token + RBAC",
    deploy: "Vercel frontend + Render/Railway API + Neon/Supabase DB",
    strengths: ["Flexible", "Easy to hire", "Clear FE/BE split", "Production proven"],
    tradeoffs: ["More boilerplate", "Manual FE/BE type sync"],
  },
  "Next.js + tRPC + Prisma": {
    short: "T3 Commerce",
    frontend: "Next.js App Router + TailwindCSS + shadcn/ui + Zustand",
    backend: "Next.js Route Handlers + tRPC + TypeScript",
    database: "PostgreSQL + Prisma ORM + Redis cache",
    auth: "Auth.js / Better Auth + RBAC + multi-session security",
    deploy: "Vercel fullstack + Neon DB + Upstash Redis + Cloudflare R2",
    strengths: ["End-to-end type safety", "Fast DX", "SSR/SEO", "Less API boilerplate"],
    tradeoffs: ["Next.js conventions", "Harder to split backend later"],
  },
  "Production E-commerce SaaS": {
    short: "NovaShop Pro",
    frontend: "Next.js storefront + dashboard + mobile-first UX",
    backend: "Express/NestJS API + Workers + Webhooks + Event bus",
    database: "PostgreSQL + Prisma + Redis + object storage",
    auth: "Multi-tenant RBAC: OWNER, ADMIN, STAFF, CUSTOMER",
    deploy: "CDN/WAF + API cluster + managed DB + queue workers + monitoring",
    strengths: ["Real commerce flows", "Tenant isolation", "Scalable workers", "Audit-ready"],
    tradeoffs: ["More moving parts", "Requires strong architecture discipline"],
  },
};

const SECTIONS = [
  "Overview",
  "System Diagram",
  "File Structure",
  "Database Schema",
  "Commerce Flows",
  "API Design",
  "Security",
  "Deployment",
  "AI Prompt Generator",
];

const CODE = {
  fileStructure: `project-root/
├── apps/
│   ├── web/                         # Customer storefront + admin dashboard
│   │   ├── src/app/
│   │   │   ├── (storefront)/         # home, products, cart, checkout
│   │   │   ├── dashboard/            # admin/staff dashboard
│   │   │   ├── auth/                 # login, register, callbacks
│   │   │   └── api/                  # optional BFF / route handlers
│   │   ├── src/components/           # UI, layout, forms, commerce widgets
│   │   ├── src/features/             # products, cart, checkout, orders
│   │   ├── src/lib/                  # api client, utils, constants
│   │   └── src/stores/               # cart/session/client state
│   │
│   └── api/                         # Backend API
│       ├── src/controllers/          # HTTP controllers
│       ├── src/routes/               # route definitions
│       ├── src/services/             # business logic
│       ├── src/repositories/         # DB access layer
│       ├── src/middleware/           # auth, RBAC, validation, rate limit
│       ├── src/jobs/                 # queue workers
│       ├── src/webhooks/             # Stripe/VNPay/MoMo/webhook dispatcher
│       └── src/index.ts
│
├── packages/
│   ├── db/                          # Prisma client singleton
│   └── shared/                      # shared Zod schemas and types
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── docker-compose.yml               # Postgres + Redis + local services
├── .env.example
└── package.json`,

  dbSchema: `Core production e-commerce schema:

Tenant / user:
- Organization(id, name, slug, customDomain, subscriptionTier, stripeCustomerId)
- User(id, email, passwordHash, name, avatar, emailVerified)
- OrganizationMember(id, organizationId, userId, role)
- Session(id, userId, tokenHash, expiresAt)

Catalog:
- Category(id, organizationId, name, slug, parentId)
- Product(id, organizationId, categoryId, name, slug, description, status)
- ProductVariant(id, productId, sku, price, compareAtPrice, attributes)
- ProductImage(id, productId, url, alt, sortOrder)
- Inventory(id, organizationId, variantId, quantity, reservedQuantity)

Checkout:
- Cart(id, organizationId, userId, guestId, status)
- CartItem(id, cartId, variantId, quantity, priceSnapshot)
- Order(id, organizationId, customerId, status, paymentStatus, totalAmount)
- OrderItem(id, orderId, variantId, quantity, unitPrice, totalPrice)
- Payment(id, organizationId, orderId, provider, providerPaymentId, status, amount)
- Refund(id, paymentId, amount, reason, status)

Growth / ops:
- Coupon(id, organizationId, code, discountType, value, startsAt, endsAt)
- Review(id, organizationId, productId, userId, rating, comment)
- Address(id, userId, type, line1, city, country)
- Webhook(id, organizationId, url, events, secret, isActive)
- WebhookLog(id, webhookId, event, status, payload, response)
- AuditLog(id, organizationId, userId, action, entityType, entityId, metadata)`,

  flows: `Critical commerce flows:

1. Browse catalog
Customer -> Frontend -> GET /products -> API -> DB/cache -> product list

2. Add to cart
Frontend -> POST /cart/items -> validate stock -> save cart item -> return cart summary

3. Checkout
Frontend -> POST /orders -> reserve inventory -> create pending order -> create payment session -> redirect customer

4. Payment webhook
Provider -> POST /webhooks/payment -> verify signature -> idempotency check -> mark payment paid -> mark order paid -> decrement stock -> queue email

5. Fulfillment
Staff -> update order PROCESSING/SHIPPED/DELIVERED -> audit log -> customer notification

6. Refund/cancel
Admin -> refund payment -> mark refund -> restore inventory when needed -> audit log

7. Abandoned cart
Scheduler -> find inactive carts -> queue email/reminder coupon -> track conversion`,

  apiDesign: `API design:

Public storefront:
GET    /api/v1/products
GET    /api/v1/products/:slug
GET    /api/v1/categories
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:id
DELETE /api/v1/cart/items/:id
POST   /api/v1/checkout

Customer account:
GET    /api/v1/me
GET    /api/v1/orders
GET    /api/v1/orders/:id
POST   /api/v1/reviews

Admin dashboard:
POST   /api/v1/admin/products
PATCH  /api/v1/admin/products/:id
POST   /api/v1/admin/products/:id/images
GET    /api/v1/admin/orders
PATCH  /api/v1/admin/orders/:id/status
GET    /api/v1/admin/customers
GET    /api/v1/admin/analytics

Webhooks:
POST   /api/v1/webhooks/stripe
POST   /api/v1/webhooks/vnpay
POST   /api/v1/admin/webhooks
GET    /api/v1/admin/webhooks/:id/logs

Response envelope:
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "limit": 20, "total": 100 }
}`,

  security: `Security checklist:

- Strict tenant isolation: every query must scope by organizationId
- RBAC middleware: OWNER, ADMIN, STAFF, CUSTOMER
- Zod validation on every request body, params, query
- Rate limits: auth strict, checkout strict, public API normal
- Payment webhook signature verification and idempotency keys
- HttpOnly refresh tokens with rotation
- Password hashing with argon2id or bcrypt cost 12
- Helmet security headers and CORS allowlist
- Audit log for product, order, payment, staff, webhook changes
- No secrets in frontend bundle
- File upload validation: MIME, size, extension, malware scanning if possible
- Observability: request id, structured logs, Sentry, health checks`,

  deployment: `Production deployment:

Browser / Mobile
  -> DNS + CDN + WAF
  -> Frontend hosting (Vercel/Netlify/Cloudflare Pages)
  -> API load balancer
  -> API instances
  -> PostgreSQL primary database
  -> Redis cache / rate-limit / queues
  -> Worker processes
  -> Object storage (S3/R2/Cloudinary)
  -> Payment providers (Stripe/VNPay/MoMo)
  -> Email provider (Resend/SendGrid)
  -> Monitoring (Sentry + logs + metrics)

Recommended environments:
- local: docker-compose Postgres + Redis
- staging: production-like with test payment keys
- production: managed DB, backups, alerts, WAF, separate secrets`,
};

function generatePrompt(stackName: keyof typeof STACKS, appType: string) {
  const stack = STACKS[stackName];

  return `You are an expert senior fullstack architect. Generate a complete production-grade e-commerce application.

TECH STACK
Frontend: ${stack.frontend}
Backend: ${stack.backend}
Database: ${stack.database}
Auth: ${stack.auth}
Deploy: ${stack.deploy}

APPLICATION TYPE
${appType}

CORE REQUIREMENTS
1. Storefront: homepage, catalog, product detail, search, filters, cart, checkout.
2. Customer account: profile, addresses, order history, reviews.
3. Admin dashboard: products, categories, inventory, orders, customers, analytics, settings.
4. Payment integration: Stripe/VNPay/MoMo-ready abstraction, secure webhooks, idempotency.
5. Inventory: reserve stock during checkout, decrement after payment, restore on cancel/refund.
6. Multi-tenant support: organization/store isolation by organizationId.
7. RBAC: OWNER, ADMIN, STAFF, CUSTOMER.
8. Webhooks: outbound webhook subscriptions, signed delivery, retry, logs.
9. Notifications: transactional emails for order placed, paid, shipped, cancelled, abandoned cart.
10. Observability: structured logs, request IDs, Sentry, health checks, audit logs.

DATABASE REQUIREMENTS
${CODE.dbSchema}

COMMERCE FLOWS
${CODE.flows}

API REQUIREMENTS
${CODE.apiDesign}

SECURITY REQUIREMENTS
${CODE.security}

CODE STANDARDS
- TypeScript strict mode.
- Zod validation for all inputs.
- Repository/service/controller separation.
- No business logic inside route files.
- Consistent response envelope.
- Prisma migrations and seed script.
- Tests for auth, cart, checkout, payment webhook, inventory, order lifecycle.
- .env.example with all required variables.
- Docker Compose for Postgres and Redis.

OUTPUT ORDER
1. Directory tree.
2. package.json scripts and dependencies.
3. Env template.
4. Database schema.
5. Backend routes, middleware, controllers, services, repositories.
6. Payment webhook implementation.
7. Frontend pages and components.
8. Admin dashboard.
9. Tests.
10. Deployment guide.

Generate complete working code. Do not use TODO placeholders.`;
}

export default function EcommerceArchitecturePage() {
  const [activeSection, setActiveSection] = useState("Overview");
  const [selectedStack, setSelectedStack] = useState<keyof typeof STACKS>("Production E-commerce SaaS");
  const [appType, setAppType] = useState("Multi-tenant pet food e-commerce platform with subscription billing");
  const [copied, setCopied] = useState(false);

  const stack = STACKS[selectedStack];
  const prompt = useMemo(() => generatePrompt(selectedStack, appType), [selectedStack, appType]);

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white p-4">
        <h1 className="mb-4 text-sm font-bold uppercase tracking-wide text-orange-600">Architecture Lab</h1>
        <nav className="space-y-1">
          {SECTIONS.map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                activeSection === section ? "bg-orange-50 font-semibold text-orange-700" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {section}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold text-orange-600">Production fullstack e-commerce blueprint</p>
          <h2 className="mt-2 text-3xl font-bold">System Architecture + AI Prompt Generator</h2>
          <p className="mt-3 max-w-3xl text-gray-600">
            Kết hợp prompt builder tương tác với kiến trúc website bán hàng thực tế: storefront, admin, payment,
            inventory, webhook, tenant isolation, workers, monitoring và deployment.
          </p>
        </div>

        {activeSection === "Overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(STACKS).map(([name, item]) => (
                <button
                  key={name}
                  onClick={() => setSelectedStack(name as keyof typeof STACKS)}
                  className={`rounded-xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md ${
                    selectedStack === name ? "border-orange-500 ring-2 ring-orange-100" : "border-gray-200"
                  }`}
                >
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">{item.short}</span>
                  <h3 className="mt-3 font-semibold">{name}</h3>
                  <p className="mt-2 text-sm text-gray-600">{item.frontend}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.strengths.map((strength) => (
                      <span key={strength} className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700">
                        {strength}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold">Selected stack: {selectedStack}</h3>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <p><span className="font-medium text-gray-500">Frontend:</span> {stack.frontend}</p>
                <p><span className="font-medium text-gray-500">Backend:</span> {stack.backend}</p>
                <p><span className="font-medium text-gray-500">Database:</span> {stack.database}</p>
                <p><span className="font-medium text-gray-500">Auth:</span> {stack.auth}</p>
                <p className="md:col-span-2"><span className="font-medium text-gray-500">Deploy:</span> {stack.deploy}</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === "System Diagram" && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <pre className="overflow-auto whitespace-pre-wrap text-sm leading-7 text-gray-800">{`Customer / Admin
  ↓
CDN + WAF + Frontend Web App
  ↓
API Gateway / Backend API
  ├─ Auth + RBAC + Tenant Isolation
  ├─ Product Catalog Service
  ├─ Cart + Checkout Service
  ├─ Order + Payment Service
  ├─ Inventory Service
  ├─ Webhook Service
  ├─ Email / Notification Service
  └─ Analytics / Audit Service
      ↓
PostgreSQL + Prisma
Redis Cache / Rate Limit / Queue
Object Storage + CDN
Payment Gateway
Workers + Schedulers
Logging + Sentry + Metrics`}</pre>
          </div>
        )}

        {["File Structure", "Database Schema", "Commerce Flows", "API Design", "Security", "Deployment"].includes(activeSection) && (
          <pre className="overflow-auto rounded-xl border border-gray-200 bg-white p-6 text-sm leading-7 text-gray-800 shadow-sm whitespace-pre-wrap">
            {activeSection === "File Structure" && CODE.fileStructure}
            {activeSection === "Database Schema" && CODE.dbSchema}
            {activeSection === "Commerce Flows" && CODE.flows}
            {activeSection === "API Design" && CODE.apiDesign}
            {activeSection === "Security" && CODE.security}
            {activeSection === "Deployment" && CODE.deployment}
          </pre>
        )}

        {activeSection === "AI Prompt Generator" && (
          <div className="space-y-4">
            <div className="grid gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-2">
              <label className="text-sm font-medium">
                Tech stack
                <select
                  value={selectedStack}
                  onChange={(event) => setSelectedStack(event.target.value as keyof typeof STACKS)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  {Object.keys(STACKS).map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                App type
                <input
                  value={appType}
                  onChange={(event) => setAppType(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
            </div>

            <button
              onClick={copyPrompt}
              className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700"
            >
              {copied ? "Copied" : "Copy production prompt"}
            </button>

            <pre className="max-h-[620px] overflow-auto rounded-xl border border-gray-200 bg-gray-950 p-6 text-sm leading-7 text-gray-100 shadow-sm whitespace-pre-wrap">
              {prompt}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
