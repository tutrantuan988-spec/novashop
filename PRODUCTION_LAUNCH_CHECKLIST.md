# Production Launch Checklist

> Checklist kiểm tra trước khi ra mắt production cho NovaShop

---

## Security

- [ ] **Environment Variables**: Đảm bảo không commit file `.env.local` hoặc bất kỳ file chứa key thật
- [ ] **API Keys Production**: Đã chuyển sang production keys (Clerk `pk_live_`, Stripe `sk_live_`)
- [ ] **Firebase Rules**: Firestore rules đã cấu hình đúng cho production (đọc/ghi quyền hạn)
- [ ] **HTTPS**: Domain đã cấu hình HTTPS (Netlify tự động, nhưng verify)
- [ ] **CORS Headers**: Backend CORS đã cấu hình cho domain production
- [ ] **Rate Limiting**: Backend rate limiting đã bật cho tất cả public endpoints
- [ ] **Input Sanitization**: Backend sử dụng `sanitizeText` cho tất cả input người dùng
- [ ] **Secret Management**: Service account Firebase và các secret khác đã lưu ở nơi an toàn (không commit)

---

## Backend

- [ ] **Build Success**: `npm run build` thành công, không lỗi
- [ ] **Health Check**: `/api/health` trả về `{ status: 'healthy' }` khi deploy
- [ ] **Database Connection**: Firestore Admin SDK kết nối thành công
- [ ] **Email Service**: Resend API key đã cấu hình, gửi email test thành công
- [ ] **Stripe Webhook**: Webhook endpoint `/api/stripe-webhook` đã cấu hình đúng signing secret
- [ ] **Cron Jobs**: Abandoned cart job đã bật và hoạt động
- [ ] **Error Logging**: Console logs đã review, không có thông tin nhạy cảm
- [ ] **Environment**: `NODE_ENV=production` đã set

---

## Frontend

