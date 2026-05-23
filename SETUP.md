# NovaShop Deploy Checklist

## 1. Frontend (Netlify)
- [ ] Set `VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx`
- [ ] Set `VITE_API_URL=https://<backend>.onrender.com` (hoặc để trống nếu chưa có)
- [ ] Set `VITE_FIREBASE_API_KEY` và các biến Firebase còn lại
- [ ] Set `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx`
- [ ] Set `VITE_SHOP_NAME`, `VITE_SHOP_DOMAIN`, `VITE_SHOP_PHONE`
- [ ] Set `VITE_ADMIN_EMAILS`

## 2. Backend (Render)
- [ ] Deploy repo `tutrantuan988-spec/novashop`
- [ ] Set `CLERK_SECRET_KEY=sk_live_xxx`
- [ ] Set `STRIPE_SECRET_KEY=sk_live_xxx`
- [ ] Set `STRIPE_WEBHOOK_SECRET=whsec_xxx`
- [ ] Set `FIREBASE_SERVICE_ACCOUNT_JSON` (paste JSON 1 dòng)
- [ ] Set `RESEND_API_KEY=re_xxx`
- [ ] Set `ADMIN_API_TOKEN` (random ≥32 ký tự)
- [ ] Set `CLIENT_URL=https://trong-dinh-store.netlify.app`
- [ ] Set `PUBLIC_API_URL=https://<backend>.onrender.com`

## 3. Clerk Dashboard
- [ ] Tạo Production instance
- [ ] Thêm domain `trong-dinh-store.netlify.app` vào Authorized domains
- [ ] Copy `pk_live_` → Netlify env
- [ ] Copy `sk_live_` → Render env

## 4. Build & Test
```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```
- [ ] Không còn warning `pk_test_` trong console
- [ ] Chat hiển thị "bảo trì" nếu chưa có backend
- [ ] Checkout fallback hoạt động khi API 404
- [ ] Firebase warning 1 lần duy nhất nếu chưa config

## 5. Security
- [ ] `.env.local` trong `.gitignore`
- [ ] Không commit key thật lên GitHub
- [ ] `ADMIN_API_TOKEN` đủ mạnh (≥32 chars, random)
