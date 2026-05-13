# 🚀 PRODUCTION ROADMAP — Từ Local đến Website Thật

## 📋 TỔNG QUAN

Chuyển từ `localhost` → Website production hoàn chỉnh với:
- ✅ Domain riêng (.com/.vn)
- ✅ Hosting/cloud server
- ✅ Database production
- ✅ Payment gateway thật (Stripe/MoMo/ZaloPay)
- ✅ Email service
- ✅ SSL/HTTPS
- ✅ CDN, caching, monitoring

---

## 🎯 PHASE 1: FOUNDATION (Ngày 1-2)

### 1.1 Mua Domain

| Nhà cung cấp | Giá/năm | Link |
|-------------|---------|------|
| **Namecheap** | ~$10 | https://namecheap.com |
| **Cloudflare** | ~$8 | https://dash.cloudflare.com |
| **GoDaddy** | ~$12 | https://godaddy.com |
| **PA Vietnam** | ~250k VND | https://pavietnam.vn (.vn) |

**Khuyến nghị:** Namecheap hoặc Cloudflare

### 1.2 Hosting/Cloud Server

**Option A: VPS (Khuyến nghị cho production)**
| Nhà cung cấp | Giá/tháng | Link |
|-------------|-----------|------|
| **DigitalOcean** | $6 | https://digitalocean.com |
| **Vultr** | $5 | https://vultr.com |
| **Linode** | $5 | https://linode.com |
| **AWS Lightsail** | $5 | https://lightsail.aws.amazon.com |

**Option B: Platform-as-a-Service (Dễ setup)**
| Platform | Free tier | Link |
|----------|-----------|------|
| **Railway** | Có | https://railway.app |
| **Render** | Có | https://render.com |
| **Fly.io** | Có | https://fly.io |

### 1.3 Cấu hình DNS

Sau khi mua domain, trỏ records:

```
Type    Name    Value
A       @       <SERVER_IP>
A       www     <SERVER_IP>
CNAME   api     <SERVER_IP>  (nếu backend riêng subdomain)
```

---

## 🎯 PHASE 2: CƠ SỞ HẠ TẦNG (Ngày 2-3)

### 2.1 Setup VPS (Nếu dùng VPS)

```bash
# SSH vào server
ssh root@<SERVER_IP>

# Update
apt update && apt upgrade -y

# Cài Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Cài PM2 (process manager)
npm install -g pm2

# Cài Nginx
apt install nginx -y

# Cài Certbot (SSL)
apt install certbot python3-certbot-nginx -y
```

### 2.2 Deploy Backend

```bash
# Clone code
git clone https://github.com/yourusername/novashop.git /var/www/novashop
cd /var/www/novashop/server

# Cài dependencies
npm install

# Tạo .env production
nano .env
```

**File `.env`:**
```env
NODE_ENV=production
PORT=3001

# Stripe LIVE
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Firebase Admin
GOOGLE_APPLICATION_CREDENTIALS=/var/www/novashop/serviceAccountKey.json

# Frontend URL (domain thật)
CLIENT_URL=https://novashop.com

# Email
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=TRỌNG ĐỊNH STORE <orders@novashop.com>
ADMIN_NOTIFICATION_EMAIL=admin@novashop.com

# MoMo LIVE (nếu có)
MOMO_PARTNER_CODE=MOMOxxxxx
MOMO_ACCESS_KEY=xxxxx
MOMO_SECRET_KEY=xxxxx
MOMO_ENDPOINT=https://payment.momo.vn/v2/gateway/api/create

# VNPay LIVE (nếu có)
VNP_TMN_CODE=xxxxx
VNP_HASH_SECRET=xxxxx
VNP_URL=https://pay.vnpay.vn/vpcpay.html
```

### 2.3 Chạy Backend với PM2

```bash
cd /var/www/novashop/server
pm2 start index.js --name "novashop-api"
pm2 save
pm2 startup
```

### 2.4 Cấu hình Nginx Reverse Proxy

```bash
nano /etc/nginx/sites-available/novashop
```

**Config:**
```nginx
server {
    listen 80;
    server_name novashop.com www.novashop.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/novashop /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 2.5 SSL Certificate (HTTPS)

```bash
certbot --nginx -d novashop.com -d www.novashop.com
```

---

## 🎯 PHASE 3: FRONTEND DEPLOY (Ngày 3)

### 3.1 Build Production

**File `.env.production` (trong thư mục gốc):**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx

VITE_FIREBASE_API_KEY=AIzaSyAxxxxx
VITE_FIREBASE_AUTH_DOMAIN=novashop-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=novashop-prod
VITE_FIREBASE_STORAGE_BUCKET=novashop-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxx

VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
VITE_API_URL=https://api.novashop.com  # hoặc /api nếu same domain

VITE_ADMIN_EMAILS=admin@novashop.com
```

```bash
# Build
npm run build

# Test build locally
npx serve dist
```

### 3.2 Deploy Frontend

**Option A: Vercel (Khuyến nghị)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Option B: Cloudflare Pages**
```bash
# Kết nối GitHub repo
# Auto deploy khi push
```

**Option C: VPS (Cùng server backend)**
```bash
# Copy build lên server
scp -r dist/* root@<SERVER_IP>:/var/www/novashop/dist/

# Cập nhật Nginx config phục vụ static files
```

---

## 🎯 PHASE 4: PAYMENT GATEWAYS (Ngày 4)

### 4.1 Stripe Production Setup