- [ ] **Build Size**: `dist/` folder size hợp lý (< 5MB)
- [ ] **Code Splitting**: Manual chunks đã cấu hình (firebase, clerk, stripe, motion, forms)
- [ ] **Environment Variables**: Tất cả `VITE_*` đã set trên Netlify
- [ ] **Clerk Auth**: Login/Logout/Sign up hoạt động với production keys
- [ ] **Payment Flow**: Thanh toán Stripe Elements hoạt động
- [ **API Fallback**: Frontend hiển thị thông báo phù hợp khi backend unavailable
- [ ] **Chat Widget**: Hiển thị maintenance message khi backend không cấu hình
- [ ] **Dev Key Warning**: Banner cảnh báo dev key đã ẩn trên production
- [ ] **Contact Form**: Gửi email thành công khi backend có sẵn
- [ ] **Admin Panel**: Admin dashboard hoạt động, quản lý sản phẩm/đơn hàng
- [ ] **Cart Sync**: Giỏ hàng đồng bộ với Firestore khi đăng nhập

---

## SEO

- [ ] **Meta Tags**: Title, description, og:title, og:description, og:image đã cấu hình
- [ ] **Canonical URL**: Canonical tag trỏ đến domain production
- [ ] **Sitemap.xml**: Đã update với đúng domain và tất cả routes
- [ ] **Robots.txt**: Cho phép bot truy cập, block các thư mục không cần thiết
- [ ] **Structured Data**: JSON-LD LocalBusiness đã thêm
- [ ] **Page Speed**: Lighthouse score > 80 trên mobile/desktop
- [ ] **Mobile Friendly**: Responsive trên mọi kích thước màn hình
- [ ] **Alt Text**: Tất cả ảnh có alt text mô tả

---

## Payments

- [ ] **Stripe Test Mode**: Đã test với test cards (4242...), thanh toán thành công
- [ ] **Webhook Events**: `payment_intent.succeeded` đã xử lý, cập nhật order status
- [ ] **Currency**: Đã set currency là `VND` cho Stripe
- [ ] **Order Creation**: Backend tạo order với status `pending` trước khi thanh toán
- [ ] **Order Update**: Backend cập nhật status `paid` sau khi webhook nhận sự kiện
- [ ] **Email Notifications**: Email gửi cho khách hàng và admin sau khi thanh toán
- [ ] **Error Handling**: Hiển thị thông báo lỗi rõ ràng khi thanh toán thất bại

---

## Cross-Device & Performance

- [ ] **Desktop**: Test trên Chrome, Firefox, Safari, Edge
- [ ] **Mobile iOS**: Test trên iPhone Safari, Chrome
- [ ] **Mobile Android**: Test trên Chrome, Samsung Browser
- [ ] **Tablet**: Test trên iPad, Android tablets
- [ ] **Lazy Loading**: Ảnh lazy loading đã bật
- [ ] **Image Optimization**: Ảnh đã resize/compress (Unsplash auto)
- [ ] **Cache Headers**: Static assets có cache headers (netlify.toml)
- [ ] **Bundle Size**: JavaScript bundle size < 500KB (gzipped)
- [ ] **Loading Speed**: First Contentful Paint < 2s

---

## Pre-Launch Verification

- [ ] **Smoke Test**: Thử đặt đơn hàng từ đầu đến cuối (đăng nhập → thêm sản phẩm → thanh toán)
- [ ] **Admin Test**: Đăng nhập admin → thêm sản phẩm → xem đơn hàng
- [ ] **Email Test**: Gửi form liên hệ → nhận email admin
- [ ] **Auth Test**: Đăng xuất → đăng nhập lại → kiểm tra session
- [ ] **Mobile Test**: Thử smoke test trên mobile
- [ ] **Error Test**: Tắt backend → kiểm tra fallback UI
- [ ] **Analytics**: Google Analytics đã track page views (kiểm tra Realtime)
- [ ] **Backup**: Database backup đã cấu hình (Firebase tự động)

---

## Post-Launch Monitoring

- [ ] **Uptime Monitor**: Cấu hình uptime monitoring (UptimeRobot, Pingdom)
- [ ] **Error Tracking**: Sentry đã cấu hình để track lỗi runtime
- [ ] **Performance Monitor**: Google PageSpeed Insights scheduled monitoring
- [ ] **User Feedback**: Cấu hình Tawk.to hoặc chat widget để nhận feedback
- [ ] **Review Logs**: Kiểm tra server logs hàng tuần
- [ ] **Backup Strategy**: Đã có kế hoạch backup và restore

---

## Domain & SSL

- [ ] **Domain Configured**: Domain đã trỏ đến Netlify DNS
- [ ] **SSL Certificate**: SSL tự động từ Netlify, verify certificate valid
- [ ] **WWW Redirect**: Config redirect www → non-www hoặc ngược lại
- [ ] **Custom Domain**: Netlify site settings đã set custom domain

---

## Final Checklist

- [ ] Tất cả checklist trên đã hoàn thành
- [ ] Team đã review và approve
- [ ] Database đã seeded với dữ liệu sản phẩm thực tế
- [ ] Đã có kế hoạch marketing/launch
- [ ] Support team đã được đào tạo sử dụng admin panel
- [ ] Terms of Service, Privacy Policy đã update
- [ ] Contact info hiển thị đúng (phone, email, Zalo)
- [ ] Social media links hoạt động
- [ ] **READY TO LAUNCH** ✅

---

## Emergency Rollback Plan

Nếu có vấn đề sau khi launch:

1. **Immediate**: Disable payment flow (set Stripe key empty hoặc redirect checkout page)
2. **Backend**: Revert to previous deployment (Netlify deploy history)
3. **Database**: Firestore có automatic backup, restore nếu cần
4. **Communication**: Thông báo cho khách hàng qua email/social media
5. **Support**: Zalo/phone hotline sẵn sàng nhận support

---

## Dashboard Links

- **Netlify**: https://app.netlify.com
- **Clerk**: https://dashboard.clerk.com
- **Firebase**: https://console.firebase.google.com
- **Stripe**: https://dashboard.stripe.com
- **Resend**: https://resend.com/dashboard
- **Render/Railway**: https://dashboard.render.com hoặc https://dashboard.railway.app
