import { memo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import SITE from '../config/site-config';

function NotFoundPage() {
  useEffect(() => {
    document.title = `404 - Không tìm thấy trang | ${SITE.name}`;
  }, []);

  return (
    <section className="section not-found">
      <div className="not-found-card">
        <span className="not-found-code">404</span>
        <h1>Không tìm thấy trang</h1>
        <p>Trang bạn đang tìm có thể đã bị di chuyển hoặc không còn tồn tại.</p>
        <div className="not-found-actions">
          <Link to="/" className="primary-button">
            <Home size={18} aria-hidden /> Về trang chủ
          </Link>
          <Link to="/#products" className="secondary-button">
            <Search size={18} aria-hidden /> Khám phá sản phẩm
          </Link>
        </div>
      </div>
    </section>
  );
}

export default memo(NotFoundPage);
