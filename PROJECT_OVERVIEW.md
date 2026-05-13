# 🎯 NOVASHOP - PROJECT OVERVIEW & DEVELOPMENT PLAN

## 📊 SƠ ĐỒ ERD (Entity Relationship Diagram)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NOVASHOP ERD                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     USERS        │       │    PRODUCTS      │       │    CATEGORIES    │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │       │ id (PK)          │
│ clerkId          │       │ name             │       │ name             │
│ email            │       │ description      │       │ slug             │
│ name             │       │ price            │       │ image            │
│ phone            │       │ originalPrice    │       │ parentId (FK)    │
│ address          │       │ stock            │       │ createdAt        │
│ avatar           │       │ images[]         │       └────────┬─────────┘
│ role             │       │ categoryId (FK)──┼──────────────┘
│ createdAt        │       │ brand            │
└────────┬─────────┘       │ rating           │
         │                │ sold             │
         │                │ status           │
         │                │ createdAt        │
         │                └────────┬─────────┘
         │                         │
         │     ┌───────────────────┘
         │     │
         │     │       ┌──────────────────┐
         │     │       │   CART_ITEMS     │
         │     │       ├──────────────────┤
         │     │       │ id (PK)          │
         │     │       │ userId (FK)──────┼──────────────┐
         │     │       │ productId (FK)───┼──────┐       │
         │     │       │ quantity         │      │       │
         │     │       │ addedAt          │      │       │
         │     │       └──────────────────┘      │       │
         │     │                                   │       │
         │     │       ┌──────────────────┐       │       │
         │     └──────▶│    ORDERS        │◀──────┘       │
         │             ├──────────────────┤              │
         │             │ id (PK)          │              │
         │             │ userId (FK)──────┼──────────────┘
         │             │ items[]          │
         │             │ total            │
         │             │ subtotal         │
         │             │ shipping         │
         │             │ discount         │
         │             │ status           │
         │             │ paymentMethod    │
         │             │ paymentStatus    │
         │             │ shippingAddress  │
         │             │ createdAt        │
         │             └────────┬─────────┘
         │                      │
         │                      │
         │       ┌──────────────┘
         │       │
         │       │       ┌──────────────────┐
         │       │       │  ORDER_ITEMS     │
         │       │       ├──────────────────┤
         │       │       │ id (PK)          │
         │       │       │ orderId (FK)     │
         └───────┼──────▶│ productId (FK)───┼──────┐
                 │       │ quantity         │      │
                 │       │ price            │      │
                 │       └──────────────────┘      │
                 │                                 │
                 │       ┌──────────────────┐      │
                 │       │   WISHLIST       │      │
                 │       ├──────────────────┤      │
                 └──────▶│ id (PK)          │      │
                         │ userId (FK)      │      │
                         │ productId (FK)───┼──────┘
                         │ addedAt          │
                         └──────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     COUPONS      │       │  PAYMENTS        │       │    REVIEWS       │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │       │ id (PK)          │
