# 🎨 CÔNG CỤ TẠO ẢNH AI MIỄN PHÍ CHO SẢN PHẨM PET

## 🆓 MIỄN PHÍ (Không cần thẻ tín dụng)

### 1. Leonardo.Ai ⭐ Khuyến nghị
```
https://leonardo.ai
```
- **Free:** 150 credits/ngày (~15-30 ảnh)
- **Mô hình tốt:** Leonardo Vision, Leonardo Diffusion
- **Ưu điểm:** Không watermark, chất lượng cao

**Prompt mẫu cho thức ăn chó:**
```
Premium dog food packaging, golden retriever eating from bowl, 
professional product photography, studio lighting, white background, 
8k quality, commercial advertisement style
```

**Prompt mẫu cho thức ăn mèo:**
```
Premium cat food bag, cute fluffy cat eating, elegant product shot, 
soft studio lighting, clean background, high quality commercial photo
```

---

### 2. Microsoft Bing Image Creator
```
https://www.bing.com/create
```
- **Free:** Không giới hạn (dùng DALL-E 3)
- **Cần:** Tài khoản Microsoft
- **Ưu điểm:** Tích hợp ChatGPT, viết prompt bằng tiếng Việt được

**Ví dụ prompt tiếng Việt:**
```
Bịch thức ăn cho chó cao cấp, chó golden retriever đang ăn, 
chụp ảnh sản phẩm chuyên nghiệp, ánh sáng studio, nền trắng
```

---

### 3. Playground AI
```
https://playgroundai.com
```
- **Free:** 500 ảnh/ngày (có watermark nhỏ)
- **Mô hình:** Stable Diffusion XL
- **Ưu điểm:** Dễ sử dụng, nhiều filter

---

### 4. Canva AI (Text to Image)
```
https://www.canva.com
```
- **Free:** 25 lượt AI/ngày (bản free)
- **Ưu điểm:** Tích hợp chỉnh sửa luôn, không cần chuyển app
- **Cách:** Canva → Apps → Text to Image

---

### 5. Ideogram.ai
```
https://ideogram.ai
```
- **Free:** 25 prompts/ngày
- **Ưu điểm:** Render chữ/text trên ảnh rất tốt (tên sản phẩm, logo)

**Prompt cho packaging:**
```
Pet food bag with "ROYAL PET" text, dog and cat illustration, 
professional packaging design, commercial product photo
```

---

## 🎯 PROMPT MẪU CHO SẢN PHẨM PET

### Thức ăn chó (Dog Food)
```
Professional product photography of premium dog food, 
brown kibble in ceramic bowl, happy golden retriever in background, 
soft natural lighting, beige studio background, 8k, commercial style
```

### Thức ăn mèo (Cat Food)
```
Premium cat food packaging mockup, silver bag with cat illustration, 
fluffy persian cat sitting beside, elegant studio shot, 
soft shadows, high-end commercial photography
```

### Phụ kiện thú cưng
```
Pet accessories collection, leather collar and leash, 
shiny metal bowl, colorful toys, flat lay photography, 
white background, Pinterest style, aesthetic arrangement
```

### Banner/Hero Image
```
Wide banner image, happy dog and cat together, 
pet food bowls in foreground, warm golden hour lighting, 
cozy home setting, lifestyle photography, 16:9 ratio
```

---

## 📐 KÍCH THƯỚC ẢNH CHUẨN

| Mục đích | Kích thước | Tỷ lệ |
|----------|-----------|-------|
| **Thumbnail** | 300x300 | 1:1 |
| **Product card** | 500x500 | 1:1 |
| **Detail image** | 800x800 | 1:1 |
| **Hero banner** | 1200x600 | 2:1 |
| **Category banner** | 800x400 | 2:1 |

**Thêm vào prompt:**
```
--ar 1:1    (vuông)
--ar 2:1    (ngang)
--ar 1:2    (dọc)
```

---

## 🖼️ CÔNG CỤ CHỈNH SỮA ẢNH MIỄN PHÍ

### Remove.bg (Xóa nền)
```
https://www.remove.bg
```
- **Free:** 1 ảnh chất lượng cao, không giới hạn ảnh thường
- **Dùng để:** Làm ảnh sản phẩm transparent background

### Canva (Thiết kế)
```
https://www.canva.com
```
- **Free:** Templates, chỉnh sửa cơ bản
- **Dùng để:** Thêm text, logo, giá vào ảnh

### Photopea (Photoshop online)
```
https://www.photopea.com
```
- **Free:** Giống Photoshop 100%
- **Dùng để:** Chỉnh sửa chuyên nghiệp, layer, filter

---

## 🚀 WORKFLOW TẠO ẢNH SẢN PHẨM

### Bước 1: Tạo ảnh gốc
```
Leonardo.Ai hoặc Bing Image Creator
→ Nhập prompt
→ Chọn 4 ảnh đẹp nhất
→ Tải xuống
```

### Bước 2: Chỉnh sửa (nếu cần)
```
Remove.bg → Xóa nền nếu cần
Canva → Thêm text, giá, logo
```

### Bước 3: Resize
```
Canva hoặc Photopea
→ Resize về 500x500 (product card)
→ Xuất PNG hoặc JPG (chất lượng 80%)
```

### Bước 4: Upload
```
Firebase Storage → Upload ảnh
→ Copy URL → Paste vào Firestore product
```

---

## 💡 MẸO TẠO ẢNH ĐẸP

### 1. Prompt chi tiết hơn = Ảnh đẹp hơn
```
❌ Tệ: "dog food"
✅ Tốt: "Premium dog food in ceramic bowl, studio lighting, 
white background, professional commercial photography, 8k"
```

### 2. Thêm style nhiếp ảnh
```
- studio lighting
- soft natural light
- golden hour
- bokeh background
- macro photography
- flat lay
```

### 3. Thêm chất lượng
```
- 8k, high quality, sharp focus
- photorealistic
- commercial advertisement
- product photography
- professional shot
```

---

## ⚠️ LƯU Ý BẢN QUYỀN AI

| Công cụ | Quyền sử dụng |
|---------|--------------|
| **Leonardo.Ai** | ✅ Sở hữu ảnh bạn tạo |
| **Bing Image Creator** | ✅ Dùng thương mại miễn phí |
| **Playground** | ✅ Có watermark nhỏ ở free tier |
| **Canva** | ✅ Sở hữu nội dung bạn tạo |

**Tóm lại:** Ảnh AI bạn tạo = Bạn sở hữu, dùng thương mại được! 🎉

---

## 🎯 BẮT ĐẦU NGAY

**Công cụ khuyến nghị nhất:**
1. 🥇 **Leonardo.Ai** - Chất lượng cao, không watermark
2. 🥈 **Bing Image Creator** - Dùng tiếng Việt được, không giới hạn

**Prompt đầu tiên thử:**
```
Premium pet food bag mockup, cute dog and cat illustration, 
professional packaging design, commercial product photo, 
white studio background, soft lighting, 8k quality
```

**Tạo 5-10 ảnh đầu tiên cho sản phẩm mẫu nhé!** 🚀
