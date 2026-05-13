import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Clock, ShoppingCart, Flame } from 'lucide-react';
import { formatVND } from '../utils/format';
import { DOG_FOOD_PRODUCTS, CAT_FOOD_PRODUCTS, ACCESSORIES_PRODUCTS } from '../data/categoryProducts';

function Countdown({ targetMinutes = 120 }) {
  const [time, setTime] = useState(targetMinutes * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((t) => (t > 0 ? t - 1 : targetMinutes * 60));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetMinutes]);

  const h = Math.floor(time / 3600);
  const m = Math.floor((time % 3600) / 60);
  const s = time % 60;

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="flash-countdown">
      <span className="flash-countdown-box">{pad(h)}</span>
      <span className="flash-countdown-sep">:</span>
      <span className="flash-countdown-box">{pad(m)}</span>
      <span className="flash-countdown-sep">:</span>
      <span className="flash-countdown-box">{pad(s)}</span>
    </div>
  );
}

function FlashSale() {
  const flashProducts = [
    ...DOG_FOOD_PRODUCTS.filter((p) => p.oldPrice > p.price).slice(0, 2),
    ...CAT_FOOD_PRODUCTS.filter((p) => p.oldPrice > p.price).slice(0, 2),
    ...ACCESSORIES_PRODUCTS.filter((p) => p.oldPrice > p.price).slice(0, 2)
  ];

  if (flashProducts.length === 0) return null;

  return (
    <section className="section flash-sale-section" aria-labelledby="flash-heading">
      <div className="section-heading">
        <div>
          <span className="section-kicker">
            <Flame size={16} aria-hidden style={{ color: '#ef4444' }} /> Flash Sale
          </span>
          <h2 id="flash-heading" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Zap size={24} fill="#f59e0b" color="#f59e0b" aria-hidden /> Giá sốc hôm nay
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Clock size={16} style={{ color: 'var(--muted)' }} />
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>Kết thúc sau</span>
          <Countdown />
        </div>
      </div>

      <div
        className="flash-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16
        }}
      >
        {flashProducts.map((product) => {
          const discount = Math.round((1 - product.price / product.oldPrice) * 100);
          return (
            <Link
              key={product.id}
              to={`/san-pham/${product.slug}`}
              className="flash-card"
              style={{
                background: 'var(--surface)',
                borderRadius: 14,
                overflow: 'hidden',
                border: '1.5px solid var(--border)',
                textDecoration: 'none',
                color: 'inherit',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s'
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
              <span
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 20,
                  zIndex: 2
                }}
              >
                -{discount}%
              </span>
              <div style={{ aspectRatio: '1 / 1', overflow: 'hidden', background: 'var(--bg)' }}>
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                  onMouseEnter={(e) => { e.target.style.transform = 'scale(1.06)'; }}
                  onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
                />
              </div>
              <div style={{ padding: '12px 14px' }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 6,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.4
                  }}
                >
                  {product.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ef4444' }}>
                    {formatVND(product.price)}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'line-through' }}>
                    {formatVND(product.oldPrice)}
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 4,
                    background: 'var(--border)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    marginBottom: 4
                  }}
                >
                  <div
                    style={{
                      width: `${Math.floor(Math.random() * 40 + 60)}%`,
                      height: '100%',
                      background: '#ef4444',
                      borderRadius: 2
                    }}
                  />
                </div>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Sắp hết hàng</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default memo(FlashSale);
