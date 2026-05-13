import { memo, useState, useCallback } from 'react';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import {
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react';

const CARD_BRAND_ICONS = {
  visa: 'https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c8bdb40353de404e253ba1.svg',
  mastercard: 'https://js.stripe.com/v3/fingerprinted/img/mastercard-7d10af030c32f72ebd25f653e78d51f9.svg',
  amex: 'https://js.stripe.com/v3/fingerprinted/img/amex-a42b00d25d4f07a64c3e93d6e89c68d6.svg',
  jcb: 'https://js.stripe.com/v3/fingerprinted/img/jcb-271f03ac792b45f4f20628f37e8f92a4.svg',
  discover: 'https://js.stripe.com/v3/fingerprinted/img/discover-ac5a27f6369f6d7f0ff2f53b6a8c1a2a.svg',
  diners: 'https://js.stripe.com/v3/fingerprinted/img/diners-fd4476f852fee2e6595b1c67778ce31e.svg',
  unionpay: 'https://js.stripe.com/v3/fingerprinted/img/unionpay-8a0e7140fd701238f4ae6bed1f0b8c02.svg'
};

const ELEMENT_STYLE = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1e293b',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      '::placeholder': { color: '#94a3b8', fontSize: '14px' },
      iconColor: '#f97316'
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444'
    },
    complete: {
      color: '#16a34a',
      iconColor: '#16a34a'
    }
  }
};

const CARD_NUMBER_OPTIONS = {
  ...ELEMENT_STYLE,
  showIcon: true,
  iconStyle: 'default'
};

const inputBaseStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1.5px solid var(--border)',
  background: 'var(--bg)',
  fontSize: 15,
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s'
};

const getElementWrapperStyle = (error, complete) => ({
  ...inputBaseStyle,
  borderColor: error ? '#ef4444' : complete ? '#16a34a' : 'var(--border)',
  background: 'var(--bg)',
  display: 'flex',
  alignItems: 'center',
  padding: '10px 14px'
});

