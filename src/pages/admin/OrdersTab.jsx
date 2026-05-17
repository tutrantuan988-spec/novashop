import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { X, CheckCircle2, Eye, Truck } from 'lucide-react';
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

function OrdersTab() {
  const { user } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [shippingForm, setShippingForm] = useState({ carrier: '', trackingCode: '', trackingUrl: '', note: '' });

  useEffect(() => {
    if (!user?.email) return;
    listOrdersApi(user.email)
      .then((data) => setOrders(data))
      .catch(() => toast.error('Không tải được danh sách đơn hàng'));
  }, [user?.email, toast]);

  useEffect(() => {
    if (!selectedOrder) return;
    setShippingForm({
      carrier: selectedOrder.shippingInfo?.carrier || '',
      trackingCode: selectedOrder.shippingInfo?.trackingCode || '',
      trackingUrl: selectedOrder.shippingInfo?.trackingUrl || '',
      note: selectedOrder.shippingInfo?.note || ''
    });
  }, [selectedOrder]);

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === 'all') return orders;
    return orders.filter((o) => o.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  const exportCSV = useCallback(() => {
    exportOrdersCsv(orders, 'trongdinhstore-orders.csv');
    toast.success('Đã xuất CSV');
  }, [orders, toast]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatusApi(orderId, newStatus, user?.email);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Đã cập nhật trạng thái: ${statusLabel[newStatus] || newStatus}`);
    } catch (err) {
      toast.error(err.message || 'Không cập nhật được');
    }
  };

  const updateShipping = async (orderId) => {
    try {
      await updateOrderShippingApi(orderId, shippingForm, user?.email);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, shippingInfo: shippingForm } : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, shippingInfo: shippingForm } : null);
      toast.success('Đã cập nhật thông tin vận chuyển');
    } catch (err) {
      toast.error(err.message || 'Không cập nhật được');
    }
  };

  const nextStatus = (currentStatus) => {
    const flow = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
    const idx = flow.indexOf(currentStatus);
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  return (
    <>
      <div className="card-box admin-list">
        <div className="admin-list-header">
          <h2>Danh sách đơn hàng ({orders.length})</h2>
          <div className="admin-filters">
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              aria-label="Lọc trạng thái"
            >
              <option value="all">Tất cả trạng thái</option>
              {Object.entries(statusLabel).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <button type="button" className="secondary-button" onClick={exportCSV}>
              Xuất CSV
            </button>
          </div>
        </div>
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
                  <td><code>#{String(order.id).slice(-8).toUpperCase()}</code></td>
                  <td>
                    <strong>{order.customer?.name}</strong>
                    <br /><small>{order.customer?.phone}</small>
                  </td>
                  <td>{(order.items || []).length} sản phẩm</td>
                  <td><strong>{formatVND(order.total || 0)}</strong></td>
                  <td>{order.paymentMethod || '—'}</td>
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
                          className="icon-action"
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
          {filteredOrders.length === 0 && <p className="empty-result">Không có đơn hàng nào.</p>}
        </div>
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết đơn #{String(selectedOrder.id).slice(-8).toUpperCase()}</h2>
              <button type="button" onClick={() => setSelectedOrder(null)} aria-label="Đóng">
                <X size={20} />
              </button>
            </div>
            <div className="order-detail">
              <section>
                <h3>Khách hàng</h3>
                <p><strong>{selectedOrder.customer?.name}</strong></p>
                <p>{selectedOrder.customer?.email}</p>
                <p>{selectedOrder.customer?.phone}</p>
                <p>{selectedOrder.customer?.address}</p>
              </section>
              <section>
                <h3>Sản phẩm</h3>
                <ul className="order-items-list">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <li key={idx}>
                      <img src={item.image} alt={item.name} loading="lazy" />
                      <div>
                        <strong>{item.name}</strong>
                        <span>SL: {item.quantity} · {formatVND(item.price)}</span>
                      </div>
                      <span>{formatVND(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="order-summary-box">
                <div><span>Tạm tính:</span><strong>{formatVND(selectedOrder.subtotal || 0)}</strong></div>
                {selectedOrder.discount > 0 && <div><span>Giảm giá:</span><strong>-{formatVND(selectedOrder.discount)}</strong></div>}
                <div><span>Vận chuyển:</span><strong>{selectedOrder.shipping === 0 ? 'Miễn phí' : formatVND(selectedOrder.shipping || 0)}</strong></div>
                <div className="grand-total"><span>Tổng cộng:</span><strong>{formatVND(selectedOrder.total || 0)}</strong></div>
              </section>
              <section>
                <h3>Cập nhật trạng thái</h3>
                <div className="status-actions">
                  <span className="status-badge" style={{
                    background: `${statusColors[selectedOrder.status] || '#6b7280'}20`,
                    color: statusColors[selectedOrder.status] || '#6b7280',
                    fontSize: 14, padding: '4px 12px'
                  }}>
                    {statusLabel[selectedOrder.status] || selectedOrder.status}
                  </span>
                  {nextStatus(selectedOrder.status) && (
                    <button type="button" className="primary-button" onClick={() => updateStatus(selectedOrder.id, nextStatus(selectedOrder.status))}>
                      <CheckCircle2 size={16} aria-hidden /> Chuyển sang "{statusLabel[nextStatus(selectedOrder.status)]}"
                    </button>
                  )}
                </div>
              </section>
              <section>
                <h3>Vận chuyển</h3>
                <div className="shipping-form">
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
                  <textarea
                    placeholder="Ghi chú vận chuyển"
                    value={shippingForm.note}
                    onChange={(e) => setShippingForm((prev) => ({ ...prev, note: e.target.value }))}
                    rows={2}
                  />
                  <button type="button" className="primary-button" onClick={() => updateShipping(selectedOrder.id)}>
                    <Truck size={16} aria-hidden /> Cập nhật vận chuyển
                  </button>
                </div>
                {selectedOrder.shippingInfo?.trackingCode && (
                  <p style={{ marginTop: 12, fontSize: 14 }}>
                    <strong>Đã cập nhật:</strong> {selectedOrder.shippingInfo.carrier} — {selectedOrder.shippingInfo.trackingCode}
                    {selectedOrder.shippingInfo.trackingUrl && (
                      <> · <a href={selectedOrder.shippingInfo.trackingUrl} target="_blank" rel="noreferrer">Theo dõi</a></>
                    )}
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default memo(OrdersTab);
