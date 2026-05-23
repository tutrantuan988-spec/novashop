import { memo, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Search, ShoppingBag } from 'lucide-react';
import SITE from '../config/site-config';

function NotFoundPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = `404 - Không tìm thấy trang | ${SITE.name}`;
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/tim-kiem?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <section className="section not-found">
      <div className="not-found-card">
        <span className="not-found-code">404</span>
        <h1>Không tìm thấy trang</h1>
        <p>Trang bạn đang tìm có thể đã bị di chuyển hoặc không còn tồn tại.</p>

        <form className="not-found-search" onSubmit={handleSearch}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            aria-label="Tìm kiếm"
          />
          <button type="submit" aria-label="Tìm">
            <Search size={18} />
          </button>
        </form>

        <div className="not-found-actions">
          <Link to="/" className="primary-button">
            <Home size={18} aria-hidden /> Về trang chủ
          </Link>
          <Link to="/danh-muc" className="secondary-button">
            <ShoppingBag size={18} aria-hidden /> Khám phá sản phẩm
          </Link>
        </div>
      </div>
    </section>
  );
}

export default memo(NotFoundPage);
