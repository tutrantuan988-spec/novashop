# 📝 NỘI DUNG TRANG WEBSITE

## 1. TRANG GIỚI THIỆU (About Us)

```jsx
// src/pages/AboutPage.jsx
const aboutContent = {
  title: "Về NovaShop - Người Bạn Đồng Hành Cùng Thú Cưng",
  
  heroSection: {
    headline: "Yêu Thương Từ Những Điều Nhỏ Bé",
    subheadline: "NovaShop ra đời với sứ mệnh mang đến những sản phẩm chất lượng nhất cho người bạn đồng hành của bạn"
  },

  story: {
    title: "Câu Chuyện Của Chúng Tôi",
    content: `NovaShop được thành lập từ tình yêu sâu sắc dành cho thú cưng. 
    Chúng tôi hiểu rằng chó và mèo không chỉ là vật nuôi, mà là những người 
    bạn, là thành viên trong gia đình. Mỗi chiếc đuôi vẫy, mỗi tiếng rên rỉ 
    đều mang ý nghĩa đặc biệt.

    Từ những ngày đầu, chúng tôi đã cam kết chỉ cung cấp những sản phẩm 
    mà chính chúng tôi tin dùng cho thú cưng của mình - từ thức ăn dinh 
    dưỡng đến phụ kiện an toàn.`
  },

  mission: {
    title: "Sứ Mệnh",
    points: [
      "Cung cấp thực phẩm an toàn, dinh dưỡng cân bằng",
      "Mang đến trải nghiệm mua sắm thuận tiện, nhanh chóng",
      "Tư vấn chuyên nghiệp, tận tâm cho từng khách hàng",
      "Xây dựng cộng đồng yêu thương thú cưng"
    ]
  },

  values: {
    title: "Giá Trị Cốt Lõi",
    items: [
      { icon: "Heart", title: "Tận Tâm", desc: "Mỗi sản phẩm đều được chọn lọc kỹ càng" },
      { icon: "Shield", title: "An Toàn", desc: "Chỉ bán hàng chính hãng, nguồn gốc rõ ràng" },
      { icon: "Zap", title: "Nhanh Chóng", desc: "Giao hàng trong 24-48 giờ" },
      { icon: "Smile", title: "Vui Vẻ", desc: "Mang niềm vui đến cho thú cưng của bạn" }
    ]
  },

  stats: {
    title: "NovaShop Trong Số Liệu",
    numbers: [
      { value: "10,000+", label: "Khách hàng hài lòng" },
      { value: "50,000+", label: "Đơn hàng thành công" },
      { value: "500+", label: "Sản phẩm đa dạng" },
      { value: "99%", label: "Đánh giá tích cực" }
    ]
  },

  team: {
    title: "Đội Ngũ Của Chúng Tôi",
    members: [
      { name: "Trần Tuấn Tú", role: "Founder & CEO", bio: "Người sáng lập với tình yêu lớn dành cho thú cưng" },
      { name: "Đội Ngũ CSKH", role: "Chăm Sóc Khách Hàng", bio: "Luôn sẵn sàng hỗ trợ 24/7" }
    ]
  },

  cta: {
    title: "Trở Thành Khách Hàng Của NovaShop",
    button: "Bắt Đầu Mua Sắm",
    link: "/"
  }
};
```

---

## 2. TRANG LIÊN HỆ (Contact)

```jsx
// src/pages/ContactPage.jsx
const contactContent = {
  title: "Liên Hệ Với Chúng Tôi",
  
  intro: "Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Đừng ngần ngại liên hệ!",
  
  contactInfo: {
    phone: {
      label: "Hotline",
      value: "0901 234 567",
      hours: "8:00 - 21:00 (Tất cả các ngày)"
    },
    email: {
      label: "Email",
      value: "support@novashop.com"
    },
    address: {
      label: "Địa chỉ",
      value: "123 Nguyễn Văn A, Quận 1, TP.HCM"
    },
    social: {
      label: "Mạng xã hội",
      facebook: "fb.com/novashop",
      zalo: "zalo.me/novashop",
      instagram: "instagram.com/novashop"
    }
  },

  faq: {
    title: "Câu Hỏi Thường Gặp",
    items: [
      {
        q: "Thời gian giao hàng là bao lâu?",
        a: "Chúng tôi giao hàng trong 24-48 giờ đối với nội thành HCM và 3-5 ngày đối với tỉnh thành khác."
      },
      {
        q: "Chính sách đổi trả như thế nào?",
        a: "Bạn có thể đổi trả trong vòng 7 ngày nếu sản phẩm còn nguyên seal và chưa qua sử dụng."
      },
      {
        q: "Có miễn phí vận chuyển không?",
        a: "Miễn phí vận chuyển cho đơn hàng từ 300,000đ trở lên."
      },
      {
        q: "Làm sao để tôi biết thức ăn phù hợp với thú cưng?",
        a: "Bạn có thể chat với chúng tôi hoặc gọi hotline để được tư vấn miễn phí."
      }
    ]
  },

  form: {
    title: "Gửi Tin Nhắn Cho Chúng Tôi",
    fields: [
      { name: "name", label: "Họ và tên", required: true },
      { name: "email", label: "Email", required: true },
      { name: "phone", label: "Số điện thoại", required: false },
      { name: "subject", label: "Chủ đề", options: ["Tư vấn sản phẩm", "Khiếu nại", "Hợp tác", "Khác"] },
      { name: "message", label: "Nội dung", type: "textarea", required: true }
    ],
    submitButton: "Gửi Tin Nhắn",
    successMessage: "Cảm ơn bạn! Chúng tôi sẽ liên hệ lại trong 24 giờ."
  }
};
```

