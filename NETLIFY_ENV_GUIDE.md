# 🌐 NETLIFY ENVIRONMENT VARIABLES GUIDE — TRỌNG ĐỊNH STORE

> Hướng dẫn set biến môi trường trên Netlify để website chạy production.

---

## Cách set

1. Vào **https://app.netlify.com/sites/trong-dinh-store**
2. **Site settings → Environment variables**
3. Click **"Add a variable"**
4. Nhập từng cặp `KEY=value`
5. Deploy lại (Netlify auto-build)

---

## Danh sách biến cần set

### 🔐 BẮT BUỘC — Website không chạy nếu thiếu

| Key | Ví dụ | Lấy từ đâu |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyBcMx...` | Firebase Console → Project Settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | `trantuantu-fa889.firebaseapp.com` | Firebase Console |
| `VITE_FIREBASE_PROJECT_ID` | `trantuantu-fa889` | Firebase Console |
| `VITE_FIREBASE_STORAGE_BUCKET` | `trantuantu-fa889.firebasestorage.app` | Firebase Console |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `121842255709` | Firebase Console |
| `VITE_FIREBASE_APP_ID` | `1:121842255709:web:xxx` | Firebase Console |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_xxx` | Clerk Dashboard → Production Instance |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_xxx` | Stripe Dashboard → API keys |

### 🏪 THÔNG TIN SHOP

| Key | Ví dụ |
|---|---|
| `VITE_SHOP_NAME` | `TRỌNG ĐỊNH STORE` |
| `VITE_SHOP_PHONE` | `0369712958` |
| `VITE_SHOP_EMAIL` | `tutrantuan988@gmail.com` |
| `VITE_SHOP_DOMAIN` | `trong-dinh-store.netlify.app` |
| `VITE_SHOP_ADDRESS` | `Hà Nội, Việt Nam` |
| `VITE_ADMIN_EMAILS` | `tutrantuan988@gmail.com` |

### 🤖 AI COPILOT (Tùy chọn)

Chọn 1 trong các option:

**Option A: OpenAI**
```
VITE_OPENAI_API_KEY=sk-xxx
VITE_LLM_BASE_URL=https://api.openai.com/v1
VITE_LLM_MODEL=gpt-4o-mini
```

**Option B: Google Gemini (free)**
```
VITE_GEMINI_API_KEY=AIza...
VITE_LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
VITE_LLM_MODEL=gemini-2.0-flash
```

**Option C: Tắt hẳn AI**
```
VITE_DISABLE_AI_COPILOT=true
```

### 📊 ANALYTICS (Tùy chọn)

| Key | Ví dụ |
|---|---|
| `VITE_GA_ID` | `G-XXXXXXXXXX` |
| `VITE_SENTRY_DSN` | `https://xxx@xxx.ingest.us.sentry.io/xxx` |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | `0.05` |

---

## Cách kiểm tra

Sau khi set xong, vào website → F12 → Console.
Không còn lỗi đỏ là OK! ✅

Hoặc chạy:
```bash
npm run check:env
```
