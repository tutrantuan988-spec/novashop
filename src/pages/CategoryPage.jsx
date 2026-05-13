import { memo, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Star,
  Filter,
  ChevronDown,
  Heart,
  PackageCheck,
  ArrowUpDown,
  Tag,
  X
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { formatVND } from '../utils/format';
import {
  getCategoryMeta,
  getAllBrands,
  getPriceRange,
  filterProducts
} from '../data/categoryProducts';
import SITE from '../config/site-config';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Nổi bật' },
  { value: 'price-asc', label: 'Giá: thấp → cao' },
  { value: 'price-desc', label: 'Giá: cao → thấp' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'popular', label: 'Bán chạy' }
];

function CategoryPage({ slug: propSlug }) {
  const location = useLocation();
  const slug = propSlug || location.pathname.replace(/^\/+/, '').split('/')[0];
  const { addToCart } = useCart();
  const { toggleItem, isWishlisted } = useWishlist();
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [sort, setSort] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const meta = useMemo(() => getCategoryMeta(slug), [slug]);
  const brands = useMemo(() => getAllBrands(slug), [slug]);
  const range = useMemo(() => getPriceRange(slug), [slug]);

  useEffect(() => {
    if (meta) {
      document.title = `${meta.title} - ${SITE.name}`;
    }
    // Reset filters when slug changes
    setQuery('');
    setSelectedBrand('all');
    setSort('featured');
    setPriceRange({ min: '', max: '' });
    setCurrentPage(1);
    window.scrollTo({ top: 0 });
  }, [slug, meta]);

  const filtered = useMemo(() => {
    if (!meta) return [];
    return filterProducts(slug, {
      query: query.trim(),
      brand: selectedBrand,
      sort,
      minPrice: priceRange.min ? Number(priceRange.min) : undefined,
      maxPrice: priceRange.max ? Number(priceRange.max) : undefined
    });
  }, [slug, meta, query, selectedBrand, sort, priceRange]);

  const activeFilterCount =
    (selectedBrand !== 'all' ? 1 : 0) +
    (query ? 1 : 0) +
    (priceRange.min || priceRange.max ? 1 : 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
  };

  const handleToggleWishlist = (product) => {
    toggleItem(product);
    const added = isWishlisted(product.id);
    toast.success(added ? `Đã thêm ${product.name} vào yêu thích` : `Đã xoá ${product.name} khỏi yêu thích`);
  };

  if (!meta) {
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
            backgroundImage: `linear-gradient(135deg, rgba(20,33,61,0.85) 0%, rgba(20,33,61,0.6) 100%), url(${meta.heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 1
          }}
        />
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
            {meta.products.length} sản phẩm
          </span>
          <h1 style={{ color: '#fff', fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: 12 }}>{meta.title}</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem', maxWidth: 520, margin: '0 auto' }}>
            {meta.subtitle}
          </p>
        </div>
      </section>

      <section className="section category-page" style={{ paddingTop: 0 }}>
        {/* Toolbar */}
        <div className="category-toolbar" style={{ marginBottom: 32 }}>
          <div className="category-search" style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
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
                fontSize: 15
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
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters((s) => !s)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 10,
                border: '1.5px solid var(--border)',
                background: showFilters ? 'var(--accent)' : 'var(--surface)',
                color: showFilters ? '#fff' : 'var(--text)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Filter size={16} />
              Bộ lọc
              {activeFilterCount > 0 && (
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
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

        {/* Filters Panel */}
        {showFilters && (
          <div
            className="filters-panel"
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              padding: '24px',
              marginBottom: 32,
              border: '1.5px solid var(--border)',
              display: 'grid',
              gap: 24,
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
            }}
          >
            {/* Brand Filter */}
            <div>
              <strong style={{ display: 'block', marginBottom: 10, fontSize: 14 }}>Thương hiệu</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setSelectedBrand('all')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border: '1.5px solid var(--border)',
                    background: selectedBrand === 'all' ? 'var(--accent)' : 'transparent',
                    color: selectedBrand === 'all' ? '#fff' : 'var(--text)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Tất cả
                </button>
                {brands.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setSelectedBrand(brand)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 20,
                      border: '1.5px solid var(--border)',
                      background: selectedBrand === brand ? 'var(--accent)' : 'transparent',
                      color: selectedBrand === brand ? '#fff' : 'var(--text)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <strong style={{ display: 'block', marginBottom: 10, fontSize: 14 }}>Khoảng giá</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  placeholder="Từ"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange((r) => ({ ...r, min: e.target.value }))}
                  style={{
                    width: 100,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: 14
                  }}
                />
                <span style={{ color: 'var(--muted)' }}>—</span>
                <input
                  type="number"
                  placeholder="Đến"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange((r) => ({ ...r, max: e.target.value }))}
                  style={{
                    width: 100,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: 14
                  }}
                />
              </div>
              <small style={{ color: 'var(--muted)', marginTop: 6, display: 'block' }}>
                {formatVND(range.min)} - {formatVND(range.max)}
              </small>
            </div>
          </div>
        )}

        {/* Results count */}
        <p style={{ marginBottom: 20, color: 'var(--muted)', fontSize: 14 }}>
          Hiển thị <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> sản phẩm
        </p>

        {/* Product Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <PackageCheck size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>Không tìm thấy sản phẩm</p>
            <p style={{ color: 'var(--muted)' }}>Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setQuery('');
                setSelectedBrand('all');
                setPriceRange({ min: '', max: '' });
              }}
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
                    {product.brand}
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
                      <Star size={14} fill="#f59e0b" /> {product.rating}
                    </span>
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                      ({product.reviewCount} đánh giá)
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
      </section>
    </>
  );
}

export default memo(CategoryPage);
