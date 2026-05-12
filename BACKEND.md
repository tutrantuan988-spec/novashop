# Thiết kế backend cho NovaShop

Tài liệu này phác thảo backend gợi ý cho website bán hàng NovaShop. Hiện tại frontend đang dùng `localStorage` để mock dữ liệu, bạn có thể thay thế bằng REST API thật theo thiết kế dưới đây.

## Tech stack đề xuất

- **Node.js + Express** (hoặc NestJS) cho REST API
- **PostgreSQL** hoặc **MongoDB** làm cơ sở dữ liệu
- **Prisma** / **Mongoose** làm ORM
- **JWT** cho xác thực
- **Cloudinary** hoặc **S3** để lưu ảnh sản phẩm
- **Stripe** / **VNPAY** / **MoMo** cho thanh toán

## Schema database

### `users`

| Field | Type | Mô tả |
| --- | --- | --- |
| `id` | UUID | Khóa chính |
| `name` | string | Họ tên |
| `email` | string unique | Email đăng nhập |
| `password` | string | Mật khẩu đã hash (bcrypt) |
| `role` | enum (`user`, `admin`) | Phân quyền |
| `phone` | string | SĐT |
| `created_at` | timestamp | Ngày tạo |

### `products`

| Field | Type | Mô tả |
| --- | --- | --- |
| `id` | UUID | Khóa chính |
| `slug` | string unique | Đường dẫn SEO |
| `name` | string | Tên sản phẩm |
| `category_id` | UUID | Khóa ngoại danh mục |
| `price` | int | Giá bán (VND) |
| `old_price` | int | Giá cũ |
| `stock` | int | Tồn kho |
| `badge` | string | Nhãn (Hot, Sale, New) |
| `image` | string | Ảnh chính |
| `gallery` | string[] | Mảng ảnh phụ |
| `colors` | string[] | Mảng màu HEX |
| `sizes` | string[] | Mảng size |
| `description` | text | Mô tả chi tiết |
| `rating` | float | Điểm đánh giá |
| `review_count` | int | Số lượt đánh giá |
| `created_at` | timestamp | Ngày tạo |

### `categories`

| Field | Type | Mô tả |
| --- | --- | --- |
| `id` | UUID | Khóa chính |
| `name` | string | Tên danh mục |
| `slug` | string unique | SEO slug |

### `orders`

| Field | Type | Mô tả |
| --- | --- | --- |
| `id` | UUID | Khóa chính |
| `user_id` | UUID | Khóa ngoại user |
| `status` | enum (`pending`, `paid`, `shipped`, `done`, `cancelled`) | Trạng thái |
| `subtotal` | int | Tổng tiền hàng |
| `discount` | int | Tiền giảm |
| `shipping_fee` | int | Phí ship |
| `total` | int | Tổng cuối |
| `payment_method` | enum (`cod`, `bank`, `momo`) | Phương thức |
| `address` | text | Địa chỉ giao hàng |
| `note` | text | Ghi chú |
| `created_at` | timestamp | Ngày đặt |

### `order_items`

| Field | Type | Mô tả |
| --- | --- | --- |
| `id` | UUID | Khóa chính |
| `order_id` | UUID | Khóa ngoại order |
| `product_id` | UUID | Khóa ngoại product |
| `name` | string | Tên sản phẩm tại thời điểm mua |
| `price` | int | Giá tại thời điểm mua |
| `quantity` | int | Số lượng |

## REST API endpoints

### Public

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/api/products` | Danh sách sản phẩm (lọc, tìm kiếm, phân trang) |
| `GET` | `/api/products/:slug` | Chi tiết sản phẩm |
| `GET` | `/api/categories` | Danh sách danh mục |
| `POST` | `/api/auth/register` | Đăng ký |
| `POST` | `/api/auth/login` | Đăng nhập, trả JWT |

### Cần xác thực (Bearer JWT)

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/api/me` | Thông tin user hiện tại |
| `POST` | `/api/orders` | Tạo đơn hàng |
| `GET` | `/api/orders` | Danh sách đơn hàng của user |
| `GET` | `/api/orders/:id` | Chi tiết đơn hàng |

### Admin (role = admin)

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/api/admin/products` | Tạo sản phẩm |
| `PUT` | `/api/admin/products/:id` | Cập nhật sản phẩm |
| `DELETE` | `/api/admin/products/:id` | Xóa sản phẩm |
| `POST` | `/api/admin/upload` | Upload ảnh |
| `GET` | `/api/admin/orders` | Danh sách tất cả đơn hàng |
| `PATCH` | `/api/admin/orders/:id/status` | Cập nhật trạng thái đơn hàng |

## Bảo mật

- Hash mật khẩu bằng **bcrypt** (`saltRounds >= 10`).
- Phát hành JWT có `expiresIn = '7d'`, lưu HTTP-only cookie hoặc Authorization header.
- Validate input bằng **Zod** hoặc **Joi**.
- Bật **CORS** chỉ cho domain frontend.
- Rate limit bằng **express-rate-limit**.
- Ghi log bằng **winston** hoặc **pino**.

## Kết nối frontend

Trong React, tạo `src/api/client.js`:

```js
const BASE_URL = import.meta.env.VITE_API_URL;

export async function api(path, options = {}) {
  const token = localStorage.getItem('novashop:token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Request failed');
  return res.json();
}
```

Sau đó thay phần đọc/ghi `localStorage` ở `CartContext`, `AuthContext`, `ProductsContext` bằng các hàm `api(...)` tương ứng.
