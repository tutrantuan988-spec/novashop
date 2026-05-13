# Deploy Checklist - NovaShop

## Mục tiêu deploy thật

NovaShop có thể chạy kiểu 1 website duy nhất trên Render:

- Frontend React được build ra `dist`
- Backend Express serve API `/api/*`
- Backend cũng serve SPA fallback từ `dist/index.html`

## 1. Env variables bắt buộc trên Render

| Biến | Ví dụ | Ghi chú |
|------|-------|---------|
| `NODE_ENV` | `production` | Bắt buộc |
| `CLIENT_URL` | `https://your-domain.com` | URL website chính |
| `PUBLIC_API_URL` | `https://your-domain.com` | Dùng cho payment return/ipn |
| `VITE_API_URL` | để trống hoặc `https://your-domain.com` | Để trống nếu frontend/API cùng domain |
| `VITE_SHOP_NAME` | `NovaShop` | Public |
| `VITE_SHOP_DOMAIN` | `your-domain.com` | Không gồm protocol |
| `VITE_SHOP_PHONE` | `0900 xxx xxx` | Public |
| `VITE_SHOP_EMAIL` | `support@your-domain.com` | Public |
| `VITE_SHOP_ADDRESS` | `Địa chỉ shop` | Public |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Public key |
| `VITE_ADMIN_EMAILS` | `admin@your-domain.com` | Public admin allowlist |
| `ADMIN_EMAILS` | `admin@your-domain.com` | Backend admin allowlist |
| `ADMIN_API_TOKEN` | random 32+ ký tự | Secret, không commit |
| `VITE_FIREBASE_API_KEY` | `AIza...` | Public Firebase config |
| `VITE_FIREBASE_AUTH_DOMAIN` | `project.firebaseapp.com` | Public Firebase config |
| `VITE_FIREBASE_PROJECT_ID` | `project-id` | Public Firebase config |
| `VITE_FIREBASE_STORAGE_BUCKET` | `project.firebasestorage.app` | Public Firebase config |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` | Public Firebase config |
| `VITE_FIREBASE_APP_ID` | `1:...:web:...` | Public Firebase config |
| `GOOGLE_APPLICATION_CREDENTIALS` | `/etc/secrets/firebase-admin.json` | Secret file path |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Public key |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Secret |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Secret |
| `RESEND_API_KEY` | `re_...` | Tuỳ chọn gửi email |
| `EMAIL_FROM` | `NovaShop <orders@your-domain.com>` | Tuỳ chọn |
| `ADMIN_NOTIFICATION_EMAIL` | `admin@your-domain.com` | Tuỳ chọn |

## 2. Firebase Admin

1. Vào Firebase Console → Project Settings → Service Accounts
2. Generate private key
3. Upload JSON lên Render Secret Files với tên `firebase-admin.json`
4. Set `GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/firebase-admin.json`
5. Sau deploy, `/api/health` phải báo Firestore healthy

## 3. Stripe

1. Set `VITE_STRIPE_PUBLISHABLE_KEY`
2. Set `STRIPE_SECRET_KEY`
3. Tạo webhook endpoint:
   - URL: `https://your-domain.com/api/stripe-webhook`
   - Event: `checkout.session.completed`
4. Copy signing secret vào `STRIPE_WEBHOOK_SECRET`
5. Test bằng thẻ sandbox: `4242 4242 4242 4242`

## 4. VNPay / MoMo

Chỉ bật khi bạn có thông tin merchant thật hoặc sandbox:

- `VNP_TMN_CODE`
- `VNP_HASH_SECRET`
- `VNP_URL`
- `MOMO_PARTNER_CODE`
- `MOMO_ACCESS_KEY`
- `MOMO_SECRET_KEY`
- `MOMO_ENDPOINT`

Nếu chưa có, website vẫn chạy với COD và Stripe.

## 5. Render deploy

Render Blueprint đang dùng `render.yaml`:

- Build command: `npm run build`
- Start command: `node server/index.js`

Các bước:

1. Push repo lên GitHub
2. Render → New → Blueprint
3. Chọn repo
4. Điền env vars
5. Upload Firebase secret file
6. Deploy

## 6. Smoke test sau deploy

- `/` load homepage
- `/api/health` trả `healthy`
- `/api/products` trả danh sách sản phẩm
- Đặt hàng COD thành công
- Thanh toán Stripe redirect đúng và webhook cập nhật đơn `paid`
- `/admin` đăng nhập admin và thêm/sửa/xóa sản phẩm
- SEO: `/robots.txt` và `/sitemap.xml` dùng đúng domain

## 7. Bảo mật

- Không commit `.env.local`, `env-render.json`, Firebase service account, Stripe secret
- Nếu secret từng bị commit hoặc paste public, rotate ngay trong dashboard
- `ADMIN_API_TOKEN` phải là chuỗi random mạnh, 32+ ký tự
- Production không dùng local auth fallback nếu thiếu Clerk key
