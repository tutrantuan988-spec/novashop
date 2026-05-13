import { memo, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Edit3, Plus, RotateCcw, Search, Trash2, ShoppingBag, Package, BarChart3, Eye, X, Tag, ShieldCheck } from 'lucide-react';
import {
  clearAdminSessionToken,
  getAdminConfigApi,
  getAdminSessionToken,
  listOrdersApi,
  setAdminSessionToken,
  updateOrderShippingApi,
  updateOrderStatusApi,
  verifyAdminApi
} from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import SITE from '../config/site-config';
import { useProducts } from '../context/ProductsContext';
import { categories } from '../data/products';
import { formatVND } from '../utils/format';
import { isUploadConfigured, uploadProductImage } from '../services/upload';
import CouponManager from '../components/CouponManager';
import AnalyticsCharts from '../components/AnalyticsCharts';

const emptyForm = {
  name: '',
  category: 'Thời trang',
  price: '',
  oldPrice: '',
  stock: '',
  badge: '',
  image: '',
  description: ''
};

function AdminPage() {
  const { user, isAdmin } = useAuth();
  const { items, addProduct, updateProduct, removeProduct, resetProducts } = useProducts();
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('Tất cả');
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [orders, setOrders] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [shippingForm, setShippingForm] = useState({ carrier: '', trackingCode: '', trackingUrl: '', note: '' });
  const [tokenRequired, setTokenRequired] = useState(false);
  const [adminVerified, setAdminVerified] = useState(false);
  const [adminTokenInput, setAdminTokenInput] = useState('');
  const [verifyingAdmin, setVerifyingAdmin] = useState(true);

  useEffect(() => {
    document.title = `Quản trị ${SITE.name}`;
  }, []);

  useEffect(() => {
    if (!user?.email || !isAdmin) {
      setVerifyingAdmin(false);
      return;
    }

    let cancelled = false;
    setVerifyingAdmin(true);
    getAdminConfigApi()
      .then(async (config) => {
        if (cancelled) return;
        setTokenRequired(!!config.tokenRequired);
        if (!config.tokenRequired) {
          setAdminVerified(true);
          return;
        }
        const savedToken = getAdminSessionToken();
        if (!savedToken) {
          setAdminVerified(false);
          return;
        }
        await verifyAdminApi(user.email, savedToken);
        if (!cancelled) setAdminVerified(true);
      })
      .catch(() => {
        clearAdminSessionToken();
        if (!cancelled) {
          setTokenRequired(true);
          setAdminVerified(false);
        }
      })
      .finally(() => {
        if (!cancelled) setVerifyingAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.email, isAdmin]);

  useEffect(() => {
    if (!user?.email || !isAdmin || !adminVerified) return;
    listOrdersApi(user.email)
      .then((data) => setOrders(data))
      .catch((err) => console.error('Load orders failed:', err));
  }, [activeTab, user?.email, isAdmin, adminVerified]);

  useEffect(() => {
    if (!selectedOrder) return;
    setShippingForm({
      carrier: selectedOrder.shippingInfo?.carrier || '',
      trackingCode: selectedOrder.shippingInfo?.trackingCode || '',
      trackingUrl: selectedOrder.shippingInfo?.trackingUrl || '',
      note: selectedOrder.shippingInfo?.note || ''
    });
  }, [selectedOrder]);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      const matchCategory = filter === 'Tất cả' || p.category === filter;
      const matchQuery = p.name.toLowerCase().includes(query.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [items, filter, query]);

  const handleAdminTokenSubmit = async (event) => {
    event.preventDefault();
    const token = adminTokenInput.trim();
    if (!token) {
      toast.error('Vui lòng nhập admin secret');
      return;
    }
    try {
      setVerifyingAdmin(true);
      await verifyAdminApi(user.email, token);
      setAdminSessionToken(token);
      setAdminVerified(true);
      setAdminTokenInput('');
      toast.success('Xác thực admin thành công');
    } catch (err) {
      clearAdminSessionToken();
      setAdminVerified(false);
      toast.error(err.message || 'Admin secret không hợp lệ');
    } finally {
      setVerifyingAdmin(false);
    }
  };

  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) {
    return (
      <section className="section admin-denied">
        <h1>Bạn không có quyền truy cập</h1>
        <p>Trang này chỉ dành cho tài khoản quản trị viên. Liên hệ admin để được cấp quyền.</p>
        <Link to="/" className="primary-button">Về trang chủ</Link>
      </section>
    );
  }

  if (verifyingAdmin) {
    return (
      <section className="section admin-denied">
        <h1>Đang xác thực quyền quản trị...</h1>
        <p>Vui lòng chờ trong giây lát.</p>
      </section>
    );
  }

  if (tokenRequired && !adminVerified) {
    return (
      <section className="section admin-denied admin-token-gate">
        <div className="card-box">
          <ShieldCheck size={44} aria-hidden />
          <h1>Xác thực admin API</h1>
          <p>Nhập admin secret để mở bảng quản trị. Secret chỉ lưu trong session hiện tại và không được build vào frontend.</p>
          <form onSubmit={handleAdminTokenSubmit}>
            <input
              type="password"
              value={adminTokenInput}
              onChange={(event) => setAdminTokenInput(event.target.value)}
              placeholder="Admin secret"
              autoComplete="current-password"
              aria-label="Admin secret"
            />
            <button type="submit" className="primary-button">Xác thực</button>
          </form>
        </div>
      </section>
    );
  }

  const onChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const onImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const url = await uploadProductImage(file);
      setForm((current) => ({ ...current, image: url }));
      toast.success('Upload ảnh thành công');
    } catch (err) {
      toast.error('Upload ảnh thất bại: ' + err.message);
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      category: form.category,
      price: Number(form.price) || 0,
      oldPrice: Number(form.oldPrice) || 0,
      stock: Number(form.stock) || 0,
      badge: form.badge || 'Mới',
      image: form.image || 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=900&q=80',
      description: form.description || `Sản phẩm mới của ${SITE.name}.`
    };
    if (editingId) {
      updateProduct(editingId, payload);
      setEditingId(null);
    } else {
      addProduct(payload);
    }
    setForm(emptyForm);
  };

  const onEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      oldPrice: String(product.oldPrice || ''),
      stock: String(product.stock || 0),
      badge: product.badge || '',
      image: product.image,
      description: product.description || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      removeProduct(id);
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await updateOrderStatusApi(orderId, status, user?.email);
      setOrders((current) => current.map((o) => (o.id === orderId ? { ...o, status } : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((current) => ({ ...current, status }));
      }
      toast.success('Cập nhật trạng thái thành công');
    } catch (err) {
      toast.error('Cập nhật thất bại: ' + err.message);
    }
  };

  const handleShippingSubmit = async (event) => {
    event.preventDefault();
    try {
      await updateOrderShippingApi(selectedOrder.id, shippingForm, user?.email);
      setOrders((current) => current.map((order) => (
        order.id === selectedOrder.id ? { ...order, shippingInfo: shippingForm } : order
      )));
      setSelectedOrder((current) => ({ ...current, shippingInfo: shippingForm }));
      toast.success('Cập nhật vận chuyển thành công');
    } catch (err) {
      toast.error('Cập nhật vận chuyển thất bại: ' + err.message);
    }
  };

  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter((o) => ['paid', 'delivered', 'shipped', 'processing'].includes(o.status))
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const pending = orders.filter((o) => o.status === 'pending').length;
    const paid = orders.filter((o) => o.status === 'paid').length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    return { totalRevenue, pending, paid, delivered, totalOrders: orders.length };
  }, [orders]);

  const exportOrdersCSV = () => {
    const headers = ['ID', 'Khách hàng', 'Email', 'SDT', 'Tổng tiền', 'Thanh toán', 'Trạng thái', 'Ngày'];
    const rows = orders.map((o) => [
      o.id,
      o.customer?.name || '',
      o.customer?.email || '',
      o.customer?.phone || '',
      o.total || 0,
      o.paymentMethod || '',
      o.status || '',
      o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toISOString() : ''
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trongdinhstore-orders-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Đã xuất CSV');
  };

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === 'all') return orders;
    return orders.filter((o) => o.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  const statusLabel = {
    pending: 'Chờ xác nhận',
    paid: 'Đã thanh toán',
    processing: 'Đang xử lý',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy'
  };

  const statusBadgeClass = {
    pending: 'badge-pending',
    paid: 'badge-paid',
    processing: 'badge-processing',
    shipped: 'badge-shipped',
    delivered: 'badge-delivered',
    cancelled: 'badge-cancelled'
  };

  return (
    <section className="section admin" aria-labelledby="admin-title">
      <div className="admin-header">
        <div>
          <span className="section-kicker">Khu vực quản trị</span>
          <h1 id="admin-title">
            {activeTab === 'orders' ? 'Quản lý đơn hàng'
              : activeTab === 'coupons' ? 'Mã giảm giá'
              : activeTab === 'dashboard' ? 'Tổng quan'
              : 'Quản lý sản phẩm'}
          </h1>
          <p>
            {activeTab === 'orders'
              ? `Tổng đơn hàng: ${orders.length}`
              : activeTab === 'products'
              ? `Tổng sản phẩm: ${items.length}`
              : ''}
          </p>
        </div>
        {activeTab === 'products' && (
          <button type="button" className="secondary-button" onClick={resetProducts}>
            <RotateCcw size={16} aria-hidden /> Khôi phục dữ liệu
          </button>
        )}
      </div>

      <div className="admin-tabs">
        <button
          type="button"
          className={activeTab === 'dashboard' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('dashboard')}
        >
          <BarChart3 size={16} aria-hidden /> Tổng quan
        </button>
        <button
          type="button"
          className={activeTab === 'products' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('products')}
        >
          <Package size={16} aria-hidden /> Sản phẩm
        </button>
        <button
          type="button"
          className={activeTab === 'orders' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingBag size={16} aria-hidden /> Đơn hàng ({orders.length})
        </button>
        <button
          type="button"
          className={activeTab === 'coupons' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('coupons')}
        >
          <Tag size={16} aria-hidden /> Mã giảm giá
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="admin-dashboard">
          <AnalyticsCharts adminEmail={user?.email} />

          <div className="card-box">
            <h2>Đơn hàng gần nhất</h2>
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="recent-order">
                <div>
                  <strong>{o.customer?.name || 'Khách'}</strong>
                  <span>{o.items?.length || 0} sản phẩm · {formatVND(o.total || 0)}</span>
                </div>
                <span className={`status-badge ${statusBadgeClass[o.status] || ''}`}>
                  {statusLabel[o.status] || o.status}
                </span>
              </div>
            ))}
            {orders.length === 0 && <p className="empty-result">Chưa có đơn hàng.</p>}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
      <div className="admin-grid">
        <form className="card-box admin-form" onSubmit={onSubmit}>
          <h2>{editingId ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h2>
          <div className="form-grid">
            <label className="full">
              <span>Tên sản phẩm *</span>
              <input name="name" required value={form.name} onChange={onChange} />
            </label>
            <label>
              <span>Danh mục</span>
              <select name="category" value={form.category} onChange={onChange}>
                {categories.filter((c) => c !== 'Tất cả').map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              <span>Badge</span>
              <input name="badge" value={form.badge} onChange={onChange} placeholder="Mới, Hot, Sale..." />
            </label>
            <label>
              <span>Giá bán (VND) *</span>
              <input name="price" type="number" min="0" required value={form.price} onChange={onChange} />
            </label>
            <label>
              <span>Giá cũ (VND)</span>
              <input name="oldPrice" type="number" min="0" value={form.oldPrice} onChange={onChange} />
            </label>
            <label>
              <span>Tồn kho</span>
              <input name="stock" type="number" min="0" value={form.stock} onChange={onChange} />
            </label>
            <label className="full">
              <span>Ảnh sản phẩm (URL)</span>
              <input name="image" type="url" value={form.image} onChange={onChange} placeholder="https://..." />
            </label>
            <label className="full upload-field">
              <span>Upload ảnh sản phẩm</span>
              <input type="file" accept="image/*" onChange={onImageUpload} disabled={!isUploadConfigured() || uploadingImage} />
              <small>
                {isUploadConfigured()
                  ? (uploadingImage ? 'Đang upload ảnh...' : 'Chọn ảnh để tự động upload và điền URL.')
                  : 'Chưa cấu hình Cloudinary, bạn vẫn có thể dán URL ảnh ở trên.'}
              </small>
            </label>
            {form.image && (
              <div className="full image-preview">
                <img src={form.image} alt="Ảnh xem trước sản phẩm" />
              </div>
            )}
            <label className="full">
              <span>Mô tả</span>
              <textarea name="description" rows={4} value={form.description} onChange={onChange} />
            </label>
          </div>

          <div className="admin-actions">
            <button type="submit" className="primary-button">
              <Plus size={16} aria-hidden /> {editingId ? 'Cập nhật' : 'Thêm sản phẩm'}
            </button>
            {editingId && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => { setEditingId(null); setForm(emptyForm); }}
              >
                Hủy
              </button>
            )}
          </div>
        </form>

        <div className="card-box admin-list">
          <div className="admin-list-header">
            <h2>Danh sách sản phẩm</h2>
            <div className="admin-filters">
              <div className="search-box small">
                <Search size={16} aria-hidden />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm sản phẩm..."
                  type="search"
                  aria-label="Tìm sản phẩm"
                />
              </div>
              <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Lọc danh mục">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Kho</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="cell-product">
                        <img src={p.image} alt={p.name} loading="lazy" />
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>{formatVND(p.price)}</td>
                    <td>{p.stock ?? 0}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="icon-action" onClick={() => onEdit(p)} aria-label={`Sửa ${p.name}`}>
                          <Edit3 size={16} />
                        </button>
                        <button type="button" className="icon-action danger" onClick={() => onDelete(p.id)} aria-label={`Xóa ${p.name}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="empty-result">Không có sản phẩm nào phù hợp.</p>}
          </div>
        </div>
      </div>
      )}

      {activeTab === 'orders' && (
        <div className="card-box admin-list">
          <div className="admin-list-header">
            <h2>Danh sách đơn hàng</h2>
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
              <button type="button" className="secondary-button" onClick={exportOrdersCSV}>
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
                {filteredOrders.map((o) => (
                  <tr key={o.id}>
                    <td><code>{o.id.slice(-8).toUpperCase()}</code></td>
                    <td>
                      <div className="cell-customer">
                        <strong>{o.customer?.name || 'N/A'}</strong>
                        <span>{o.customer?.phone || ''}</span>
                      </div>
                    </td>
                    <td>{o.items?.length || 0} sản phẩm</td>
                    <td>{formatVND(o.total || 0)}</td>
                    <td>{o.paymentMethod === 'stripe' ? 'Stripe' : o.paymentMethod?.toUpperCase()}</td>
                    <td>
                      <span className={`status-badge ${statusBadgeClass[o.status] || ''}`}>
                        {statusLabel[o.status] || o.status}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="icon-action"
                          onClick={() => setSelectedOrder(o)}
                          aria-label="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="status-select"
                          aria-label="Cập nhật trạng thái"
                        >
                          {Object.entries(statusLabel).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && <p className="empty-result">Chưa có đơn hàng nào.</p>}
          </div>
        </div>
      )}

      {activeTab === 'coupons' && (
        <CouponManager adminEmail={user?.email} />
      )}

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
              {selectedOrder.note && (
                <section><h3>Ghi chú</h3><p>{selectedOrder.note}</p></section>
              )}
              <section>
                <h3>Vận chuyển</h3>
                <form className="shipping-form" onSubmit={handleShippingSubmit}>
                  <label>
                    <span>Đơn vị vận chuyển</span>
                    <input
                      value={shippingForm.carrier}
                      onChange={(e) => setShippingForm({ ...shippingForm, carrier: e.target.value })}
                      placeholder="GHN, GHTK, Viettel Post..."
                    />
                  </label>
                  <label>
                    <span>Mã vận đơn</span>
                    <input
                      value={shippingForm.trackingCode}
                      onChange={(e) => setShippingForm({ ...shippingForm, trackingCode: e.target.value })}
                      placeholder="VD: S123456789"
                    />
                  </label>
                  <label className="full">
                    <span>Link theo dõi</span>
                    <input
                      type="url"
                      value={shippingForm.trackingUrl}
                      onChange={(e) => setShippingForm({ ...shippingForm, trackingUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </label>
                  <label className="full">
                    <span>Ghi chú nội bộ</span>
                    <textarea
                      rows={3}
                      value={shippingForm.note}
                      onChange={(e) => setShippingForm({ ...shippingForm, note: e.target.value })}
                      placeholder="Ghi chú xử lý đơn hàng..."
                    />
                  </label>
                  <button type="submit" className="primary-button">Lưu thông tin vận chuyển</button>
                </form>
                {selectedOrder.shippingInfo?.trackingCode && (
                  <p className="tracking-line">
                    Mã vận đơn: <strong>{selectedOrder.shippingInfo.trackingCode}</strong>
                    {selectedOrder.shippingInfo.trackingUrl && (
                      <a href={selectedOrder.shippingInfo.trackingUrl} target="_blank" rel="noreferrer">Theo dõi</a>
                    )}
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default memo(AdminPage);
