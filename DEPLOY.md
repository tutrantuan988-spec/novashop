# Hướng dẫn triển khai NovaShop lên production

## 1. Kiểm tra trước khi deploy

```bash
npm install
npm run build
npm run preview
```

- Mở `http://localhost:4173` để kiểm tra bản production.
- Đảm bảo không còn lỗi console.
- Kiểm tra hiệu năng bằng Lighthouse (Performance, Accessibility, SEO, Best Practices).

## 2. Biến môi trường

Tạo file `.env.production`:

```env
VITE_API_URL=https://api.novashop.example.com
```

## 3. Deploy lên Netlify

1. Push code lên GitHub.
2. Vào [https://app.netlify.com](https://app.netlify.com) → **New site from Git**.
3. Chọn repo, cấu hình:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. File `public/_redirects` đã có sẵn để hỗ trợ SPA routing.

## 4. Deploy lên Vercel

1. `npm i -g vercel`
2. Chạy `vercel` và làm theo hướng dẫn.
3. Trong Vercel dashboard chọn **Framework Preset: Vite**.

## 5. Deploy lên VPS / Docker

```Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

`nginx.conf`:

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri /index.html;
  }

  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;
}
```

## 6. Checklist sau deploy

- [ ] HTTPS hoạt động (Netlify/Vercel mặc định có)
- [ ] SPA routing đúng (truy cập trực tiếp `/san-pham/...` không lỗi 404)
- [ ] Ảnh hiển thị và lazy load tốt
- [ ] Lighthouse Performance ≥ 90
- [ ] Test trên iPhone Safari và Android Chrome
- [ ] Thêm Google Analytics / Plausible nếu cần
- [ ] Cấu hình domain riêng và DNS

## 7. Tối ưu hiệu năng đã áp dụng

- `React.lazy` + `Suspense` cho code splitting các trang `ProductDetail`, `Checkout`, `Admin`
- `React.memo` cho các component không thay đổi thường xuyên
- `useMemo` cho lọc/tính toán giỏ hàng và sản phẩm
- `useCallback` cho các hàm trong Context
- `loading="lazy"` và `decoding="async"` cho ảnh sản phẩm
- `fetchPriority="high"` cho hero image
- `preconnect` tới `images.unsplash.com`
- Tránh re-render bằng cách tách Context (`Auth`, `Cart`, `Products`)
- CSS gọn, không phụ thuộc utility framework nặng
