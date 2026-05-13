# 🎯 NovaShop — Implementation Summary

Hoàn thành 15 phần theo Master Implementation Prompt.

---

## ✅ P1 — Firestore Schema Helpers
**Files mới:**
- `src/lib/firebase-schema.js` — collection constants + validators (variant, address, return_request)

---

## ✅ P2 — Product Variants
**Backend:**
- `server/index.js` — CRUD `/api/products/:productId/variants` (GET/POST/PUT/DELETE)

**Frontend:**
- `src/components/product/VariantSelector.jsx` — button-group selector, sync URL ?variant=, disable hết hàng
- `src/context/CartContext.jsx` — line key `productId::variantId`, snapshot tại thời điểm add
- `src/services/api.js` — listVariantsApi, createVariantApi, updateVariantApi, deleteVariantApi

---

## ✅ P3 — Race Condition & Inventory Lock
**Files mới:**
- `server/utils/inventoryTransaction.js` — `reserveInventory`, `releaseInventory`, `InsufficientStockError`

**Files sửa:**
- `server/index.js` — POST /api/orders dùng transaction, webhook idempotency với `processed_webhooks`, PATCH order status auto-release
- `src/services/api.js` — preserve `insufficientItems` trong error
- `src/pages/CheckoutPage.jsx` — banner + highlight inline khi 409
- `src/styles.css` — `.stock-warning`

---

## ✅ P4 — Guest Checkout
**Files mới:**
- `server/utils/guestToken.js` — HMAC signed token (no JWT dep)
- `server/index.js` — POST /api/checkout/guest, GET /api/track-order
- `src/pages/GuestOrderTrackingPage.jsx` — `/track-order?token=`
- `src/services/api.js` — createGuestOrderApi, trackOrderApi, saveGuestToken

---

## ✅ P5 — Order Tracking Timeline
**Files mới:**
- `src/components/order/OrderTimeline.jsx` — 6 stages với icon + timestamp + tracking link

---

## ✅ P6 — Abandoned Cart Recovery
**Files mới:**
- `server/jobs/abandonedCartJob.js` — node-cron hourly, 1h + 24h reminders
- `server/email.js` — `sendAbandonedCartEmail` template với coupon block

**Files sửa:**
- `server/index.js` — `startAbandonedCartJob(adminDb)` trong startServer

**Lưu ý:** Cần cart_items collection trên Firestore + sync khi user login (TODO frontend)

---

## ✅ P7 — Returns & Refunds
**Files mới:**
- `server/utils/refundService.js` — Stripe refund (full/partial)
- `server/index.js` — POST /api/returns, GET /api/returns, PUT /api/returns/:id/approve|reject với auto-refund + release inventory
- `src/pages/ReturnRequestPage.jsx` — form chọn item, lý do, upload ảnh, refund estimate
- `src/components/admin/ReturnsManager.jsx` — duyệt/từ chối với note

---

## ✅ P8 — Search Engine
**Files mới:**
- `server/utils/algoliaSync.js` — lazy require, no-op khi chưa config
- `src/lib/searchClient.js` — Algolia + Firestore fallback (algoliasearch/lite lazy import)
- `src/components/search/SearchBar.jsx` — debounce 300ms, autocomplete với highlight

**Files sửa:**
- `server/index.js` — sync khi CRUD product, /api/search fallback, /api/admin/algolia/reindex
- `src/pages/SearchPage.jsx` — chuyển sang searchClient, URL params cho filters + sort

---

## ✅ P9 — Image Optimization
**Files mới:**
- `server/utils/imageUpload.js` — sharp + Cloudinary (lazy require), thumbnail/medium/original
- `server/index.js` — /api/upload/image (base64, không multer), /api/upload/config
- `src/components/ui/ProgressiveImage.jsx` — IntersectionObserver, blur placeholder

**Files sửa:**
- `server/index.js` — `express.json({ limit: '12mb' })`

---

## ✅ P10 — Security
**Files mới:**
- `server/middleware/security.js` — authLimiter, checkoutHardLimiter, publicReadLimiter, reviewLimiter, sanitizeText, idempotencyMiddleware

**Files sửa:**
- `server/index.js` — apply idempotencyMiddleware vào POST /api/orders + /api/checkout/guest
- Webhook idempotency qua collection `processed_webhooks` (P3 cũ + P10 chính thức)

---

## ✅ P11 — Sentry Error Monitoring
**Files mới:**
- `server/utils/sentry.js` — lazy require @sentry/node, captureException, error handler middleware

**Files sửa:**
- `server/index.js` — initSentry() + captureException trong global error handler
- `src/main.jsx` — `initMonitoring()` call (lib/monitoring.js đã có sẵn)

---

