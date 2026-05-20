import { memo, useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Star,
  SlidersHorizontal,
  ArrowUpDown,
  Heart,
  PackageCheck,
  X,
  Loader
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { formatVND } from '../utils/format';
import {
  fetchProducts,
  fetchCategoryBySlug,
  fetchCategoryTree
} from '../services/apiV2';
import FilterSidebar from '../components/FilterSidebar';
import SITE from '../config/site-config';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Nổi bật' },
  { value: 'price-asc', label: 'Giá: thấp → cao' },
  { value: 'price-desc', label: 'Giá: cao → thấp' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'popular', label: 'Bán chạy' }
];

const CATEGORY_COLORS = {
  'thoi-trang': { from: '#3e2d1a', to: '#5e442d' },
  'dien-tu': { from: '#2d1a3e', to: '#442d5e' },
  'do-gia-dung': { from: '#1a3e3e', to: '#2d5e5e' },
  'suc-khoe-lam-dep': { from: '#3e1a1a', to: '#5e2d2d' },
  'lam-dep': { from: '#4a1942', to: '#6b2d5b' },
  'the-thao': { from: '#1a4a1a', to: '#2d6b2d' },
  'sach': { from: '#4a3a1a', to: '#6b552d' },
  'me-be': { from: '#4a2d3e', to: '#6b3d55' },
  'oto-xe-may': { from: '#2d2d3e', to: '#44445e' },
  'thuc-pham': { from: '#3e2d1a', to: '#5e442d' },
  'nong-nghiep': { from: '#1a3e2d', to: '#2d5e44' },
  default: { from: '#14213d', to: '#2a3f6d' }
};

function CategoryPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryMeta, setCategoryMeta] = useState(null);

  const colors = CATEGORY_COLORS[slug] || CATEGORY_COLORS.default;

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    Promise.all([
      fetchCategoryBySlug(slug),
      fetchProducts({ category_slug: slug })
    ])
      .then(([cat, products]) => {
        setCategoryMeta(cat);
        setAllProducts(products || []);
        setFilteredProducts(products || []);
        setLoading(false);
      })
      .catch(() => {
        fetchProducts({ category_slug: slug }).then((products) => {
          setAllProducts(products || []);
          setFilteredProducts(products || []);
          setLoading(false);
        });
      });

    document.title = `${slug?.replace(/-/g, ' ') || 'Danh mục'} - ${SITE.name}`;
    setQuery('');
    setSort('featured');
    setFilterSidebarOpen(false);
    setFilteredProducts([]);
    setCurrentPage(1);
    window.scrollTo({ top: 0 });
  }, [slug]);

  useEffect(() => {
    if (categoryMeta) {
      document.title = `${categoryMeta.title || categoryMeta.name || 'Danh mục'} - ${SITE.name}`;
    }
    setQuery('');
    setSort('featured');
    setFilterSidebarOpen(false);
    setFilteredProducts([]);
    setCurrentPage(1);
    window.scrollTo({ top: 0 });
  }, [slug, categoryMeta]);

  const filtered = useMemo(() => {
    const baseList = filteredProducts.length > 0 ? filteredProducts : allProducts;
    let list = [...baseList];

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case 'price-desc':
        list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case 'rating':
        list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
        break;
      case 'popular':
        list.sort((a, b) => (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0));
        break;
      default:
        break;
    }

    return list;
  }, [filteredProducts, allProducts, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAddToCart = useCallback((product) => {
    addToCart(product);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
  }, [addToCart, toast]);

  const handleToggleWishlist = useCallback((product) => {
    const currentlyWishlisted = isWishlisted(product.id);
    toggleWishlist(product.id);
    toast.success(currentlyWishlisted ? `Đã xoá ${product.name} khỏi yêu thích` : `Đã thêm ${product.name} vào yêu thích`);
  }, [toggleWishlist, isWishlisted, toast]);

  if (!loading && allProducts.length === 0 && !categoryMeta) {
    return (
      <section className="section" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <PackageCheck size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
        <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Danh mục không tồn tại</h1>
        <p style={{ color: 'var(--muted)' }}>Vui lòng quay lại trang chủ để tiếp tục mua sắm.</p>
        <Link to="/" className="primary-button" style={{ marginTop: 24 }}>
          Về trang chủ
        </Link>
      </section>
    );
  }

  const categoryName = categoryMeta?.name || slug?.replace(/-/g, ' ') || 'Danh mục';

  return (
    <>
      {/* Hero Banner */}
      <section
        className="category-hero"
        style={{
          position: 'relative',
          minHeight: '320px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: '0 0 24px 24px',
          marginBottom: 40
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
            zIndex: 1
          }}
        />
        {categoryMeta?.image && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${categoryMeta.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.2,
              zIndex: 1
            }}
          />
        )}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '60px 24px', maxWidth: 720 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 16
            }}
          >
            {filtered.length} sản phẩm
          </span>
          <h1 style={{ color: '#fff', fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: 12 }}>{categoryName}</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem', maxWidth: 520, margin: '0 auto' }}>
            {categoryMeta?.description || ''}
          </p>
        </div>
      </section>

      <section className="section category-page" style={{ paddingTop: 0 }}>
        {/* Toolbar */}
        <div className="category-toolbar" style={{ marginBottom: 32, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="category-search" style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 400 }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm sản phẩm..."
              aria-label="Tìm sản phẩm"
              style={{
                width: '100%',
                padding: '12px 16px 12px 44px',
                borderRadius: 12,
                border: '1.5px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontSize: 15,
                boxSizing: 'border-box'
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="category-controls" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
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
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <SlidersHorizontal size={16} />
              Bộ lọc
            </button>

            <div style={{ position: 'relative' }}>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
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
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ArrowUpDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }} />
            </div>
          </div>
        </div>

        {/* Content: Sidebar + Grid */}
        <div className="category-layout" style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
          <FilterSidebar
            products={allProducts}
            onFilterChange={setFilteredProducts}
            isOpen={filterSidebarOpen}
            onClose={() => setFilterSidebarOpen(false)}
          />

          <div className="category-products">
            <button className="filter-toggle" onClick={() => setFilterSidebarOpen(true)}>
              <SlidersHorizontal size={16} /> Bộ lọc
            </button>

            <p className="category-result-count">
              Đã tìm thấy <strong>{filtered.length}</strong> sản phẩm
            </p>

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Loader size={32} className="spin" style={{ opacity: 0.3 }} />
            <p style={{ marginTop: 12, color: 'var(--muted)' }}>Đang tải sản phẩm...</p>
          </div>
        ) : (
          <>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <PackageCheck size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>Không tìm thấy sản phẩm</p>
                <p style={{ color: 'var(--muted)' }}>Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setQuery('')}
                  style={{ marginTop: 20 }}
                >
                  Xoá bộ lọc
                </button>
              </div>
            ) : (
              <div
                className="category-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 24
                }}
              >
                {paginated.map((product) => (
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
                    {/* Image */}
                    <Link
                      to={`/san-pham/${product.slug}`}
                      style={{
                        position: 'relative',
                        display: 'block',
                        aspectRatio: '1 / 1',
                        overflow: 'hidden',
                        background: 'var(--bg)'
                      }}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.5s ease'
                        }}
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
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}
                        >
                          {product.badge}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleWishlist(product);
                        }}
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.95)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <Heart
                          size={18}
                          fill={isWishlisted(product.id) ? '#ef4444' : 'none'}
                          color={isWishlisted(product.id) ? '#ef4444' : '#64748b'}
                        />
                      </button>
                    </Link>

                    {/* Info */}
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
            )}

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32 }}>
                <button
                  type="button"
                  onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      border: '1.5px solid var(--border)',
                      background: currentPage === page ? 'var(--accent)' : 'var(--surface)',
                      color: currentPage === page ? '#fff' : 'var(--text)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
      </section>
    </>
  );
}

export default memo(CategoryPage);