│ code             │       │ orderId (FK)     │       │ userId (FK)      │
│ discountType     │       │ userId (FK)      │       │ productId (FK)   │
│ discountValue    │       │ amount           │       │ rating           │
│ minOrderValue    │       │ method           │       │ comment          │
│ maxDiscount      │       │ status           │       │ images[]         │
│ usageLimit       │       │ transactionId    │       │ createdAt        │
│ usedCount        │       │ createdAt        │       └──────────────────┘
│ expiresAt        │       └──────────────────┘
│ status           │
└──────────────────┘
```

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

### 1. Frontend Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    NOVASHOP FRONTEND                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  UI Layer (React + Vite + TailwindCSS)                  ││
│  │  ├── Pages: Home, Product, Category, Cart, Checkout     ││
│  │  ├── Components: Header, Footer, ProductCard, Forms     ││
│  │  └── Layouts: MainLayout, AdminLayout                   ││
│  └─────────────────────────────────────────────────────────┘│
│                              │                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  State Management (Context API)                          ││
│  │  ├── CartContext: Giỏ hàng                             ││
│  │  ├── AuthContext: Xác thực (Clerk)                      ││
│  │  ├── ProductsContext: Sản phẩm                           ││
│  │  └── WishlistContext: Yêu thích                         ││
│  └─────────────────────────────────────────────────────────┘│
│                              │                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Services Layer                                          ││
│  │  ├── API calls (REST)                                    ││
│  │  ├── Stripe Integration                                  ││
│  │  └── Firebase (Auth, Storage)                          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 2. Backend Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    NOVASHOP BACKEND                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Express.js Server                                       ││
│  │  ├── Routes: /api/products, /api/orders, /api/payments││
│  │  ├── Middleware: Auth, Validation, Rate Limiting        ││
│  │  └── Controllers: Business Logic                      ││
│  └─────────────────────────────────────────────────────────┘│
│                              │                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  External Services                                       ││
│  │  ├── Stripe: Payment Processing                         ││
│  │  ├── Firebase: Database (Firestore)                   ││
│  │  ├── Clerk: Authentication                            ││
│  │  └── Resend: Email Notifications                        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ TÍNH NĂNG HIỆN TẠI (Đã hoàn thành)

### 🎨 Frontend
| Module | Tính năng | Trạng thái |
|--------|-----------|------------|
| **Trang chủ** | Hero banner, sản phẩm nổi bật, flash sale | ✅ Done |
| **Sản phẩm** | Grid, filters, tìm kiếm, phân trang | ✅ Done |
| **Chi tiết SP** | Ảnh, mô tả, đánh giá, thêm giỏ hàng | ✅ Done |
| **Giỏ hàng** | Thêm/xóa/sửa số lượng, tính tổng | ✅ Done |
| **Thanh toán** | Form shipping, Stripe Elements, QR | ✅ Done |
| **Danh mục** | Dog food, Cat food, Accessories | ✅ Done |
| **Auth** | Đăng nhập/đăng ký (Clerk) | ✅ Done |
| **Admin** | Dashboard quản lý | ✅ Done |

### ⚙️ Backend
| Module | Tính năng | Trạng thái |
|--------|-----------|------------|
| **Products API** | CRUD sản phẩm | ✅ Done |
| **Orders API** | Tạo đơn, cập nhật status | ✅ Done |
| **Stripe** | PaymentIntent, webhook | ✅ Done |
| **Email** | Gửi mail xác nhận (Resend) | ✅ Done |

---

## 📋 KẾ HOẠCH PHÁT TRIỂN

### 📅 GIAI ĐOẠN 1: HOÀN THIỆN CORE (1-2 tuần)

#### 1.1 Product Management
| Task | Ưu tiên | Chi tiết |
|------|---------|----------|
| Thêm sản phẩm vào Firebase | 🔴 Cao | Tạo collection products với 20-30 sản phẩm mẫu |
| Upload ảnh sản phẩm | 🔴 Cao | Dùng Firebase Storage hoặc Cloudinary |
| Quản lý tồn kho | 🟡 TB | Cập nhật stock khi có đơn hàng |
| Danh mục phân cấp | 🟡 TB | Category → Sub-category |

#### 1.2 Order & Payment
| Task | Ưu tiên | Chi tiết |
|------|---------|----------|
| Test Stripe thanh toán | 🔴 Cao | Dùng thẻ test 4242 4242 4242 4242 |
| Test MoMo/VNPay | 🟡 TB | Tích hợp cổng thanh toán VN |
| Quản lý đơn hàng | 🔴 Cao | Admin xem/cập nhật status đơn |
| Email xác nhận | 🟡 TB | Gửi mail khi đặt hàng thành công |

#### 1.3 User Experience
| Task | Ưu tiên | Chi tiết |
|------|---------|----------|
| Tìm kiếm nâng cao | 🟡 TB | Filter theo giá, brand, rating |
| Sắp xếp sản phẩm | 🟢 Thấp | Theo giá, mới nhất, bán chạy |
| Wishlist | 🟢 Thấp | Lưu sản phẩm yêu thích |
| Lịch sử xem | 🟢 Thấp | Recently viewed products |

---

### 📅 GIAI ĐOẠN 2: NÂNG CAO (2-3 tuần)

#### 2.1 Marketing & SEO
| Task | Ưu tiên | Chi tiết |
|------|---------|----------|
| SEO Optimization | 🟡 TB | Meta tags, sitemap, structured data |
| Blog/Content | 🟢 Thấp | Bài viết chăm sóc thú cưng |
| Newsletter | 🟢 Thấp | Thu thập email, gửi khuyến mãi |
| Social Share | 🟢 Thấp | Chia sẻ sản phẩm lên FB, Zalo |

#### 2.2 Analytics & Reports
| Task | Ưu tiên | Chi tiết |
|------|---------|----------|
| Dashboard Admin | 🟡 TB | Biểu đồ doanh thu, đơn hàng |
| Google Analytics | 🟡 TB | Theo dõi traffic |
| Báo cáo bán hàng | 🟢 Thấp | Export Excel/PDF |

#### 2.3 Customer Service
| Task | Ưu tiên | Chi tiết |
|------|---------|----------|
| Chat widget | 🟢 Thấp | Tích hợp Messenger/Zalo |
| FAQ/Help Center | 🟢 Thấp | Trang hỏi đáp |
| Đánh giá sản phẩm | 🟡 TB | Cho phép khách đánh giá |

---

### 📅 GIAI ĐOẠN 3: SCALE & OPTIMIZE (3-4 tuần)

#### 3.1 Performance
| Task | Ưu tiên | Chi tiết |
|------|---------|----------|
| Image optimization | 🟡 TB | Lazy loading, WebP format |
| Caching | 🟡 TB | Redis cache API response |
| CDN | 🟢 Thấp | Cloudflare for static assets |

#### 3.2 Security
| Task | Ưu tiên | Chi tiết |
|------|---------|----------|
| Rate limiting | 🟡 TB | Chống spam API |
| Input validation | 🔴 Cao | Zod schema cho tất cả form |
| HTTPS enforce | 🔴 Cao | SSL certificate |

#### 3.3 Mobile App (Tương lai)
| Task | Ưu tiên | Chi tiết |
|------|---------|----------|
| PWA | 🟢 Thấp | Convert to Progressive Web App |
| Native App | 🟢 Thấp | React Native (nếu cần) |

---

## 🎯 MỤC TIÊU NGẮN HẠN (Trong tuần này)

### 🔴 Cao ưu tiên:
1. ✅ **Thêm 20-30 sản phẩm thật** vào Firebase
2. ✅ **Test toàn bộ flow**: Xem SP → Thêm giỏ → Thanh toán Stripe
3. ✅ **Viết nội dung**: Giới thiệu, liên hệ, chính sách
4. ✅ **Tạo logo & favicon** cho website

### 🟡 Trung bình:
5. Hoàn thiện trang Admin (quản lý đơn hàng)
6. Thêm tính năng tìm kiếm
7. Tối ưu SEO cơ bản

---

## 📂 CẤU TRÚC THƯ MỤC HIỆN TẠI

```
novashop/
├── src/
│   ├── components/        # UI components
│   ├── pages/            # Page components
│   │   ├── HomePage.jsx
│   │   ├── ProductDetailPage.jsx
│   │   ├── CategoryPage.jsx
│   │   ├── CheckoutPage.jsx ✅
│   │   ├── CartPage.jsx
│   │   └── AdminPage.jsx
│   ├── context/          # State management
│   │   ├── CartContext.jsx
│   │   ├── AuthContext.jsx
│   │   └── ProductsContext.jsx
│   ├── services/         # API calls
│   ├── lib/              # Utilities
│   └── data/             # Static data
├── server/               # Backend Express
│   ├── index.js          # Main server ✅
│   ├── routes/           # API routes
│   └── models/           # Data models
├── public/               # Static assets
├── dist/                 # Build output ✅
└── docs/                 # Documentation
    ├── PROJECT_OVERVIEW.md (file này)
    ├── PAYMENT_SETUP.md
    ├── READY_TO_DEPLOY.md
    └── FREE_DEPLOY.md
