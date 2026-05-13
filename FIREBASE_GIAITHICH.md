# Firebase là gì?

## 🎯 Tóm tắt
**Firebase = Database + Storage + Authentication MIỄN PHÍ**

Nơi lưu trữ tất cả dữ liệu website của bạn.

## 📦 Firebase gồm những gì?

### 1. Firestore Database
- Lưu: sản phẩm, đơn hàng, users, giỏ hàng
- Miễn phí: 1GB dữ liệu, 50k đọc/ghi/ngày
- Tự động sync real-time

### 2. Authentication
- Đăng nhập/Đăng ký bằng Email, Google, Facebook
- Miễn phí: 50k users/tháng

### 3. Storage
- Lưu ảnh sản phẩm
- Miễn phí: 1GB storage, 10GB download/tháng

## 🆚 So sánh với MySQL

| Tính năng | Firebase | MySQL truyền thống |
|-----------|----------|-------------------|
| Giá | Miễn phí đến 1GB | Phải thuê server $5-10/tháng |
| Setup | 0 config | Cài đặt phức tạp |
| Realtime | ✅ Có | ❌ Không |
| Scale | Tự động | Thủ công |
| Bảo trì | Google lo | Bạn tự lo |

## 💡 Ví dụ thực tế

### Trước khi có Firebase:
```
Sản phẩm lưu ở đâu? → File JSON cục bộ
→ Mỗi lần thêm sửa phải deploy lại code
→ Không có giỏ hàng real-time
```

### Sau khi có Firebase:
```
Sản phẩm lưu trong Firestore
→ Thêm sửa trực tiếp trong Firebase Console
→ Khách hàng thấy ngay lập tức
→ Giỏ hàng sync giữa các thiết bị
```

## 🔧 Truy cập Firebase Console

```
https://console.firebase.google.com/project/trantuantu-fa889
```

### Bạn cần làm gì trong Firebase?

1. **Firestore Database** → Create database
2. **Authentication** → Enable Email/Password
3. **Storage** → Enable
4. **Rules** → Cấu hình bảo mật

## 📍 Dữ liệu lưu ở đâu?

```
📁 trantuantu-fa889 (Project của bạn)
├── 📁 products/        ← Sản phẩm
├── 📁 orders/          ← Đơn hàng  
├── 📁 users/           ← Người dùng
├── 📁 categories/      ← Danh mục
└── 📁 coupons/         ← Mã giảm giá
```

## ✅ Tóm lại

**Firebase = Nơi website lưu trữ dữ liệu**
- Miễn phí
- Không cần cài đặt
- Google quản lý server
- Bạn chỉ cần dùng

**Tương đương:** Google Drive nhưng dành cho ứng dụng/website.
