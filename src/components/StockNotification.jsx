import { memo, useState } from 'react';
import { Bell, Mail, CheckCircle2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { isBackendConfigured } from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

function StockNotification({ productId, productName }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const toast = useToast();
  const backendOk = isBackendConfigured();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Vui lòng nhập email hợp lệ');
      return;
    }
    if (!backendOk) {
      toast.info('Tính năng này sẽ sớm khả dụng. Vui lòng liên hệ Zalo để được thông báo.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/stock-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, productName, email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đăng ký thất bại');
      setSubscribed(true);
      toast.success('Bạn sẽ nhận thông báo khi sản phẩm có hàng!');
    } catch (err) {
      toast.error(err.message || 'Không thể đăng ký. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 600,
        color: '#10b981'
      }}>
        <CheckCircle2 size={18} />
        Đã đăng ký nhận thông báo!
      </div>
    );
  }

  return (
    <div style={{
      padding: 16,
      background: 'var(--surface)',
      borderRadius: 12,
      border: '1.5px solid var(--border)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Bell size={18} style={{ color: '#f59e0b' }} />
        <h4 style={{ fontSize: 14, fontWeight: 700 }}>Thông báo khi có hàng</h4>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
        Nhập email để nhận thông báo khi "{productName}" có hàng trở lại.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              borderRadius: 8,
              border: '1.5px solid var(--border)',
              background: 'var(--bg)',
              fontSize: 14,
              color: 'var(--text)',
              outline: 'none'
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !email}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            background: loading || !email ? 'var(--border)' : '#f59e0b',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: loading || !email ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {loading ? 'Đang xử lý...' : 'Đăng ký'}
        </button>
      </form>
    </div>
  );
}

export default memo(StockNotification);
