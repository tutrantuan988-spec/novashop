import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { X, CheckCircle2, Eye, Truck, Search, Download, Filter, Clock, Package, MapPin, Phone, Mail } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatVND } from '../../utils/format';
import { listOrdersApi, updateOrderStatusApi, updateOrderShippingApi } from '../../services/api';
import { exportOrdersCsv } from '../../utils/exportCsv';

const statusLabel = {
  pending: 'Chờ xác nhận',
  paid: 'Đã thanh toán',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền'
};

const statusColors = {
  pending: '#d97706',
  paid: '#059669',
  processing: '#2563eb',
  shipped: '#7c3aed',
  delivered: '#065f46',
  cancelled: '#dc2626',
  refunded: '#374151'
};

const statusFlow = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

function OrderDetailModal({ order, onClose, onUpdateStatus, onUpdateShipping }) {
  const [shippingForm, setShippingForm] = useState({
    carrier: order.shippingInfo?.carrier || '',
    trackingCode: order.shippingInfo?.trackingCode || '',
    trackingUrl: order.shippingInfo?.trackingUrl || '',
    note: order.shippingInfo?.note || ''
  });

  const nextIdx = statusFlow.indexOf(order.status);
  const nextStatus = nextIdx >= 0 && nextIdx < statusFlow.length - 1 ? statusFlow[nextIdx + 1] : null;

  const handleShippingSubmit = () => {
    onUpdateShipping(order.id, shippingForm);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content order-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h2>Đơn hàng #{String(order.id).slice(-8).toUpperCase()}</h2>
            <span
              className="status-badge"
              style={{ background: `${statusColors[order.status] || '#6b7280'}20`, color: statusColors[order.status] || '#6b7280' }}
            >
              {statusLabel[order.status] || order.status}
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>
        <div className="order-detail">
          <div className="detail-grid">
            <section className="detail-section">
              <h3><MapPin size={16} /> Thông tin giao hàng</h3>
              <div className="detail-info">
                <p><strong>{order.customer?.name}</strong></p>
                {order.customer?.email && <p><Mail size={14} /> {order.customer.email}</p>}
                {order.customer?.phone && <p><Phone size={14} /> {order.customer.phone}</p>}
                {order.customer?.address && <p className="address-text">{order.customer.address}</p>}
              </div>
            </section>
            <section className="detail-section">
              <h3><Clock size={16} /> Thanh toán</h3>
              <div className="detail-info">
                <p><strong>{order.paymentMethod || '—'}</strong></p>
              </div>
            </section>
          </div>

          <section className="detail-section">
            <h3><Package size={16} /> Sản phẩm ({(order.items || []).length})</h3>
            <ul className="order-items-list">
              {(order.items || []).map((item, idx) => (
                <li key={idx}>
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <div>
                    <strong>{item.name}</strong>
                    <span>SL: {item.quantity} · {formatVND(item.price)}</span>
                  </div>
                  <span className="item-total">{formatVND(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="order-summary-box">
            <div><span>Tạm tính:</span><strong>{formatVND(order.subtotal || 0)}</strong></div>
            {order.discount > 0 && <div><span>Giảm giá:</span><strong className="discount-text">-{formatVND(order.discount)}</strong></div>}
            <div><span>Vận chuyển:</span><strong>{order.shipping === 0 ? 'Miễn phí' : formatVND(order.shipping || 0)}</strong></div>
            <div className="grand-total"><span>Tổng cộng:</span><strong>{formatVND(order.total || 0)}</strong></div>
          </section>

          <section className="detail-section">
            <h3>Cập nhật trạng thái</h3>
            <div className="status-actions">
              <span className="status-badge" style={{
                background: `${statusColors[order.status] || '#6b7280'}20`,
                color: statusColors[order.status] || '#6b7280',
                fontSize: 14, padding: '6px 14px'
              }}>
                {statusLabel[order.status] || order.status}
              </span>
              {nextStatus && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => onUpdateStatus(order.id, nextStatus)}
                >
                  <CheckCircle2 size={16} /> Chuyển sang "{statusLabel[nextStatus]}"
                </button>
              )}
              {order.status === 'pending' && (
                <button
                  type="button"
                  className="secondary-button danger"
                  onClick={() => onUpdateStatus(order.id, 'cancelled')}
                >
                  <X size={16} /> Hủy đơn
                </button>
              )}
            </div>
          </section>

          <section className="detail-section">
            <h3><Truck size={16} /> Vận chuyển</h3>
            <div className="shipping-form">
              <div className="shipping-grid">
                <input
                  type="text"
                  placeholder="Đơn vị vận chuyển"
                  value={shippingForm.carrier}
                  onChange={(e) => setShippingForm((prev) => ({ ...prev, carrier: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Mã vận đơn"
                  value={shippingForm.trackingCode}
                  onChange={(e) => setShippingForm((prev) => ({ ...prev, trackingCode: e.target.value }))}
                />
                <input
                  type="url"
                  placeholder="Link theo dõi"
                  value={shippingForm.trackingUrl}
                  onChange={(e) => setShippingForm((prev) => ({ ...prev, trackingUrl: e.target.value }))}
                />
              </div>
              <textarea
                placeholder="Ghi chú vận chuyển"
                value={shippingForm.note}
                onChange={(e) => setShippingForm((prev) => ({ ...prev, note: e.target.value }))}
                rows={2}
              />
              <button type="button" className="primary-button" onClick={handleShippingSubmit}>
                <Truck size={16} /> Cập nhật vận chuyển
              </button>
            </div>
            {order.shippingInfo?.trackingCode && (
              <div className="shipping-updated">
                <strong>Đã cập nhật:</strong> {order.shippingInfo.carrier} — {order.shippingInfo.trackingCode}
                {order.shippingInfo.trackingUrl && (
                  <> · <a href={order.shippingInfo.trackingUrl} target="_blank" rel="noreferrer">Theo dõi</a></>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function OrdersTab() {
  const { user } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    setLoading(true);
    listOrdersApi(user.email)
      .then((data) => setOrders(data))
      .catch(() => toast.error('Không tải được danh sách đơn hàng'))
      .finally(() => setLoading(false));
  }, [user?.email, toast]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (orderStatusFilter !== 'all') {
      result = result.filter((o) => o.status === orderStatusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((o) => {
        const code = String(o.id).slice(-8).toUpperCase();
        const customerName = o.customer?.name?.toLowerCase() || '';
        const customerPhone = o.customer?.phone || '';
        return code.includes(q) || customerName.includes(q) || customerPhone.includes(q);
      });
    }
    return result;
  }, [orders, orderStatusFilter, searchQuery]);

  const exportCSV = useCallback(() => {
    exportOrdersCsv(filteredOrders, 'lifestyle-orders.csv');
    toast.success(`Đã xuất ${filteredOrders.length} đơn hàng ra CSV`);
  }, [filteredOrders, toast]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatusApi(orderId, newStatus, user?.email);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
      }
      toast.success(`Đã cập nhật trạng thái: ${statusLabel[newStatus] || newStatus}`);
    } catch (err) {
      toast.error(err.message || 'Không cập nhật được');
    }
  };

  const updateShipping = async (orderId, shippingData) => {
    try {
      await updateOrderShippingApi(orderId, shippingData, user?.email);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, shippingInfo: shippingData } : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, shippingInfo: shippingData } : null);
      }
      toast.success('Đã cập nhật thông tin vận chuyển');
    } catch (err) {
      toast.error(err.message || 'Không cập nhật được');
    }
  };

  const nextStatus = (currentStatus) => {
    const idx = statusFlow.indexOf(currentStatus);
    return idx >= 0 && idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
  };

  const statusCounts = useMemo(() => {
    const counts = { all: orders.length };
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  return (
    <div className="admin-orders">
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <div className="admin-search">
            <Search size={16} aria-hidden />
            <input
              type="text"
              placeholder="Tìm mã đơn hoặc khách hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm đơn hàng"
            />
          </div>
        </div>
        <div className="admin-toolbar-right">
          <button type="button" className="secondary-button" onClick={exportCSV}>
            <Download size={16} /> Xuất CSV
          </button>
        </div>
      </div>

      <div className="status-filter-bar">
        <button
          type="button"
          className={`status-filter-btn ${orderStatusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setOrderStatusFilter('all')}
        >
          <Filter size={14} /> Tất cả <span className="filter-count">{statusCounts.all || 0}</span>
        </button>
        {Object.entries(statusLabel).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`status-filter-btn ${orderStatusFilter === key ? 'active' : ''}`}
            onClick={() => setOrderStatusFilter(key)}
            style={orderStatusFilter === key ? {
              background: `${statusColors[key]}18`,
              color: statusColors[key],
              borderColor: `${statusColors[key]}40`
            } : {}}
          >
            {label} <span className="filter-count">{statusCounts[key] || 0}</span>
          </button>
        ))}
      </div>

      <div className="card-box admin-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Đang tải đơn hàng...</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table orders-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Sản phẩm</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td><code className="order-code">#{String(order.id).slice(-8).toUpperCase()}</code></td>
                    <td>
                      <div className="cell-customer">
                        <strong>{order.customer?.name || '—'}</strong>
                        <span>{order.customer?.phone || ''}</span>
                      </div>
                    </td>
                    <td><span className="items-count">{(order.items || []).length} sản phẩm</span></td>
                    <td><strong className="order-total">{formatVND(order.total || 0)}</strong></td>
                    <td><span className="payment-method">{order.paymentMethod || '—'}</span></td>
                    <td>
                      <span className="status-badge" style={{ background: `${statusColors[order.status] || '#6b7280'}20`, color: statusColors[order.status] || '#6b7280' }}>
                        {statusLabel[order.status] || order.status}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="icon-action" onClick={() => setSelectedOrder(order)} aria-label="Chi tiết">
                          <Eye size={16} />
                        </button>
                        {nextStatus(order.status) && (
                          <button
                            type="button"
                            className="icon-action next-status"
                            onClick={() => updateStatus(order.id, nextStatus(order.status))}
                            aria-label={`Chuyển sang ${statusLabel[nextStatus(order.status)]}`}
                            title={`Chuyển sang ${statusLabel[nextStatus(order.status)]}`}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button type="button" className="icon-action danger" onClick={() => updateStatus(order.id, 'cancelled')} aria-label="Hủy đơn">
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
              <div className="empty-state">
                <ShoppingBag size={48} />
                <p>{searchQuery || orderStatusFilter !== 'all' ? 'Không có đơn hàng nào phù hợp.' : 'Chưa có đơn hàng nào.'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateStatus}
          onUpdateShipping={updateShipping}
        />
      )}
    </div>
  );
}

export default memo(OrdersTab);