---

## 3. TRANG CHÍNH SÁCH (Policy Pages)

### Chính Sách Đổi Trả
```jsx
const returnPolicy = {
  title: "Chính Sách Đổi Trả & Hoàn Tiền",
  sections: [
    {
      title: "Điều Kiện Đổi Trả",
      content: `1. Sản phẩm còn nguyên seal, chưa qua sử dụng
2. Thời hạn: trong vòng 7 ngày kể từ ngày nhận hàng
3. Có hóa đơn mua hàng hoặc mã đơn hàng
4. Sản phẩm không thuộc danh mục không hỗ trợ đổi trả (thức ăn đã mở seal)`
    },
    {
      title: "Quy Trình Đổi Trả",
      steps: [
        "Liên hệ CSKH qua hotline hoặc email",
        "Cung cấp thông tin đơn hàng và lý do đổi trả",
        "Đóng gói sản phẩm kèm hóa đơn",
        "Gửi trả qua đơn vị vận chuyển (miễn phí nếu lỗi từ shop)",
        "Nhận sản phẩm mới hoặc hoàn tiền trong 3-5 ngày"
      ]
    },
    {
      title: "Hoàn Tiền",
      content: `• Hoàn tiền qua chuyển khoản ngân hàng: 3-5 ngày làm việc
• Hoàn tiền qua ví điện tử: 24 giờ
• Đối với thanh toán COD: chuyển khoản sau khi nhận hàng trả về`
    }
  ]
};
```

### Chính Sách Vận Chuyển
```jsx
const shippingPolicy = {
  title: "Chính Sách Vận Chuyển",
  sections: [
    {
      title: "Phí Vận Chuyển",
      content: `• Nội thành HCM: 30,000đ (miễn phí đơn > 300k)
• Ngoại thành HCM: 40,000đ (miễn phí đơn > 500k)
• Các tỉnh thành khác: 50,000đ (miễn phí đơn > 500k)`
    },
    {
      title: "Thời Gian Giao Hàng",
      content: `• Nội thành HCM: 24-48 giờ
• Ngoại thành: 2-3 ngày
• Tỉnh thành khác: 3-5 ngày`
    },
    {
      title: "Lưu Ý",
      content: `• Đơn hàng được xử lý trong 24h (trừ CN & ngày lễ)
• Kiểm tra hàng trước khi thanh toán
• Liên hệ ngay nếu hàng bị hư hỏng trong vận chuyển`
    }
  ]
};
```

### Điều Khoản Sử Dụng
```jsx
const termsOfService = {
  title: "Điều Khoản Sử Dụng",
  lastUpdated: "13/05/2026",
  sections: [
    {
      title: "1. Chấp Nhận Điều Khoản",
      content: "Bằng việc truy cập và sử dụng website NovaShop, bạn đồng ý tuân theo các điều khoản này."
    },
    {
      title: "2. Tài Khoản Người Dùng",
      content: `• Bạn phải cung cấp thông tin chính xác khi đăng ký
• Bảo mật mật khẩu tài khoản của bạn
• Thông báo ngay nếu phát hiện sử dụng trái phép`
    },
    {
      title: "3. Mua Hàng & Thanh Toán",
      content: `• Giá cả có thể thay đổi không báo trước
• Thanh toán qua Stripe, COD, hoặc chuyển khoản
• Đơn hàng có thể bị hủy nếu không thanh toán trong 24h`
    },
    {
      title: "4. Quyền Sở Hữu Trí Tuệ",
      content: "Tất cả nội dung trên website thuộc sở hữu của NovaShop."
    },
    {
      title: "5. Giới Hạn Trách Nhiệm",
      content: "NovaShop không chịu trách nhiệm về tổn thất gián tiếp từ việc sử dụng dịch vụ."
    }
  ]
};
```

