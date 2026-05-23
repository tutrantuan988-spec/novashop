import { memo, useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Shield,
  Truck,
  ChevronRight,
  ChevronLeft,
  Lock,
  Wallet,
  Building2,
  Smartphone,
  Loader2,
  MapPin,
  Tag,
  BookmarkPlus
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatVND } from '../utils/format';
import SITE from '../config/site-config';
import { checkoutSchema } from '../lib/checkoutSchema';
import { createOrderApi, validateCouponApi } from '../services/api';
import { getProvinces, getDistricts, getWards } from '../services/locationApi';
import { isRecaptchaConfigured, executeRecaptcha } from '../lib/recaptcha';

const SHIPPING_FEE = 30000;
const FREE_SHIP_THRESHOLD = 300000;

const STEPS = [
  { key: 'shipping', label: 'Giao hàng', icon: Truck },
  { key: 'payment', label: 'Thanh toán', icon: CreditCard },
  { key: 'confirm', label: 'Xác nhận', icon: CheckCircle2 }
];

const PAYMENT_METHODS = [
  {
    value: 'cod',
    label: 'Thanh toán khi nhận hàng (COD)',
    desc: 'Kiểm tra hàng trước khi thanh toán',
    icon: Truck
  },
  {
    value: 'bank',
    label: 'Chuyển khoản MBBank',
    desc: 'Quét QR hoặc chuyển khoản sau khi đặt hàng',
    icon: Building2
  },
  {
    value: 'vnpay',
    label: 'VNPay (ATM / Visa / QR)',
    desc: 'Hỗ trợ ATM nội địa, Visa, MasterCard, QR Pay',
    icon: CreditCard
  },
  {
    value: 'momo',
    label: 'Ví MoMo',
    desc: 'Thanh toán nhanh qua ví điện tử MoMo',
    icon: Smartphone
  },
  {
    value: 'stripe',
    label: 'Stripe (Thẻ quốc tế)',
    desc: 'Visa, MasterCard, AMEX, JCB',
    icon: Wallet
  }
];

