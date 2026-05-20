import { memo, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Package, Truck, CheckCircle2, Clock, AlertCircle, ArrowLeft, MapPin, Phone, Mail, User } from 'lucide-react';
import { formatVND } from '../utils/format';
import { trackOrderApi } from '../services/api';
import OrderTimeline from '../components/order/OrderTimeline';
import SITE from '../config/site-config';

const STATUS_CONFIG = {
  pending: { label: 'Chờ xác nhận', color: '#f59e0b', icon: Clock },
  confirmed: { label: 'Đã xác nhận', color: '#3b82f6', icon: CheckCircle2 },
  processing: { label: 'Đang xử lý', color: '#8b5cf6', icon: Package },
  shipped: { label: 'Đang giao hàng', color: '#06b6d4', icon: Truck },
  delivered: { label: 'Đã giao hàng', color: '#16a34a', icon: CheckCircle2 },
  cancelled: { label: 'Đã hủy', color: '#ef4444', icon: AlertCircle },
  refunded: { label: 'Đã hoàn tiền', color: '#6b7280', icon: AlertCircle }
};

function OrderConfirmationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      navigate('/', { replace: true });
      return;
    }

    let cancelled = false;
    setLoading(true);

    trackOrderApi(id)
      .then((data) => {
        if (!cancelled) {
          setOrder(data);
          document.title = `Đơn hàng #${id} - ${SITE.name}`;
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id, navigate]);

  if (loading) {
    return (
      <section className="section" style={{ textAlign: 'center', padding: '80px 24px', maxWidth: 800, margin: '0 auto' }}>
        <Package size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
        <p>Đang tải thông tin đơn hàng...</p>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="section" style={{ textAlign: 'center', padding: '80px 24px', maxWidth: 600, margin: '0 auto' }}>
        <AlertCircle size={56} color="#ef4444" style={{ marginBottom: 16 }} />
        <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Không tìm thấy đơn hàng</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>{error || 'Đơn hàng không tồn tại hoặc đã bị xóa.'}</p>
        <Link to="/" className="primary-button">
          <ArrowLeft size={18} /> Về trang chủ
        </Link>
      </section>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const items = order.items || [];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <section className="section" style={{ maxWidth: 900, margin: '0 auto' }}>
      <Link to="/" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, color: 'var(--muted)', textDecoration: 'none', fontSize: 14 }}>
        <ArrowLeft size={16} /> Trang chủ
      </Link>

      {/* Order header */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: 20,
        border: '1.5px solid var(--border)',
        padding: '32px 28px',
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: `${statusConfig.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <StatusIcon size={24} color={statusConfig.color} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Đơn hàng #{order.id}</h1>
            <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
              Đặt ngày {new Date(order.createdAt || order.created_at || Date.now()).toLocaleDateString('vi-VN')}
              {' · '}{itemCount} sản phẩm
            </p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 16px',
              borderRadius: 20,
              background: `${statusConfig.color}15`,
              color: statusConfig.color,
              fontSize: 13,
              fontWeight: 700
            }}>
              <StatusIcon size={14} />
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <OrderTimeline order={order} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        {/* Shipping info */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 16,
          border: '1.5px solid var(--border)',
          padding: '24px 20px'
        }}>
          <h2 style={{ fontSize: '1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} color="var(--accent)" /> Thông tin giao hàng
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <User size={16} color="var(--muted)" />
              <div>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Người nhận</span>
                <p style={{ fontWeight: 600, margin: 0 }}>{order.customer?.name}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Phone size={16} color="var(--muted)" />
              <div>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Số điện thoại</span>
                <p style={{ fontWeight: 600, margin: 0 }}>{order.customer?.phone}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={16} color="var(--muted)" />
              <div>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Email</span>
                <p style={{ fontWeight: 600, margin: 0 }}>{order.customer?.email}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <MapPin size={16} color="var(--muted)" style={{ marginTop: 2 }} />
              <div>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Địa chỉ</span>
                <p style={{ fontWeight: 600, margin: 0 }}>{order.customer?.address}</p>
              </div>
            </div>
            {order.note && (
              <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--bg)', borderRadius: 10, fontSize: 13 }}>
                <strong>Ghi chú:</strong> {order.note}
              </div>
            )}
          </div>
        </div>

        {/* Payment info */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 16,
          border: '1.5px solid var(--border)',
          padding: '24px 20px'
        }}>
          <h2 style={{ fontSize: '1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={18} color="var(--accent)" /> Thanh toán
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Phương thức</span>
              <p style={{ fontWeight: 600, margin: 0 }}>
                {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' :
                 order.paymentMethod === 'bank' ? 'Chuyển khoản ngân hàng' :
                 order.paymentMethod === 'vnpay' ? 'VNPay' :
                 order.paymentMethod || 'Chưa xác định'}
              </p>
            </div>
            {order.paymentStatus && (
              <div>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Trạng thái thanh toán</span>
                <p style={{ fontWeight: 600, margin: 0, color: order.paymentStatus === 'paid' ? '#16a34a' : '#f59e0b' }}>
                  {order.paymentStatus === 'paid' ? 'Đã thanh toán' :
                   order.paymentStatus === 'pending' ? 'Chờ thanh toán' :
                   order.paymentStatus}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order items */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: 16,
        border: '1.5px solid var(--border)',
        padding: '24px 20px',
        marginTop: 24
      }}>
        <h2 style={{ fontSize: '1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={18} color="var(--accent)" /> Sản phẩm ({itemCount})
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none'
              }}
            >
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                overflow: 'hidden',
                flexShrink: 0,
                background: 'var(--bg)'
              }}>
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                    <Package size={24} />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 14, margin: 0, marginBottom: 4 }}>{item.name}</p>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>SL: {item.quantity}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{formatVND(item.price * item.quantity)}</p>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatVND(item.price)} / sp</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: '2px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span style={{ color: 'var(--muted)' }}>Tạm tính</span>
            <span>{formatVND(order.subtotal || 0)}</span>
          </div>
          {(order.discount || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#16a34a' }}>
              <span>Giảm giá</span>
              <span>-{formatVND(order.discount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span style={{ color: 'var(--muted)' }}>Phí vận chuyển</span>
            <span>{(order.shipping || 0) === 0 ? 'Miễn phí' : formatVND(order.shipping)}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '1.15rem',
            fontWeight: 800,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
            marginTop: 4
          }}>
            <span>Tổng cộng</span>
            <span style={{ color: 'var(--accent)' }}>{formatVND(order.total || 0)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
        <Link to="/" className="primary-button" style={{ flex: 1, textAlign: 'center', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowLeft size={18} /> Tiếp tục mua sắm
        </Link>
      </div>
    </section>
  );
}

export default memo(OrderConfirmationPage);
