import { memo, useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

function SocialProof({ productId }) {
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    const base = Math.floor(Math.random() * 8) + 3;
    setViewers(base);

    const interval = setInterval(() => {
      setViewers(prev => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(1, Math.min(15, prev + delta));
      });
    }, 5000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, [productId]);

  if (viewers <= 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 13,
      fontWeight: 600,
      color: '#ef4444',
      padding: '6px 12px',
      background: 'rgba(239, 68, 68, 0.08)',
      borderRadius: 8,
      width: 'fit-content'
    }}>
      <Eye size={14} />
      <span>{viewers} người đang xem sản phẩm này</span>
    </div>
  );
}

export default memo(SocialProof);
