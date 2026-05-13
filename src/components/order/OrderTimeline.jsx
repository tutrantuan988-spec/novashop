import { memo, useMemo } from 'react';
import { CheckCircle2, Circle, Package, Truck, Home, XCircle, Clock } from 'lucide-react';

const STAGES = [
  { key: 'pending', label: 'Đặt hàng thành công', icon: CheckCircle2 },
  { key: 'confirmed', label: 'Đã xác nhận', icon: Package },
  { key: 'packing', label: 'Đang đóng gói', icon: Package },
  { key: 'shipped', label: 'Đã giao vận chuyển', icon: Truck },
  { key: 'delivering', label: 'Đang giao', icon: Truck },
  { key: 'delivered', label: 'Giao thành công', icon: Home }
];

const STATUS_INDEX = {
  pending: 0,
  paid: 1,
  confirmed: 1,
  packing: 2,
  shipped: 3,
  delivering: 4,
  delivered: 5,
  completed: 5
};

/**
 * OrderTimeline
 * @param {{ order: { status: string, createdAt?: any, paidAt?: any, shippedAt?: any, deliveredAt?: any, shippingInfo?: any } }} props
 */
function OrderTimeline({ order }) {
  const currentIdx = useMemo(() => {
    const status = order?.status || 'pending';
    if (status === 'cancelled') return -1;
    if (status === 'failed' || status === 'returned') return -2;
    return STATUS_INDEX[status] ?? 0;
  }, [order?.status]);

  const isCancelled = order?.status === 'cancelled';
  const isFailed = order?.status === 'failed' || order?.status === 'returned';

  const formatTime = (ts) => {
    if (!ts) return '';
    let d;
    if (typeof ts === 'string' || typeof ts === 'number') d = new Date(ts);
    else if (ts.toDate) d = ts.toDate();
    else if (ts.seconds) d = new Date(ts.seconds * 1000);
    else d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('vi-VN');
  };

  const timestampForStage = (key) => {
    if (key === 'pending') return formatTime(order.createdAt);
    if (key === 'confirmed') return formatTime(order.paidAt || order.confirmedAt);
    if (key === 'shipped') return formatTime(order.shippedAt);
    if (key === 'delivered') return formatTime(order.deliveredAt);
    return '';
  };

  if (isCancelled) {
    return (
      <div className="order-timeline cancelled" role="status">
        <div className="timeline-step is-done error">
          <span className="timeline-icon"><XCircle size={20} /></span>
          <div>
            <strong>Đơn hàng đã bị hủy</strong>
            <small>{formatTime(order.updatedAt || order.cancelledAt)}</small>
          </div>
        </div>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="order-timeline failed" role="status">
        <div className="timeline-step is-done error">
          <span className="timeline-icon"><XCircle size={20} /></span>
          <div>
            <strong>Giao hàng thất bại</strong>
            <small>{order.failureReason || 'Vui lòng liên hệ hỗ trợ'}</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ol className="order-timeline" aria-label="Tiến trình đơn hàng">
      {STAGES.map((stage, idx) => {
        const Icon = stage.icon;
        const done = idx <= currentIdx;
        const current = idx === currentIdx;
        return (
          <li
            key={stage.key}
            className={`timeline-step ${done ? 'is-done' : ''} ${current ? 'is-current' : ''}`}
          >
            <span className="timeline-icon">
              {done ? <Icon size={20} /> : <Circle size={20} />}
            </span>
            <div>
              <strong>{stage.label}</strong>
              <small>{timestampForStage(stage.key) || (current ? 'Đang xử lý' : '')}</small>
            </div>
          </li>
        );
      })}

      {order?.shippingInfo?.trackingCode && (
        <li className="timeline-tracking">
          <Truck size={18} aria-hidden />
          <div>
            <strong>Mã vận đơn: {order.shippingInfo.trackingCode}</strong>
            {order.shippingInfo.trackingUrl && (
              <a href={order.shippingInfo.trackingUrl} target="_blank" rel="noopener noreferrer">
                Theo dõi tại {order.shippingInfo.carrier || 'đơn vị vận chuyển'} →
              </a>
            )}
          </div>
        </li>
      )}
    </ol>
  );
}

export default memo(OrderTimeline);
