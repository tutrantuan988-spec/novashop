import { useEffect, useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag } from 'lucide-react';
import {
  listCouponsApi,
  createCouponApi,
  updateCouponApi,
  deleteCouponApi
} from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatVND } from '../utils/format';

const emptyCoupon = {
  code: '',
  type: 'percent',
  value: 10,
  minSubtotal: 0,
  maxDiscount: 0,
  usageLimit: 0,
  expiresAt: '',
  active: true
};

function describeCoupon(c) {
  if (c.type === 'shipping') return 'Miễn phí vận chuyển';
  if (c.type === 'fixed') return `Giảm ${formatVND(c.value)}`;
  const cap = c.maxDiscount > 0 ? ` (tối đa ${formatVND(c.maxDiscount)})` : '';
  return `Giảm ${c.value}%${cap}`;
}

function formatExpires(value) {
  if (!value) return '—';
  const ts = value.seconds ? value.seconds * 1000 : value._seconds ? value._seconds * 1000 : value;
  return new Date(ts).toLocaleDateString('vi-VN');
}

export default function CouponManager({ adminEmail }) {
  const toast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyCoupon);
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => {
    setLoading(true);
    listCouponsApi(adminEmail)
      .then((data) => setCoupons(data))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (adminEmail) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminEmail]);

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!form.code.trim()) {
      toast.error('Vui lòng nhập mã coupon');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        value: Number(form.value) || 0,
        minSubtotal: Number(form.minSubtotal) || 0,
        maxDiscount: Number(form.maxDiscount) || 0,
        usageLimit: Number(form.usageLimit) || 0,
        expiresAt: form.expiresAt || null
      };
      await createCouponApi(payload, adminEmail);
      toast.success('Đã tạo mã ' + payload.code);
      setForm(emptyCoupon);
      refresh();
    } catch (err) {
      toast.error(err.message || 'Không tạo được mã');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (coupon) => {
    try {
      await updateCouponApi(coupon.code, { ...coupon, active: !coupon.active }, adminEmail);
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (code) => {
    if (!window.confirm(`Xoá mã ${code}?`)) return;
    try {
      await deleteCouponApi(code, adminEmail);
      toast.success('Đã xoá ' + code);
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="admin-grid">
      <form className="card-box admin-form" onSubmit={onSubmit}>
        <h2><Tag size={18} aria-hidden /> Tạo mã giảm giá</h2>
        <label>
          Mã coupon
          <input name="code" value={form.code} onChange={onChange} placeholder="NOVA10" required />
        </label>
        <label>
          Loại giảm
          <select name="type" value={form.type} onChange={onChange}>
            <option value="percent">Phần trăm (%)</option>
            <option value="fixed">Số tiền cố định (VND)</option>
            <option value="shipping">Miễn phí vận chuyển</option>
          </select>
        </label>
        {form.type !== 'shipping' && (
          <label>
            {form.type === 'percent' ? 'Giảm (%)' : 'Giảm (VND)'}
            <input name="value" type="number" min="0" value={form.value} onChange={onChange} required />
          </label>
        )}
        {form.type === 'percent' && (
          <label>
            Giảm tối đa (VND, 0 = không giới hạn)
            <input name="maxDiscount" type="number" min="0" value={form.maxDiscount} onChange={onChange} />
          </label>
        )}
        <label>
          Đơn tối thiểu (VND)
          <input name="minSubtotal" type="number" min="0" value={form.minSubtotal} onChange={onChange} />
        </label>
        <label>
          Giới hạn lượt dùng (0 = không giới hạn)
          <input name="usageLimit" type="number" min="0" value={form.usageLimit} onChange={onChange} />
        </label>
        <label>
          Ngày hết hạn
          <input name="expiresAt" type="date" value={form.expiresAt} onChange={onChange} />
        </label>
        <label className="checkbox-row">
          <input type="checkbox" name="active" checked={form.active} onChange={onChange} />
          <span>Kích hoạt ngay</span>
        </label>
        <button type="submit" className="primary-button" disabled={submitting}>
          <Plus size={16} aria-hidden /> {submitting ? 'Đang lưu...' : 'Tạo mã'}
        </button>
      </form>

      <div className="card-box admin-list">
        <div className="admin-list-header">
          <h2>Danh sách mã ({coupons.length})</h2>
        </div>
        {loading ? (
          <p>Đang tải...</p>
        ) : coupons.length === 0 ? (
          <p className="empty-state">Chưa có mã nào.</p>
        ) : (
          <div className="coupon-list">
            {coupons.map((coupon) => (
              <div key={coupon.code} className={`coupon-item ${coupon.active ? '' : 'inactive'}`}>
                <div className="coupon-main">
                  <strong>{coupon.code}</strong>
                  <span>{describeCoupon(coupon)}</span>
                  <small>
                    Đơn tối thiểu: {coupon.minSubtotal ? formatVND(coupon.minSubtotal) : 'không'} ·
                    Hết hạn: {formatExpires(coupon.expiresAt)} ·
                    Lượt dùng: {coupon.usageCount || 0}{coupon.usageLimit > 0 ? `/${coupon.usageLimit}` : ''}
                  </small>
                </div>
                <div className="coupon-actions">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => toggleActive(coupon)}
                    title={coupon.active ? 'Tắt' : 'Bật'}
                  >
                    {coupon.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>
                  <button
                    type="button"
                    className="icon-button danger"
                    onClick={() => remove(coupon.code)}
                    title="Xoá"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
