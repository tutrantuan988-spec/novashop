import { memo, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Clock, ArrowRight, ShoppingCart } from 'lucide-react';
import { fetchProducts } from '../services/apiV2';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { formatVND } from '../utils/format';
import SITE from '../config/site-config';

function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Clock size={18} style={{ color: '#ef4444' }} />
      {[
        { value: pad(timeLeft.hours), label: 'Giờ' },
        { value: pad(timeLeft.minutes), label: 'Phút' },
        { value: pad(timeLeft.seconds), label: 'Giây' }
      ].map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            background: '#ef4444',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: 6,
            fontWeight: 800,
            fontSize: 18,
            minWidth: 40,
            textAlign: 'center'
          }}>
            {item.value}
          </span>
          {i < 2 && <span style={{ fontWeight: 800, color: '#ef4444', fontSize: 18 }}>:</span>}
        </div>
      ))}
    </div>
  );
}

function FlashSalePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const flashSaleEnd = new Date();
  flashSaleEnd.setHours(23, 59, 59, 0);

  useEffect(() => {
    document.title = `Flash Sale - ${SITE.name}`;
    window.scrollTo({ top: 0 });
    fetchProducts({ sort_by: 'sale_price', sort_order: 'asc', limit: 20 })
      .then((res) => setProducts(res.products || res))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const dealProducts = products.filter(p => p.sale_price || p.oldPrice).slice(0, 12);

  if (loading) {
    return (
      <section className="section" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <Zap size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
        <p>Đang tải flash sale...</p>
      </section>
    );
  }

  return (
    <section className="section" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
        borderRadius: 24,
        padding: '40px 32px',
        marginBottom: 40,
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 24
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Zap size={32} fill="#fff" />
            <h1 style={{ fontSize: 36, fontWeight: 900 }}>FLASH SALE</h1>
          </div>
          <p style={{ fontSize: 18, opacity: 0.9 }}>Giảm giá cực sốc — Số lượng có hạn!</p>
        </div>
        <CountdownTimer targetDate={flashSaleEnd} />
      </div>

      {/* Products */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
        {dealProducts.map((product) => {
          const price = product.sale_price || product.price || product.base_price;
          const oldPrice = product.oldPrice || product.base_price;
          const discount = oldPrice && price ? Math.round((1 - price / oldPrice) * 100) : 0;

          return (
            <div
              key={product.id}
              style={{
                background: 'var(--surface)',
                borderRadius: 16,
                border: '1.5px solid var(--border)',
                overflow: 'hidden',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(239, 68, 68, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Discount badge */}
              {discount > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  background: '#ef4444',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 800,
                  zIndex: 1
                }}>
                  -{discount}%
                </div>
              )}

              <Link to={`/san-pham/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ height: 200, overflow: 'hidden', background: 'var(--bg)' }}>
                  <img
                    src={product.image || product.primary_image_url}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                </div>
                <div style={{ padding: 16 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.4, minHeight: 42 }}>
                    {product.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#ef4444' }}>
                      {formatVND(price)}
                    </span>
                    {oldPrice && oldPrice > price && (
                      <span style={{ fontSize: 14, color: 'var(--muted)', textDecoration: 'line-through' }}>
                        {formatVND(oldPrice)}
                      </span>
                    )}
                  </div>

                  {/* Progress bar for "sold" */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                      <span>Đã bán {product.sold || 0}</span>
                      <span>Còn {product.stock || 0}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, ((product.sold || 0) / ((product.sold || 0) + (product.stock || 1))) * 100)}%`,
                        background: 'linear-gradient(90deg, #ef4444, #f97316)',
                        borderRadius: 3,
                        transition: 'width 0.5s'
                      }} />
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart(product, 1, null);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      borderRadius: 10,
                      border: 'none',
                      background: '#ef4444',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <ShoppingCart size={16} /> Thêm vào giỏ
                  </button>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {dealProducts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Zap size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h2 style={{ marginBottom: 8 }}>Hiện không có flash sale nào</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Hãy quay lại sau để không bỏ lỡ ưu đãi!</p>
          <Link to="/danh-muc" className="primary-button">
            Khám phá sản phẩm <ArrowRight size={18} />
          </Link>
        </div>
      )}
    </section>
  );
}

export default memo(FlashSalePage);
