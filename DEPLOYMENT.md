# Hướng dẫn Deploy NovaShop

NovaShop là một ứng dụng full-stack gồm:

- **Frontend**: Vite + React (build ra `dist/`)
- **Backend**: Express server (`server/index.js`) phục vụ cả API và static files

Server đã tự serve `dist/` nên chỉ cần deploy 1 service duy nhất.

---

## 1. Deploy bằng Docker (khuyến nghị VPS)

### Yêu cầu

- VPS có Docker + Docker Compose
- File `.env.local` đã cấu hình đầy đủ
- Domain trỏ về IP server (tuỳ chọn)

### Lệnh deploy

```bash
git clone <repo-url>
cd Website
cp .env.example .env.local
# Chỉnh các biến trong .env.local
npm run deploy:docker
```

Server chạy ở `http://<server-ip>:3001`.

### Build thủ công

```bash
docker build -t novashop .
docker run -d -p 3001:3001 --env-file .env.local --name novashop novashop
```

### Reverse proxy với Nginx (HTTPS)

```nginx
server {
  listen 443 ssl http2;
  server_name your-domain.com;

  ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

  location / {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Sau đó cập nhật env:

```env
CLIENT_URL=https://your-domain.com
VITE_API_URL=
```

---

## 2. Deploy lên Render

File `render.yaml` đã cấu hình sẵn.

### Các bước

1. Push code lên GitHub.
2. Vào [https://dashboard.render.com](https://dashboard.render.com).
3. New → Blueprint → chọn repo NovaShop.
4. Render đọc `render.yaml`, hỏi các env cần `sync: false`.
5. Điền:
   - `VITE_FIREBASE_PROJECT_ID`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `CLIENT_URL` (URL public của Render)
   - `VITE_API_URL` (có thể để trống nếu frontend/API cùng domain Render)
   - `ADMIN_EMAILS`
   - `RESEND_API_KEY`, `EMAIL_FROM`
6. `ADMIN_API_TOKEN` Render tự sinh — lưu lại để admin nhập trong `/admin`. Không set token này dưới prefix `VITE_`.
7. Nhấn **Apply** → Render build và deploy tự động.

### Service Account Firebase trên Render

- Vào Project Settings của Firebase → Service accounts → Generate new private key.
- Trong Render dashboard → service novashop-api → Environment → Secret Files → upload file JSON với path `/etc/secrets/firebase-admin.json`.
- Thêm env: `GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/firebase-admin.json`.

---

## 3. Deploy lên Railway

Tương tự Render. Tạo project mới từ repo, Railway tự nhận `package.json`:

- Build command: `npm run build`
- Start command: `npm start`
- Port: `3001`

Set env tương tự mục Render.

---

## 4. Deploy frontend riêng (Vercel/Netlify) + backend riêng

Nếu muốn tách:

### Frontend (Vercel)

- Build command: `npm run build`
- Output directory: `dist`
- Env: tất cả biến `VITE_*`

### Backend (Render/Railway/Fly.io)

- Chỉ deploy `server/` + `package.json`
- Env: biến không có prefix `VITE_`

Cập nhật `VITE_API_URL` trên Vercel = URL backend.

CORS đã whitelist `CLIENT_URL` nên đảm bảo set đúng.

---

## 5. Checklist trước khi golive

- [ ] `.env.local` đã có đầy đủ key Firebase, Stripe, Resend, Cloudinary
- [ ] `STRIPE_WEBHOOK_SECRET` lấy từ Stripe Dashboard và set đúng
- [ ] Stripe webhook endpoint đăng ký: `https://your-domain.com/api/stripe-webhook`
- [ ] `ADMIN_EMAILS` chứa email admin thật
- [ ] `ADMIN_API_TOKEN` đã sinh, không public ra frontend, admin có secret để đăng nhập dashboard
- [ ] Firestore Rules đã publish theo `firestore.rules`
- [ ] Service account Firebase đã set qua `GOOGLE_APPLICATION_CREDENTIALS` hoặc `FIREBASE_SERVICE_ACCOUNT_JSON`
- [ ] Test thanh toán thật bằng card live (1 đơn nhỏ)
- [ ] Test webhook bằng Stripe CLI: `stripe listen --forward-to https://your-domain.com/api/stripe-webhook`
- [ ] SEO: `sitemap.xml`, `robots.txt`, meta tags
- [ ] Backup Firestore định kỳ (Firebase Console → Backups)

---

## 6. Monitor và logs

- **Stripe Dashboard**: theo dõi giao dịch, webhook events
- **Firebase Console**: theo dõi orders/products
- **Render/Railway logs**: lỗi server real-time
- **Resend Dashboard**: theo dõi email delivery
