# TRỌNG ĐỊNH STORE — Coding Rules
> Inspired by everything-claude-code rules/

## 1. Naming Conventions
- **Components**: PascalCase (e.g., `ProductCard.jsx`, `CartDrawer.jsx`)
- **Hooks**: camelCase với prefix `use` (e.g., `useDebounce.js`, `useAuth.js`)
- **Utilities**: camelCase (e.g., `format.js`, `exportCsv.js`)
- **Pages**: PascalCase + Page suffix (e.g., `HomePage.jsx`, `CheckoutPage.jsx`)
- **API routes**: lowercase + hyphens (e.g., `/api/products`, `/api/checkout/guest`)
- **Files**: Same as component/hook name

## 2. Import Order
```javascript
// 1. React & libraries
import React from 'react';
// 2. Third-party packages
import { useAuth } from '@clerk/clerk-react';
// 3. Internal components
import { Header } from './components/Header';
// 4. Context & services
import { useCart } from './context/CartContext';
// 5. Utilities & styles
import { formatPrice } from './utils/format';
import './styles.css';
```

## 3. Error Handling
- **API calls**: Luôn dùng try/catch + hiển thị user-friendly error
- **Firebase**: Kiểm tra `error.code` để xử lý cụ thể (e.g., `permission-denied`)
- **Stripe**: Catch `payment_intent.payment_failed` event
- **Global error**: Sentry capture + user notification via Toast

## 4. Security
- **Input sanitization**: Luôn dùng `sanitizeText()` cho user input
- **Rate limiting**: Admin endpoints có rate limit riêng
- **Admin API**: Xác thực bằng `x-admin-email` + `Authorization: Bearer <token>`
- **Environment variables**: Không hardcode secrets, luôn dùng `.env.local`
- **Firestore rules**: Validate ownership trước khi đọc/ghi

## 5. Performance
- **Images**: Dùng `ProgressiveImage` component với lazy loading
- **Code splitting**: Dùng dynamic import cho các page nặng
- **Cache**: Firestore cache + Algolia cho search
- **Bundle**: Theo dõi chunk size, avoid large libraries

## 6. Testing
- **E2E**: Playwright cho critical flows (checkout, payment, auth)
- **API**: Test với curl scripts
- **Manual**: Kiểm tra responsive trên mobile trước khi deploy

## 7. State Management
- **Local state**: useState/useReducer cho component-specific
- **Global state**: React Context (Auth, Cart, Products, I18n, Theme)
- **Server state**: React Query cho API calls
- **Persistence**: Firestore sync + localStorage

## 8. Git Conventions
- **Branch**: `feature/xxx`, `fix/xxx`, `refactor/xxx`
- **Commit**: `type(scope): message` (e.g., `feat(checkout): add Stripe payment`)
- **Types**: feat, fix, refactor, docs, style, test, chore

## 9. Accessibility
- **Alt text**: Tất cả images có alt text
- **ARIA labels**: Buttons và interactive elements có aria-label
- **Keyboard nav**: Tab order hợp lý, focus indicators
- **Color contrast**: Đảm bảo text/background contrast ratio

## 10. Documentation
- **Components**: Props documentation
- **API**: Swagger docs cho backend endpoints
- **Environment**: Cập nhật `.env.local.example` khi thêm env mới
- **Changelog**: Ghi lại breaking changes
