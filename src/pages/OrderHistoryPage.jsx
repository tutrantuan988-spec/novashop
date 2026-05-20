import { memo, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import { formatVND } from '../utils/format';
import { getMyOrders } from '../services/apiMongo';
import { fetchPgOrders } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SITE from '../config/site-config';

const STATUS_MAP = {
  pending: { label: 'Chờ xác nhận', color: '#f59e0b', icon: Clock },
  confirmed: { label: 'Đã xác nhận', color: '#3b82f6', icon: CheckCircle },
  shipping: { label: 'Đang giao', color: '#6366f1', icon: Truck },
  delivered: { label: 'Đã giao', color: '#14b8a6', icon: CheckCircle },
  cancelled: { label: 'Đã hủy', color: '#ef4444', icon: XCircle },
  refunded: { label: 'Đã hoàn tiền', color: '#64748b', icon: XCircle }
};

function normalizeOrder(order, source) {
  // Normalize to a common format for display
  const isPg = source === 'pg';
  const createdAt = order.createdAt || order.created_at || order.createdAt;
  const items = isPg ? (order.items || []) : (order.items || []).map(item => ({
    ...item,
    subtotal: item.subtotal || item.total || (item.unit_price || item.price || 0) * (item.quantity || 0)
  }));

  return {
    _id: order._id || order.id,
    orderCode: order.orderCode || order.order_code || `#${(order._id || order.id || '').slice(0, 8)}`,
    status: order.status || order.order_status || 'pending',
    total: Number(order.total || 0),
    subtotal: Number(order.subtotal || 0),
    shippingFee: Number(order.shippingFee || order.shipping_fee || order.shipping || 0),
    discount: Number(order.discount || 0),
    paymentMethod: order.paymentMethod || order.payment_method || 'cod',
    paymentStatus: order.paymentStatus || order.payment_status || null,
    customerName: order.customerName || order.customer_name || order.customer?.name || '',
    customerEmail: order.customerEmail || order.customer_email || order.customer?.email || '',
    items: items.map(item => ({
      product_name: item.product_name || item.name || '',
      product_slug: item.product_slug || item.slug || '',
      product_image: item.product_image || item.image || '',
      variant_label: item.variant_label || '',
      quantity: item.quantity || 0,
      price: item.unit_price || item.price || 0,
      subtotal: item.subtotal || 0
    })),
    createdAt,
    source
  };
}

function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    document.title = `Lịch sử đơn hàng - ${SITE.name}`;
    
    const loadOrders = async () => {
      setLoading(true);
      setError(null);
      const allOrders = [];

      try {
        // Load from MongoDB (apiMongo)
        const mongoRes = await getMyOrders();
        const mongoOrders = (mongoRes.data || mongoRes.orders || mongoRes || []).map(o => normalizeOrder(o, 'mongo'));
        allOrders.push(...mongoOrders);
      } catch (err) {
        console.warn('[OrderHistory] MongoDB fetch failed:', err.message);
      }

      // Load from PostgreSQL orders (auto-filtered by JWT)
      try {
        const pgRes = await fetchPgOrders();
        const pgOrders = (pgRes.data || []).map(o => normalizeOrder(o, 'pg'));
        allOrders.push(...pgOrders);
      } catch (err) {
        console.warn('[OrderHistory] PG fetch failed:', err.message);
      }

      // Sort by createdAt descending
      allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(allOrders);
      setLoading(false);
    };

    loadOrders().catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, [user?.email]);

  const getItemSubtotal = useCallback((item) => {
    return item.price * item.quantity;
  }, []);

  if (loading) {
    return (
      <section className="section" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <Clock size={32} style={{ opacity: 0.3, marginBottom: 12 }} className="spin" />
        <p>Đang tải đơn hàng...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <p style={{ color: '#ef4444' }}>Không thể tải đơn hàng: {error}</p>
      </section>
    );
  }

  return (
    <section className="section" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="section-heading">
        <div>
          <span className="section-kicker"><Package size={16} aria-hidden /> Đơn hàng của bạn</span>
          <h1>Lịch sử đơn hàng</h1>
        </div>
        {orders.length > 0 && (
          <span style={{ color: 'var(--muted)', fontSize: 14 }}>
            Tổng số: {orders.length} đơn
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--surface)', borderRadius: 16 }}>
          <Package size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Chưa có đơn hàng nào</p>
          <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Bắt đầu mua sắm ngay để có đơn hàng đầu tiên!</p>
          <Link to="/" className="primary-button">Mua sắm ngay</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map((order) => {
            const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
            const StatusIcon = status.icon;
            return (
              <div
                key={order._id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 16,
                  border: '1.5px solid var(--border)',
                  padding: '20px 24px',
                  transition: 'box-shadow 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                      Mã đơn: <strong style={{ color: 'var(--text)' }}>{order.orderCode}</strong>
                      {order.source === 'pg' && (
                        <span style={{
                          marginLeft: 8,
                          fontSize: 11,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: '#3b82f615',
                          color: '#3b82f6',
                          fontWeight: 700
                        }}>PG</span>
                      )}
                    </span>
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 14px',
                      borderRadius: 20,
                      background: `${status.color}15`,
                      color: status.color,
                      fontSize: 13,
                      fontWeight: 700
                    }}
                  >
                    <StatusIcon size={14} /> {status.label}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  {order.items?.slice(0, 3).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {item.product_image && (
                        <img src={item.product_image} alt={item.product_name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} loading="lazy" />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.product_name}
                        </p>
                        {item.variant_label && (
                          <p style={{ fontSize: 12, color: 'var(--muted)' }}>{item.variant_label}</p>
                        )}
                        <p style={{ fontSize: 12, color: 'var(--muted)' }}>x{item.quantity}</p>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {formatVND(item.subtotal || getItemSubtotal(item))}
                      </span>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>+{order.items.length - 3} sản phẩm khác</p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                    Thanh toán: <strong>
                      {order.paymentMethod === 'cod' ? 'COD'
                        : order.paymentMethod === 'vnpay' ? 'VNPay'
                        : order.paymentMethod === 'momo' ? 'MoMo'
                        : 'Chuyển khoản'}
                    </strong>
                  </span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)' }}>
                    {formatVND(Number(order.total) || 0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default memo(OrderHistoryPage);
