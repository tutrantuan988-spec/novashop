import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ShoppingCart, Star, SlidersHorizontal, ArrowUpDown, PackageCheck, Loader } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatVND } from '../utils/format';
import { fetchProducts } from '../services/apiV2';
import FilterSidebar from '../components/FilterSidebar';
import SITE from '../config/site-config';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất', sort_by: 'created_at', sort_order: 'desc' },
  { value: 'price-asc', label: 'Giá: thấp → cao', sort_by: 'base_price', sort_order: 'asc' },
  { value: 'price-desc', label: 'Giá: cao → thấp', sort_by: 'base_price', sort_order: 'desc' },
  { value: 'name-asc', label: 'Tên A → Z', sort_by: 'name_vi', sort_order: 'asc' },
  { value: 'name-desc', label: 'Tên Z → A', sort_by: 'name_vi', sort_order: 'desc' }
];

const ITEMS_PER_PAGE = 12;

function BrandPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const sortMode = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;

  const { addToCart } = useCart();
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brandInfo, setBrandInfo] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);

  const currentSort = useMemo(() => SORT_OPTIONS.find(s => s.value === sortMode) || SORT_OPTIONS[0], [sortMode]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setProducts([]);
    setFilteredProducts([]);

    const sort = SORT_OPTIONS.find(s => s.value === sortMode) || SORT_OPTIONS[0];

    Promise.all([
      fetch(`${API_BASE}/api/v2/brands/${encodeURIComponent(slug)}?page=${page}&limit=${ITEMS_PER_PAGE}&sort_by=${sort.sort_by}&sort_order=${sort.sort_order}`).then(r => r.json()),
      fetch(`${API_BASE}/api/v2/brands`).then(r => r.json())
    ])
      .then(([brandResult, allBrandsResult]) => {
        const brandName = deslugifyBrand(slug);
        const brandData = allBrandsResult?.data?.find(b => b.slug === slug);

        setBrandInfo({
          name: brandName,
          productCount: brandData?.productCount || brandResult?.total || 0
        });

        const transformed = (brandResult?.data || []).map(transformProduct);
        setProducts(transformed);
        setFilteredProducts(transformed);
        setTotalResults(brandResult?.total || 0);
        setTotalPages(brandResult?.totalPages || 1);
        setLoading(false);

        document.title = `${brandName} - ${SITE.name}`;
      })
      .catch(() => {
        setLoading(false);
      });

    window.scrollTo({ top: 0 });
  }, [slug, sortMode, page]);

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

  const displayProducts = filteredProducts.length > 0 ? filteredProducts : products;

  if (!loading && !brandInfo) {
    return (
      <section className="section" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <PackageCheck size={64} style={{ opacity: 0.3, marginBottom: 16 }} />
        <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Thương hiệu không tồn tại</h1>
        <p style={{ color: 'var(--muted)' }}>Vui lòng quay lại trang chủ để tiếp tục mua sắm.</p>
        <Link to="/" className="primary-button" style={{ marginTop: 24 }}>Về trang chủ</Link>
      </section>
    );
  }

  return (
    <>
      <section
        className="category-hero"
        style={{
          position: 'relative',
          minHeight: '240px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: '0 0 24px 24px',
          marginBottom: 40,
          background: 'linear-gradient(135deg, #1a233e 0%, #2d3a5e 100%)'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '48px 24px', maxWidth: 720 }}>
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
            Thương hiệu
          </span>
          <h1 style={{ color: '#fff', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: 12 }}>
            {brandInfo?.name || slug}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem' }}>
            {totalResults > 0 ? `${totalResults} sản phẩm` : 'Đang tải...'}
          </p>
        </div>
      </section>

      <section className="section" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="category-toolbar" style={{ marginBottom: 32, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <p style={{ flex: 1, color: 'var(--muted)', fontSize: 14, margin: 0 }}>
            {totalResults > 0 ? `Hiển thị ${displayProducts.length} trong ${totalResults} sản phẩm` : ''}
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
            products={products}
            onFilterChange={setFilteredProducts}
            isOpen={filterSidebarOpen}
            onClose={() => setFilterSidebarOpen(false)}
          />

          <div className="category-products" style={{ flex: 1 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Loader size={32} className="spin" style={{ opacity: 0.3 }} />
                <p style={{ marginTop: 12, color: 'var(--muted)' }}>Đang tải sản phẩm...</p>
              </div>
            ) : displayProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--surface)', borderRadius: 16 }}>
                <PackageCheck size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Chưa có sản phẩm</p>
                <p style={{ color: 'var(--muted)' }}>Thương hiệu này chưa có sản phẩm nào.</p>
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
                  {displayProducts.map((product) => (
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
                        next.set('page', String(Math.max(1, page - 1)));
                        setSearchParams(next);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={page === 1}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        color: page === 1 ? 'var(--muted)' : 'var(--text)',
                        fontWeight: 600,
                        cursor: page === 1 ? 'not-allowed' : 'pointer',
                        opacity: page === 1 ? 0.5 : 1
                      }}
                    >
                      ← Trước
                    </button>

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let p;
                      if (totalPages <= 5) p = i + 1;
                      else if (page <= 3) p = i + 1;
                      else if (page >= totalPages - 2) p = totalPages - 4 + i;
                      else p = page - 2 + i;
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
                          background: page === p ? 'var(--accent)' : 'var(--surface)',
                          color: page === p ? '#fff' : 'var(--text)',
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
                        next.set('page', String(Math.min(totalPages, page + 1)));
                        setSearchParams(next);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={page === totalPages}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        color: page === totalPages ? 'var(--muted)' : 'var(--text)',
                        fontWeight: 600,
                        cursor: page === totalPages ? 'not-allowed' : 'pointer',
                        opacity: page === totalPages ? 0.5 : 1
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

function transformProduct(pgProduct) {
  const basePrice = Number(pgProduct.base_price) || 0;
  const salePrice = Number(pgProduct.sale_price) || 0;
  return {
    id: pgProduct.id,
    name: pgProduct.name_vi || pgProduct.name_en || '',
    category: pgProduct.category_name_vi || '',
    price: basePrice,
    oldPrice: salePrice > basePrice ? salePrice : undefined,
    stock: 0,
    badge: pgProduct.badge_vi || '',
    image: pgProduct.primary_image_url || '',
    description: pgProduct.description_vi || pgProduct.description_en || '',
    slug: pgProduct.slug || '',
    rating: 4.5,
    reviewCount: 0,
    brand: pgProduct.brand || '',
    _pg: pgProduct
  };
}

function deslugifyBrand(slug) {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default memo(BrandPage);
