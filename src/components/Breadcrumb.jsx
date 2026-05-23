import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const LABELS = {
  'san-pham': 'Sản phẩm',
  'danh-muc': 'Danh mục',
  'thanh-toan': 'Thanh toán',
  'tai-khoan': 'Tài khoản',
  'profile': 'Hồ sơ',
  'don-hang': 'Đơn hàng',
  'yeu-thich': 'Yêu thích',
  'admin': 'Quản trị',
  'chinh-sach': 'Chính sách',
  'doi-tra': 'Đổi trả',
  'van-chuyen': 'Vận chuyển',
  'bao-mat': 'Bảo mật',
  'dieu-khoan': 'Điều khoản',
  'faq': 'Câu hỏi thường gặp',
  'lien-he': 'Liên hệ',
  'gio-hang': 'Giỏ hàng',
  'thanh-cong': 'Thành công',
  'that-bai': 'Thất bại',
  'track-order': 'Theo dõi đơn hàng',
  'danh-gia': 'Đánh giá',
  'them-san-pham': 'Thêm sản phẩm',
  'quan-ly-san-pham': 'Quản lý sản phẩm',
  'momo-return': 'MoMo Return',
  'dia-chi': 'Địa chỉ',
  'sign-in': 'Đăng nhập',
  'sign-up': 'Đăng ký',
  'danh-muc': 'Danh mục',
  'thuong-hieu': 'Thương hiệu',
  'tim-kiem': 'Tìm kiếm',
  'about': 'Giới thiệu',
  'contact': 'Liên hệ',
  'khuyen-mai': 'Khuyến mãi',
  'agents': 'Agent Dashboard'
};

function Breadcrumb() {
  const location = useLocation();
  if (location.pathname === '/') return null;

  const segments = location.pathname.split('/').filter(Boolean);
  const items = [{ label: 'Trang chủ', to: '/' }];

  let path = '';
  for (const seg of segments) {
    path += `/${seg}`;
    const label = LABELS[seg] || seg.replace(/-/g, ' ');
    items.push({ label, to: path });
  }

  // Last item is not clickable
  const last = items[items.length - 1];
  last.isCurrent = true;

  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <ol>
        {items.map((item, i) => (
          <li key={item.to}>
            {i === 0 ? (
              <Link to={item.to}><Home size={14} aria-hidden /></Link>
            ) : item.isCurrent ? (
              <span aria-current="page">{item.label}</span>
            ) : (
              <Link to={item.to}>{item.label}</Link>
            )}
            {!item.isCurrent && <ChevronRight size={14} aria-hidden />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default memo(Breadcrumb);
