import { memo, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ShoppingCart, Star, Heart, PackageCheck, X, Loader } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { formatVND } from '../utils/format';
import { ALL_CATEGORY_PRODUCTS } from '../data/categoryProducts';
import SITE from '../config/site-config';

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { addItem } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const toast = useToast();

  const [input, setInput] = useState(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = query ? `Kết quả tìm kiếm "${query}" - ${SITE.name}` : `Tìm kiếm - ${SITE.name}`;
    if (!query) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(() => {
      const q = query.toLowerCase();
      const filtered = ALL_CATEGORY_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
      setResults(filtered);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSearchParams({ q: input.trim() });
  };

  const handleAdd = (product) => {
    addItem(product);
    toast.success(`Đã thêm ${product.name}`);
  };

  return (
    <section className="section" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: 8 }}>Tìm kiếm sản phẩm</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Tìm thức ăn, phụ kiện cho thú cưng của bạn</p>

        <form
          onSubmit={handleSearch}
          style={{
            position: 'relative',
            maxWidth: 600,
            margin: '0 auto',
            display: 'flex',
            gap: 0
          }}
        >
          <Search size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tìm sản phẩm, thương hiệu, danh mục..."
            style={{
              flex: 1,
              padding: '14px 16px 14px 48px',
              borderRadius: '12px 0 0 12px',
              border: '1.5px solid var(--border)',
              borderRight: 'none',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: 16
            }}
          />
          <button
            type="submit"
            className="primary-button"
            style={{
              borderRadius: '0 12px 12px 0',
              padding: '14px 24px',
              fontWeight: 700
            }}
          >
            Tìm kiếm
          </button>
          {input && (
            <button
              type="button"
              onClick={() => { setInput(''); setSearchParams({}); }}
              style={{
                position: 'absolute',
                right: 110,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                opacity: 0.5
              }}
            >
              <X size={18} />
            </button>
          )}
        </form>
      </div>

      {query && (
        <>
          <p style={{ marginBottom: 20, color: 'var(--muted)', fontSize: 14 }}>
            Kết quả cho <strong style={{ color: 'var(--text)' }}>"{query}"</strong>: {results.length} sản phẩm
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Loader size={32} className="spin" style={{ opacity: 0.3 }} />
              <p style={{ marginTop: 12, color: 'var(--muted)' }}>Đang tìm kiếm...</p>
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--surface)', borderRadius: 16 }}>
              <PackageCheck size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Không tìm thấy sản phẩm</p>
              <p style={{ color: 'var(--muted)' }}>Thử từ khoá khác hoặc tìm theo thương hiệu</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 20
              }}
            >
              {results.map((product) => (
                <article
                  key={product.id}
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: '1.5px solid var(--border)',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Link to={`/san-pham/${product.slug}`} style={{ display: 'block', aspectRatio: '1/1', overflow: 'hidden', background: 'var(--bg)' }}>
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                      onMouseEnter={(e) => { e.target.style.transform = 'scale(1.06)'; }}
                      onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
                    />
                    {product.badge && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          padding: '4px 10px',
                          borderRadius: 20,
                          background: '#f97316',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 700
                        }}
                      >
                        {product.badge}
                      </span>
                    )}
                  </Link>
                  <div style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{product.brand}</span>
                    <Link
                      to={`/san-pham/${product.slug}`}
                      style={{ display: 'block', color: 'var(--text)', fontWeight: 700, fontSize: 14, margin: '6px 0', textDecoration: 'none', lineHeight: 1.4 }}
                    >
                      {product.name}
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{product.rating}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>({product.reviewCount})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent)' }}>
                          {formatVND(product.price)}
                        </span>
                        {product.oldPrice > product.price && (
                          <span style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'line-through', marginLeft: 6 }}>
                            {formatVND(product.oldPrice)}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAdd(product)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'var(--accent)',
                          border: 'none',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default memo(SearchPage);