| Bước | Link | Mô tả |
|------|------|-------|
| Đăng ký | https://dashboard.stripe.com/register | Tạo account business |
| Xác minh | Dashboard → Settings → Account | Upload CMND + Bank account |
| Lấy API keys | https://dashboard.stripe.com/apikeys | Copy pk_live, sk_live |
| Webhooks | https://dashboard.stripe.com/webhooks | Add endpoint |

**Webhook endpoint:**
```
URL: https://api.novashop.com/api/webhook/stripe
Events: 
- payment_intent.succeeded
- payment_intent.payment_failed
- checkout.session.completed
```

### 4.2 MoMo Production Setup

**Đăng ký Merchant MoMo:**
```
https://business.momo.vn
```

**Yêu cầu:**
- Giấy phép kinh doanh
- CMND/CCCD
- Tài khoản ngân hàng

**Sau khi duyệt, nhận:**
- Partner Code
- Access Key
- Secret Key

### 4.3 VNPay Production Setup

**Đăng ký:**
```
https://vnpay.vn
```

**Liên hệ sales để mở merchant account.**

---

## 🎯 PHASE 5: DATABASE & STORAGE (Ngày 4-5)

### 5.1 Firebase Production

**Tạo project mới (không dùng dev):**
```
https://console.firebase.google.com
```

**Bật các service:**
- [ ] Firestore Database
- [ ] Authentication (Email/Password, Google)
- [ ] Storage (ảnh sản phẩm)
- [ ] Hosting (nếu dùng Firebase Hosting)

**Security Rules (Firestore):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.email in ["admin@novashop.com"];
    }
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (request.auth.token.email == resource.data.customer.email || 
         request.auth.token.email in ["admin@novashop.com"]);
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        request.auth.token.email in ["admin@novashop.com"];
    }
  }
}
```

### 5.2 Cloudinary (Ảnh sản phẩm)

```
https://cloudinary.com
```

**Upload preset:** Unsigned

---

## 🎯 PHASE 6: EMAIL & NOTIFICATIONS (Ngày 5)

### 6.1 Resend (Email service)

```
https://resend.com
```

**Setup:**
- Verify domain (DKIM, SPF records)
- Get API key: `re_xxxxx`

### 6.2 Telegram Bot (Notifications)

```
https://t.me/BotFather
```

Tạo bot → Lấy token → Gửi message khi có đơn hàng.

---

## 🎯 PHASE 7: MONITORING & ANALYTICS (Ngày 5-6)

### 7.1 Error Monitoring

| Service | Free tier | Link |
|---------|-----------|------|
| **Sentry** | 5k events/tháng | https://sentry.io |
| **LogRocket** | 1k sessions/tháng | https://logrocket.com |

### 7.2 Analytics

| Service | Purpose | Link |
|---------|---------|------|
| **Google Analytics 4** | Traffic | https://analytics.google.com |
| **Google Search Console** | SEO | https://search.google.com/search-console |

### 7.3 Uptime Monitoring

| Service | Link |
|---------|------|
| **UptimeRobot** | https://uptimerobot.com |
| **Pingdom** | https://pingdom.com |

---

## 🎯 PHASE 8: BACKUP & SECURITY (Ngày 6)

### 8.1 Backup Strategy

```bash
# Cron job backup database hàng ngày
0 2 * * * /var/www/novashop/scripts/backup.sh
```

### 8.2 Security Headers

**Nginx config:**
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### 8.3 Firewall

```bash
# UFW
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

---

## 📊 CHECKLIST HOÀN THÀNH

### Infrastructure
- [ ] Domain đã mua và trỏ DNS
- [ ] VPS/Cloud server đã chạy
- [ ] SSL certificate (HTTPS)
- [ ] Nginx reverse proxy
- [ ] PM2 running backend

### Services
- [ ] Firebase project production
- [ ] Stripe LIVE keys + webhooks
- [ ] MoMo merchant (nếu cần)
- [ ] Resend email verified
- [ ] Cloudinary upload preset

### Monitoring
- [ ] Sentry error tracking
- [ ] Google Analytics
- [ ] Uptime monitoring

### Security
- [ ] Firewall enabled
- [ ] Security headers
- [ ] Backup automation
- [ ] Webhook signature verification

---

## 💰 TỔNG CHI PHÍ ƯỚC TÍNH (Tháng đầu)

| Hạng mục | Chi phí |
|---------|---------|
| Domain (.com) | ~$10 (~250k VND) |
| VPS (DigitalOcean) | $6 (~150k VND) |
| Stripe | Miễn phí setup, 2.9% + $0.30/giao dịch |
| Resend | Miễn phí 3k emails/tháng |
| Sentry | Miễn phí 5k events/tháng |
| Cloudflare | Miễn phí |
| **TỔNG** | **~$16/tháng (~400k VND)** |

---

## 🚀 DEPLOY SCRIPT (Tự động hóa)

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Deploying NovaShop to Production..."

# Build frontend
npm run build

# Deploy to server
rsync -avz --delete dist/ root@novashop.com:/var/www/novashop/dist/

# Restart backend
ssh root@novashop.com "pm2 restart novashop-api"

echo "✅ Deploy complete!"
echo "🔗 https://novashop.com"
```

---

**Bắt đầu từ đâu?** ➡️ **Mua domain** → **Thuê VPS** → **Setup SSL** → **Deploy**

Tôi sẽ hướng dẫn chi tiết từng bước khi bạn sẵn sàng!
