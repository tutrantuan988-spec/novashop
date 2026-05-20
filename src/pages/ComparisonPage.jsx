import { memo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingCart, Check, ArrowLeft, Scale } from 'lucide-react';
import { useComparison } from '../context/ComparisonContext';
import { useCart } from '../context/CartContext';
import { formatVND } from '../utils/format';
import SITE from '../config/site-config';

const COMPARE_FIELDS = [
  { key: 'price', label: 'Giá bán', render: (v) => formatVND(v) },
  { key: 'oldPrice', label: 'Giá gốc', render: (v) => v ? formatVND(v) : '—' },
  { key: 'rating', label: 'Đánh giá', render: (v) => `${v || 0} / 5` },
  { key: 'reviewCount', label: 'Số đánh giá', render: (v) => v || 0 },
  { key: 'brand', label: 'Thương hiệu', render: (v) => v || '—' },
  { key: 'stock', label: 'Tồn kho', render: (v) => v > 0 ? `Còn ${v}` : 'Hết hàng' },
  { key: 'sold', label: 'Đã bán', render: (v) => v || 0 },
  { key: 'badge', label: 'Nhãn', render: (v) => v || '—' },
  { key: 'shortDescription', label: 'Mô tả ngắn', render: (v) => v || '—' },
];

function ComparisonPage() {
  const { compareList, removeFromCompare, clearCompare } = useComparison();
  const { addToCart } = useCart();

  useEffect(() => {
    document.title = `So sánh sản phẩm - ${SITE.name}`;
    window.scrollTo({ top: 0 });
  }, []);

  if (compareList.length < 2) {
    return (
      <section className="section" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <Scale size={56} style={{ opacity: 0.3, marginBottom: 20 }} />
        <h1 style={{ marginBottom: 8 }}>So sánh sản phẩm</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
          {compareList.length === 0 ? 'Chưa có sản phẩm nào để so sánh' : 'Cần ít nhất 2 sản phẩm để so sánh'}
        </p>
        <Link to="/danh-muc" className="primary-button">
          <ArrowLeft size={18} /> Khám phá sản phẩm
        </Link>
      </section>
    );
  }

  return (
    <section className="section" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>So sánh sản phẩm</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>{compareList.length} sản phẩm</p>
        </div>
        <button
          onClick={clearCompare}
          style={{
            padding: '10px 20px',
            borderRadius: 10,
            border: '1.5px solid var(--border)',
            background: 'transparent',
            color: '#ef4444',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          Xóa tất cả
        </button>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 16, border: '1.5px solid var(--border)' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          background: 'var(--surface)',
          minWidth: compareList.length * 280
        }}>
          <thead>
            <tr>
              <th style={{ width: 160, padding: 16, textAlign: 'left', borderBottom: '2px solid var(--border)', background: 'var(--bg)', fontWeight: 700, fontSize: 14, color: 'var(--muted)' }}>
                Thuộc tính
              </th>
              {compareList.map((product) => (
                <th key={product.id} style={{ width: 280, padding: 16, borderBottom: '2px solid var(--border)', textAlign: 'center', position: 'relative' }}>
                  <button
                    onClick={() => removeFromCompare(product.id)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--muted)',
                      padding: 4,
                      borderRadius: 6
                    }}
                    aria-label={`Xóa ${product.name}`}
                  >
                    <X size={16} />
                  </button>
                  <Link to={`/san-pham/${product.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ width: 120, height: 120, margin: '0 auto 12px', borderRadius: 12, overflow: 'hidden', background: 'var(--bg)' }}>
                      <img src={product.image || product.primary_image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{product.name}</h3>
                  </Link>
                  <button
                    onClick={() => addToCart(product, 1, null)}
                    style={{
                      marginTop: 12,
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'var(--accent)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <ShoppingCart size={14} /> Thêm vào giỏ
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_FIELDS.map((field, idx) => (
              <tr key={field.key} style={{ background: idx % 2 === 0 ? 'transparent' : 'var(--bg)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                  {field.label}
                </td>
                {compareList.map((product) => {
                  const value = product[field.key] ?? product._pg?.[field.key];
                  const displayValue = field.render ? field.render(value) : (value || '—');
                  return (
                    <td key={product.id} style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: field.key === 'price' ? 700 : 400, color: field.key === 'price' ? 'var(--accent)' : 'var(--text)' }}>
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr style={{ background: 'var(--bg)' }}>
              <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, color: 'var(--muted)' }}>
                Hành động
              </td>
              {compareList.map((product) => (
                <td key={product.id} style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <Link
                    to={`/san-pham/${product.slug}`}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1.5px solid var(--accent)',
                      background: 'transparent',
                      color: 'var(--accent)',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    Xem chi tiết
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default memo(ComparisonPage);
