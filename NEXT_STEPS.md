# 🎯 KẾ HOẠCH HÀNH ĐỘNG - TUẦN NÀY

## 📋 TÓM TẮT DỰ ÁN NOVASHOP

**NovaShop** = Website thương mại điện tử bán thức ăn & phụ kiện thú cưng
- **Stack:** React + Vite + Firebase + Stripe + Clerk
- **Status:** Core đã xong, cần thêm sản phẩm & content
- **Mục tiêu:** Launch trong 1-2 tuần

---

## 🔴 VIỆC CẦN LÀM NGAY (Ưu tiên cao)

### Ngày 1-2: Thêm sản phẩm
```
⬜ Vào https://console.firebase.google.com/project/trantuantu-fa889
⬜ Firestore Database → Create collection "products"
⬜ Thêm 20-30 sản phẩm với đầy đủ thông tin:
   - Tên, giá, ảnh, mô tả, danh mục, stock
⬜ Upload ảnh vào Firebase Storage
```

**Template sản phẩm:**
```javascript
{
  id: "auto-generated",
  name: "Royal Canin Adult Dog Food 2kg",
  price: 285000,
  originalPrice: 320000,
  stock: 50,
  category: "dog-food",
  brand: "Royal Canin",
  description: "Thức ăn cao cấp cho chó trưởng thành...",
  images: ["url1", "url2"],
  rating: 4.5,
  sold: 120,
  createdAt: timestamp
}
```

### Ngày 3: Test toàn bộ flow
```
⬜ Chạy local: npm run dev
⬜ Test xem sản phẩm hiển thị đúng không
⬜ Test thêm vào giỏ hàng
⬜ Test thanh toán Stripe (thẻ test: 4242 4242 4242 4242)
⬜ Test đăng nhập/đăng ký
⬜ Kiểm tra responsive trên mobile
```

### Ngày 4: Content & SEO
```
⬜ Viết trang "Giới thiệu"
⬜ Viết trang "Liên hệ"
⬜ Viết "Chính sách đổi trả"
⬜ Thêm meta tags cho SEO
⬜ Tạo logo đơn giản (hoặc dùng text)
```

### Ngày 5: Hoàn thiện Admin
```
⬜ Test quản lý đơn hàng trong Admin
⬜ Thêm tính năng cập nhật status đơn
⬜ Dashboard hiển thị tổng quan
```

---

## 🗂️ DANH SÁCH SẢN PHẨM MẪU (Thêm vào Firebase)

### 🐕 Thức ăn chó (8 sản phẩm)
1. Royal Canin Adult Dog 2kg - 285,000đ
2. Pedigree Adult Beef 1.5kg - 125,000đ
3. SmartHeart Power Pack 1kg - 95,000đ
4. NutriSource Adult Dog 2.27kg - 195,000đ
5. Pro Pac Puppy 1kg - 85,000đ
6. ANF 6 Free Dog 2kg - 165,000đ
7. Fresh Pet Adult Dog 1kg - 75,000đ
8. Doggyman Soft Snack 200g - 45,000đ

### 🐈 Thức ăn mèo (8 sản phẩm)
1. Whiskas Adult Ocean Fish 1.2kg - 115,000đ
2. Me-O Tuna 1.2kg - 98,000đ
3. Royal Canin Indoor Adult 2kg - 295,000đ
4. Fancy Feast Grilled Chicken 85g - 25,000đ
5. Catsrang Salmon 1.2kg - 108,000đ
6. Nekko Tuna & Chicken 1.2kg - 92,000đ
7. Pro Plan Adult Cat 1.5kg - 185,000đ
8. Natural Core Tuna 80g - 22,000đ

### 🎾 Phụ kiện (6 sản phẩm)
1. Vòng cổ da cao cấp - 85,000đ
2. Dây dắt chó size M - 65,000đ
3. Bát ăn inox chống trượt - 55,000đ
4. Đồ chơi bóng cao su - 35,000đ
5. Nhà cây cho mèo 3 tầng - 450,000đ
6. Khay vệ sinh mèo - 120,000đ

---

## 📱 CÁCH THÊM SẢN PHẨM VÀO FIREBASE

### Bước 1: Vào Firebase Console
```
https://console.firebase.google.com/project/trantuantu-fa889/firestore
```

### Bước 2: Tạo Collection
1. Click "Start collection"
2. Collection ID: `products`
3. Click "Next"

### Bước 3: Thêm Document
1. Click "Add document"
2. Điền thông tin theo template ở trên
3. Click "Save"
4. Lặp lại cho từng sản phẩm

### Bước 4: Upload ảnh
```
Storage → Upload file → Copy URL → Paste vào images[] trong product
```

---

## ✅ CHECKLIST MỖI NGÀY

### Trước khi nghỉ:
- [ ] Push code lên GitHub
- [ ] Commit message rõ ràng
- [ ] Kiểm tra local build thành công

### Sáng hôm sau:
- [ ] Pull code mới nhất
- [ ] Chạy `npm install` nếu có lỗi
- [ ] Kiểm tra `npm run dev` chạy được

---

## 🆘 XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi "Cannot find module"
```bash
npm install
```

### Lỗi Firebase không kết nối
- Kiểm tra API key trong `.env.local`
- Kiểm tra Firebase project đã enable Firestore

### Lỗi Stripe không hiển thị
- Kiểm tra `VITE_STRIPE_PUBLISHABLE_KEY`
- Đảm bảo key bắt đầu bằng `pk_test_`

---

## 🎯 MỤC TIÊU CUỐI TUẦN

**Khi nào xong những việc này thì website sẵn sàng launch:**

- ✅ 20+ sản phẩm trong Firebase
- ✅ Thanh toán Stripe test thành công
- ✅ Đăng nhập/đăng ký hoạt động
- ✅ Trang giới thiệu, liên hệ có nội dung
- ✅ Logo & favicon đã có
- ✅ Mobile responsive tốt

**Sau đó:**
→ Deploy lên Vercel
→ Test production
→ Mở cửa bán hàng! 🚀

---

## 📞 HỖ TRỢ

Nếu gặp lỗi khi phát triển:
1. Xem log lỗi trong terminal
2. Kiểm tra file `PROJECT_OVERVIEW.md` cho ERD
3. Hỏi tôi với thông tin lỗi cụ thể

**Bắt đầu ngay với việc đầu tiên: Thêm sản phẩm vào Firebase!** 🎉