### Chính Sách Bảo Mật
```jsx
const privacyPolicy = {
  title: "Chính Sách Bảo Mật",
  lastUpdated: "13/05/2026",
  sections: [
    {
      title: "Thông Tin Chúng Tôi Thu Thập",
      content: `• Thông tin cá nhân: tên, email, số điện thoại, địa chỉ
• Thông tin thanh toán: được mã hóa qua Stripe
• Thông tin đơn hàng: sản phẩm, số lượng, giá cả
• Dữ liệu sử dụng: cookies, IP address`
    },
    {
      title: "Cách Chúng Tôi Sử Dụng Thông Tin",
      content: `• Xử lý đơn hàng và giao hàng
• Liên hệ về đơn hàng và hỗ trợ khách hàng
• Gửi thông tin khuyến mãi (nếu bạn đồng ý)
• Cải thiện dịch vụ của chúng tôi`
    },
    {
      title: "Bảo Mật Thông Tin",
      content: `• Mã hóa SSL/TLS cho tất cả dữ liệu truyền tải
• Lưu trữ trên Firebase với bảo mật cao
• Không bán thông tin cho bên thứ ba`
    },
    {
      title: "Quyền Của Bạn",
      content: `• Yêu cầu xem thông tin cá nhân
• Yêu cầu chỉnh sửa hoặc xóa thông tin
• Từ chối nhận email marketing`
    }
  ]
};
```

---

## 4. TRANG HƯỚNG DẪN (Guide)

### Hướng Dẫn Mua Hàng
```jsx
const shoppingGuide = {
  title: "Hướng Dẫn Mua Hàng",
  steps: [
    {
      step: 1,
      title: "Chọn Sản Phẩm",
      content: "Duyệt qua các danh mục hoặc dùng thanh tìm kiếm để tìm sản phẩm bạn cần."
    },
    {
      step: 2,
      title: "Thêm Vào Giỏ",
      content: "Chọn số lượng và bấm 'Thêm vào giỏ'. Tiếp tục mua sắm hoặc đi đến thanh toán."
    },
    {
      step: 3,
      title: "Thanh Toán",
      content: "Điền thông tin giao hàng, chọn phương thức thanh toán (Stripe, COD, hoặc chuyển khoản)."
    },
    {
      step: 4,
      title: "Xác Nhận Đơn",
      content: "Kiểm tra lại đơn hàng và bấm 'Đặt hàng'. Bạn sẽ nhận email xác nhận ngay sau đó."
    },
    {
      step: 5,
      title: "Nhận Hàng",
      content: "Kiểm tra hàng khi nhận và thanh toán (nếu chọn COD)."
    }
  ],
  tips: [
    "Đăng ký tài khoản để theo dõi đơn hàng dễ dàng",
    "Kiểm tra mã giảm giá trước khi thanh toán",
    "Liên hệ CSKH nếu cần tư vấn sản phẩm"
  ]
};
```

---

## 📂 CÁCH TẠO TRANG MỚI

### Bước 1: Tạo file JSX
```bash
# Trong thư mục src/pages/
touch AboutPage.jsx
```

### Bước 2: Code mẫu
```jsx
// src/pages/AboutPage.jsx
import { memo } from 'react';
import { Heart, Shield, Zap, Smile } from 'lucide-react';

function AboutPage() {
  return (
    <section className="section about">
      <h1>Về NovaShop</h1>
      
      {/* Hero */}
      <div className="about-hero">
        <h2>Yêu Thương Từ Những Điều Nhỏ Bé</h2>
        <p>NovaShop ra đời với sứ mệnh mang đến những sản phẩm chất lượng nhất...</p>
      </div>
      
      {/* Mission */}
      <div className="about-mission">
        <h3>Sứ Mệnh</h3>
        <ul>
          <li>Cung cấp thực phẩm an toàn</li>
          <li>Trải nghiệm mua sắm thuận tiện</li>
          <li>Tư vấn chuyên nghiệp</li>
        </ul>
      </div>
      
      {/* Values */}
      <div className="about-values">
        <h3>Giá Trị Cốt Lõi</h3>
        <div className="values-grid">
          <div><Heart /> Tận Tâm</div>
          <div><Shield /> An Toàn</div>
          <div><Zap /> Nhanh Chóng</div>
          <div><Smile /> Vui Vẻ</div>
        </div>
      </div>
    </section>
  );
}

export default memo(AboutPage);
```

### Bước 3: Thêm route
```jsx
// App.jsx
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

<Route path="/about" element={<AboutPage />} />
<Route path="/contact" element={<ContactPage />} />
<Route path="/policy/return" element={<ReturnPolicyPage />} />
<Route path="/policy/shipping" element={<ShippingPolicyPage />} />
<Route path="/policy/privacy" element={<PrivacyPolicyPage />} />
<Route path="/policy/terms" element={<TermsPage />} />
```

---

**Bạn muốn tôi tạo sẵn các file JSX cho những trang này không?** 🚀
