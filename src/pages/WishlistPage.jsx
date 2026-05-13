import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowRight, PackageCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { formatVND } from '../utils/format';
import SITE from '../config/site-config';

function WishlistPage() {
  const { items: wishlistItems, removeItem } = useWishlist();
  const { addToCart } = useCart();
  const toast = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    document.title = `Yêu thích - ${SITE.name}`;
    setMounted(true);
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
  };

  const handleRemove = (product) => {
    removeItem(product.id);
    toast.success(`Đã xoá ${product.name} khỏi yêu thích`);
  };

  if (!mounted) return null;

  return (
    <section className="section" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div className="section-heading">
        <div>
          <span className="section-kicker"><Heart size={16} aria-hidden fill="currentColor" /> Yêu thích</span>
          <h1>Sản phẩm đã lưu</h1>
        </div>
        <span style={{ fontSize: 14, color: 'var(--muted)' }}>{wishlistItems.length} sản phẩm</span>
      </div>

      {wishlistItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', background: 'var(--surface)', borderRadius: 16 }}>
          <Heart size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Chưa có sản phẩm yêu thích</p>
          <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Lưu sản phẩm bạn yêu thích để xem lại sau!</p>
          <Link to="/" className="primary-button" style={{ display: 'inline-flex', gap: 8 }}>
            Mua sắm ngay <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20
          }}
        >
          {wishlistItems.map((product) => (
            <article
              key={product.id}
              style={{
                background: 'var(--surface)',
                borderRadius: 16,
                overflow: 'hidden',
                border: '1.5px solid var(--border)',
                transition: 'all 0.3s',
                display: 'flex',
                flexDirection: 'column'
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
              <Link to={`/san-pham/${product.slug}`} style={{ display: 'block', aspectRatio: '1/1', overflow: 'hidden', position: 'relative', background: 'var(--bg)' }}>
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                  onMouseEnter={(e) => { e.target.style.transform = 'scale(1.06)'; }}
                  onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
                />
              </Link>
              <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{product.brand}</span>
                <Link
                  to={`/san-pham/${product.slug}`}
                  style={{ color: 'var(--text)', fontWeight: 700, fontSize: '1rem', textDecoration: 'none', margin: '6px 0 10px', lineHeight: 1.4 }}
                >
                  {product.name}
                </Link>
                <p style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent)', marginBottom: 14 }}>
                  {formatVND(product.price)}
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleAddToCart(product)}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, fontWeight: 700 }}
                  >
                    <ShoppingCart size={16} /> Thêm giỏ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(product)}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      border: '1.5px solid var(--border)',
                      background: 'var(--bg)',
                      color: '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    aria-label="Xoá khỏi yêu thích"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default memo(WishlistPage);
