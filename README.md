# NovaShop - Website bán hàng

Dự án website bán hàng **Max Premium** xây dựng bằng **React + Vite + React Router**, có trải nghiệm luxury ecommerce, trang chủ boutique, chi tiết sản phẩm, giỏ hàng, thanh toán, đăng nhập và trang quản trị.

## Tính năng

- Trang chủ premium với hero cinematic, brand strip, luxury collections, concierge VIP, deal countdown, FAQ
- 20 sản phẩm mẫu chia theo 6 danh mục
- Tìm kiếm và lọc sản phẩm theo danh mục
- Trang chi tiết sản phẩm có gallery, chọn màu, size, số lượng
- Giỏ hàng dạng drawer
- Trang thanh toán: mã giảm giá, chọn COD / Bank / Momo / **Stripe** (thẻ quốc tế)
- Đăng ký / đăng nhập: **Clerk** (thật) hoặc fallback `localStorage` — dual mode
- **Đơn hàng** lưu Firestore với trạng thái: pending → paid → processing → shipped → delivered
- Trang quản trị `/admin`: quản lý **sản phẩm + đơn hàng**, cập nhật trạng thái đơn
- Backend mini (Express + Stripe API) cho thanh toán
- SEO: meta, Open Graph, schema.org, `robots.txt`
- Giao diện luxury navy/gold/cream, product card cao cấp, hover motion, glassmorphism
- Hiệu năng: code splitting với `React.lazy`, `memo`, `useMemo`, lazy load ảnh
- Responsive mobile / tablet / desktop
- Hỗ trợ truy cập (ARIA labels, focus visible, semantic HTML)

## Chạy dự án

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`.

## Build production

```bash
npm run build
npm run preview
```

## Cấu trúc thư mục

```
src/
  main.jsx            -> bootstrap React + Router
  App.jsx             -> providers + routes
  styles.css          -> toàn bộ CSS
  data/products.js    -> dữ liệu 20 sản phẩm
  utils/format.js     -> định dạng tiền VND
  context/
    AuthContext.jsx
    CartContext.jsx
    ProductsContext.jsx
  components/
    Header.jsx
    Footer.jsx
    ProductCard.jsx
    CartDrawer.jsx
    AuthModal.jsx
  pages/
    HomePage.jsx
    ProductDetailPage.jsx
    CheckoutPage.jsx
    AdminPage.jsx
```

## Tài liệu mở rộng

- `PROMPTS.md` - bộ 16 prompt Max Premium để tiếp tục phát triển
- `CLERK_SETUP.md` - hướng dẫn kích hoạt đăng nhập thật với Clerk
- `BACKEND_SETUP.md` - hướng dẫn kích hoạt bán hàng thật (Firebase + Stripe)
- `PRODUCTION_LAUNCH.md` - checklist đưa NovaShop thành website chính thức
- `BACKEND.md` - thiết kế API + database
- `DEPLOY.md` - hướng dẫn triển khai production

## Tài khoản dùng thử

- **User**: tự đăng ký bằng email bất kỳ (mật khẩu ≥ 6 ký tự).
- **Admin**: đăng ký với email `admin@novashop.vn` để vào trang `/admin`.
