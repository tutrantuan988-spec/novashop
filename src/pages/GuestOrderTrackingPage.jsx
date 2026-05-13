import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { trackOrderApi } from '../services/api';
import { formatVND } from '../utils/format';
import OrderTimeline from '../components/order/OrderTimeline';
import SITE from '../config/site-config';

function GuestOrderTrackingPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manualToken, setManualToken] = useState(token);

  useEffect(() => {
    document.title = `Tra cứu đơn hàng - ${SITE.name}`;
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    trackOrderApi(token)
      .then((data) => !cancelled && setOrder(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [token]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualToken.trim()) {
      window.location.href = `/track-order?token=${encodeURIComponent(manualToken.trim())}`;
    }
  };

  if (!token) {
    return (
      <section className="section" style={{ maxWidth: 600, margin: '40px auto' }}>
        <Link to="/" className="back-link"><ArrowLeft size={16} /> Trang chủ</Link>
        <h1>Tra cứu đơn hàng</h1>
        <p style={{ color: 'var(--muted)' }}>Nhập mã token đã được gửi qua email khi đặt hàng.</p>
        <form onSubmit={handleManualSubmit} className="card-box" style={{ marginTop: 20 }}>
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="Dán token tại đây"
            style={{ width: '100%', padding: '12px 14px', marginBottom: 12 }}
          />
          <button type="submit" className="primary-button" style={{ width: '100%' }}>
            Tra cứu
          </button>
        </form>
      </section>
    );
  }

  if (loading) {
    return <section className="section"><p>Đang tải thông tin đơn hàng...</p></section>;
  }

  if (error || !order) {
    return (
      <section className="section" style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <AlertCircle size={56} color="#ef4444" />
        <h1>Không thể tra cứu</h1>
        <p>{error || 'Token không hợp lệ hoặc đã hết hạn'}</p>
        <Link to="/" className="primary-button">Về trang chủ</Link>
      </section>
    );
  }

  return (
    <section className="section" style={{ maxWidth: 800, margin: '40px auto' }}>
      <Link to="/" className="back-link"><ArrowLeft size={16} /> Trang chủ</Link>
      <h1>Đơn hàng #{order.id}</h1>

      <div className="card-box" style={{ marginTop: 20 }}>
        <h2>Tiến trình</h2>
        <OrderTimeline order={order} />
      </div>

      <div className="card-box" style={{ marginTop: 20 }}>
        <h2>Thông tin giao hàng</h2>
        <p><strong>Người nhận:</strong> {order.customer?.name}</p>
        <p><strong>SĐT:</strong> {order.customer?.phone}</p>
        <p><strong>Địa chỉ:</strong> {order.customer?.address}</p>
        <p><strong>Email:</strong> {order.customer?.email}</p>
      </div>

      <div className="card-box" style={{ marginTop: 20 }}>
        <h2>Sản phẩm</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {(order.items || []).map((item, idx) => (
            <li key={idx} style={{ display: 'flex', gap: 12, padding: 10, borderBottom: '1px solid var(--border, #e5e7eb)' }}>
              {item.image && <img src={item.image} alt={item.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />}
              <div style={{ flex: 1 }}>
                <strong>{item.name}</strong>
                <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                  SL: {item.quantity} × {formatVND(item.price)}
                </div>
              </div>
              <strong>{formatVND(item.price * item.quantity)}</strong>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 16, fontSize: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tạm tính:</span><span>{formatVND(order.subtotal || 0)}</span>
          </div>
          {(order.discount > 0) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
              <span>Giảm giá:</span><span>-{formatVND(order.discount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Vận chuyển:</span><span>{formatVND(order.shipping || 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, marginTop: 8 }}>
            <span>Tổng:</span><span>{formatVND(order.total || 0)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GuestOrderTrackingPage;
