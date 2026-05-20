import { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const LABELS = {
  'san-pham': 'Sản phẩm',
  'danh-muc': 'Danh mục',
  'thanh-toan': 'Thanh toán',
  'tai-khoan': 'Tài khoản',
  'profile': 'Thông tin cá nhân',
  'don-hang': 'Lịch sử đơn hàng',
  'yeu-thich': 'Yêu thích',
  'admin': 'Quản trị',
  'chinh-sach': 'Chính sách',
  'doi-tra': 'Đổi trả',
  'van-chuyen': 'Vận chuyển',
  'bao-mat': 'Bảo mật',
  'dieu-khoan': 'Điều khoản',
  'faq': 'FAQ',
  'lien-he': 'Liên hệ'
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
