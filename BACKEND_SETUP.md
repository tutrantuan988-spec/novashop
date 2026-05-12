# Hướng dẫn kích hoạt bán hàng thật — Firebase + Stripe

Sau khi hoàn tất, NovaShop sẽ có:
- **Sản phẩm** lưu trên Firebase Firestore (không còn mock)
- **Đơn hàng** lưu thật trên Firestore với trạng thái xử lý
- **Thanh toán** qua Stripe (thẻ quốc tế Visa/MasterCard)
- **Admin** quản lý sản phẩm + đơn hàng từ database

## Dual Mode (tự động)

- **Chưa có Firebase config**: Dùng `localStorage` cho sản phẩm + đơn hàng mock
- **Đã có Firebase config**: Tự động chuyển sang Firestore thật

---

## Bước 1: Tạo Firebase Project

1. Truy cập [https://console.firebase.google.com](https://console.firebase.google.com)
2. Nhấn **Create project** → đặt tên `novashop` → nhấn **Continue**
3. Tắt Google Analytics (hoặc bật nếu muốn) → **Create project**
4. Đợi 1 phút cho project sẵn sàng, nhấn **Continue**

## Bước 2: Tạo Firestore Database

1. Trong dashboard Firebase, vào **Build → Firestore Database**
2. Nhấn **Create database**
3. Chọn **Start in test mode** (cho phép read/write tạm thời)
4. Chọn vùng **asia-southeast1** (Singapore — gần Việt Nam nhất)
5. Nhấn **Enable**

### ⚠️ Bảo mật Firestore (quan trọng)

Sau khi test xong, vào **Rules** và cập nhật:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{product} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /orders/{order} {
      allow read: if request.auth != null;
      allow write: if true;
    }
  }
}
```

Nhấn **Publish**.

## Bước 3: Lấy Firebase Config

1. Trong dashboard Firebase, nhấn **Project settings** (biểu tượng bánh răng)
2. Tab **General**, kéo xuống **Your apps** → nhấn **</> Add web app**
3. Đặt nickname: `NovaShop Web` → nhấn **Register app**
4. Copy đoạn config (dạng `const firebaseConfig = {...}`)
5. Trích xuất các giá trị và dán vào `.env.local`:

```env
VITE_FIREBASE_API_KEY=AIzaSyA...
VITE_FIREBASE_AUTH_DOMAIN=novashop-xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=novashop-xxx
VITE_FIREBASE_STORAGE_BUCKET=novashop-xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

## Bước 4: Tạo Stripe Account

1. Truy cập [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Đăng ký bằng email
3. Vào **Developers → API keys**
4. Copy:
   - **Publishable key** (`pk_test_...`) → dán vào `.env.local`
   - **Secret key** (`sk_test_...`) → dán vào `.env.local`

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
CLIENT_URL=http://localhost:5173
```

## Bước 5: Khởi động hệ thống

**Terminal 1 — Frontend:**
```bash
npm run dev
```

**Terminal 2 — Backend (Stripe server):**
```bash
node server/index.js
```

## Bước 6: Seed sản phẩm (lần đầu)

Mở trang chủ. Nếu Firestore trống, hệ thống tự động dùng seed data từ `src/data/products.js`. Bạn có thể thêm/sửa/xóa sản phẩm từ trang `/admin` — dữ liệu sẽ đồng bộ Firestore.

## Bước 7: Test thanh toán

1. Thêm sản phẩm vào giỏ hàng
2. Vào **Thanh toán**
3. Chọn phương thức **Thẻ quốc tế (Stripe)**
4. Điền thông tin giao hàng → nhấn **Đặt hàng**
5. Bạn sẽ được redirect sang Stripe Checkout
6. Dùng **test card**: `4242 4242 4242 4242`, bất kỳ ngày tương lai, bất kỳ CVC
7. Sau thanh toán, redirect về `PaymentSuccessPage` và đơn hàng được lưu Firestore

## Kiểm tra đơn hàng

1. Vào `/admin` bằng tài khoản admin
2. Chuyển sang tab **Đơn hàng**
3. Thấy đơn hàng vừa đặt → cập nhật trạng thái từ dropdown

## Bảo mật Admin API (khuyến nghị production)

Backend hiện chấp nhận admin nếu header `x-admin-email` thuộc danh sách `ADMIN_EMAILS`. Để chắc chắn hơn, bật thêm shared secret:

1. Sinh chuỗi ngẫu nhiên đủ dài (32+ ký tự), ví dụ:
   ```bash
   openssl rand -hex 32
   ```
2. Cập nhật `.env.local`:
   ```env
   ADMIN_API_TOKEN=chuoi_ngau_nhien_cua_ban
   ```
3. Không đặt token dưới prefix `VITE_` để tránh lộ trong bundle frontend.
4. Khi vào `/admin`, quản trị viên nhập secret một lần. Frontend lưu trong `sessionStorage` và gửi qua header `Authorization: Bearer <token>`. Backend từ chối nếu sai.

## Firebase Admin Service Account (production)

Trên production server, đăng ký Firebase Admin SDK bằng service account thay vì chỉ truyền `projectId`:

1. Firebase Console → Project settings → tab **Service accounts**.
2. Nhấn **Generate new private key** → tải file JSON về.
3. Đặt file JSON trên server (không commit vào git).
4. Cấu hình env trên hosting:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=/duong/dan/serviceAccountKey.json
   ```
5. Firebase Admin SDK sẽ tự đọc credential từ biến môi trường này.

## Triển khai production

Khi deploy, bạn cần:

1. **Deploy backend** (Render, Railway, hoặc VPS):
   ```bash
   # Chỉ cần upload folder server/ lên hosting Node.js
   # Đặt biến môi trường STRIPE_SECRET_KEY và CLIENT_URL
   ```

2. **Cập nhật `VITE_API_URL`** trong `.env.local` trỏ đến URL backend

3. **Chuyển Stripe sang live mode**:
   - Kích hoạt tài khoản Stripe (cần thông tin doanh nghiệp)
   - Dùng `pk_live_...` và `sk_live_...`
   - Stripe sẽ trừ phí ~2.9% + 0.30 USD/giao dịch

## Chi phí dự kiến

| Dịch vụ | Free tier | Khi vượt |
|---------|----------|---------|
| Firebase Firestore | 50k đọc/ghi/ngày | ~$0.036/100k reads |
| Firebase Hosting | 1GB/tháng | $0.15/GB |
| Clerk | 10k user/tháng | $25/tháng |
| Stripe | Miễn phí tích hợp | 2.9% + $0.30/giao dịch |

---

**Nếu chỉ muốn test cục bộ** mà không muốn setup Firebase/Stripe, bạn vẫn có thể chạy NovaShop bình thường — dual mode sẽ tự động fallback về `localStorage`.
