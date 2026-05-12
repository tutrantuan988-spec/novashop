# Hướng dẫn kích hoạt đăng nhập thật với Clerk

NovaShop đã tích hợp **Clerk** — nền tảng xác thực hiện đại với UI sẵn có, hỗ trợ email/mật khẩu, Google, Facebook, Apple và nhiều phương thức khác.

## Chế độ Dual (tự động)

- **Chưa có API key**: Hệ thống tự động dùng `localStorage` (đăng ký/đăng nhập mock) để bạn test ngay.
- **Đã có API key**: Hệ thống tự động chuyển sang **Clerk** — đăng nhập thật, bảo mật production.

## Bước 1: Tạo tài khoản Clerk

1. Truy cập [https://clerk.com](https://clerk.com)
2. Đăng ký bằng email hoặc Google
3. Tạo một **Application** mới (miễn phí đến 10.000 user)
4. Đặt tên app: `NovaShop`

## Bước 2: Lấy Publishable Key

1. Trong dashboard Clerk, vào **Configure → API keys**
2. Copy **Publishable key** (bắt đầu bằng `pk_test_...` hoặc `pk_live_...`)

## Bước 3: Cấu hình dự án

1. Trong thư mục gốc, tạo file `.env.local`:

```bash
# Windows PowerShell
New-Item .env.local

# Hoặc mở VS Code và tạo file .env.local
```

2. Dán key vào file `.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
```

3. Khởi động lại dev server:

```bash
npm run dev
```

## Bước 4: Kiểm tra

- Mở trang chủ, nhấn **Đăng nhập**
- Cửa sổ Clerk sẽ hiện ra (modal đăng nhập chuyên nghiệp)
- Thử đăng ký bằng email thật
- Sau khi đăng nhập, Header sẽ hiển thị tên và nút đăng xuất

## Admin với Clerk

Mặc định, user có email `admin@novashop.vn` sẽ được cấp quyền `admin` tự động.

Nếu muốn cấp quyền admin cho user khác, bạn có thể:

1. Vào dashboard Clerk → **Users**
2. Chọn user → tab **Metadata**
3. Thêm `role: "admin"` vào **Public metadata**:

```json
{
  "role": "admin"
}
```

## Tùy chỉnh giao diện Clerk

Mở `src/context/AuthContext.jsx` và tìm `openSignIn()` để thêm tùy chọn:

```jsx
openSignIn({
  appearance: {
    variables: {
      colorPrimary: '#d8a84f',
      colorBackground: '#ffffff',
      colorText: '#0d1324'
    }
  }
});
```

Tham khảo thêm tại: [Clerk Appearance docs](https://clerk.com/docs/customization/overview)

## Lưu ý bảo mật

- **Publishable key** (`pk_...`) là an toàn để expose ra client — chỉ dùng để khởi tạo UI
- Không bao giờ commit file `.env.local` lên Git (đã có trong `.gitignore` mặc định)
- Dùng **Secret key** (`sk_...`) chỉ trên server/backend

## Xóa Clerk (quay về localStorage)

Chỉ cần xóa file `.env.local` hoặc comment dòng `VITE_CLERK_PUBLISHABLE_KEY`, rồi khởi động lại dev server.
