import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ShoppingCart, Star, SlidersHorizontal, ArrowUpDown, PackageCheck, X, Loader } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatVND } from '../utils/format';
import { searchProductsV2, fetchProducts } from '../services/apiV2';
import FilterSidebar from '../components/FilterSidebar';
import SITE from '../config/site-config';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Liên quan nhất', sort_by: '', sort_order: '' },
  { value: 'price-asc', label: 'Giá: thấp → cao', sort_by: 'base_price', sort_order: 'asc' },
  { value: 'price-desc', label: 'Giá: cao → thấp', sort_by: 'base_price', sort_order: 'desc' },
  { value: 'newest', label: 'Mới nhất', sort_by: 'created_at', sort_order: 'desc' },
  { value: 'best-selling', label: 'Bán chạy', sort_by: 'updated_at', sort_order: 'desc' }
];

const ITEMS_PER_PAGE = 12;

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const sortMode = searchParams.get('sort') || 'relevance';
  const page = Number(searchParams.get('page')) || 1;

  const { addToCart } = useCart();
  const toast = useToast();

  const [input, setInput] = useState(query);
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);

  const currentSort = useMemo(() => SORT_OPTIONS.find(s => s.value === sortMode) || SORT_OPTIONS[0], [sortMode]);

  useEffect(() => {
    document.title = query ? `Kết quả tìm kiếm "${query}" - ${SITE.name}` : `Tìm kiếm - ${SITE.name}`;
    if (!query) { setResults([]); setTotalResults(0); return; }

    let cancelled = false;
    setLoading(true);
    setError(false);

    const sort = SORT_OPTIONS.find(s => s.value === sortMode) || SORT_OPTIONS[0];

    (async () => {
      try {
        let hits = [];
        let total = 0;
        let tp = 1;

        try {
          const pgResult = await searchProductsV2(query, {
            limit: ITEMS_PER_PAGE,
            page,
            sort_by: sort.sort_by,
            sort_order: sort.sort_order
          });
          hits = pgResult.products || [];
          total = pgResult.total || 0;
          tp = pgResult.totalPages || 1;
        } catch {
          // Fallback
        }

        if (cancelled) return;

        setResults(hits);
        setFilteredResults(hits);
        setTotalResults(total);
        setTotalPages(tp);
        if (hits.length === 0 && total === 0) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [query, sortMode, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const next = new URLSearchParams();
    next.set('q', input.trim());
    if (sortMode !== 'relevance') next.set('sort', sortMode);
    setSearchParams(next);
  };

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const handleAddToCart = useCallback((product) => {
    addToCart(product);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
  }, [addToCart, toast]);

  const displayResults = filteredResults.length > 0 ? filteredResults : results;
  const currentPage = page;
  const paginatedResults = displayResults;

  return (
    <>
      <section className="section" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: 8 }}>Tìm kiếm sản phẩm</h1>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Tìm sản phẩm, thương hiệu, danh mục bạn cần</p>

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
              style={{ borderRadius: '0 12px 12px 0', padding: '14px 24px', fontWeight: 700 }}
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
            <div className="category-toolbar" style={{ marginBottom: 32, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <p style={{ flex: 1, color: 'var(--muted)', fontSize: 14, margin: 0 }}>
                Kết quả cho <strong style={{ color: 'var(--text)' }}>"{query}"</strong>: {totalResults > 0 ? `${totalResults} sản phẩm` : 'Không tìm thấy'}
              </p>

              <button
                type="button"
                className="filter-toggle"
                onClick={() => setFilterSidebarOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: '1.5px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <SlidersHorizontal size={16} />
                Bộ lọc
              </button>

              <div style={{ position: 'relative' }}>
                <select
                  value={sortMode}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  style={{
                    padding: '10px 36px 10px 16px',
                    borderRadius: 10,
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontWeight: 600,
                    appearance: 'none',
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ArrowUpDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }} />
              </div>
            </div>

            <div className="category-layout" style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
              <FilterSidebar
                products={results}
                onFilterChange={setFilteredResults}
                isOpen={filterSidebarOpen}
                onClose={() => setFilterSidebarOpen(false)}
              />

              <div className="category-products" style={{ flex: 1 }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 60 }}>
                    <Loader size={32} className="spin" style={{ opacity: 0.3 }} />
                    <p style={{ marginTop: 12, color: 'var(--muted)' }}>Đang tìm kiếm...</p>
                  </div>
                ) : displayResults.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--surface)', borderRadius: 16 }}>
                    <PackageCheck size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Không tìm thấy sản phẩm</p>
                    <p style={{ color: 'var(--muted)' }}>Thử từ khoá khác hoặc thay đổi bộ lọc</p>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                        gap: 24
                      }}
                    >
                      {paginatedResults.map((product) => (
                        <article
                          key={product.id}
                          className="category-card"
                          style={{
                            background: 'var(--surface)',
                            borderRadius: 16,
                            overflow: 'hidden',
                            border: '1.5px solid var(--border)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-6px)';
                            e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <Link to={`/san-pham/${product.slug}`} style={{ position: 'relative', display: 'block', aspectRatio: '1 / 1', overflow: 'hidden', background: 'var(--bg)' }}>
                            <img
                              src={product.image}
                              alt={product.name}
                              loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                              onMouseEnter={(e) => { e.target.style.transform = 'scale(1.08)'; }}
                              onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
                            />
                            {product.badge && (
                              <span
                                style={{
                                  position: 'absolute',
                                  top: 12,
                                  left: 12,
                                  padding: '4px 12px',
                                  borderRadius: 20,
                                  background: product.badge === 'Bán chạy' ? '#f97316' : product.badge === 'Giảm giá' ? '#ef4444' : product.badge === 'Cao cấp' ? '#8b5cf6' : 'var(--navy)',
                                  color: '#fff',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  textTransform: 'uppercase'
                                }}
                              >
                                {product.badge}
                              </span>
                            )}
                          </Link>

                          <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>
                              {product.brand || product.category}
                            </span>
                            <Link
                              to={`/san-pham/${product.slug}`}
                              style={{
                                color: 'var(--text)',
                                fontWeight: 700,
                                fontSize: '1rem',
                                lineHeight: 1.4,
                                textDecoration: 'none',
                                marginBottom: 8,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {product.name}
                            </Link>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 700, fontSize: 13 }}>
                                <Star size={14} fill="#f59e0b" /> {product.rating || 4.5}
                              </span>
                              <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                                ({product.reviewCount || 0} đánh giá)
                              </span>
                            </div>

                            <p
                              style={{
                                fontSize: 13,
                                color: 'var(--muted)',
                                lineHeight: 1.5,
                                marginBottom: 12,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                flex: 1
                              }}
                            >
                              {product.description}
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent)' }}>
                                {formatVND(product.price)}
                              </span>
                              {product.oldPrice > product.price && (
                                <span style={{ fontSize: 14, color: 'var(--muted)', textDecoration: 'line-through' }}>
                                  {formatVND(product.oldPrice)}
                                </span>
                              )}
                              {product.oldPrice > product.price && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#ef4444',
                                    background: 'rgba(239,68,68,0.1)',
                                    padding: '2px 8px',
                                    borderRadius: 6
                                  }}
                                >
                                  -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              className="primary-button"
                              onClick={() => handleAddToCart(product)}
                              style={{
                                width: '100%',
                                padding: '10px 16px',
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                fontSize: 14,
                                fontWeight: 700
                              }}
                            >
                              <ShoppingCart size={16} /> Thêm vào giỏ
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32 }}>
                        <button
                          type="button"
                          onClick={() => {
                            const next = new URLSearchParams(searchParams);
                            next.set('page', String(Math.max(1, currentPage - 1)));
                            setSearchParams(next);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          disabled={currentPage === 1}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: '1.5px solid var(--border)',
                            background: 'var(--surface)',
                            color: currentPage === 1 ? 'var(--muted)' : 'var(--text)',
                            fontWeight: 600,
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            opacity: currentPage === 1 ? 0.5 : 1
                          }}
                        >
                          ← Trước
                        </button>

                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let p;
                          if (totalPages <= 5) {
                            p = i + 1;
                          } else if (currentPage <= 3) {
                            p = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            p = totalPages - 4 + i;
                          } else {
                            p = currentPage - 2 + i;
                          }
                          return p;
                        }).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              const next = new URLSearchParams(searchParams);
                              next.set('page', String(p));
                              setSearchParams(next);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              border: '1.5px solid var(--border)',
                              background: currentPage === p ? 'var(--accent)' : 'var(--surface)',
                              color: currentPage === p ? '#fff' : 'var(--text)',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {p}
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            const next = new URLSearchParams(searchParams);
                            next.set('page', String(Math.min(totalPages, currentPage + 1)));
                            setSearchParams(next);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          disabled={currentPage === totalPages}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: '1.5px solid var(--border)',
                            background: 'var(--surface)',
                            color: currentPage === totalPages ? 'var(--muted)' : 'var(--text)',
                            fontWeight: 600,
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            opacity: currentPage === totalPages ? 0.5 : 1
                          }}
                        >
                          Sau →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}

export default memo(SearchPage);
