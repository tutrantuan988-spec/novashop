import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Scale, X, ArrowRight } from 'lucide-react';
import { useComparison } from '../context/ComparisonContext';

function CompareBar() {
  const { compareList, clearCompare } = useComparison();

  if (compareList.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--surface)',
      borderRadius: 16,
      border: '1.5px solid var(--border)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      zIndex: 1000,
      backdropFilter: 'blur(12px)',
      maxWidth: '90vw'
    }}>
      <Scale size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
      <span style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
        {compareList.length} sản phẩm so sánh
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        {compareList.map((product) => (
          <div
            key={product.id}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              overflow: 'hidden',
              border: '1.5px solid var(--border)',
              position: 'relative'
            }}
          >
            <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
      <Link
        to="/so-sanh"
        style={{
          padding: '8px 16px',
          borderRadius: 10,
          background: 'var(--accent)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 13,
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap'
        }}
      >
        So sánh ngay <ArrowRight size={14} />
      </Link>
      <button
        onClick={clearCompare}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: 'var(--muted)',
          padding: 4,
          borderRadius: 6,
          display: 'flex'
        }}
        aria-label="Xóa so sánh"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default memo(CompareBar);
