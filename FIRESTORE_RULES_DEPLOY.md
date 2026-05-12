# Publish Firestore Rules

File `firestore.rules` đã được siết theo hướng production:

- Ai cũng đọc được `products`.
- Chỉ admin email được ghi `products` trực tiếp.
- Client không tạo `orders` trực tiếp nữa.
- Backend tạo/cập nhật `orders` bằng Firebase Admin SDK.
- User chỉ đọc đơn của chính email mình nếu có Firebase Auth token.
- Admin đọc/cập nhật/xóa đơn trực tiếp nếu có Firebase Auth token.

## Cách publish bằng Firebase Console

1. Mở Firebase Console.
2. Chọn project NovaShop.
3. Vào Firestore Database.
4. Chọn tab Rules.
5. Copy toàn bộ nội dung file `firestore.rules`.
6. Paste vào editor.
7. Bấm Publish.

## Lưu ý quan trọng

Nếu frontend đang dùng Clerk hoặc local auth, Firestore client sẽ không tự có `request.auth`. Khi publish rules production, các thao tác client trực tiếp vào orders/admin có thể bị chặn.

Hướng vận hành chuẩn là chuyển toàn bộ quản trị sản phẩm/đơn hàng sang backend API dùng Firebase Admin SDK. Backend Admin SDK bỏ qua Firestore rules và xác thực bằng server credentials.

## Admin emails hiện tại

- admin@novashop.vn
- tutrantuan988@gmail.com

Nếu thêm admin mới, cập nhật đồng thời:

- `firestore.rules`
- `.env.local`: `VITE_ADMIN_EMAILS`, `ADMIN_EMAILS`
- Clerk metadata nếu dùng Clerk role admin
