import { memo, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, CheckCircle2, CreditCard, Shield, Truck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatVND } from '../utils/format';
import SITE from '../config/site-config';
import { checkoutSchema } from '../lib/checkoutSchema';
import {
  createOrderApi,
  validateCouponApi
} from '../services/api';
import {
  getProvinces,
  getDistricts,
  getWards
} from '../services/locationApi';
import { isRecaptchaConfigured, executeRecaptcha } from '../lib/recaptcha';

const SHIPPING_FEE = 30000;
const FREE_SHIP_THRESHOLD = 300000;

function CheckoutPageInner() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const recaptchaEnabled = isRecaptchaConfigured();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: '',
      address: '',
      city: '',
      district: '',
      ward: '',
      note: '',
      payment: 'cod'
    }
  });

  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [vnpayLoading, setVnpayLoading] = useState(false);
  const [stockIssues, setStockIssues] = useState([]);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  const payment = watch('payment');
  const isPlacing = isSubmitting;

  useEffect(() => {
    document.title = `Thanh toán - ${SITE.name}`;
    window.scrollTo({ top: 0 });
    getProvinces().then(setProvinces).catch(() => toast.error('Không thể tải danh sách tỉnh/thành phố'));
  }, []);

  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setWards([]);
      setSelectedDistrict('');
      setSelectedWard('');
      setValue('district', '');
      setValue('ward', '');
      return;
    }
    setLocationLoading(true);
    getDistricts(selectedProvince)
      .then((d) => {
        setDistricts(d);
        setWards([]);
        setSelectedDistrict('');
        setSelectedWard('');
        setValue('district', '');
        setValue('ward', '');
      })
      .catch(() => toast.error('Không thể tải danh sách quận/huyện'))
      .finally(() => setLocationLoading(false));
  }, [selectedProvince]);

  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      setSelectedWard('');
      setValue('ward', '');
      return;
    }
    setLocationLoading(true);
    getWards(selectedDistrict)
      .then((w) => setWards(w))
      .catch(() => toast.error('Không thể tải danh sách phường/xã'))
      .finally(() => setLocationLoading(false));
  }, [selectedDistrict]);


  const totals = useMemo(() => {
    let discount = 0;
    let shipping = subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FEE;
    if (appliedCoupon) {
      if (appliedCoupon.freeShipping) shipping = 0;
      discount = Math.min(subtotal, Number(appliedCoupon.discount) || 0);
    }
    const total = Math.max(0, subtotal - discount) + shipping;
    return { subtotal, discount, shipping, total };
  }, [subtotal, appliedCoupon]);

  const applyCoupon = async (event) => {
    event.preventDefault();
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    setCouponBusy(true);
    try {
      const result = await validateCouponApi(code, subtotal);
      setAppliedCoupon(result);
      setCouponMessage(result.message || 'Áp dụng mã thành công');
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMessage(err.message || 'Mã không hợp lệ');
    } finally {
      setCouponBusy(false);
    }
  };

  const handleShippingSubmit = async (data) => {
    try {
      let recaptchaToken = '';
      if (recaptchaEnabled) {
        recaptchaToken = await executeRecaptcha('checkout');
      }

      const wardName = selectedWard ? wards.find(w => w.code === Number(selectedWard))?.name || '' : '';
      const districtName = selectedDistrict ? districts.find(d => d.code === Number(selectedDistrict))?.name || '' : '';
      const cityName = selectedProvince ? provinces.find(p => p.code === Number(selectedProvince))?.name || '' : '';

      const orderData = {
        customer: {
          name: data.fullName,
          email: data.email,
          phone: data.phone,
          address: `${data.address}, ${wardName}, ${districtName}, ${cityName}`
        },
        items: items.map((i) => ({
          id: i.id,
          variantId: i.variantId || null,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image
        })),
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        total: totals.total,
        paymentMethod: data.payment,
        coupon: appliedCoupon?.code || null,
        note: data.note,
        recaptchaToken
      };

      setStockIssues([]); // Reset trước mỗi lần submit
      const saved = await createOrderApi(orderData);

      if (data.payment === 'vnpay') {
        setVnpayLoading(true);
        try {
          const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
          const vnpRes = await fetch(`${apiBase}/api/payments/vnpay/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: saved.id })
          });
          const vnpData = await vnpRes.json();
          if (!vnpRes.ok) throw new Error(vnpData.error || 'Không thể tạo thanh toán VNPay');
          window.location.href = vnpData.url;
          return;
        } catch (err) {
          setVnpayLoading(false);
          toast.error(`VNPay: ${err.message}`);
          return;
        }
      }

      if (data.payment === 'momo') {
        setVnpayLoading(true);
        try {
          const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
          const momoRes = await fetch(`${apiBase}/api/payments/momo/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: saved.id })
          });
          const momoData = await momoRes.json();
          if (!momoRes.ok) throw new Error(momoData.error || 'Không thể tạo thanh toán MoMo');
          window.location.href = momoData.payUrl;
          return;
        } catch (err) {
          setVnpayLoading(false);
          toast.error(`MoMo: ${err.message}`);
          return;
        }
      }

      setOrderPlaced({ id: saved.id, total: saved.total ?? totals.total });
      clearCart();
    } catch (error) {
      // Server trả 409 + INSUFFICIENT_STOCK → highlight items thiếu
      if (error.code === 'INSUFFICIENT_STOCK' && Array.isArray(error.insufficientItems)) {
        setStockIssues(error.insufficientItems);
        const list = error.insufficientItems
          .map((it) => `${it.name}: chỉ còn ${it.available} (bạn đặt ${it.requested})`)
          .join('; ');
        toast.error(`Không đủ tồn kho — ${list}`);
        // Scroll lên đầu giỏ hàng để user thấy highlight
        document.getElementById('cart-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      toast.error(`Đặt hàng thất bại: ${error.message || 'Vui lòng thử lại sau.'}`);
    }
  };


  if (orderPlaced) {
    return (
      <section className="section order-success">
        <div className="success-card">
          <BadgeCheck size={64} aria-hidden />
          <h1>Đặt hàng thành công!</h1>
          <p>Mã đơn hàng của bạn: <strong>{orderPlaced.id}</strong></p>
          <p>Tổng giá trị đơn hàng: <strong>{formatVND(orderPlaced.total)}</strong></p>
          <p>Chúng tôi sẽ liên hệ xác nhận đơn hàng trong vòng 15 phút.</p>
          <div className="success-actions">
            <Link to="/" className="primary-button">Tiếp tục mua sắm</Link>
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="section empty-checkout">
        <h1>Giỏ hàng của bạn đang trống</h1>
        <p>Hãy chọn vài sản phẩm yêu thích trước khi thanh toán nhé.</p>
        <button type="button" className="primary-button" onClick={() => navigate('/')}>Khám phá sản phẩm</button>
      </section>
    );
  }

  return (
    <section className="section checkout" aria-labelledby="checkout-title">
      <h1 id="checkout-title">Thanh toán đơn hàng</h1>

      <form onSubmit={handleSubmit(handleShippingSubmit)} className="checkout-grid" noValidate>
        <div className="checkout-form">
          <div className="card-box">
            <h2><Truck size={18} aria-hidden /> Thông tin giao hàng</h2>
            <div className="form-grid">
              <label>
                <span>Họ và tên *</span>
                <input {...register('fullName')} autoComplete="name" aria-invalid={!!errors.fullName} />
                {errors.fullName && <span className="field-error">{errors.fullName.message}</span>}
              </label>
              <label>
                <span>Số điện thoại *</span>
                <input {...register('phone')} autoComplete="tel" placeholder="0901 234 567" aria-invalid={!!errors.phone} />
                {errors.phone && <span className="field-error">{errors.phone.message}</span>}
              </label>
              <label className="full">
                <span>Email *</span>
                <input {...register('email')} type="email" autoComplete="email" aria-invalid={!!errors.email} />
                {errors.email && <span className="field-error">{errors.email.message}</span>}
              </label>
              <label className="full">
                <span>Địa chỉ *</span>
                <input {...register('address')} autoComplete="street-address" placeholder="Số nhà, tên đường" aria-invalid={!!errors.address} />
                {errors.address && <span className="field-error">{errors.address.message}</span>}
              </label>
              <label className="full">
                <span>Tỉnh/Thành phố *</span>
                <select
                  value={selectedProvince}
                  onChange={(e) => {
                    setSelectedProvince(e.target.value);
                    setValue('city', e.target.value ? provinces.find(p => p.code === Number(e.target.value))?.name || '' : '');
                  }}
                  aria-invalid={!!errors.city}
                >
                  <option value="">-- Chọn tỉnh/thành phố --</option>
                  {provinces.map((p) => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
                {errors.city && <span className="field-error">{errors.city.message}</span>}
              </label>
              <label>
                <span>Quận/Huyện *</span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setValue('district', e.target.value ? districts.find(d => d.code === Number(e.target.value))?.name || '' : '');
                  }}
                  disabled={!districts.length || locationLoading}
                  aria-invalid={!!errors.district}
                >
                  <option value="">-- Chọn quận/huyện --</option>
                  {districts.map((d) => (
                    <option key={d.code} value={d.code}>{d.name}</option>
                  ))}
                </select>
                {errors.district && <span className="field-error">{errors.district.message}</span>}
              </label>
              <label>
                <span>Phường/Xã *</span>
                <select
                  value={selectedWard}
                  onChange={(e) => {
                    setSelectedWard(e.target.value);
                    setValue('ward', e.target.value ? wards.find(w => w.code === Number(e.target.value))?.name || '' : '');
                  }}
                  disabled={!wards.length || locationLoading}
                  aria-invalid={!!errors.ward}
                >
                  <option value="">-- Chọn phường/xã --</option>
                  {wards.map((w) => (
                    <option key={w.code} value={w.code}>{w.name}</option>
                  ))}
                </select>
                {errors.ward && <span className="field-error">{errors.ward.message}</span>}
              </label>
              <label className="full">
                <span>Ghi chú</span>
                <textarea {...register('note')} rows={3} placeholder="Ví dụ: giao trong giờ hành chính" />
                {errors.note && <span className="field-error">{errors.note.message}</span>}
              </label>
            </div>
          </div>

          <div className="card-box">
            <h2><CreditCard size={18} aria-hidden /> Phương thức thanh toán</h2>
            <div className="payment-options">
              <label className={payment === 'cod' ? 'payment active' : 'payment'}>
                <input type="radio" {...register('payment')} value="cod" />
                <div>
                  <strong>Thanh toán khi nhận hàng (COD)</strong>
                  <span>Kiểm tra hàng trước khi thanh toán</span>
                </div>
              </label>
              <label className={payment === 'bank' ? 'payment active' : 'payment'}>
                <input type="radio" {...register('payment')} value="bank" />
                <div>
                  <strong>Chuyển khoản MBBank</strong>
                  <span>Quét QR hoặc chuyển khoản sau khi đặt hàng</span>
                </div>
              </label>
              <label className={payment === 'vnpay' ? 'payment active' : 'payment'}>
                <input type="radio" {...register('payment')} value="vnpay" />
                <div>
                  <strong>VNPay (ATM / Visa / QR)</strong>
                  <span>Thanh toán qua VNPay — hỗ trợ thẻ ATM, Visa, MasterCard, QR Pay</span>
                </div>
              </label>
              <label className={payment === 'momo' ? 'payment active' : 'payment'}>
                <input type="radio" {...register('payment')} value="momo" />
                <div>
                  <strong>Ví MoMo</strong>
                  <span>Thanh toán nhanh qua ví điện tử MoMo</span>
                </div>
              </label>
            </div>

            {payment === 'bank' && (
              <div style={{ marginTop: 16, padding: 20, background: 'var(--surface)', borderRadius: 14, textAlign: 'center', border: '1.5px solid var(--border)' }}>
                <img
                  src={`https://img.vietqr.io/image/MBBANK-0369712958-compact2.jpg?amount=${totals.total}&addInfo=${encodeURIComponent('Thanh toan don hang')}&accountName=${encodeURIComponent('TRAN TUAN TU')}`}
                  alt="QR VietQR chuyển khoản MBBank"
                  style={{ maxWidth: 240, width: '100%', borderRadius: 12, marginBottom: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  onError={(e) => { e.target.src = '/qr-payment.png'; }}
                />
                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Quét mã để chuyển khoản MBBank</p>
                <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 2 }}>Chủ TK: TRAN TUAN TU</p>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>Số TK: 0369712958</p>
                <p style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 700, marginTop: 6 }}>Số tiền: {formatVND(totals.total)}</p>
              </div>
            )}

            {payment === 'vnpay' && (
              <div style={{ marginTop: 16, padding: 20, background: 'var(--surface)', borderRadius: 14, textAlign: 'center', border: '1.5px solid var(--border)' }}>
                <CreditCard size={36} style={{ marginBottom: 8, color: '#0071ba' }} />
                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Thanh toán qua VNPay</p>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>Hỗ trợ ATM nội địa, Visa, Mastercard, JCB, QR Pay</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {['ATM nội địa', 'Visa', 'Mastercard', 'JCB', 'QR Pay'].map((m) => (
                    <span key={m} style={{ padding: '4px 10px', background: 'var(--bg)', borderRadius: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)', border: '1px solid var(--border)' }}>{m}</span>
                  ))}
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 12 }}>Nhấn "Thanh toán VNPay" → chuyển sang cổng VNPay để thanh toán</p>
              </div>
            )}

            {payment === 'momo' && (
              <div style={{ marginTop: 16, padding: 20, background: 'var(--surface)', borderRadius: 14, textAlign: 'center', border: '1.5px solid var(--border)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#a5002e', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>M</span>
                </div>
                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Thanh toán qua MoMo</p>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>Quét QR hoặc mở ứng dụng MoMo để thanh toán</p>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 12 }}>Nhấn "Thanh toán MoMo" → chuyển sang cổng MoMo để thanh toán</p>
              </div>
            )}
          </div>
        </div>

        <aside id="cart-summary" className="checkout-summary card-box">
          <h2>Đơn hàng của bạn</h2>

          {stockIssues.length > 0 && (
            <div className="stock-warning" role="alert">
              <strong>⚠️ Một số sản phẩm không đủ tồn kho:</strong>
              <ul>
                {stockIssues.map((it) => (
                  <li key={`${it.productId}-${it.variantId || ''}`}>
                    {it.name}: chỉ còn <strong>{it.available}</strong> (bạn đặt {it.requested})
                  </li>
                ))}
              </ul>
              <p>Vui lòng quay lại giỏ hàng để điều chỉnh số lượng.</p>
            </div>
          )}

          <ul className="summary-items">
            {items.map((item) => {
              const issue = stockIssues.find((s) => String(s.productId) === String(item.id));
              return (
                <li
                  key={item.id}
                  className={issue ? 'summary-item-error' : ''}
                  style={issue ? { background: 'rgba(239, 68, 68, 0.08)', borderLeft: '3px solid #ef4444', paddingLeft: 8 } : undefined}
                >
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <div>
                    <strong>{item.name}</strong>
                    <span>SL: {item.quantity}</span>
                    {issue && (
                      <small style={{ color: '#ef4444', fontWeight: 700, display: 'block' }}>
                        Còn {issue.available} sản phẩm
                      </small>
                    )}
                  </div>
                  <span className="summary-price">{formatVND(item.price * item.quantity)}</span>
                </li>
              );
            })}
          </ul>

          <div className="coupon-row">
            <input
              type="text"
              value={coupon}
              onChange={(event) => setCoupon(event.target.value)}
              placeholder="Nhập mã giảm giá"
              aria-label="Mã giảm giá"
              disabled={couponBusy}
            />
            <button type="button" onClick={applyCoupon} disabled={couponBusy}>
              {couponBusy ? 'Đang kiểm tra...' : 'Áp dụng'}
            </button>
          </div>
          {couponMessage && <p className={appliedCoupon ? 'coupon-success' : 'coupon-error'}>{couponMessage}</p>}

          <dl className="summary-totals">
            <div><dt>Tạm tính</dt><dd>{formatVND(totals.subtotal)}</dd></div>
            {totals.discount > 0 && <div><dt>Giảm giá</dt><dd>-{formatVND(totals.discount)}</dd></div>}
            <div><dt>Phí vận chuyển</dt><dd>{totals.shipping === 0 ? 'Miễn phí' : formatVND(totals.shipping)}</dd></div>
            <div className="grand"><dt>Tổng cộng</dt><dd>{formatVND(totals.total)}</dd></div>
          </dl>

          <button
            type="submit"
            className="primary-button submit-btn"
            disabled={isPlacing || vnpayLoading}
          >
            {isPlacing || vnpayLoading ? 'Đang xử lý...' : payment === 'vnpay' ? <><CreditCard size={18} aria-hidden /> Thanh toán VNPay</> : payment === 'momo' ? <><CreditCard size={18} aria-hidden /> Thanh toán MoMo</> : <><CheckCircle2 size={18} aria-hidden /> Đặt hàng</>}
          </button>
          <p className="checkout-note">Bằng việc đặt hàng, bạn đồng ý với điều khoản và chính sách của {SITE.name}.</p>

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--muted)', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={14} style={{ color: '#10b981' }} /> SSL bảo mật
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={14} style={{ color: '#10b981' }} /> Bảo vệ dữ liệu
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle2 size={14} style={{ color: '#10b981' }} /> Thanh toán an toàn
            </span>
          </div>
          {recaptchaEnabled && (
            <p style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Shield size={12} /> Form được bảo vệ bởi Google reCAPTCHA
            </p>
          )}
        </aside>
      </form>
    </section>
  );
}

function CheckoutPage() {
  return <CheckoutPageInner />;
}

export default memo(CheckoutPage);