function StripePaymentForm({ amount, orderId, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();

  const [cardholderName, setCardholderName] = useState('');
  const [country, setCountry] = useState('VN');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [cardBrand, setCardBrand] = useState('unknown');
  const [fieldStates, setFieldStates] = useState({
    number: { complete: false, error: null },
    expiry: { complete: false, error: null },
    cvc: { complete: false, error: null }
  });

  const allComplete = fieldStates.number.complete && fieldStates.expiry.complete && fieldStates.cvc.complete;
  const anyError = fieldStates.number.error || fieldStates.expiry.error || fieldStates.cvc.error || formError;

  const updateField = useCallback((field, updates) => {
    setFieldStates((prev) => ({ ...prev, [field]: { ...prev[field], ...updates } }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      onError('Stripe chưa được khởi tạo. Vui lòng thử lại.');
      return;
    }
    if (!allComplete) {
      setFormError('Vui lòng nhập đầy đủ thông tin thẻ');
      return;
    }
    if (!cardholderName.trim()) {
      setFormError('Vui lòng nhập tên chủ thẻ');
      return;
    }

    setLoading(true);
    setFormError(null);

    try {
      const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
      const res = await fetch(`${apiBase}/api/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, orderId, currency: 'vnd' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thể tạo payment intent');

      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: {
            name: cardholderName.trim(),
            address: { country }
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Thanh toán thất bại');
      }

      if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
      } else {
        throw new Error('Trạng thái thanh toán không xác định');
      }
    } catch (err) {
      setFormError(err.message);
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const brandIcon = CARD_BRAND_ICONS[cardBrand] || null;

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: 16,
        padding: 24,
        border: '1.5px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CreditCard size={18} color="#fff" />
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, display: 'block', color: 'var(--text)' }}>Thông tin thẻ</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Bảo mật bởi Stripe</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontSize: 12, fontWeight: 600 }}>
            <Lock size={13} /> Đã mã hóa SSL
          </div>
        </div>

        {/* Cardholder Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
            Tên chủ thẻ (như trên thẻ) *
          </label>
          <input
            type="text"
            value={cardholderName}
            onChange={(e) => { setCardholderName(e.target.value); setFormError(null); }}
            placeholder="TRAN TUAN TU"
            autoComplete="cc-name"
            style={{
              ...inputBaseStyle,
              color: 'var(--text)',
              borderColor: formError && !cardholderName.trim() ? '#ef4444' : 'var(--border)'
            }}
            onFocus={(e) => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Card Number */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
            Số thẻ *
          </label>
          <div
            style={getElementWrapperStyle(fieldStates.number.error, fieldStates.number.complete)}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {brandIcon && (
              <img
                src={brandIcon}
                alt={cardBrand}
                style={{ width: 32, height: 20, marginRight: 10, objectFit: 'contain' }}
              />
            )}
            {!brandIcon && <CreditCard size={20} style={{ marginRight: 10, color: '#94a3b8' }} />}
            <CardNumberElement
              options={CARD_NUMBER_OPTIONS}
              onChange={(event) => {
                updateField('number', { complete: event.complete, error: event.error?.message || null });
                if (event.brand) setCardBrand(event.brand);
                if (event.error) setFormError(null);
              }}
            />
          </div>
          {fieldStates.number.error && (
            <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{fieldStates.number.error}</span>
          )}
        </div>

        {/* Expiry + CVC */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
              Ngày hết hạn (MM/YY) *
            </label>
            <div
              style={getElementWrapperStyle(fieldStates.expiry.error, fieldStates.expiry.complete)}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <CardExpiryElement
                options={ELEMENT_STYLE}
                onChange={(event) => {
                  updateField('expiry', { complete: event.complete, error: event.error?.message || null });
                  if (event.error) setFormError(null);
                }}
              />
            </div>
            {fieldStates.expiry.error && (
              <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{fieldStates.expiry.error}</span>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
              Mã bảo mật (CVV/CVC) *
            </label>
            <div
              style={getElementWrapperStyle(fieldStates.cvc.error, fieldStates.cvc.complete)}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <CardCvcElement
                options={ELEMENT_STYLE}
                onChange={(event) => {
                  updateField('cvc', { complete: event.complete, error: event.error?.message || null });
                  if (event.error) setFormError(null);
                }}
              />
            </div>
            {fieldStates.cvc.error && (
              <span style={{ color: '#ef4444', fontSize: 12, marginTop: 4, display: 'block' }}>{fieldStates.cvc.error}</span>
            )}
          </div>
        </div>

        {/* Country */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
            Quốc gia phát hành thẻ *
          </label>
          <div style={{ position: 'relative' }}>
            <Globe size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={{
                ...inputBaseStyle,
                color: 'var(--text)',
                paddingLeft: 40,
                appearance: 'none',
                cursor: 'pointer'
              }}
              onFocus={(e) => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            >
              <option value="VN">Vietnam</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="JP">Japan</option>
              <option value="KR">South Korea</option>
              <option value="SG">Singapore</option>
              <option value="MY">Malaysia</option>
              <option value="TH">Thailand</option>
              <option value="PH">Philippines</option>
              <option value="ID">Indonesia</option>
              <option value="CN">China</option>
              <option value="FR">France</option>
              <option value="DE">Germany</option>
              <option value="IT">Italy</option>
              <option value="ES">Spain</option>
              <option value="NL">Netherlands</option>
              <option value="BE">Belgium</option>
              <option value="CH">Switzerland</option>
              <option value="AT">Austria</option>
              <option value="SE">Sweden</option>
              <option value="NO">Norway</option>
              <option value="DK">Denmark</option>
              <option value="FI">Finland</option>
              <option value="IE">Ireland</option>
              <option value="PT">Portugal</option>
              <option value="GR">Greece</option>
              <option value="PL">Poland</option>
              <option value="CZ">Czech Republic</option>
              <option value="HU">Hungary</option>
              <option value="RO">Romania</option>
              <option value="BG">Bulgaria</option>
              <option value="HR">Croatia</option>
              <option value="SI">Slovenia</option>
              <option value="SK">Slovakia</option>
              <option value="LT">Lithuania</option>
              <option value="LV">Latvia</option>
              <option value="EE">Estonia</option>
              <option value="LU">Luxembourg</option>
              <option value="MT">Malta</option>
              <option value="CY">Cyprus</option>
              <option value="AE">United Arab Emirates</option>
              <option value="SA">Saudi Arabia</option>
              <option value="QA">Qatar</option>
              <option value="KW">Kuwait</option>
              <option value="BH">Bahrain</option>
              <option value="OM">Oman</option>
              <option value="IN">India</option>
              <option value="PK">Pakistan</option>
              <option value="BD">Bangladesh</option>
              <option value="LK">Sri Lanka</option>
              <option value="NP">Nepal</option>
              <option value="MM">Myanmar</option>
              <option value="KH">Cambodia</option>
              <option value="LA">Laos</option>
              <option value="BR">Brazil</option>
              <option value="MX">Mexico</option>
              <option value="AR">Argentina</option>
              <option value="CL">Chile</option>
              <option value="CO">Colombia</option>
              <option value="PE">Peru</option>
              <option value="VE">Venezuela</option>
              <option value="UY">Uruguay</option>
              <option value="PY">Paraguay</option>
              <option value="BO">Bolivia</option>
              <option value="EC">Ecuador</option>
              <option value="RU">Russia</option>
              <option value="TR">Turkey</option>
              <option value="IL">Israel</option>
              <option value="ZA">South Africa</option>
              <option value="EG">Egypt</option>
              <option value="NG">Nigeria</option>
              <option value="KE">Kenya</option>
              <option value="GH">Ghana</option>
              <option value="TZ">Tanzania</option>
              <option value="UG">Uganda</option>
              <option value="RW">Rwanda</option>
              <option value="ZW">Zimbabwe</option>
              <option value="NZ">New Zealand</option>
              <option value="HK">Hong Kong</option>
              <option value="TW">Taiwan</option>
              <option value="MO">Macau</option>
            </select>
          </div>
        </div>

        {/* Form-level error */}
        {formError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 14px',
            background: '#fef2f2',
            borderRadius: 10,
            border: '1px solid #fecaca',
            marginBottom: 16,
            color: '#dc2626',
            fontSize: 13,
            fontWeight: 600
          }}>
            <AlertCircle size={16} /> {formError}
          </div>
        )}

        {/* Success state */}
        {allComplete && !anyError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 14px',
            background: '#f0fdf4',
            borderRadius: 10,
            border: '1px solid #bbf7d0',
            marginBottom: 16,
            color: '#16a34a',
            fontSize: 13,
            fontWeight: 600
          }}>
            <CheckCircle2 size={16} /> Thông tin thẻ đã hợp lệ — sẵn sàng thanh toán
          </div>
        )}

        {/* Card brand badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          {Object.entries(CARD_BRAND_ICONS).map(([brand, url]) => (
            <img
              key={brand}
              src={url}
              alt={brand}
              style={{
                width: 36,
                height: 24,
                objectFit: 'contain',
                opacity: cardBrand === brand || cardBrand === 'unknown' ? 1 : 0.3,
                transition: 'opacity 0.2s',
                filter: cardBrand === brand || cardBrand === 'unknown' ? 'none' : 'grayscale(100%)'
              }}
            />
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="primary-button"
        style={{
          width: '100%',
          marginTop: 16,
          padding: '16px 24px',
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          opacity: loading || !stripe ? 0.6 : 1,
          cursor: loading || !stripe ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 14px rgba(249,115,22,0.25)',
          letterSpacing: '0.3px'
        }}
      >
        {loading ? (
          <><Loader2 size={20} className="spin" /> Đang xử lý thanh toán...</>
        ) : (
          <><Lock size={18} /> Thanh toán an toàn {amount ? `• ${amount.toLocaleString('vi-VN')}đ` : ''}</>
        )}
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
        Thông tin thẻ được mã hóa và xử lý bởi Stripe. Chúng tôi không lưu trữ thông tin thẻ.
      </p>
    </form>
  );
}

export default memo(StripePaymentForm);
