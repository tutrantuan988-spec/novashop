# NovaShop Production Launch

Tài liệu này dùng để đưa NovaShop thành một website chính thức: frontend + backend + database + thanh toán thật.

## 1. Kiến trúc chính thức

NovaShop hiện chạy như một ứng dụng thống nhất:

- **Frontend:** React + Vite, build ra thư mục `dist/`
- **Backend:** Express server trong `server/index.js`
- **Database:** Firebase Firestore
- **Auth:** Clerk
- **Payment:** Stripe Checkout

Ở production, server Express sẽ:

- Phục vụ frontend từ `dist/`
- Xử lý API `/api/create-checkout-session`
- Cho phép React Router hoạt động khi refresh đường dẫn con

## 2. Chạy production local

```bash
npm install
npm run build
npm start
```

Mở:

```text
http://localhost:3001
```

Kiểm tra API:

```text
http://localhost:3001/api/health
```

Nếu thấy `{"ok":true}` là backend hoạt động.

## 3. Environment variables production

Dùng file `.env.production.example` làm mẫu.

Các biến `VITE_...` là public key cho frontend.
Các biến không có `VITE_` là private key cho backend.

### Không commit file chứa key thật

File `.gitignore` đã bỏ qua:

```text
.env
.env.local
.env.*.local
```

Khi deploy, đặt env variables trực tiếp trong dashboard hosting.

## 4. Firebase chính thức

Bạn đã tạo Firebase project và Firestore.

Cần kiểm tra:

1. Firestore Database đã bật
2. Collection `products` có dữ liệu
3. Collection `orders` sinh ra khi đặt hàng
4. Rules nên siết lại trước khi mở công khai

Rules gợi ý:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{product} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /orders/{order} {
      allow create: if true;
      allow read, update: if request.auth != null;
    }
  }
}
```

## 5. Stripe chính thức

Hiện tại bạn đang dùng `pk_test_...` và `sk_test_...`, chỉ để test.

Để thu tiền thật:

1. Vào Stripe Dashboard
2. Nhấn **Switch to live account**
3. Hoàn tất xác minh doanh nghiệp/cá nhân
4. Lấy live keys:
   - `pk_live_...`
   - `sk_live_...`
5. Cập nhật env production:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
CLIENT_URL=https://your-domain.com
VITE_API_URL=https://your-domain.com
```

## 6. Clerk chính thức

Hiện tại Clerk key đang là test/dev key.

Để dùng domain thật:

1. Vào Clerk Dashboard
2. Chọn app NovaShop
3. Configure domain production
4. Lấy publishable key production nếu Clerk yêu cầu
5. Cập nhật:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

## 7. Deploy lên Render/Railway/VPS

### Build command

```bash
npm install && npm run build
```

### Start command

```bash
npm start
```

### Port

Hosting sẽ tự inject `PORT`. Server đã đọc `process.env.PORT`.

### Environment variables

Copy toàn bộ biến trong `.env.production.example` vào dashboard hosting.

## 8. Domain chính thức

Sau khi deploy, bạn sẽ có URL dạng:

```text
https://novashop.onrender.com
```

Hoặc domain riêng:

```text
https://novashop.vn
```

Cần cập nhật:

```env
CLIENT_URL=https://novashop.vn
VITE_API_URL=https://novashop.vn
```

Trong Clerk và Stripe cũng cần thêm domain production vào allowed origins/redirect URLs nếu được yêu cầu.

## 9. Stripe Webhook (xác nhận thanh toán thật)

Backend đã có endpoint:

```text
POST /api/stripe-webhook
```

### Test local với Stripe CLI

1. Cài Stripe CLI: https://docs.stripe.com/stripe-cli
2. Login:
   ```bash
   stripe login
   ```
3. Forward sự kiện về local:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe-webhook
   ```
4. Copy `whsec_...` vào `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
5. Restart backend.

### Production

- Vào Stripe Dashboard → Developers → Webhooks → Add endpoint
- URL: `https://your-domain.com/api/stripe-webhook`
- Sự kiện cần subscribe: `checkout.session.completed`
- Copy signing secret vào env hosting

Khi webhook chạy đúng: đơn hàng tự động cập nhật `status=paid`, `paymentStatus=paid`, `paidAt=now`.

## 10. Firebase Admin SDK (server-side validation)

Backend dùng `firebase-admin` để:
- Validate giá sản phẩm từ Firestore (chống tampering từ client)
- Cập nhật trạng thái đơn hàng từ webhook

### Local
Backend tự dùng `applicationDefault` — chỉ cần `VITE_FIREBASE_PROJECT_ID` trong `.env.local`. Nếu thiếu, sẽ fallback dùng giá từ client (kém an toàn hơn).

### Production
Cần service account JSON:
1. Firebase Console → Project Settings → Service accounts → Generate new private key
2. Tải file JSON về
3. Lưu trên hosting (Render: secret file; VPS: file riêng)
4. Set env:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
   ```

## 11. Firestore Rules

File `firestore.rules` đã sẵn:
- **products:** read public, write chỉ admin
- **orders:** create public (cho guest checkout), read chính chủ + admin, update/delete chỉ admin

Deploy rules:

```bash
firebase deploy --only firestore:rules
```

Hoặc copy nội dung paste thủ công vào Firebase Console → Firestore → Rules.

## 12. Checklist trước khi mở bán

- [ ] Website deploy thành công
- [ ] `/api/health` trả `{"ok":true, "stripe":true, "firebaseAdmin":true}`
- [ ] Đăng ký/đăng nhập Clerk hoạt động
- [ ] Sản phẩm đọc từ Firestore
- [ ] Đặt hàng tạo document trong `orders`
- [ ] Stripe Checkout redirect đúng
- [ ] Webhook cập nhật `status=paid` sau khi thanh toán
- [ ] Trang `/thanh-toan/thanh-cong` hiển thị đúng
- [ ] Trang `/tai-khoan` hiện lịch sử đơn hàng
- [ ] Admin dashboard hiện stats (doanh thu, đơn pending)
- [ ] Admin xem chi tiết đơn + cập nhật trạng thái
- [ ] Admin export CSV đơn hàng
- [ ] Toast thông báo hoạt động
- [ ] 404 page hoạt động khi vào URL sai
- [ ] SEO meta + JSON-LD trên trang sản phẩm
- [ ] Firestore rules đã bảo mật (không phải test mode)
- [ ] Secret keys không nằm trong GitHub
- [ ] Domain production đã cập nhật trong Stripe/Clerk
