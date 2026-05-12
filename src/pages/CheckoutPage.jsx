import { memo, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, CheckCircle2, CreditCard, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatVND } from '../utils/format';
import SITE from '../config/site-config';
import {
  createCheckoutSession,
  createOrderApi,
  validateCouponApi,
  createVnpayPayment,
  createMomoPayment
} from '../services/api';

const SHIPPING_FEE = 30000;
const FREE_SHIP_THRESHOLD = 1000000;

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    note: '',
    payment: 'cod'
  });
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [isPlacing, setIsPlacing] = useState(false);

  useEffect(() => {
    document.title = `Thanh toán - ${SITE.name}`;
    window.scrollTo({ top: 0 });
  }, []);

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

  const onChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

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

  const placeOrder = async (event) => {
    event.preventDefault();
    if (!form.fullName || !form.phone || !form.address || !form.city) return;
    setIsPlacing(true);

    try {
      const orderData = {
        customer: {
          name: form.fullName,
          email: form.email,
          phone: form.phone,
          address: `${form.address}, ${form.city}`
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
        paymentMethod: form.payment,
        coupon: appliedCoupon?.code || null,
        note: form.note
      };

      const saved = await createOrderApi(orderData);

      if (form.payment === 'stripe') {
        const session = await createCheckoutSession({
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          orderId: saved.id,
          customerEmail: form.email || user?.email || ''
        });
        if (session.url) {
          window.location.href = session.url;
          return;
        }
      }

      if (form.payment === 'vnpay') {
        const session = await createVnpayPayment(saved.id);
        if (session.url) {
          window.location.href = session.url;
          return;
        }
      }

      if (form.payment === 'momo') {
        const session = await createMomoPayment(saved.id);
        if (session.url) {
          window.location.href = session.url;
          return;
        }
      }

      setOrderPlaced({ id: saved.id, total: saved.total ?? totals.total });
      clearCart();
    } catch (error) {
      console.error('Order error:', error);
      toast.error(`Đặt hàng thất bại: ${error.message || 'Vui lòng thử lại sau.'}`);
    } finally {
      setIsPlacing(false);
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

      <form onSubmit={placeOrder} className="checkout-grid" noValidate>
        <div className="checkout-form">
          <div className="card-box">
            <h2><Truck size={18} aria-hidden /> Thông tin giao hàng</h2>
            <div className="form-grid">
              <label>
                <span>Họ và tên *</span>
                <input name="fullName" required value={form.fullName} onChange={onChange} autoComplete="name" />
              </label>
              <label>
                <span>Số điện thoại *</span>
                <input name="phone" required value={form.phone} onChange={onChange} autoComplete="tel" placeholder="0901 234 567" />
              </label>
              <label className="full">
                <span>Email</span>
                <input name="email" type="email" value={form.email} onChange={onChange} autoComplete="email" />
              </label>
              <label className="full">
                <span>Địa chỉ *</span>
                <input name="address" required value={form.address} onChange={onChange} autoComplete="street-address" placeholder="Số nhà, tên đường" />
              </label>
              <label className="full">
                <span>Tỉnh/Thành phố *</span>
                <input name="city" required value={form.city} onChange={onChange} autoComplete="address-level2" placeholder="TP. Hồ Chí Minh" />
              </label>
              <label className="full">
                <span>Ghi chú</span>
                <textarea name="note" rows={3} value={form.note} onChange={onChange} placeholder="Ví dụ: giao trong giờ hành chính" />
              </label>
            </div>
          </div>

          <div className="card-box">
            <h2><CreditCard size={18} aria-hidden /> Phương thức thanh toán</h2>
            <div className="payment-options">
              <label className={form.payment === 'cod' ? 'payment active' : 'payment'}>
                <input type="radio" name="payment" value="cod" checked={form.payment === 'cod'} onChange={onChange} />
                <div>
                  <strong>Thanh toán khi nhận hàng (COD)</strong>
                  <span>Kiểm tra hàng trước khi thanh toán</span>
                </div>
              </label>
              <label className={form.payment === 'bank' ? 'payment active' : 'payment'}>
                <input type="radio" name="payment" value="bank" checked={form.payment === 'bank'} onChange={onChange} />
                <div>
                  <strong>Chuyển khoản ngân hàng</strong>
                  <span>Hoàn tất thanh toán bằng QR sau khi đặt hàng</span>
                </div>
              </label>
              <label className={form.payment === 'momo' ? 'payment active' : 'payment'}>
                <input type="radio" name="payment" value="momo" checked={form.payment === 'momo'} onChange={onChange} />
                <div>
                  <strong>Ví điện tử MoMo</strong>
                  <span>Quét QR hoặc dùng app MoMo</span>
                </div>
              </label>
              <label className={form.payment === 'vnpay' ? 'payment active' : 'payment'}>
                <input type="radio" name="payment" value="vnpay" checked={form.payment === 'vnpay'} onChange={onChange} />
                <div>
                  <strong>VNPay (ATM / QR / Visa nội địa)</strong>
                  <span>Thanh toán qua cổng VNPay</span>
                </div>
              </label>
              <label className={form.payment === 'stripe' ? 'payment active' : 'payment'}>
                <input type="radio" name="payment" value="stripe" checked={form.payment === 'stripe'} onChange={onChange} />
                <div>
                  <strong>Thẻ quốc tế (Visa / MasterCard / Stripe)</strong>
                  <span>Thanh toán bảo mật qua Stripe</span>
                </div>
              </label>
            </div>
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

          <button type="submit" className="primary-button submit-btn" disabled={isPlacing}>
            {isPlacing ? 'Đang xử lý...' : <><CheckCircle2 size={18} aria-hidden /> Đặt hàng</>}
          </button>
          <p className="checkout-note">Bằng việc đặt hàng, bạn đồng ý với điều khoản và chính sách của {SITE.name}.</p>
        </aside>
      </form>
    </section>
  );
}

export default memo(CheckoutPage);
