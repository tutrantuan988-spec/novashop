import { memo, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, CheckCircle2, CreditCard, Truck } from 'lucide-react';
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
import StripeProvider from '../components/StripeProvider';
import StripePaymentForm from '../components/StripePaymentForm';

const SHIPPING_FEE = 30000;
const FREE_SHIP_THRESHOLD = 300000;

function CheckoutPageInner() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();

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
      note: '',
      payment: 'cod'
    }
  });

  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [stripeOrder, setStripeOrder] = useState(null);

  const payment = watch('payment');
  const isPlacing = isSubmitting;

  useEffect(() => {
    document.title = `Thanh toán - ${SITE.name}`;
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    if (payment !== 'stripe') {
      setStripeOrder(null);
    }
  }, [payment]);

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
      const orderData = {
        customer: {
          name: data.fullName,
          email: data.email,
          phone: data.phone,
          address: `${data.address}, ${data.city}`
        },
        items: items.map((i) => ({
          id: i.id,
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
        note: data.note
      };

      const saved = await createOrderApi(orderData);

      if (data.payment === 'stripe') {
        setStripeOrder({ id: saved.id, total: saved.total ?? totals.total });
        return;
      }

      setOrderPlaced({ id: saved.id, total: saved.total ?? totals.total });
      clearCart();
    } catch (error) {
      console.error('Order error:', error);
      toast.error(`Đặt hàng thất bại: ${error.message || 'Vui lòng thử lại sau.'}`);
    }
  };

  const handleStripeSuccess = () => {
    setOrderPlaced(stripeOrder);
    setStripeOrder(null);
    clearCart();
  };

  const handleStripeError = (msg) => {
    toast.error(msg);
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
                <input {...register('city')} autoComplete="address-level2" placeholder="TP. Hồ Chí Minh" aria-invalid={!!errors.city} />
                {errors.city && <span className="field-error">{errors.city.message}</span>}
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
              <label className={payment === 'stripe' ? 'payment active' : 'payment'}>
                <input type="radio" {...register('payment')} value="stripe" />
                <div>
                  <strong>Thẻ Visa / Mastercard</strong>
                  <span>Thanh toán an toàn qua Stripe</span>
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

            {payment === 'stripe' && stripeOrder && (
              <StripePaymentForm
                amount={totals.total}
                orderId={stripeOrder.id}
                onSuccess={handleStripeSuccess}
                onError={handleStripeError}
              />
            )}

            {payment === 'stripe' && !stripeOrder && (
              <div style={{ marginTop: 16, padding: 20, background: 'var(--surface)', borderRadius: 14, textAlign: 'center', border: '1.5px solid var(--border)' }}>
                <CreditCard size={36} style={{ marginBottom: 8, color: '#6772e5' }} />
                <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Thanh toán bằng thẻ quốc tế</p>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>Visa, Mastercard, JCB, Amex — Bảo mật bởi Stripe</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
                  {['Visa', 'Mastercard', 'JCB', 'Amex'].map((card) => (
                    <span key={card} style={{ padding: '4px 10px', background: 'var(--bg)', borderRadius: 6, fontSize: 12, fontWeight: 700, color: 'var(--muted)', border: '1px solid var(--border)' }}>{card}</span>
                  ))}
                </div>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 12 }}>Nhấn "Tiếp tục thanh toán" để nhập thông tin thẻ</p>
              </div>
            )}
          </div>
        </div>

        <aside className="checkout-summary card-box">
          <h2>Đơn hàng của bạn</h2>
          <ul className="summary-items">
            {items.map((item) => (
              <li key={item.id}>
                <img src={item.image} alt={item.name} loading="lazy" />
                <div>
                  <strong>{item.name}</strong>
                  <span>SL: {item.quantity}</span>
                </div>
                <span className="summary-price">{formatVND(item.price * item.quantity)}</span>
              </li>
            ))}
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
            disabled={isPlacing || (payment === 'stripe' && stripeOrder)}
          >
            {isPlacing ? 'Đang xử lý...' : payment === 'stripe' && !stripeOrder ? <><CreditCard size={18} aria-hidden /> Tiếp tục thanh toán</> : payment === 'stripe' && stripeOrder ? 'Nhập thông tin thẻ bên trái' : <><CheckCircle2 size={18} aria-hidden /> Đặt hàng</>}
          </button>
          <p className="checkout-note">Bằng việc đặt hàng, bạn đồng ý với điều khoản và chính sách của {SITE.name}.</p>
        </aside>
      </form>
    </section>
  );
}

function CheckoutPage() {
  return (
    <StripeProvider>
      <CheckoutPageInner />
    </StripeProvider>
  );
}

export default memo(CheckoutPage);