function CheckoutPageInner() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const recaptchaEnabled = isRecaptchaConfigured();

  const [currentStep, setCurrentStep] = useState('shipping');
  const [formData, setFormData] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    trigger
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
      payment: 'cod',
      saveAddress: false
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
  const saveAddress = watch('saveAddress');

  useEffect(() => {
    document.title = `Thanh toán - ${SITE.name}`;
    window.scrollTo({ top: 0 });
    getProvinces()
      .then(setProvinces)
      .catch(() => toast.error('Không thể tải danh sách tỉnh/thành phố'));
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
    setCouponMessage('');
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

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponMessage('');
    setCoupon('');
  };

  const handleShippingNext = async (data) => {
    const isValid = await trigger(['fullName', 'phone', 'email', 'address', 'city', 'district', 'ward']);
    if (!isValid) return;
    setFormData(data);
    setCurrentStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaymentNext = async () => {
    const isValid = await trigger('payment');
    if (!isValid) return;
    setCurrentStep('confirm');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSubmitError('');
    if (currentStep === 'confirm') {
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      setCurrentStep('shipping');
    }
  };

  const handleFinalSubmit = async () => {
    if (!formData) return;
    setSubmitError('');
    setStockIssues([]);

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
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: `${formData.address}, ${wardName}, ${districtName}, ${cityName}`
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
        paymentMethod: formData.payment,
        coupon: appliedCoupon?.code || null,
        note: formData.note,
        saveAddress: user ? (saveAddress || false) : false,
        recaptchaToken
      };

      const saved = await createOrderApi(orderData);

      if (formData.payment === 'vnpay') {
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

      if (formData.payment === 'momo') {
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

      if (formData.payment === 'stripe') {
        setVnpayLoading(true);
        try {
          const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
          const stripeRes = await fetch(`${apiBase}/api/payments/stripe/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: saved.id })
          });
          const stripeData = await stripeRes.json();
          if (!stripeRes.ok) throw new Error(stripeData.error || 'Không thể tạo thanh toán Stripe');
          window.location.href = stripeData.url;
          return;
        } catch (err) {
          setVnpayLoading(false);
          toast.error(`Stripe: ${err.message}`);
          return;
        }
      }

      setOrderPlaced({ id: saved.id, total: saved.total ?? totals.total });
      clearCart();
    } catch (error) {
      if (error.code === 'INSUFFICIENT_STOCK' && Array.isArray(error.insufficientItems)) {
        setStockIssues(error.insufficientItems);
        const list = error.insufficientItems
          .map((it) => `${it.name}: chỉ còn ${it.available} (bạn đặt ${it.requested})`)
          .join('; ');
        toast.error(`Không đủ tồn kho — ${list}`);
        document.getElementById('cart-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const msg = error.message || 'Vui lòng thử lại sau.';
      setSubmitError(msg);
      toast.error(`Đặt hàng thất bại: ${msg}`);
    }
  };

  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);

  const renderStepIndicator = () => (
    <div className="checkout-steps">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.key === currentStep;
        const isCompleted = index < currentStepIndex;
        return (
          <div key={step.key} className="checkout-step-item">
            <div className={`checkout-step-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
              {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={18} />}
            </div>
            <span className={`checkout-step-label ${isActive ? 'active' : ''}`}>{step.label}</span>
            {index < STEPS.length - 1 && <ChevronRight size={16} className="checkout-step-chevron" />}
          </div>
        );
      })}
    </div>
  );

  const renderShippingStep = () => (
    <div className="card-box checkout-step-content">
      <h2><MapPin size={18} aria-hidden /> Thông tin giao hàng</h2>
      <div className="form-grid">
        <label>
          <span>Họ và tên *</span>
          <input
            {...register('fullName')}
            autoComplete="name"
            aria-invalid={!!errors.fullName}
            placeholder="Nguyễn Văn A"
          />
          {errors.fullName && <span className="field-error">{errors.fullName.message}</span>}
        </label>
        <label>
          <span>Số điện thoại *</span>
          <input
            {...register('phone')}
            autoComplete="tel"
            placeholder="0901 234 567"
            aria-invalid={!!errors.phone}
          />
          {errors.phone && <span className="field-error">{errors.phone.message}</span>}
        </label>
        <label className="full">
          <span>Email *</span>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="email@example.com"
            aria-invalid={!!errors.email}
          />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
        </label>
        <label className="full">
          <span>Địa chỉ *</span>
          <input
            {...register('address')}
            autoComplete="street-address"
            placeholder="Số nhà, tên đường"
            aria-invalid={!!errors.address}
          />
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
          {locationLoading && <span className="field-loading">Đang tải...</span>}
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
          <textarea
            {...register('note')}
            rows={3}
            placeholder="Ví dụ: giao trong giờ hành chính, gọi trước khi giao..."
          />
        </label>
        {user && (
          <label className="full save-address-label">
            <input type="checkbox" {...register('saveAddress')} />
            <span><BookmarkPlus size={14} /> Lưu địa chỉ này cho lần mua sau</span>
          </label>
        )}
      </div>
      <div className="step-actions">
        <button type="button" className="step-next-btn" onClick={handleSubmit(handleShippingNext)}>
          Tiếp tục <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="card-box checkout-step-content">
      <h2><CreditCard size={18} aria-hidden /> Phương thức thanh toán</h2>
      <div className="payment-options">
        {PAYMENT_METHODS.map((method) => {
          const Icon = method.icon;
          const isSelected = payment === method.value;
          return (
            <label
              key={method.value}
              className={`payment-option ${isSelected ? 'active' : ''}`}
            >
              <input type="radio" {...register('payment')} value={method.value} />
              <div className="payment-option-icon">
                <Icon size={20} />
              </div>
              <div className="payment-option-info">
                <strong>{method.label}</strong>
                <span>{method.desc}</span>
              </div>
              {isSelected && <CheckCircle2 size={18} className="payment-check" />}
            </label>
          );
        })}
      </div>

      {payment === 'bank' && (
        <div className="payment-detail-card">
          <img
            src={`https://img.vietqr.io/image/MBBANK-0369712958-compact2.jpg?amount=${totals.total}&addInfo=${encodeURIComponent('Thanh toan don hang')}&accountName=${encodeURIComponent('TRAN TUAN TU')}`}
            alt="QR VietQR chuyển khoản MBBank"
            className="payment-qr-img"
            onError={(e) => { e.target.src = '/qr-payment.png'; }}
          />
          <p className="payment-detail-title">Quét mã để chuyển khoản MBBank</p>
          <p className="payment-detail-info">Chủ TK: <strong>TRAN TUAN TU</strong></p>
          <p className="payment-detail-info">Số TK: <strong>0369712958</strong></p>
          <p className="payment-detail-amount">Số tiền: {formatVND(totals.total)}</p>
        </div>
      )}

      {payment === 'vnpay' && (
        <div className="payment-detail-card">
          <CreditCard size={36} className="payment-detail-icon vnpay-icon" />
          <p className="payment-detail-title">Thanh toán qua VNPay</p>
          <p className="payment-detail-info">Hỗ trợ ATM nội địa, Visa, Mastercard, JCB, QR Pay</p>
          <div className="payment-tags">
            {['ATM nội địa', 'Visa', 'Mastercard', 'JCB', 'QR Pay'].map((m) => (
              <span key={m} className="payment-tag">{m}</span>
            ))}
          </div>
          <p className="payment-detail-hint">Nhấn "Đặt hàng" → chuyển sang cổng VNPay để thanh toán</p>
        </div>
      )}

      {payment === 'momo' && (
        <div className="payment-detail-card">
          <div className="momo-logo">
            <span>M</span>
          </div>
          <p className="payment-detail-title">Thanh toán qua MoMo</p>
          <p className="payment-detail-info">Quét QR hoặc mở ứng dụng MoMo để thanh toán</p>
          <p className="payment-detail-hint">Nhấn "Đặt hàng" → chuyển sang cổng MoMo để thanh toán</p>
        </div>
      )}

      {payment === 'stripe' && (
        <div className="payment-detail-card">
          <Wallet size={36} className="payment-detail-icon stripe-icon" />
          <p className="payment-detail-title">Thanh toán qua Stripe</p>
          <p className="payment-detail-info">Hỗ trợ Visa, MasterCard, American Express, JCB</p>
          <div className="payment-tags">
            {['Visa', 'MasterCard', 'AMEX', 'JCB'].map((m) => (
              <span key={m} className="payment-tag">{m}</span>
            ))}
          </div>
          <p className="payment-detail-hint">Nhấn "Đặt hàng" → chuyển sang cổng Stripe để thanh toán</p>
        </div>
      )}

      <div className="trust-badges">
        <span className="trust-badge"><Lock size={14} /> SSL bảo mật</span>
        <span className="trust-badge"><Shield size={14} /> Bảo vệ dữ liệu</span>
        <span className="trust-badge"><CheckCircle2 size={14} /> Thanh toán an toàn</span>
      </div>

      <div className="step-actions">
        <button type="button" className="step-back-btn" onClick={handleBack}>
          <ChevronLeft size={18} /> Quay lại
        </button>
        <button type="button" className="step-next-btn" onClick={handlePaymentNext}>
          Tiếp tục <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );

  const renderConfirmStep = () => {
    const wardName = selectedWard ? wards.find(w => w.code === Number(selectedWard))?.name || '' : '';
    const districtName = selectedDistrict ? districts.find(d => d.code === Number(selectedDistrict))?.name || '' : '';
    const cityName = selectedProvince ? provinces.find(p => p.code === Number(selectedProvince))?.name || '' : '';
    const selectedPayment = PAYMENT_METHODS.find(m => m.value === formData?.payment);
    const PaymentIcon = selectedPayment?.icon || CreditCard;

    return (
      <div className="card-box checkout-step-content">
        <h2><CheckCircle2 size={18} aria-hidden /> Xác nhận đơn hàng</h2>

        {submitError && (
          <div className="submit-error-box" role="alert">
            <strong>Đặt hàng thất bại</strong>
            <p>{submitError}</p>
          </div>
        )}

        <div className="confirm-section">
          <h3>Thông tin giao hàng</h3>
          <div className="confirm-info">
            <div className="confirm-row">
              <span className="confirm-label">Người nhận</span>
              <span className="confirm-value">{formData?.fullName}</span>
            </div>
            <div className="confirm-row">
              <span className="confirm-label">Số điện thoại</span>
              <span className="confirm-value">{formData?.phone}</span>
            </div>
            <div className="confirm-row">
              <span className="confirm-label">Email</span>
              <span className="confirm-value">{formData?.email}</span>
            </div>
            <div className="confirm-row">
              <span className="confirm-label">Địa chỉ</span>
              <span className="confirm-value">{formData?.address}, {wardName}, {districtName}, {cityName}</span>
            </div>
            {formData?.note && (
              <div className="confirm-row">
                <span className="confirm-label">Ghi chú</span>
                <span className="confirm-value">{formData.note}</span>
              </div>
            )}
          </div>
        </div>

        <div className="confirm-section">
          <h3>Phương thức thanh toán</h3>
          <div className="confirm-payment">
            <PaymentIcon size={18} />
            <span>{selectedPayment?.label}</span>
          </div>
        </div>

        <div className="step-actions">
          <button type="button" className="step-back-btn" onClick={handleBack}>
            <ChevronLeft size={18} /> Quay lại
          </button>
        </div>
      </div>
    );
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

      {renderStepIndicator()}

      <form
        onSubmit={currentStep === 'confirm' ? handleSubmit(handleFinalSubmit) : (e) => e.preventDefault()}
        className="checkout-grid"
        noValidate
      >
        <div className="checkout-form">
          {currentStep === 'shipping' && renderShippingStep()}
          {currentStep === 'payment' && renderPaymentStep()}
          {currentStep === 'confirm' && renderConfirmStep()}
        </div>

        <aside id="cart-summary" className="checkout-summary card-box">
          <h2><Tag size={18} aria-hidden /> Đơn hàng của bạn</h2>

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
                >
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <div>
                    <strong>{item.name}</strong>
                    <span>SL: {item.quantity}</span>
                    {issue && (
                      <small className="summary-stock-error">
                        Còn {issue.available} sản phẩm
                      </small>
                    )}
                  </div>
                  <span className="summary-price">{formatVND(item.price * item.quantity)}</span>
                </li>
              );
            })}
          </ul>

          <div className="coupon-section">
            {appliedCoupon ? (
              <div className="coupon-applied">
                <Tag size={16} />
                <span><strong>{appliedCoupon.code}</strong> — Giảm {formatVND(appliedCoupon.discount)}</span>
                <button type="button" className="coupon-remove" onClick={removeCoupon} aria-label="Xóa mã giảm giá">
                  ×
                </button>
              </div>
            ) : (
              <div className="coupon-row">
                <input
                  type="text"
                  value={coupon}
                  onChange={(event) => setCoupon(event.target.value)}
                  placeholder="Nhập mã giảm giá"
                  aria-label="Mã giảm giá"
                  disabled={couponBusy}
                />
                <button type="button" onClick={applyCoupon} disabled={couponBusy || !coupon.trim()}>
                  {couponBusy ? <Loader2 size={16} className="spinner" /> : 'Áp dụng'}
                </button>
              </div>
            )}
            {couponMessage && !appliedCoupon && (
              <p className="coupon-error">{couponMessage}</p>
            )}
            {couponMessage && appliedCoupon && (
              <p className="coupon-success">{couponMessage}</p>
            )}
          </div>

          <dl className="summary-totals">
            <div><dt>Tạm tính</dt><dd>{formatVND(totals.subtotal)}</dd></div>
            {totals.discount > 0 && <div><dt>Giảm giá</dt><dd className="discount-value">-{formatVND(totals.discount)}</dd></div>}
            <div><dt>Phí vận chuyển</dt><dd>{totals.shipping === 0 ? <span className="free-ship">Miễn phí</span> : formatVND(totals.shipping)}</dd></div>
            <div className="grand"><dt>Tổng cộng</dt><dd>{formatVND(totals.total)}</dd></div>
          </dl>

          {currentStep === 'confirm' && (
            <button
              type="submit"
              className="primary-button submit-btn"
              disabled={isSubmitting || vnpayLoading}
            >
              {(isSubmitting || vnpayLoading) ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Đặt hàng — {formatVND(totals.total)}
                </>
              )}
            </button>
          )}

          {currentStep !== 'confirm' && (
            <button
              type="button"
              className="primary-button submit-btn"
              disabled={isSubmitting || vnpayLoading}
              onClick={currentStep === 'shipping' ? handleSubmit(handleShippingNext) : handlePaymentNext}
            >
              Tiếp tục thanh toán <ChevronRight size={18} />
            </button>
          )}

          <p className="checkout-note">Bằng việc đặt hàng, bạn đồng ý với điều khoản và chính sách của {SITE.name}.</p>

          <div className="trust-badges sidebar-trust">
            <span className="trust-badge"><Shield size={14} /> SSL bảo mật</span>
            <span className="trust-badge"><Lock size={14} /> Bảo vệ dữ liệu</span>
            <span className="trust-badge"><CheckCircle2 size={14} /> Thanh toán an toàn</span>
          </div>

          {recaptchaEnabled && (
            <p className="recaptcha-note">
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
