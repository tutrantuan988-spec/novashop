import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getOrderSummaryApi, createReturnApi } from '../services/api';
import { formatVND } from '../utils/format';

const REASONS = [
  'Hàng lỗi / hỏng',
  'Sai sản phẩm',
  'Không vừa ý',
  'Không đúng mô tả',
  'Khác'
];

const MAX_IMAGES = 5;

function ReturnRequestPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [type, setType] = useState('return');
  const [refundMethod, setRefundMethod] = useState('original');
  const [items, setItems] = useState({}); // { [orderItemKey]: { selected, quantity, reason, images } }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    getOrderSummaryApi(orderId)
      .then((data) => setOrder(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  const refundEstimate = useMemo(() => {
    if (!order?.items) return 0;
    let total = 0;
    for (const it of order.items) {
      const key = `${it.id}-${it.variantId || ''}`;
      const sel = items[key];
      if (sel?.selected) {
        total += (Number(it.price) || 0) * (sel.quantity || 0);
      }
    }
    return total;
  }, [order, items]);

  const handleItemChange = (key, patch) => {
    setItems((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));
  };

  const handleImageUpload = (key, files) => {
    const fileArr = Array.from(files).slice(0, MAX_IMAGES);
    const promises = fileArr.map((f) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    }));
    Promise.all(promises).then((urls) => {
      handleItemChange(key, { images: urls });
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Vui lòng đăng nhập');
    const selectedItems = [];
    for (const [key, sel] of Object.entries(items)) {
      if (!sel.selected) continue;
      const [productId, variantId] = key.split('-');
      if (!sel.reason) {
        toast.error('Vui lòng chọn lý do cho mọi sản phẩm');
        return;
      }
      selectedItems.push({
        productId,
        variantId: variantId || null,
        quantity: sel.quantity || 1,
        reason: sel.reason,
        images: sel.images || []
      });
    }
    if (selectedItems.length === 0) {
      toast.error('Hãy chọn ít nhất 1 sản phẩm muốn đổi/trả');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createReturnApi({
        orderId,
        userId: user.id || user.email,
        items: selectedItems,
        type,
        refundMethod
      });
      toast.success('Đã gửi yêu cầu đổi/trả thành công');
      navigate(`/tai-khoan/don-hang`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <section className="section"><p>Đang tải...</p></section>;
  if (error || !order) {
    return (
      <section className="section" style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <AlertCircle size={56} color="#ef4444" />
        <h1>Không thể tải đơn hàng</h1>
        <p>{error || 'Đơn hàng không tồn tại'}</p>
      </section>
    );
  }

  const orderTooOld = order.deliveredAt
    ? (Date.now() - new Date(order.deliveredAt._seconds ? order.deliveredAt._seconds * 1000 : order.deliveredAt).getTime() > 7 * 24 * 60 * 60 * 1000)
    : false;

  if (orderTooOld) {
    return (
      <section className="section" style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <AlertCircle size={56} color="#f59e0b" />
        <h1>Đã quá hạn đổi/trả</h1>
        <p>Đơn hàng đã giao quá 7 ngày, không thể đổi/trả.</p>
      </section>
    );
  }

  return (
    <section className="section" style={{ maxWidth: 800, margin: '40px auto' }}>
      <Link to="/tai-khoan/don-hang" className="back-link"><ArrowLeft size={16} /> Đơn hàng</Link>
      <h1>Yêu cầu đổi/trả - #{orderId}</h1>

      <form onSubmit={handleSubmit} className="card-box" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <label>
            <input type="radio" name="type" value="return" checked={type === 'return'} onChange={() => setType('return')} />
            <span style={{ marginLeft: 6 }}>Trả hàng + hoàn tiền</span>
          </label>
          <label>
            <input type="radio" name="type" value="exchange" checked={type === 'exchange'} onChange={() => setType('exchange')} />
            <span style={{ marginLeft: 6 }}>Đổi hàng</span>
          </label>
        </div>

        <h3>Chọn sản phẩm</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {(order.items || []).map((item) => {
            const key = `${item.id}-${item.variantId || ''}`;
            const sel = items[key] || {};
            return (
              <li key={key} className="card-box" style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!sel.selected}
                    onChange={(e) => handleItemChange(key, { selected: e.target.checked, quantity: sel.quantity || item.quantity })}
                  />
                  {item.image && <img src={item.image} alt="" style={{ width: 60, height: 60, borderRadius: 6, objectFit: 'cover' }} />}
                  <div style={{ flex: 1 }}>
                    <strong>{item.name}</strong>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>
                      {formatVND(item.price)} × {item.quantity}
                    </div>
                  </div>
                </label>

                {sel.selected && (
                  <div style={{ marginTop: 12, paddingLeft: 28, display: 'grid', gap: 12 }}>
                    <label>
                      <span>Số lượng trả:</span>
                      <input
                        type="number"
                        min={1}
                        max={item.quantity}
                        value={sel.quantity || item.quantity}
                        onChange={(e) => handleItemChange(key, { quantity: Number(e.target.value) })}
                        style={{ marginLeft: 8, padding: '4px 8px', width: 80 }}
                      />
                    </label>
                    <label>
                      <span>Lý do:</span>
                      <select
                        value={sel.reason || ''}
                        onChange={(e) => handleItemChange(key, { reason: e.target.value })}
                        style={{ marginLeft: 8, padding: '6px 10px', width: 240 }}
                      >
                        <option value="">--Chọn lý do--</option>
                        {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </label>
                    <label>
                      <span>Ảnh minh chứng (tối đa {MAX_IMAGES}):</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageUpload(key, e.target.files)}
                        style={{ marginLeft: 8 }}
                      />
                    </label>
                    {Array.isArray(sel.images) && sel.images.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {sel.images.map((src, i) => (
                          <img key={i} src={src} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4 }} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {type === 'return' && (
          <div style={{ marginTop: 16 }}>
            <h3>Phương thức hoàn tiền</h3>
            <label style={{ marginRight: 16 }}>
              <input type="radio" name="refund" value="original" checked={refundMethod === 'original'} onChange={() => setRefundMethod('original')} />
              <span style={{ marginLeft: 6 }}>Hoàn về thẻ gốc</span>
            </label>
            <label>
              <input type="radio" name="refund" value="store_credit" checked={refundMethod === 'store_credit'} onChange={() => setRefundMethod('store_credit')} />
              <span style={{ marginLeft: 6 }}>Lưu vào tài khoản (store credit)</span>
            </label>
          </div>
        )}

        <div style={{ marginTop: 24, padding: 16, background: 'rgba(249, 115, 22, 0.08)', borderRadius: 10 }}>
          <strong>Hoàn tiền dự kiến: {formatVND(refundEstimate)}</strong>
        </div>

        <button type="submit" className="primary-button" disabled={submitting} style={{ marginTop: 20, width: '100%' }}>
          {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </button>
      </form>
    </section>
  );
}

export default ReturnRequestPage;
