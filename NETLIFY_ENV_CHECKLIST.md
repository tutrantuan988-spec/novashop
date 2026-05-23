# Netlify Environment Variables Checklist

> Checklist cho frontend deploy tại https://trong-dinh-store.netlify.app

---

## Required Environment Variables

### Clerk — Authentication
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` — [dashboard.clerk.com](https://dashboard.clerk.com) → API Keys → Production instance → Publishable key (`pk_live_...`)
- [ ] `CLERK_SECRET_KEY` — Cùng trang trên → Secret key (dùng cho backend nếu cần)
- [ ] **Email Verification**: [dashboard.clerk.com](https://dashboard.clerk.com) → Users & Authentication → Email → Email verification → Enable
- [ ] **Forgot Password**: [dashboard.clerk.com](https://dashboard.clerk.com) → Users & Authentication → Email → Password → Enable forgot password

### Firebase — Database & Storage
- [ ] `VITE_FIREBASE_API_KEY` — [console.firebase.google.com](https://console.firebase.google.com) → Project Settings → Web API Key
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` — Cùng trang trên → `projectId.firebaseapp.com`
- [ ] `VITE_FIREBASE_PROJECT_ID` — Cùng trang trên → Project ID
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` — Cùng trang trên → Storage bucket
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` — Cùng trang trên → Sender ID
- [ ] `VITE_FIREBASE_APP_ID` — Cùng trang trên → App ID

### Shop Information
- [ ] `VITE_SHOP_NAME` — Tên cửa hàng (VD: TRỌNG ĐỊNH STORE)
- [ ] `VITE_SHOP_DESCRIPTION` — Mô tả ngắn (VD: Thức ăn chính hãng cho thú cưng)
- [ ] `VITE_SHOP_DOMAIN` — Domain (VD: trong-dinh-store.netlify.app)
- [ ] `VITE_SHOP_PHONE` — Số điện thoại (VD: 0369712958)
- [ ] `VITE_SHOP_EMAIL` — Email (VD: tutrantuan988@gmail.com)
- [ ] `VITE_SHOP_ADDRESS` — Địa chỉ
- [ ] `VITE_SHOP_FACEBOOK` — Link Facebook
- [ ] `VITE_SHOP_INSTAGRAM` — Link Instagram

### Payment
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` — Stripe public key (pk_live_… cho production)

---

## Recommended Environment Variables

- [ ] `VITE_API_URL` — Backend API URL (để trống nếu backend cùng domain)
- [ ] `VITE_GOOGLE_MAPS_KEY` — Google Maps API key (nếu cần bản đồ)

---

## Optional Environment Variables

### Social Media
- [ ] `VITE_SHOP_ZALO` — Link Zalo
- [ ] `VITE_SHOP_TIKTOK` — Link TikTok
- [ ] `VITE_SHOP_YOUTUBE` — Link YouTube

### Analytics & Monitoring
- [ ] `VITE_GA_ID` — [analytics.google.com](https://analytics.google.com) → Tracking ID (`G-XXXXXXXXXX`)
- [ ] `VITE_SENTRY_DSN` — [sentry.io](https://sentry.io) → Projects → DSN
- [ ] `VITE_SENTRY_TRACES_SAMPLE_RATE` — Tỷ lệ trace (khuyến nghị: `0.05`)

### Live Chat
- [ ] `VITE_TAWKTO_ID` — [dashboard.tawk.to](https://dashboard.tawk.to) → Property Settings → Widget Code → Site ID

---

## Cách thêm trên Netlify

1. Truy cập: https://app.netlify.com/sites/trong-dinh-store/settings/deploys#environment-variables
2. Click **Add a variable** → nhập **Key** và **Value**
3. Lưu → vào tab **Deploys** → click **Retry deploy**

---

## Test sau khi deploy

```bash
curl https://trong-dinh-store.netlify.app
```

## Netlify Dashboard

https://app.netlify.com

