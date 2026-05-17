(()=>{var a={};a.id=61,a.ids=[61],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},1025:a=>{"use strict";a.exports=require("next/dist/server/app-render/dynamic-access-async-storage.external.js")},1135:()=>{},1472:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>h,metadata:()=>g});var d=c(5338),e=c(8039),f=c.n(e);c(1135);let g={title:"NovaShop SaaS",description:"Multi-tenant e-commerce platform"};function h({children:a}){return(0,d.jsx)("html",{lang:"en",children:(0,d.jsx)("body",{className:f().className,children:a})})}},2043:(a,b,c)=>{Promise.resolve().then(c.bind(c,2430))},2430:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>i});var d=c(1124),e=c(8301);let f={"React + Express + PostgreSQL":{short:"MERN-SQL",frontend:"React + Vite + TailwindCSS + React Query + Zustand",backend:"Node.js + Express + TypeScript + Zod",database:"PostgreSQL + Prisma ORM + Redis cache",auth:"JWT access token + HttpOnly refresh token + RBAC",deploy:"Vercel frontend + Render/Railway API + Neon/Supabase DB",strengths:["Flexible","Easy to hire","Clear FE/BE split","Production proven"],tradeoffs:["More boilerplate","Manual FE/BE type sync"]},"Next.js + tRPC + Prisma":{short:"T3 Commerce",frontend:"Next.js App Router + TailwindCSS + shadcn/ui + Zustand",backend:"Next.js Route Handlers + tRPC + TypeScript",database:"PostgreSQL + Prisma ORM + Redis cache",auth:"Auth.js / Better Auth + RBAC + multi-session security",deploy:"Vercel fullstack + Neon DB + Upstash Redis + Cloudflare R2",strengths:["End-to-end type safety","Fast DX","SSR/SEO","Less API boilerplate"],tradeoffs:["Next.js conventions","Harder to split backend later"]},"Production E-commerce SaaS":{short:"NovaShop Pro",frontend:"Next.js storefront + dashboard + mobile-first UX",backend:"Express/NestJS API + Workers + Webhooks + Event bus",database:"PostgreSQL + Prisma + Redis + object storage",auth:"Multi-tenant RBAC: OWNER, ADMIN, STAFF, CUSTOMER",deploy:"CDN/WAF + API cluster + managed DB + queue workers + monitoring",strengths:["Real commerce flows","Tenant isolation","Scalable workers","Audit-ready"],tradeoffs:["More moving parts","Requires strong architecture discipline"]}},g=["Overview","System Diagram","File Structure","Database Schema","Commerce Flows","API Design","Security","Deployment","AI Prompt Generator"],h={fileStructure:`project-root/
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
└── package.json`,dbSchema:`Core production e-commerce schema:

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
- AuditLog(id, organizationId, userId, action, entityType, entityId, metadata)`,flows:`Critical commerce flows:

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
Scheduler -> find inactive carts -> queue email/reminder coupon -> track conversion`,apiDesign:`API design:

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
}`,security:`Security checklist:

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
- Observability: request id, structured logs, Sentry, health checks`,deployment:`Production deployment:

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
- production: managed DB, backups, alerts, WAF, separate secrets`};function i(){let[a,b]=(0,e.useState)("Overview"),[c,i]=(0,e.useState)("Production E-commerce SaaS"),[j,k]=(0,e.useState)("Multi-tenant pet food e-commerce platform with subscription billing"),[l,m]=(0,e.useState)(!1),n=f[c],o=(0,e.useMemo)(()=>(function(a,b){let c=f[a];return`You are an expert senior fullstack architect. Generate a complete production-grade e-commerce application.

TECH STACK
Frontend: ${c.frontend}
Backend: ${c.backend}
Database: ${c.database}
Auth: ${c.auth}
Deploy: ${c.deploy}

APPLICATION TYPE
${b}

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
${h.dbSchema}

COMMERCE FLOWS
${h.flows}

API REQUIREMENTS
${h.apiDesign}

SECURITY REQUIREMENTS
${h.security}

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

Generate complete working code. Do not use TODO placeholders.`})(c,j),[c,j]),p=async()=>{await navigator.clipboard.writeText(o),m(!0),setTimeout(()=>m(!1),2e3)};return(0,d.jsxs)("div",{className:"flex min-h-screen bg-gray-50 text-gray-900",children:[(0,d.jsxs)("aside",{className:"w-56 shrink-0 border-r border-gray-200 bg-white p-4",children:[(0,d.jsx)("h1",{className:"mb-4 text-sm font-bold uppercase tracking-wide text-orange-600",children:"Architecture Lab"}),(0,d.jsx)("nav",{className:"space-y-1",children:g.map(c=>(0,d.jsx)("button",{onClick:()=>b(c),className:`block w-full rounded-lg px-3 py-2 text-left text-sm ${a===c?"bg-orange-50 font-semibold text-orange-700":"text-gray-600 hover:bg-gray-100"}`,children:c},c))})]}),(0,d.jsxs)("main",{className:"flex-1 overflow-auto p-8",children:[(0,d.jsxs)("div",{className:"mb-8",children:[(0,d.jsx)("p",{className:"text-sm font-semibold text-orange-600",children:"Production fullstack e-commerce blueprint"}),(0,d.jsx)("h2",{className:"mt-2 text-3xl font-bold",children:"System Architecture + AI Prompt Generator"}),(0,d.jsx)("p",{className:"mt-3 max-w-3xl text-gray-600",children:"Kết hợp prompt builder tương t\xe1c với kiến tr\xfac website b\xe1n h\xe0ng thực tế: storefront, admin, payment, inventory, webhook, tenant isolation, workers, monitoring v\xe0 deployment."})]}),"Overview"===a&&(0,d.jsxs)("div",{className:"space-y-6",children:[(0,d.jsx)("div",{className:"grid gap-4 md:grid-cols-3",children:Object.entries(f).map(([a,b])=>(0,d.jsxs)("button",{onClick:()=>i(a),className:`rounded-xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md ${c===a?"border-orange-500 ring-2 ring-orange-100":"border-gray-200"}`,children:[(0,d.jsx)("span",{className:"rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600",children:b.short}),(0,d.jsx)("h3",{className:"mt-3 font-semibold",children:a}),(0,d.jsx)("p",{className:"mt-2 text-sm text-gray-600",children:b.frontend}),(0,d.jsx)("div",{className:"mt-4 flex flex-wrap gap-2",children:b.strengths.map(a=>(0,d.jsx)("span",{className:"rounded-full bg-green-50 px-2 py-1 text-xs text-green-700",children:a},a))})]},a))}),(0,d.jsxs)("div",{className:"rounded-xl border border-gray-200 bg-white p-6 shadow-sm",children:[(0,d.jsxs)("h3",{className:"font-semibold",children:["Selected stack: ",c]}),(0,d.jsxs)("div",{className:"mt-4 grid gap-3 text-sm md:grid-cols-2",children:[(0,d.jsxs)("p",{children:[(0,d.jsx)("span",{className:"font-medium text-gray-500",children:"Frontend:"})," ",n.frontend]}),(0,d.jsxs)("p",{children:[(0,d.jsx)("span",{className:"font-medium text-gray-500",children:"Backend:"})," ",n.backend]}),(0,d.jsxs)("p",{children:[(0,d.jsx)("span",{className:"font-medium text-gray-500",children:"Database:"})," ",n.database]}),(0,d.jsxs)("p",{children:[(0,d.jsx)("span",{className:"font-medium text-gray-500",children:"Auth:"})," ",n.auth]}),(0,d.jsxs)("p",{className:"md:col-span-2",children:[(0,d.jsx)("span",{className:"font-medium text-gray-500",children:"Deploy:"})," ",n.deploy]})]})]})]}),"System Diagram"===a&&(0,d.jsx)("div",{className:"rounded-xl border border-gray-200 bg-white p-6 shadow-sm",children:(0,d.jsx)("pre",{className:"overflow-auto whitespace-pre-wrap text-sm leading-7 text-gray-800",children:`Customer / Admin
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
Logging + Sentry + Metrics`})}),["File Structure","Database Schema","Commerce Flows","API Design","Security","Deployment"].includes(a)&&(0,d.jsxs)("pre",{className:"overflow-auto rounded-xl border border-gray-200 bg-white p-6 text-sm leading-7 text-gray-800 shadow-sm whitespace-pre-wrap",children:["File Structure"===a&&h.fileStructure,"Database Schema"===a&&h.dbSchema,"Commerce Flows"===a&&h.flows,"API Design"===a&&h.apiDesign,"Security"===a&&h.security,"Deployment"===a&&h.deployment]}),"AI Prompt Generator"===a&&(0,d.jsxs)("div",{className:"space-y-4",children:[(0,d.jsxs)("div",{className:"grid gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-2",children:[(0,d.jsxs)("label",{className:"text-sm font-medium",children:["Tech stack",(0,d.jsx)("select",{value:c,onChange:a=>i(a.target.value),className:"mt-2 w-full rounded-lg border border-gray-300 px-3 py-2",children:Object.keys(f).map(a=>(0,d.jsx)("option",{children:a},a))})]}),(0,d.jsxs)("label",{className:"text-sm font-medium",children:["App type",(0,d.jsx)("input",{value:j,onChange:a=>k(a.target.value),className:"mt-2 w-full rounded-lg border border-gray-300 px-3 py-2"})]})]}),(0,d.jsx)("button",{onClick:p,className:"rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700",children:l?"Copied":"Copy production prompt"}),(0,d.jsx)("pre",{className:"max-h-[620px] overflow-auto rounded-xl border border-gray-200 bg-gray-950 p-6 text-sm leading-7 text-gray-100 shadow-sm whitespace-pre-wrap",children:o})]})]})]})}},2735:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,1170,23)),Promise.resolve().then(c.t.bind(c,3597,23)),Promise.resolve().then(c.t.bind(c,6893,23)),Promise.resolve().then(c.t.bind(c,9748,23)),Promise.resolve().then(c.t.bind(c,6060,23)),Promise.resolve().then(c.t.bind(c,7184,23)),Promise.resolve().then(c.t.bind(c,9576,23)),Promise.resolve().then(c.t.bind(c,3041,23)),Promise.resolve().then(c.t.bind(c,1384,23))},2983:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,4160,23)),Promise.resolve().then(c.t.bind(c,1603,23)),Promise.resolve().then(c.t.bind(c,8495,23)),Promise.resolve().then(c.t.bind(c,5170,23)),Promise.resolve().then(c.t.bind(c,7526,23)),Promise.resolve().then(c.t.bind(c,8922,23)),Promise.resolve().then(c.t.bind(c,9234,23)),Promise.resolve().then(c.t.bind(c,2263,23)),Promise.resolve().then(c.bind(c,2146))},3033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},6097:()=>{},6369:()=>{},6439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},6487:()=>{},6688:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>d});let d=(0,c(7954).registerClientReference)(function(){throw Error("Attempted to call the default export of \"C:\\\\Users\\\\TUAN TU\\\\OneDrive\\\\Desktop\\\\Website\\\\apps\\\\web\\\\src\\\\app\\\\dashboard\\\\architecture\\\\page.tsx\" from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"C:\\Users\\TUAN TU\\OneDrive\\Desktop\\Website\\apps\\web\\src\\app\\dashboard\\architecture\\page.tsx","default")},6713:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/is-bot")},7619:(a,b,c)=>{Promise.resolve().then(c.bind(c,6688))},8335:()=>{},8354:a=>{"use strict";a.exports=require("util")},8895:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>e});var d=c(5338);function e({children:a}){return(0,d.jsxs)("div",{className:"flex h-screen bg-gray-50",children:[(0,d.jsxs)("aside",{className:"w-64 bg-white border-r border-gray-200 flex flex-col",children:[(0,d.jsx)("div",{className:"p-6 border-b border-gray-200",children:(0,d.jsx)("h1",{className:"text-xl font-bold text-orange-600",children:"NovaShop"})}),(0,d.jsxs)("nav",{className:"flex-1 p-4 space-y-2",children:[(0,d.jsx)("a",{href:"/dashboard",className:"block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg",children:"Overview"}),(0,d.jsx)("a",{href:"/dashboard/products",className:"block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg",children:"Products"}),(0,d.jsx)("a",{href:"/dashboard/orders",className:"block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg",children:"Orders"}),(0,d.jsx)("a",{href:"/dashboard/customers",className:"block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg",children:"Customers"}),(0,d.jsx)("a",{href:"/dashboard/analytics",className:"block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg",children:"Analytics"}),(0,d.jsx)("a",{href:"/dashboard/billing",className:"block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg",children:"Billing"}),(0,d.jsx)("a",{href:"/dashboard/settings",className:"block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg",children:"Settings"}),(0,d.jsx)("a",{href:"/dashboard/webhooks",className:"block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg",children:"Webhooks"}),(0,d.jsx)("a",{href:"/dashboard/architecture",className:"block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg",children:"Architecture"})]})]}),(0,d.jsx)("main",{className:"flex-1 overflow-auto",children:a})]})}},9121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},9294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},9518:(a,b,c)=>{"use strict";c.r(b),c.d(b,{GlobalError:()=>E.a,__next_app__:()=>K,handler:()=>M,pages:()=>J,routeModule:()=>L,tree:()=>I});var d=c(9754),e=c(9117),f=c(6595),g=c(2324),h=c(9326),i=c(8928),j=c(175),k=c(12),l=c(4290),m=c(2696),n=c(2574),o=c(2802),p=c(7533),q=c(5229),r=c(2822),s=c(261),t=c(6453),u=c(2474),v=c(6713),w=c(1356),x=c(2685),y=c(6225),z=c(3446),A=c(2762),B=c(5742),C=c(6439),D=c(1170),E=c.n(D),F=c(2506),G=c(1203),H={};for(let a in F)0>["default","tree","pages","GlobalError","__next_app__","routeModule","handler"].indexOf(a)&&(H[a]=()=>F[a]);c.d(b,H);let I={children:["",{children:["dashboard",{children:["architecture",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(c.bind(c,6688)),"C:\\Users\\TUAN TU\\OneDrive\\Desktop\\Website\\apps\\web\\src\\app\\dashboard\\architecture\\page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(c.bind(c,8895)),"C:\\Users\\TUAN TU\\OneDrive\\Desktop\\Website\\apps\\web\\src\\app\\dashboard\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(c.bind(c,1472)),"C:\\Users\\TUAN TU\\OneDrive\\Desktop\\Website\\apps\\web\\src\\app\\layout.tsx"],"global-error":[()=>Promise.resolve().then(c.t.bind(c,1170,23)),"next/dist/client/components/builtin/global-error.js"],"not-found":[()=>Promise.resolve().then(c.t.bind(c,7028,23)),"next/dist/client/components/builtin/not-found.js"],forbidden:[()=>Promise.resolve().then(c.t.bind(c,461,23)),"next/dist/client/components/builtin/forbidden.js"],unauthorized:[()=>Promise.resolve().then(c.t.bind(c,2768,23)),"next/dist/client/components/builtin/unauthorized.js"]}]}.children,J=["C:\\Users\\TUAN TU\\OneDrive\\Desktop\\Website\\apps\\web\\src\\app\\dashboard\\architecture\\page.tsx"],K={require:c,loadChunk:()=>Promise.resolve()},L=new d.AppPageRouteModule({definition:{kind:e.RouteKind.APP_PAGE,page:"/dashboard/architecture/page",pathname:"/dashboard/architecture",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:I},distDir:".next",relativeProjectDir:""});async function M(a,b,d){var D;let H="/dashboard/architecture/page";"/index"===H&&(H="/");let N=(0,h.getRequestMeta)(a,"postponed"),O=(0,h.getRequestMeta)(a,"minimalMode"),P=await L.prepare(a,b,{srcPage:H,multiZoneDraftMode:!1});if(!P)return b.statusCode=400,b.end("Bad Request"),null==d.waitUntil||d.waitUntil.call(d,Promise.resolve()),null;let{buildId:Q,query:R,params:S,parsedUrl:T,pageIsDynamic:U,buildManifest:V,nextFontManifest:W,reactLoadableManifest:X,serverActionsManifest:Y,clientReferenceManifest:Z,subresourceIntegrityManifest:$,prerenderManifest:_,isDraftMode:aa,resolvedPathname:ab,revalidateOnlyGenerated:ac,routerServerContext:ad,nextConfig:ae,interceptionRoutePatterns:af}=P,ag=T.pathname||"/",ah=(0,s.normalizeAppPath)(H),{isOnDemandRevalidate:ai}=P,aj=L.match(ag,_),ak=!!_.routes[ab],al=!!(aj||ak||_.routes[ah]),am=a.headers["user-agent"]||"",an=(0,v.getBotType)(am),ao=(0,q.isHtmlBotRequest)(a),ap=(0,h.getRequestMeta)(a,"isPrefetchRSCRequest")??"1"===a.headers[u.NEXT_ROUTER_PREFETCH_HEADER],aq=(0,h.getRequestMeta)(a,"isRSCRequest")??(0,n.f)(a.headers[u.RSC_HEADER]),ar=(0,t.getIsPossibleServerAction)(a),as=(0,m.checkIsAppPPREnabled)(ae.experimental.ppr)&&(null==(D=_.routes[ah]??_.dynamicRoutes[ah])?void 0:D.renderingMode)==="PARTIALLY_STATIC",at=!1,au=!1,av=as?N:void 0,aw=as&&aq&&!ap,ax=(0,h.getRequestMeta)(a,"segmentPrefetchRSCRequest"),ay=!am||(0,q.shouldServeStreamingMetadata)(am,ae.htmlLimitedBots);ao&&as&&(al=!1,ay=!1);let az=!0===L.isDev||!al||"string"==typeof N||aw,aA=ao&&as,aB=null;aa||!al||az||ar||av||aw||(aB=ab);let aC=aB;!aC&&L.isDev&&(aC=ab),L.isDev||aa||!al||!aq||aw||(0,k.d)(a.headers);let aD={...F,tree:I,pages:J,GlobalError:E(),handler:M,routeModule:L,__next_app__:K};Y&&Z&&(0,p.setReferenceManifestsSingleton)({page:H,clientReferenceManifest:Z,serverActionsManifest:Y,serverModuleMap:(0,r.createServerModuleMap)({serverActionsManifest:Y})});let aE=a.method||"GET",aF=(0,g.getTracer)(),aG=aF.getActiveScopeSpan();try{let f=L.getVaryHeader(ab,af);b.setHeader("Vary",f);let k=async(c,d)=>{let e=new l.NodeNextRequest(a),f=new l.NodeNextResponse(b);return L.render(e,f,d).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=aF.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==i.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${aE} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${aE} ${a.url}`)})},m=async({span:e,postponed:f,fallbackRouteParams:g})=>{let i={query:R,params:S,page:ah,sharedContext:{buildId:Q},serverComponentsHmrCache:(0,h.getRequestMeta)(a,"serverComponentsHmrCache"),fallbackRouteParams:g,renderOpts:{App:()=>null,Document:()=>null,pageConfig:{},ComponentMod:aD,Component:(0,j.T)(aD),params:S,routeModule:L,page:H,postponed:f,shouldWaitOnAllReady:aA,serveStreamingMetadata:ay,supportsDynamicResponse:"string"==typeof f||az,buildManifest:V,nextFontManifest:W,reactLoadableManifest:X,subresourceIntegrityManifest:$,serverActionsManifest:Y,clientReferenceManifest:Z,setIsrStatus:null==ad?void 0:ad.setIsrStatus,dir:c(9902).join(process.cwd(),L.relativeProjectDir),isDraftMode:aa,isRevalidate:al&&!f&&!aw,botType:an,isOnDemandRevalidate:ai,isPossibleServerAction:ar,assetPrefix:ae.assetPrefix,nextConfigOutput:ae.output,crossOrigin:ae.crossOrigin,trailingSlash:ae.trailingSlash,previewProps:_.preview,deploymentId:ae.deploymentId,enableTainting:ae.experimental.taint,htmlLimitedBots:ae.htmlLimitedBots,devtoolSegmentExplorer:ae.experimental.devtoolSegmentExplorer,reactMaxHeadersLength:ae.reactMaxHeadersLength,multiZoneDraftMode:!1,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:ae.experimental.cacheLife,basePath:ae.basePath,serverActions:ae.experimental.serverActions,...at?{nextExport:!0,supportsDynamicResponse:!1,isStaticGeneration:!0,isRevalidate:!0,isDebugDynamicAccesses:at}:{},experimental:{isRoutePPREnabled:as,expireTime:ae.expireTime,staleTimes:ae.experimental.staleTimes,cacheComponents:!!ae.experimental.cacheComponents,clientSegmentCache:!!ae.experimental.clientSegmentCache,clientParamParsing:!!ae.experimental.clientParamParsing,dynamicOnHover:!!ae.experimental.dynamicOnHover,inlineCss:!!ae.experimental.inlineCss,authInterrupts:!!ae.experimental.authInterrupts,clientTraceMetadata:ae.experimental.clientTraceMetadata||[]},waitUntil:d.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:()=>{},onInstrumentationRequestError:(b,c,d)=>L.onRequestError(a,b,d,ad),err:(0,h.getRequestMeta)(a,"invokeError"),dev:L.isDev}},l=await k(e,i),{metadata:m}=l,{cacheControl:n,headers:o={},fetchTags:p}=m;if(p&&(o[z.NEXT_CACHE_TAGS_HEADER]=p),a.fetchMetrics=m.fetchMetrics,al&&(null==n?void 0:n.revalidate)===0&&!L.isDev&&!as){let a=m.staticBailoutInfo,b=Object.defineProperty(Error(`Page changed from static to dynamic at runtime ${ab}${(null==a?void 0:a.description)?`, reason: ${a.description}`:""}
see more here https://nextjs.org/docs/messages/app-static-to-dynamic-error`),"__NEXT_ERROR_CODE",{value:"E132",enumerable:!1,configurable:!0});if(null==a?void 0:a.stack){let c=a.stack;b.stack=b.message+c.substring(c.indexOf("\n"))}throw b}return{value:{kind:w.CachedRouteKind.APP_PAGE,html:l,headers:o,rscData:m.flightData,postponed:m.postponed,status:m.statusCode,segmentData:m.segmentData},cacheControl:n}},n=async({hasResolved:c,previousCacheEntry:f,isRevalidating:g,span:i})=>{let j,k=!1===L.isDev,l=c||b.writableEnded;if(ai&&ac&&!f&&!O)return(null==ad?void 0:ad.render404)?await ad.render404(a,b):(b.statusCode=404,b.end("This page could not be found")),null;if(aj&&(j=(0,x.parseFallbackField)(aj.fallback)),j===x.FallbackMode.PRERENDER&&(0,v.isBot)(am)&&(!as||ao)&&(j=x.FallbackMode.BLOCKING_STATIC_RENDER),(null==f?void 0:f.isStale)===-1&&(ai=!0),ai&&(j!==x.FallbackMode.NOT_FOUND||f)&&(j=x.FallbackMode.BLOCKING_STATIC_RENDER),!O&&j!==x.FallbackMode.BLOCKING_STATIC_RENDER&&aC&&!l&&!aa&&U&&(k||!ak)){let b;if((k||aj)&&j===x.FallbackMode.NOT_FOUND)throw new C.NoFallbackError;if(as&&!aq){let c="string"==typeof(null==aj?void 0:aj.fallback)?aj.fallback:k?ah:null;if(b=await L.handleResponse({cacheKey:c,req:a,nextConfig:ae,routeKind:e.RouteKind.APP_PAGE,isFallback:!0,prerenderManifest:_,isRoutePPREnabled:as,responseGenerator:async()=>m({span:i,postponed:void 0,fallbackRouteParams:k||au?(0,o.u)(ah):null}),waitUntil:d.waitUntil}),null===b)return null;if(b)return delete b.cacheControl,b}}let n=ai||g||!av?void 0:av;if(at&&void 0!==n)return{cacheControl:{revalidate:1,expire:void 0},value:{kind:w.CachedRouteKind.PAGES,html:y.default.EMPTY,pageData:{},headers:void 0,status:void 0}};let p=U&&as&&((0,h.getRequestMeta)(a,"renderFallbackShell")||au)?(0,o.u)(ag):null;return m({span:i,postponed:n,fallbackRouteParams:p})},p=async c=>{var f,g,i,j,k;let l,o=await L.handleResponse({cacheKey:aB,responseGenerator:a=>n({span:c,...a}),routeKind:e.RouteKind.APP_PAGE,isOnDemandRevalidate:ai,isRoutePPREnabled:as,req:a,nextConfig:ae,prerenderManifest:_,waitUntil:d.waitUntil});if(aa&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate"),L.isDev&&b.setHeader("Cache-Control","no-store, must-revalidate"),!o){if(aB)throw Object.defineProperty(Error("invariant: cache entry required but not generated"),"__NEXT_ERROR_CODE",{value:"E62",enumerable:!1,configurable:!0});return null}if((null==(f=o.value)?void 0:f.kind)!==w.CachedRouteKind.APP_PAGE)throw Object.defineProperty(Error(`Invariant app-page handler received invalid cache entry ${null==(i=o.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E707",enumerable:!1,configurable:!0});let p="string"==typeof o.value.postponed;al&&!aw&&(!p||ap)&&(O||b.setHeader("x-nextjs-cache",ai?"REVALIDATED":o.isMiss?"MISS":o.isStale?"STALE":"HIT"),b.setHeader(u.NEXT_IS_PRERENDER_HEADER,"1"));let{value:q}=o;if(av)l={revalidate:0,expire:void 0};else if(O&&aq&&!ap&&as)l={revalidate:0,expire:void 0};else if(!L.isDev)if(aa)l={revalidate:0,expire:void 0};else if(al){if(o.cacheControl)if("number"==typeof o.cacheControl.revalidate){if(o.cacheControl.revalidate<1)throw Object.defineProperty(Error(`Invalid revalidate configuration provided: ${o.cacheControl.revalidate} < 1`),"__NEXT_ERROR_CODE",{value:"E22",enumerable:!1,configurable:!0});l={revalidate:o.cacheControl.revalidate,expire:(null==(j=o.cacheControl)?void 0:j.expire)??ae.expireTime}}else l={revalidate:z.CACHE_ONE_YEAR,expire:void 0}}else b.getHeader("Cache-Control")||(l={revalidate:0,expire:void 0});if(o.cacheControl=l,"string"==typeof ax&&(null==q?void 0:q.kind)===w.CachedRouteKind.APP_PAGE&&q.segmentData){b.setHeader(u.NEXT_DID_POSTPONE_HEADER,"2");let c=null==(k=q.headers)?void 0:k[z.NEXT_CACHE_TAGS_HEADER];O&&al&&c&&"string"==typeof c&&b.setHeader(z.NEXT_CACHE_TAGS_HEADER,c);let d=q.segmentData.get(ax);return void 0!==d?(0,B.sendRenderResult)({req:a,res:b,generateEtags:ae.generateEtags,poweredByHeader:ae.poweredByHeader,result:y.default.fromStatic(d,u.RSC_CONTENT_TYPE_HEADER),cacheControl:o.cacheControl}):(b.statusCode=204,(0,B.sendRenderResult)({req:a,res:b,generateEtags:ae.generateEtags,poweredByHeader:ae.poweredByHeader,result:y.default.EMPTY,cacheControl:o.cacheControl}))}let r=(0,h.getRequestMeta)(a,"onCacheEntry");if(r&&await r({...o,value:{...o.value,kind:"PAGE"}},{url:(0,h.getRequestMeta)(a,"initURL")}))return null;if(p&&av)throw Object.defineProperty(Error("Invariant: postponed state should not be present on a resume request"),"__NEXT_ERROR_CODE",{value:"E396",enumerable:!1,configurable:!0});if(q.headers){let a={...q.headers};for(let[c,d]of(O&&al||delete a[z.NEXT_CACHE_TAGS_HEADER],Object.entries(a)))if(void 0!==d)if(Array.isArray(d))for(let a of d)b.appendHeader(c,a);else"number"==typeof d&&(d=d.toString()),b.appendHeader(c,d)}let s=null==(g=q.headers)?void 0:g[z.NEXT_CACHE_TAGS_HEADER];if(O&&al&&s&&"string"==typeof s&&b.setHeader(z.NEXT_CACHE_TAGS_HEADER,s),!q.status||aq&&as||(b.statusCode=q.status),!O&&q.status&&G.RedirectStatusCode[q.status]&&aq&&(b.statusCode=200),p&&b.setHeader(u.NEXT_DID_POSTPONE_HEADER,"1"),aq&&!aa){if(void 0===q.rscData){if(q.postponed)throw Object.defineProperty(Error("Invariant: Expected postponed to be undefined"),"__NEXT_ERROR_CODE",{value:"E372",enumerable:!1,configurable:!0});return(0,B.sendRenderResult)({req:a,res:b,generateEtags:ae.generateEtags,poweredByHeader:ae.poweredByHeader,result:q.html,cacheControl:aw?{revalidate:0,expire:void 0}:o.cacheControl})}return(0,B.sendRenderResult)({req:a,res:b,generateEtags:ae.generateEtags,poweredByHeader:ae.poweredByHeader,result:y.default.fromStatic(q.rscData,u.RSC_CONTENT_TYPE_HEADER),cacheControl:o.cacheControl})}let t=q.html;if(!p||O||aq)return(0,B.sendRenderResult)({req:a,res:b,generateEtags:ae.generateEtags,poweredByHeader:ae.poweredByHeader,result:t,cacheControl:o.cacheControl});if(at)return t.push(new ReadableStream({start(a){a.enqueue(A.ENCODED_TAGS.CLOSED.BODY_AND_HTML),a.close()}})),(0,B.sendRenderResult)({req:a,res:b,generateEtags:ae.generateEtags,poweredByHeader:ae.poweredByHeader,result:t,cacheControl:{revalidate:0,expire:void 0}});let v=new TransformStream;return t.push(v.readable),m({span:c,postponed:q.postponed,fallbackRouteParams:null}).then(async a=>{var b,c;if(!a)throw Object.defineProperty(Error("Invariant: expected a result to be returned"),"__NEXT_ERROR_CODE",{value:"E463",enumerable:!1,configurable:!0});if((null==(b=a.value)?void 0:b.kind)!==w.CachedRouteKind.APP_PAGE)throw Object.defineProperty(Error(`Invariant: expected a page response, got ${null==(c=a.value)?void 0:c.kind}`),"__NEXT_ERROR_CODE",{value:"E305",enumerable:!1,configurable:!0});await a.value.html.pipeTo(v.writable)}).catch(a=>{v.writable.abort(a).catch(a=>{console.error("couldn't abort transformer",a)})}),(0,B.sendRenderResult)({req:a,res:b,generateEtags:ae.generateEtags,poweredByHeader:ae.poweredByHeader,result:t,cacheControl:{revalidate:0,expire:void 0}})};if(!aG)return await aF.withPropagatedContext(a.headers,()=>aF.trace(i.BaseServerSpan.handleRequest,{spanName:`${aE} ${a.url}`,kind:g.SpanKind.SERVER,attributes:{"http.method":aE,"http.target":a.url}},p));await p(aG)}catch(b){throw b instanceof C.NoFallbackError||await L.onRequestError(a,b,{routerKind:"App Router",routePath:H,routeType:"render",revalidateReason:(0,f.c)({isRevalidate:al,isOnDemandRevalidate:ai})},ad),b}}},9902:a=>{"use strict";a.exports=require("path")}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[331,342],()=>b(b.s=9518));module.exports=c})();