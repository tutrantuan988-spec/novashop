# Payment Integration Setup Guide

## Overview

Hệ thống thanh toán production-ready với Stripe Elements + Backend PaymentIntent API.

## Supported Payment Methods

1. **COD** - Thanh toán khi nhận hàng
2. **Bank Transfer** - Chuyển khoản MBBank + VietQR
3. **Stripe** - Thẻ Visa/Mastercard/JCB/Amex (REAL)

## Stripe Production Setup

### 1. Create Stripe Account

```bash
https://dashboard.stripe.com/register
```

- Chọn "Business" account
- Complete verification (ID + Bank account)

### 2. Get LIVE API Keys

Dashboard → Developers → API keys → Reveal live key

```
pk_live_xxxxx  (frontend)
sk_live_xxxxx  (backend - copy immediately, shown once only)
```

### 3. Configure Environment

**Frontend `.env.local` (development):**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_API_URL=http://localhost:3001
```

**Frontend `.env.production`:**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
VITE_API_URL=https://api.yoursite.com
```

**Backend `server/.env` (development):**
```env
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
CLIENT_URL=http://localhost:5173
```

**Backend `server/.env` (production):**
```env
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_live_xxxxx
CLIENT_URL=https://yoursite.com
```

### 4. Setup Webhook (Production Required)

Dashboard → Developers → Webhooks → Add endpoint:

```
Endpoint URL: https://api.yoursite.com/api/webhook/stripe
Events: payment_intent.succeeded, payment_intent.payment_failed
```

Copy `whsec_` secret to `STRIPE_WEBHOOK_SECRET`

### 5. Test Cards (Test Mode)

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 0127 | Incorrect CVC |

Expiry: Any future date (12/30)
CVC: Any 3 digits (123)

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│   Backend    │────▶│   Stripe    │
│  React App  │     │   Express    │     │   API       │
└─────────────┘     └──────────────┘     └─────────────┘
       │                     │
       │                     ▼
       │              ┌──────────────┐
       │              │  Firestore   │
       │              │   Orders     │
       │              └──────────────┘
       ▼
┌─────────────┐
│ Stripe.js   │
│ Elements    │
└─────────────┘
```

## Flow

### Stripe Payment Flow

1. User fills shipping form → Selects "Visa/Mastercard"
2. Click "Tiếp tục thanh toán" → Order created (pending status)
3. Stripe Elements form appears
4. User enters: Card number, Expiry, CVC, Name, Country
5. Click "Thanh toán an toàn"
6. Frontend calls `POST /api/create-payment-intent`
7. Backend creates PaymentIntent with Stripe API
8. Frontend calls `stripe.confirmCardPayment()`
9. Stripe processes payment → Returns result
10. On success: Update order status → Clear cart → Show success

## Security Checklist

- [ ] HTTPS only (required by Stripe)
- [ ] Webhook signature verification
- [ ] Amount validation on backend
- [ ] No secret keys in frontend
- [ ] CSP headers configured
- [ ] Rate limiting on API

## Files

| File | Purpose |
|------|---------|
| `src/components/StripeProvider.jsx` | Stripe Elements provider |
| `src/components/StripePaymentForm.jsx` | Card input form |
| `src/pages/CheckoutPage.jsx` | Checkout with payment selection |
| `server/index.js` | PaymentIntent API endpoint |

## Installation

```bash
# Install dependencies
npm install

# Backend
npm install stripe

# Build
npm run build

# Deploy
# Upload dist/ to hosting
# Deploy server/ to VPS/Cloud
```

## Monitoring

- Stripe Dashboard: https://dashboard.stripe.com/payments
- Check webhook delivery status
- Monitor failed payments

## Support

Stripe Support: https://support.stripe.com/
Documentation: https://stripe.com/docs/payments/accept-a-payment

---

**Status: Production Ready** ✅
- PCI Compliant (Stripe handles card data)
- Real-time validation
- Secure tokenization
- Webhook confirmation

Last updated: May 2026
