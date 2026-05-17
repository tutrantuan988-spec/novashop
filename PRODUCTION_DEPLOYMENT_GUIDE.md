# 🚀 PRODUCTION DEPLOYMENT GUIDE — TRỌNG ĐỊNH STORE

> Hướng dẫn từng bước đưa website lên production.
> Ước tính: **15-20 phút**

---

## 📋 Mục lục

1. [🔥 Việc gấp — Commit & Push lên GitHub](#1--commit--push-lên-github)
2. [🔐 Clerk Auth — Switch từ Dev sang Production](#2--clerk-auth--switch-từ-dev-sang-production)
3. [🤖 PageAgent AI — Cấu hình LLM](#3--pageagent-ai--cấu-hình-llm)
4. [📦 Seed dữ liệu vào Firestore](#4--seed-dữ-liệu-vào-firestore)
5. [🌐 Deploy lên Netlify](#5--deploy-lên-netlify)
6. [🧪 Kiểm tra toàn bộ](#6--kiểm-tra-toàn-bộ)

---

## 1️⃣ 🔥 Commit & Push lên GitHub

```powershell
cd "C:\Users\TUAN TU\OneDrive\Desktop\Website"
git add -A
git commit -m "feat: tong hop MCP GitHub projects + production ready"
git push
```

> ⏱ 30 giây

---

## 2️⃣ 🔐 Clerk Auth — Switch từ Dev sang Production

### Vấn đề
Hiện tại đang dùng **`pk_test_xxx`** (development key).
Development keys bị giới hạn: max 100 users, hay bị logout, không dùng được cho production.

### Cách fix

#### Bước 1: Vào Clerk Dashboard
1. Mở https://dashboard.clerk.com
2. Click **"Go to production"** hoặc tạo **Production Instance** mới

#### Bước 2: Lấy Production Keys
- `VITE_CLERK_PUBLISHABLE_KEY` = `pk_live_xxxxxxxxxxxx`
- `CLERK_SECRET_KEY` = `sk_live_xxxxxxxxxxxx`

#### Bước 3: Set trên Netlify
1. Vào **Netlify → Site settings → Environment variables**
2. Thêm 2 biến:
   - `VITE_CLERK_PUBLISHABLE_KEY` = `pk_live_...`
   - `CLERK_SECRET_KEY` = `sk_live_...`
3. Deploy lại (Netlify tự động build)

#### Bước 4: Test
- Vào https://trong-dinh-store.netlify.app/sign-in
- Đăng ký tài khoản mới → **Phải hoạt động bình thường**
- Vào Admin → Phải vào được (nếu email trong danh sách admin)

> ⏱ 5 phút

---

## 3️⃣ 🤖 PageAgent AI — Cấu hình LLM

### Vấn đề
PageAgent AI Copilot đang load nhưng thiếu LLM config → báo lỗi console.

### Cách fix

#### Option A: Dùng OpenAI (dễ nhất)
Thêm vào Netlify env vars:
```
VITE_OPENAI_API_KEY=sk-xxx
VITE_LLM_BASE_URL=https://api.openai.com/v1
VITE_LLM_MODEL=gpt-4o-mini
```

#### Option B: Dùng Google Gemini (miễn phí)
```
VITE_GEMINI_API_KEY=AIza...
VITE_LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
VITE_LLM_MODEL=gemini-2.0-flash
```

#### Option C: Tắt PageAgent (nếu không cần)
Nếu bạn chưa muốn dùng AI, config này sẽ ẩn AI Copilot đi:
```
VITE_DISABLE_AI_COPILOT=true
```

> ⏱ 3 phút

---

## 4️⃣ 📦 Seed dữ liệu vào Firestore

```bash
# Chạy seed để có sản phẩm mẫu trong Firestore
npm run seed
```

Script seed sẽ tạo:
- ✅ **50+ sản phẩm** (Royal Canin, Pedigree, Whiskas, Me-O,...)
- ✅ **Danh mục** (Thức ăn chó, Thức ăn mèo, Phụ kiện,...)
- ✅ **Đánh giá mẫu**

> ⏱ 2 phút

---

## 5️⃣ 🌐 Deploy lên Netlify

### Cách 1: Auto-deploy từ GitHub (khuyên dùng)
```yaml
# Đã config sẵn trong .github/workflows/deploy.yml
# Chỉ cần push lên main → Netlify tự build
git push origin main
```

### Cách 2: Deploy thủ công
```bash
npm run build
# Kéo thả thư mục dist/ vào Netlify
```

### Environment variables cần set trên Netlify

| Variable | Giá trị | Bắt buộc |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_xxx` | ✅ Có |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_xxx` | ✅ Có |
| `VITE_FIREBASE_API_KEY` | `AIza...` | ✅ Có |
| `VITE_FIREBASE_AUTH_DOMAIN` | `xxx.firebaseapp.com` | ✅ Có |
| `VITE_FIREBASE_PROJECT_ID` | `xxx` | ✅ Có |
| `VITE_FIREBASE_STORAGE_BUCKET` | `xxx.appspot.com` | ✅ Có |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `xxx` | ✅ Có |
| `VITE_FIREBASE_APP_ID` | `1:xxx` | ✅ Có |
| `VITE_SHOP_NAME` | `TRỌNG ĐỊNH STORE` | ✅ Có |
| `VITE_SENTRY_DSN` | (optional) | ❌ Tùy chọn |
| `VITE_GA_ID` | `G-XXXXXXXXXX` | ❌ Tùy chọn |

> ⏱ 3 phút

---

## 6️⃣ 🧪 Kiểm tra toàn bộ

Sau khi deploy, kiểm tra từng mục:

### ✅ Homepage
- [ ] Load được, không lỗi console
- [ ] Header hiển thị logo + nav + search
- [ ] Slideshow chạy
- [ ] Sản phẩm hiển thị

### ✅ Auth
- [ ] Đăng ký được (Clerk)
- [ ] Đăng nhập được
- [ ] Đăng xuất được

### ✅ Sản phẩm
- [ ] Click vào sản phẩm → xem chi tiết
- [ ] Search hoạt động
- [ ] Filter danh mục

### ✅ Giỏ hàng
- [ ] Thêm sản phẩm vào giỏ
- [ ] Xem giỏ hàng
- [ ] Xoá khỏi giỏ

### ✅ Admin
- [ ] Vào /admin
- [ ] Đăng nhập bằng email admin
- [ ] Tab **Import SP** hiển thị
- [ ] Tab **Sản phẩm**, **Đơn hàng**, **Khách hàng** hoạt động

### ✅ Checkout
- [ ] Thanh toán Stripe hoạt động

---

## 🆘 Cần hỗ trợ?

- **Clerk Dashboard**: https://dashboard.clerk.com
- **Netlify**: https://app.netlify.com
- **Firebase Console**: https://console.firebase.google.com
- **Stripe Dashboard**: https://dashboard.stripe.com

---

*Last updated: 2025*
