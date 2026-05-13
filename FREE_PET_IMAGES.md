# 🐾 ẢNH THÚ CƯNG MIỄN PHÍ - UNSPLASH

## Link ảnh trực tiếp (Copy & Dùng)

### 🐕 THỨC ĂN CHÓ / DOG FOOD

| Tên sản phẩm | URL ảnh Unsplash | Mô tả |
|-------------|------------------|-------|
| Dog Food Bowl | https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500 | Bát thức ăn chó |
| Dog Eating | https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500 | Chó đang ăn |
| Dog Treats | https://images.unsplash.com/photo-1535930749574-5e7e1bb9f6b9?w=500 | Bánh thưởng chó |
| Puppy Food | https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=500 | Chó con ăn |
| Dog Bowl | https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=500 | Bát nước và thức ăn |
| Golden Retriever | https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=500 | Chó Golden ăn |

### 🐈 THỨC ĂN MÈO / CAT FOOD

| Tên sản phẩm | URL ảnh Unsplash | Mô tả |
|-------------|------------------|-------|
| Cat Eating | https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500 | Mèo đang ăn |
| Cat Food Bowl | https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500 | Bát thức ăn mèo |
| Cat Treats | https://images.unsplash.com/photo-1513245543132-31f507417b26?w=500 | Bánh thưởng mèo |
| Kitten Eating | https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=500 | Mèo con ăn |
| Cat with Food | https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=500 | Mèo và đồ ăn |

### 🎾 PHỤ KIỆN THÚ CƯNG / PET ACCESSORIES

| Tên sản phẩm | URL ảnh Unsplash | Mô tả |
|-------------|------------------|-------|
| Dog Toy | https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500 | Đồ chơi chó |
| Pet Collar | https://images.unsplash.com/photo-1601758124096-1fd661873b95?w=500 | Vòng cổ thú cưng |
| Dog Leash | https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=500 | Dây dắt chó |
| Pet Bed | https://images.unsplash.com/photo-1541781777631-fa182f5d027d?w=500 | Giường thú cưng |
| Cat Tree | https://images.unsplash.com/photo-1516139008210-96e45dccd83b?w=500 | Cây leo mèo |
| Dog Ball | https://images.unsplash.com/photo-1535930749574-5e7e1bb9f6b9?w=500 | Bóng chó |
| Cat Toy | https://images.unsplash.com/photo-1545249390-6bdfa3c6b9b7?w=500 | Đồ chơi mèo |
| Pet Carrier | https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500 | Túi vận chuyển |

### 🐕🐈 CHÓ MÈO CUTE (Dùng cho banner/hero)

| Mục đích | URL ảnh Unsplash |
|---------|------------------|
| Hero Banner Dog | https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200 |
| Hero Banner Cat | https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200 |
| Dog and Cat | https://images.unsplash.com/photo-1623387641168-d9803ddd3f3e?w=1200 |
| Cute Puppy | https://images.unsplash.com/photo-1591769225440-811ad7d6eca2?w=800 |
| Cute Kitten | https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800 |
| Happy Dog | https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800 |
| Playful Cat | https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800 |
| Dog Running | https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800 |
| Cat Playing | https://images.unsplash.com/photo-1513245543132-31f507417b26?w=800 |

---

## 💡 Cách dùng trong Firebase

### Bước 1: Thêm vào Firestore
```javascript
// Ví dụ sản phẩm với ảnh Unsplash
{
  id: "dog-food-1",
  name: "Thức Ăn Chó Cao Cấp Premium",
  price: 285000,
  stock: 50,
  category: "dog-food",
  brand: "Premium",
  description: "Thức ăn dinh dưỡng cao cấp cho chó trưởng thành...",
  images: [
    "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500",
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500"
  ],
  rating: 4.5,
  sold: 120
}
```

### Bước 2: Thay đổi kích thước ảnh
Thay `?w=500` bằng:
- `?w=300` - Ảnh nhỏ (thumbnail)
- `?w=500` - Ảnh vừa (product card)
- `?w=800` - Ảnh lớn (detail page)
- `?w=1200` - Ảnh hero/banner

---

## ⚠️ Lưu ý về bản quyền

| Quyền | Giải thích |
|-------|-----------|
| ✅ **Miễn phí** | Dùng cho mục đích thương mại |
| ✅ **Không cần xin phép** | Unsplash License cho phép |
| ⚠️ **Nên làm** | Credit photographer (tùy chọn) |
| ❌ **Không được** | Bán ảnh nguyên bản, dùng vào mục đích phỉ báng |

---

## 🔗 Trang tìm ảnh thêm

- **Unsplash Pet Food**: https://unsplash.com/s/photos/pet-food
- **Unsplash Dog**: https://unsplash.com/s/photos/dog
- **Unsplash Cat**: https://unsplash.com/s/photos/cat
- **Pexels Pet**: https://www.pexels.com/search/pet/

---

## 🎯 Danh sách sẵn dùng cho 22 sản phẩm mẫu

| STT | Sản phẩm | Danh mục | URL ảnh |
|-----|----------|----------|---------|
| 1 | Royal Canin Adult Dog | dog-food | https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500 |
| 2 | Pedigree Beef | dog-food | https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500 |
| 3 | SmartHeart Power | dog-food | https://images.unsplash.com/photo-1601758124096-1fd661873b95?w=500 |
| 4 | NutriSource Adult | dog-food | https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=500 |
| 5 | Pro Pac Puppy | dog-food | https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=500 |
| 6 | ANF 6 Free | dog-food | https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=500 |
| 7 | Fresh Pet Adult | dog-food | https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=500 |
| 8 | Doggyman Snack | dog-food | https://images.unsplash.com/photo-1535930749574-5e7e1bb9f6b9?w=500 |
| 9 | Whiskas Ocean Fish | cat-food | https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500 |
| 10 | Me-O Tuna | cat-food | https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500 |
| 11 | Royal Canin Indoor | cat-food | https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=500 |
| 12 | Fancy Feast Chicken | cat-food | https://images.unsplash.com/photo-1513245543132-31f507417b26?w=500 |
| 13 | Catsrang Salmon | cat-food | https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=500 |
| 14 | Nekko Tuna Chicken | cat-food | https://images.unsplash.com/photo-1545249390-6bdfa3c6b9b7?w=500 |
| 15 | Pro Plan Adult | cat-food | https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500 |
| 16 | Natural Core Tuna | cat-food | https://images.unsplash.com/photo-1516139008210-96e45dccd83b?w=500 |
| 17 | Vòng cổ da cao cấp | accessories | https://images.unsplash.com/photo-1601758124096-1fd661873b95?w=500 |
| 18 | Dây dắt chó | accessories | https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=500 |
| 19 | Bát ăn inox | accessories | https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=500 |
| 20 | Đồ chơi bóng | accessories | https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=500 |
| 21 | Nhà cây mèo | accessories | https://images.unsplash.com/photo-1516139008210-96e45dccd83b?w=500 |
| 22 | Khay vệ sinh | accessories | https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500 |

---

**Bắt đầu copy các URL này vào Firebase cho 22 sản phẩm mẫu nhé!** 🚀
