# 🆓 FREE DEPLOYMENT GUIDE — $0/Tháng

## Tổng quan
Deploy website thương mại điện tử hoàn chỉnh **KHÔNG TỐN TIỀN**.

---

## 🎯 Stack MIỄN PHÍ

| Layer | Dịch vụ | Free Tier | Link |
|-------|---------|-----------|------|
| **Frontend** | Vercel | Unlimited bandwidth | https://vercel.com |
| **Backend** | Railway | $5 credit/tháng | https://railway.app |
| **Database** | Firebase | 1GB storage | https://firebase.google.com |
| **Payment** | Stripe | Free setup, 2.9% fee | https://stripe.com |
| **Auth** | Clerk | 10k users/tháng | https://clerk.com |
| **Email** | Resend | 3k emails/tháng | https://resend.com |
| **Images** | Cloudinary | 25GB storage | https://cloudinary.com |
| **Domain** | Free subdomain | yourname.vercel.app | - |

**Tổng chi phí: $0/tháng**

---

## 📋 Bước 1: Frontend (Vercel — Free)

### 1.1 Đăng ký Vercel
```
https://vercel.com/signup
```
Dùng GitHub account đăng ký nhanh nhất.

### 1.2 Import project
1. Click "Add New Project"
2. Import GitHub repo của bạn
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`

### 1.3 Environment Variables
Thêm vào Vercel Dashboard → Settings → Environment Variables:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_FIREBASE_API_KEY=xxxxx
VITE_FIREBASE_AUTH_DOMAIN=xxxxx
VITE_FIREBASE_PROJECT_ID=xxxxx
VITE_FIREBASE_STORAGE_BUCKET=xxxxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxx
VITE_FIREBASE_APP_ID=xxxxx
VITE_API_URL=https://your-backend.railway.app
VITE_ADMIN_EMAILS=your-email@gmail.com
```

### 1.4 Deploy
Click **Deploy** → Website live sau 2 phút!

**URL:** `https://novashop.vercel.app` (FREE)

---

## 📋 Bước 2: Backend (Railway — Free $5/month)

### 2.1 Đăng ký Railway
```
https://railway.app
```
Dùng GitHub login.

### 2.2 Deploy Backend
1. New Project → Deploy from GitHub repo
2. Chọn thư mục `server/`
3. Add variables:

```
NODE_ENV=production
PORT=3001
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
CLIENT_URL=https://novashop.vercel.app
VITE_FIREBASE_PROJECT_ID=xxxxx
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### 2.3 Custom Domain (Optional)
Railway Dashboard → Settings → Domains:
```
Add Domain: api-novashop.up.railway.app
```

---

## 📋 Bước 3: Database (Firebase — Free)

### 3.1 Tạo project
```
https://console.firebase.google.com
```

### 3.2 Enable services
- [ ] Firestore Database
- [ ] Authentication (Email/Password)
- [ ] Storage

### 3.3 Lấy config
Project Settings → Your apps → Web app:

```javascript
const firebaseConfig = {
  apiKey: "xxxxx",
  authDomain: "novashop-xxxxx.firebaseapp.com",
  projectId: "novashop-xxxxx",
  storageBucket: "novashop-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:xxxxx:web:xxxxx"
};
```

### 3.4 Service Account (Backend cần)
Project Settings → Service accounts → Generate new private key
→ Download JSON → Copy nội dung paste vào `FIREBASE_SERVICE_ACCOUNT_JSON`

---

## 📋 Bước 4: Payment (Stripe — Free setup)

### 4.1 Đăng ký (Test mode = FREE)
```
https://dashboard.stripe.com/register
```

### 4.2 Lấy API keys
Developers → API keys:
- Publishable key: `pk_test_xxxxx` → Vercel env
- Secret key: `sk_test_xxxxx` → Railway env

### 4.3 Webhook (Test mode)
Developers → Webhooks → Add endpoint:
```
URL: https://your-backend.railway.app/api/webhook/stripe
Events: payment_intent.succeeded
```

### 4.4 Test cards
```
4242 4242 4242 4242 — Thành công
4000 0000 0000 0002 — Thất bại
```

---

## 📋 Bước 5: Authentication (Clerk — Free)

### 5.1 Đăng ký
```
https://clerk.com
```

### 5.2 Lấy Publishable key
```
pk_test_xxxxx → VITE_CLERK_PUBLISHABLE_KEY
```

**Free tier:** 10,000 monthly active users

---

## 📋 Bước 6: Email (Resend — Free)

### 5.1 Đăng ký
```
https://resend.com
```

### 5.2 API Key
```
RESEND_API_KEY=re_xxxxx → Railway env
```

**Free:** 3,000 emails/tháng

---

## 🚀 QUICK START (Copy-Paste)

### Terminal 1 — Build & Push
```bash
# Build locally
cd /path/to/novashop
npm install
npm run build

# Push to GitHub
git add .
git commit -m "Production ready"
git push origin main
```

### Browser — Deploy services

| Thứ tự | Trang web | Việc làm |
|--------|-----------|----------|
| 1 | vercel.com | Import GitHub repo → Deploy |
| 2 | railway.app | New project → Deploy server folder |
| 3 | firebase.google.com | Create project → Copy config |
| 4 | stripe.com | Get API keys |
| 5 | clerk.com | Get publishable key |
| 6 | resend.com | Get API key |

---

## 📊 Giới hạn FREE Tier

| Dịch vụ | Giới hạn | Đủ dùng? |
|---------|----------|----------|
| Vercel | 100GB bandwidth/tháng | ✅ Shop nhỏ-vừa |
| Railway | $5 credit/tháng | ✅ Backend chạy 24/7 |
| Firebase | 1GB DB, 10GB storage | ✅ < 1000 sản phẩm |
| Clerk | 10k users/tháng | ✅ |
| Resend | 3k emails/tháng | ✅ ~100 đơn/ngày |
| Cloudinary | 25GB storage | ✅ Ảnh sản phẩm |

---

## 🔄 Auto-Deploy (Git push = Deploy)

Khi bạn `git push`:
1. **Vercel** tự deploy frontend mới
2. **Railway** tự deploy backend mới

**Không cần làm gì thêm!**

---

## 🆘 Nếu vượt quá FREE tier

| Dịch vụ | Giá nâng cấp | Khi nào cần |
|---------|-------------|-------------|
| Vercel Pro | $20/tháng | >100GB bandwidth |
| Railway | Pay-as-you-go | >$5 credit |
| Firebase Blaze | Pay-as-you-go | >1GB database |

**Kinh nghiệm:** Free tier đủ cho shop 100-500 đơn/ngày.

---

## ✅ CHECKLIST FREE DEPLOY

- [ ] Đăng ký Vercel → Deploy frontend
- [ ] Đăng ký Railway → Deploy backend  
- [ ] Tạo Firebase project → Copy config
- [ ] Đăng ký Stripe test → Lấy API keys
- [ ] Đăng ký Clerk → Lấy publishable key
- [ ] Đăng ký Resend → Lấy API key
- [ ] Copy tất cả keys vào Vercel + Railway env
- [ ] Test thanh toán với thẻ test
- [ ] 🎉 Website live MIỄN PHÍ!

---

## 📞 Hỗ trợ miễn phí

- Vercel Discord: https://discord.gg/vercel
- Railway Discord: https://discord.gg/railway
- Stripe IRC: https://stripe.com/go/developer-chat

---

**🎯 Kết quả: Website thương mại điện tử hoàn chỉnh chạy 24/7 với $0/tháng!**
