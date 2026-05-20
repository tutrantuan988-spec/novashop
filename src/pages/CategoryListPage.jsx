import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Loader, ShoppingBag, Shirt, Monitor, Home, Heart, Zap } from 'lucide-react';
import { fetchCategoryTree, fetchProducts } from '../services/apiV2';
import SITE from '../config/site-config';

const CATEGORY_ICONS = {
  'thuc-an-cho-cho': ShoppingBag,
  'thuc-an-cho-meo': ShoppingBag,
  'phu-kien-thu-cung': Package,
  'thoi-trang': Shirt,
  'dien-tu': Monitor,
  'do-gia-dung': Home,
  'suc-khoe-lam-dep': Heart,
  default: Package
};

const CATEGORY_COLORS = {
  'thuc-an-cho-cho': { from: '#1a233e', to: '#2d3a5e', accent: '#4f6fbf' },
  'thuc-an-cho-meo': { from: '#3e1a2d', to: '#5e2d44', accent: '#bf4f7a' },
  'phu-kien-thu-cung': { from: '#1a3e2d', to: '#2d5e44', accent: '#4fbf7a' },
  'thoi-trang': { from: '#3e2d1a', to: '#5e442d', accent: '#bf8f4f' },
  'dien-tu': { from: '#2d1a3e', to: '#442d5e', accent: '#7a4fbf' },
  'do-gia-dung': { from: '#1a3e3e', to: '#2d5e5e', accent: '#4fbfbf' },
  'suc-khoe-lam-dep': { from: '#3e1a1a', to: '#5e2d2d', accent: '#bf4f4f' },
  default: { from: '#14213d', to: '#2a3f6d', accent: '#4f6fbf' }
};

function CategoryListPage() {
  const [categories, setCategories] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCategoryTree()
      .then((tree) => {
        const topLevel = tree.filter((c) => c.is_active !== false);
        setCategories(topLevel);
        return Promise.allSettled(
          topLevel.map((cat) =>
            fetchProducts({ category_slug: cat.slug, limit: 1 }).then(
              (products) => ({ slug: cat.slug, count: products.length === 1 ? (products._total || 0) : 0 })
            )
          )
        );
      })
      .then((results) => {
        const counts = {};
        results.forEach((r) => {
          if (r.status === 'fulfilled' && r.value) counts[r.value.slug] = r.value.count;
        });
        setProductCounts(counts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="section" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <Loader size={32} className="spin" style={{ opacity: 0.3 }} />
        <p style={{ marginTop: 12, color: 'var(--muted)' }}>Đang tải danh mục...</p>
      </section>
    );
  }

  return (
    <>
      <section
        style={{
          background: 'linear-gradient(135deg, #14213d 0%, #2a3f6d 100%)',
          padding: '60px 24px',
          textAlign: 'center',
          borderRadius: '0 0 24px 24px'
        }}
      >
        <h1 style={{ color: '#fff', fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginBottom: 12 }}>
          Danh mục sản phẩm
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto' }}>
          Khám phá đa dạng ngành hàng tại {SITE.name}
        </p>
      </section>

      <section className="section">
        {categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <Package size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Chưa có danh mục nào</p>
            <p style={{ color: 'var(--muted)' }}>Vui lòng quay lại sau.</p>
            <Link to="/" className="primary-button" style={{ marginTop: 20 }}>
              Về trang chủ
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 24
            }}
          >
            {categories.map((cat) => {
              const slug = cat.slug;
              const colors = CATEGORY_COLORS[slug] || CATEGORY_COLORS.default;
              const Icon = CATEGORY_ICONS[slug] || CATEGORY_ICONS.default;
              const count = productCounts[slug];

              return (
                <Link
                  key={cat.id}
                  to={`/danh-muc/${slug}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 20,
                    overflow: 'hidden',
                    background: 'var(--surface)',
                    border: '1.5px solid var(--border)',
                    textDecoration: 'none',
                    color: 'var(--text)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
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
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
                      padding: '40px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      minHeight: 140
                    }}
                  >
                    <div>
                      <h2 style={{ color: '#fff', fontSize: '1.5rem', margin: 0 }}>
                        {cat.name}
                      </h2>
                      {count !== undefined && (
                        <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 6, fontSize: 14 }}>
                          {count} sản phẩm
                        </p>
                      )}
                    </div>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: 'rgba(255,255,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Icon size={28} color="#fff" />
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--muted)' }}>
                      {cat.description || `Khám phá ${cat.name.toLowerCase()} tại ${SITE.name}`}
                    </span>
                    <ChevronRight size={18} style={{ color: 'var(--accent)' }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

export default memo(CategoryListPage);