## ✅ P12 — Notification System
**Files mới:**
- `server/utils/notificationService.js` — `createNotification(adminDb, userId, type, data)` + email trigger
- `src/components/ui/NotificationBell.jsx` — badge unread + polling 30s + mark read

**Files sửa:**
- `server/index.js` — /api/notifications CRUD, hook vào PATCH order status
- `server/email.js` — `sendNotificationEmail` template
- `src/components/Header.jsx` — render `<NotificationBell />`
- `src/styles.css` — `.notif-bell`, `.notif-dropdown`

---

## ✅ P13 — Address Management
**Files mới:**
- `src/data/vnProvinces.js` — minimal VN admin divisions (HN, HCM, DN, HP, CT)
- `src/pages/account/AddressesPage.jsx` — list + add/edit/delete + set default + cascading select

**Files sửa:**
- `server/index.js` — /api/addresses CRUD + /api/addresses/:id/default
- `src/services/api.js` — listAddressesApi, createAddressApi, updateAddressApi, deleteAddressApi, setDefaultAddressApi
- `src/App.jsx` — route `/tai-khoan/dia-chi`

---

## ✅ P14 — GHN Shipping Integration
**Files mới:**
- `server/utils/ghnService.js` — calculateShippingFee, createShipment, getTrackingStatus, cancelShipment

**Files sửa:**
- `server/index.js` — /api/shipping/calculate|create|track
- `src/services/api.js` — calculateShippingFeeApi, createShipmentApi, trackShipmentApi

---

## ✅ P15 — Admin Enhancements
**Files mới:**
- `src/components/admin/ReturnsManager.jsx` — duyệt/từ chối returns với Stripe refund result
- `src/utils/exportCsv.js` — CSV export với BOM UTF-8, không papaparse

**Files sửa:**
- `src/pages/AdminPage.jsx` — Returns tab, low stock highlight (red <=0, amber <10), CSV export đã có sẵn

---

## 🔧 Cần install (optional packages)

```bash
# Nếu muốn dùng các features tương ứng:
npm i node-cron       # P6 abandoned cart
npm i @sentry/node    # P11 server sentry (frontend đã có @sentry/react)
npm i algoliasearch   # P8 search engine
npm i sharp cloudinary # P9 image optimization
```

Mọi package đều **lazy require** — không break gì nếu chưa cài.

---

## 🔑 Environment Variables

Xem `.env.local.example` đã được cập nhật với:

**Critical:**
- `ADMIN_API_TOKEN` — bắt buộc cho /admin trên production
- `GUEST_TOKEN_SECRET` — nên đặt khác ADMIN_API_TOKEN
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `RESEND_API_KEY`

**Optional (graceful skip nếu không có):**
- `ALGOLIA_*` / `VITE_ALGOLIA_*` (P8)
- `CLOUDINARY_*` (P9)
- `GHN_API_TOKEN` (P14)
- `SENTRY_DSN` / `VITE_SENTRY_DSN` (P11)

---

## 🧪 Test commands nhanh

```bash
# 1. Test stock reserve transaction (P3)
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-001" \
  -d '{"order":{"customer":{"name":"A","phone":"0900","address":"HN","email":"a@a.com"},"items":[{"id":"PROD_ID","quantity":1,"price":100000,"name":"X"}],"paymentMethod":"cod"}}'

# 2. Test guest checkout (P4)
curl -X POST http://localhost:3001/api/checkout/guest \
  -H "Content-Type: application/json" \
  -d '{"order":{"customer":{"name":"G","phone":"0900","email":"g@g.com","address":"HCM"},"items":[{"id":"PROD_ID","quantity":1,"price":50000,"name":"Y"}]}}'

# 3. Test search (P8)
curl "http://localhost:3001/api/search?q=royal"

# 4. Test GHN shipping calc (P14)
curl -X POST http://localhost:3001/api/shipping/calculate \
  -H "Content-Type: application/json" \
  -d '{"from_district_id":1442,"to_district_id":1820,"to_ward_code":"21211","weight":1000}'

# 5. Notifications - tự tạo bằng cách đổi order status
curl -X PATCH http://localhost:3001/api/orders/ORDER_ID/status \
  -H "Content-Type: application/json" \
  -H "x-admin-email: tutrantuan988@gmail.com" \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -d '{"status":"shipped"}'
```

---

## 🚀 Routes mới

- `/track-order?token=xxx` — Guest tracking (P4)
- `/tai-khoan/dia-chi` — Address management (P13)
- `/tai-khoan/doi-tra/:orderId` — Return request form (P7)
- `/tim-kiem?q=&brand=&minPrice=&maxPrice=&sort=` — Search with facets (P8)
- Admin tab "Đổi/trả" — Returns approval (P15)

---

**Total commits trong implementation:** 7
**Files mới:** 21
**Files sửa:** 11
**Tổng lines code:** ~3500
