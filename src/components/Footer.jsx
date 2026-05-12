import { memo } from 'react';
import { Mail, MapPin, Phone, ShoppingBag } from 'lucide-react';
import SITE from '../config/site-config';

function Footer() {
  return (
    <footer className="footer" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Chân trang {SITE.name}</h2>
      <div className="footer-grid">
        <div>
          <div className="footer-brand">
            <span><ShoppingBag size={20} aria-hidden /></span>
            <strong>{SITE.name}</strong>
          </div>
          <p>{SITE.description}</p>
          <div className="footer-social" aria-label="Mạng xã hội">
            <a href={SITE.facebook} aria-label="Facebook" target="_blank" rel="noopener noreferrer"><span aria-hidden>f</span></a>
            <a href={SITE.instagram} aria-label="Instagram" target="_blank" rel="noopener noreferrer"><span aria-hidden>ig</span></a>
            <a href={SITE.youtube} aria-label="Youtube" target="_blank" rel="noopener noreferrer"><span aria-hidden>yt</span></a>
          </div>
        </div>

        <div>
          <h3>Hỗ trợ khách hàng</h3>
          <ul>
            <li><a href="/chinh-sach/doi-tra">Chính sách đổi trả</a></li>
            <li><a href="/chinh-sach/van-chuyen">Chính sách vận chuyển</a></li>
            <li><a href="/chinh-sach/dieu-khoan">Điều khoản sử dụng</a></li>
            <li><a href="/chinh-sach/faq">Câu hỏi thường gặp</a></li>
          </ul>
        </div>

        <div>
          <h3>Về {SITE.name}</h3>
          <ul>
            <li><a href="/#luxury">Giới thiệu</a></li>
            <li><a href="/chinh-sach/bao-mat">Chính sách bảo mật</a></li>
            <li><a href="/#reviews">Đánh giá</a></li>
            <li><a href="/chinh-sach/lien-he">Liên hệ hợp tác</a></li>
          </ul>
        </div>

        <div>
          <h3>Liên hệ</h3>
          <ul className="contact">
            <li><Phone size={16} aria-hidden /> {SITE.phone}</li>
            <li><Mail size={16} aria-hidden /> {SITE.email}</li>
            <li><MapPin size={16} aria-hidden /> {SITE.address}</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {SITE.name}. Mọi quyền được bảo lưu.</span>
        <span>Thiết kế bởi đội ngũ {SITE.name}</span>
      </div>
    </footer>
  );
}

export default memo(Footer);
