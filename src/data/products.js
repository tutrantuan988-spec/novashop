export const categories = [
  'Tất cả',
  'Thời trang',
  'Công nghệ',
  'Phụ kiện',
  'Du lịch',
  'Thể thao',
  'Gia dụng'
];

// Placeholder products — chỉ dùng khi Firestore trống (seed data).
// Sản phẩm thật quản lý qua trang /admin hoặc Firebase Console.
export const products = [
  {
    id: 1,
    slug: 'san-pham-mau-1',
    name: 'Sản phẩm mẫu 1',
    category: 'Thời trang',
    price: 500000,
    oldPrice: 700000,
    rating: 5,
    reviewCount: 0,
    image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80',
    gallery: ['https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80'],
    badge: 'Mới',
    description: 'Sản phẩm mẫu. Hãy vào /admin để thêm sản phẩm thật của bạn.',
    stock: 10,
    colors: ['#1f2937'],
    sizes: ['M', 'L']
  },
  {
    id: 2,
    slug: 'san-pham-mau-2',
    name: 'Sản phẩm mẫu 2',
    category: 'Công nghệ',
    price: 1000000,
    oldPrice: 1300000,
    rating: 5,
    reviewCount: 0,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    gallery: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80'],
    badge: 'Mới',
    description: 'Sản phẩm mẫu. Hãy vào /admin để thêm sản phẩm thật của bạn.',
    stock: 10,
    colors: ['#111827'],
    sizes: []
  },
  {
    id: 3,
    slug: 'san-pham-mau-3',
    name: 'Sản phẩm mẫu 3',
    category: 'Phụ kiện',
    price: 800000,
    oldPrice: 1000000,
    rating: 5,
    reviewCount: 0,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80',
    gallery: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80'],
    badge: 'Mới',
    description: 'Sản phẩm mẫu. Hãy vào /admin để thêm sản phẩm thật của bạn.',
    stock: 10,
    colors: ['#0f172a'],
    sizes: []
  }
];


export const reviews = [
  { id: 1, name: 'Minh Anh', role: 'Designer', rating: 5, content: 'Giao diện đẹp, sản phẩm đúng mô tả và giao rất nhanh trong 24h. Mình sẽ tiếp tục mua sắm ở đây.' },
  { id: 2, name: 'Quốc Huy', role: 'Lập trình viên', rating: 5, content: 'Dễ tìm sản phẩm, thanh toán thuận tiện, đội ngũ hỗ trợ nhiệt tình và phản hồi rất nhanh.' },
  { id: 3, name: 'Thanh Trúc', role: 'Marketing', rating: 5, content: 'Ưu đãi tốt, đóng gói cẩn thận, mỗi đơn hàng đều có thiệp cảm ơn rất tinh tế. Mình rất hài lòng.' },
  { id: 4, name: 'Đức Long', role: 'Sinh viên', rating: 5, content: 'Giá hợp lý, có nhiều mã giảm giá cho sinh viên, app dùng mượt và dễ thao tác trên điện thoại.' },
  { id: 5, name: 'Bảo Trân', role: 'Freelancer', rating: 5, content: 'Trải nghiệm mua sắm rất tốt, sản phẩm chất lượng cao và đội ngũ chăm sóc khách hàng tận tâm.' }
];