```

---

## 💰 BUSINESS MODEL

### Doanh thu:
| Nguồn | Mô tả |
|-------|-------|
| Bán sản phẩm | Thức ăn, phụ kiện thú cưng |
| Shipping fee | 30k VNĐ/đơn (miễn phí > 300k) |
| Commission | Nếu có nhà cung cấp khác |

### Chi phí (Free tier):
| Hạng mục | Chi phí |
|----------|---------|
| Domain | ~$10/năm |
| Hosting (Vercel) | $0 |
| Database (Firebase) | $0 |
| Payment (Stripe fee) | 2.9% + $0.30/giao dịch |
| Email (Resend) | $0 (3k/tháng) |

---

## 🚀 CHECKLIST TRƯỚC KHI LAUNCH

### Kỹ thuật:
- [ ] Tất cả API hoạt động
- [ ] Thanh toán test thành công
- [ ] Responsive trên mobile
- [ ] SSL/HTTPS hoạt động
- [ ] Load time < 3 giây

### Nội dung:
- [ ] Có ít nhất 20 sản phẩm
- [ ] Trang giới thiệu
- [ ] Trang liên hệ
- [ ] Chính sách đổi trả
- [ ] Hướng dẫn mua hàng

### Legal:
- [ ] Chính sách bảo mật (Privacy Policy)
- [ ] Điều khoản sử dụng (Terms of Service)

---

**Tổng kết:**
- ✅ **Core đã xong:** Thanh toán, giỏ hàng, auth
- 🔄 **Tiếp theo:** Thêm sản phẩm, test flow, content
- 🚀 **Launch khi:** 20+ sản phẩm, test xong, content đủ

Bắt đầu với **thêm sản phẩm vào Firebase** nhé! 🎉
