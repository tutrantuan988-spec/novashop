import { memo, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, Trash2, ArrowLeft, Package, Tag, Truck, CheckCircle2 } from 'lucide-react';
import { formatVND } from '../utils/format';
import { fetchPgCart, addToPgCart, updatePgCartItem, removePgCartItem, clearPgCart, getSessionId, validateCouponApi } from '../services/api';
import { useCart } from '../context/CartContext';
import SITE from '../config/site-config';
import RecentlyViewed from '../components/RecentlyViewed';

const FREE_SHIP_THRESHOLD = 300000;
const MAX_STOCK = 99;

function CartPageInner() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const { addToCart } = useCart();

  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponStatus, setCouponStatus] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPgCart();
      setCart(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = `Giỏ hàng - ${SITE.name}`;
    loadCart();
  }, [loadCart]);

  const handleQuantityChange = async (item, newQty) => {
    if (newQty < 1) return;
    if (newQty > MAX_STOCK) return;
    setUpdatingItems(prev => new Set(prev).add(item.id));
    try {
      await updatePgCartItem(item.id, newQty);
      setCart(prev => {
        if (!prev) return prev;
        const updatedItems = prev.items.map(i =>
          i.id === item.id ? { ...i, quantity: newQty } : i
        );
        return { ...prev, items: updatedItems, subtotal: updatedItems.reduce((s, i) => s + i.price * i.quantity, 0) };
      });
    } catch (err) {
      console.error('Update quantity error:', err);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleRemove = async (itemId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) return;
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await removePgCartItem(itemId);
      setCart(prev => {
        if (!prev) return prev;
        const updatedItems = prev.items.filter(i => i.id !== itemId);
        return { ...prev, items: updatedItems, subtotal: updatedItems.reduce((s, i) => s + i.price * i.quantity, 0) };
      });
    } catch (err) {
      console.error('Remove item error:', err);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const applyCoupon = async (event) => {
    event.preventDefault();
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    setCouponBusy(true);
    setCouponStatus('');
    setCouponMessage('');
    try {
      const result = await validateCouponApi(code, cart?.subtotal || 0);
      setAppliedCoupon(result);
      setCouponMessage(result.message || 'Áp dụng mã thành công');
      setCouponStatus('success');
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMessage(err.message || 'Mã không hợp lệ');
      setCouponStatus('error');
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = () => {
    setCoupon('');
    setAppliedCoupon(null);
    setCouponMessage('');
    setCouponStatus('');
  };

  const handleCheckout = async () => {
    if (cart?.items?.length) {
      cart.items.forEach(item => {
        addToCart(
          { id: item.product_id, name: item.product_name, price: item.price, image: item.product_image, slug: item.product_slug },
          item.quantity,
          item.variant_id ? { id: item.variant_id, price: item.price, attributes: { size: item.variant_label } } : null,
          { skipDrawer: true }
        );
      });
      try {
        await clearPgCart();
        setCart({ items: [], subtotal: 0 });
      } catch (err) {
        console.warn('Failed to clear PG cart after transfer:', err.message);
      }
    }
    navigate('/thanh-toan');
  };

  const items = cart?.items || [];
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart?.subtotal || 0;
  const shipping = subtotal >= FREE_SHIP_THRESHOLD ? 0 : (subtotal > 0 ? 30000 : 0);
  const discount = appliedCoupon?.discount || 0;
  const total = subtotal - discount + shipping;
  const remainingForFreeShip = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
  const freeShipProgress = Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100);

  if (loading) {
    return (
      <section className="cart-loading">
        <ShoppingCart size={40} aria-hidden />
        <p>Đang tải giỏ hàng...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="cart-error">
        <p>Không thể tải giỏ hàng: {error}</p>
        <button type="button" className="primary-button" onClick={loadCart}>Thử lại</button>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="cart-empty">
        <div className="cart-empty-card">
          <ShoppingCart size={64} aria-hidden />
          <h2>Giỏ hàng đang trống</h2>
          <p>Hãy thêm sản phẩm vào giỏ hàng trước khi thanh toán nhé!</p>
          <Link to="/" className="continue-shopping-btn">
            <ArrowLeft size={18} /> Tiếp tục mua sắm
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <div className="cart-page-header">
        <div>
          <span className="section-kicker"><ShoppingCart size={16} aria-hidden /> Giỏ hàng của bạn</span>
          <h1>Giỏ hàng</h1>
        </div>
        <span className="item-count">{itemCount} sản phẩm</span>
      </div>

      {/* Free shipping progress */}
      {remainingForFreeShip > 0 ? (
        <div className="free-ship-progress" style={{ marginBottom: 24 }}>
          <div className="free-ship-message">
            <Truck size={16} />
            <span>Mua thêm <strong>{formatVND(remainingForFreeShip)}</strong> để được <strong>freeship</strong></span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${freeShipProgress}%` }} />
          </div>
        </div>
      ) : (
        <div className="free-ship-achieved" style={{ marginBottom: 24 }}>
          <Truck size={16} />
          <span>Đơn hàng của bạn được freeship!</span>
        </div>
      )}

      <div className="cart-layout">
        {/* Cart items list */}
        <div className="cart-items-list">
          {items.map((item) => {
            const isUpdating = updatingItems.has(item.id);
            const rowTotal = item.price * item.quantity;

            return (
              <div
                className={`cart-row${isUpdating ? ' updating' : ''}`}
                key={item.id}
              >
                <div className="cart-row-img">
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_name} loading="lazy" />
                  ) : (
                    <div className="placeholder-icon">
                      <Package size={32} />
                    </div>
                  )}
                </div>

                <div className="cart-row-info">
                  <Link to={`/san-pham/${item.product_slug}`}>
                    {item.product_name}
                  </Link>
                  {item.variant_label && (
                    <span className="variant-tag">{item.variant_label}</span>
                  )}
                  <div className="unit-price">{formatVND(item.price)}</div>
                </div>

                <div className="cart-row-qty">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item, item.quantity - 1)}
                    disabled={item.quantity <= 1 || isUpdating}
                    aria-label="Giảm số lượng"
                  >
                    <Minus size={16} />
                  </button>
                  <span aria-live="polite">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item, Math.min(item.quantity + 1, MAX_STOCK))}
                    disabled={isUpdating || item.quantity >= MAX_STOCK}
                    aria-label="Tăng số lượng"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="cart-row-total">
                  {formatVND(rowTotal)}
                </div>

                <button
                  type="button"
                  className="cart-row-remove"
                  onClick={() => handleRemove(item.id)}
                  disabled={isUpdating}
                  aria-label={`Xóa ${item.product_name}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Order summary sidebar */}
        <aside className="cart-summary">
          <h3>Đơn hàng của bạn</h3>

          {/* Coupon section */}
          <div className="coupon-section">
            {appliedCoupon ? (
              <div className="applied-coupon">
                <span className="applied-coupon-tag">
                  <CheckCircle2 size={14} />
                  {appliedCoupon.code} — Giảm {formatVND(appliedCoupon.discount || 0)}
                </span>
                <button type="button" className="coupon-remove-btn" onClick={removeCoupon}>
                  Xóa
                </button>
              </div>
            ) : (
              <form onSubmit={applyCoupon}>
                <div className="coupon-row">
                  <Tag size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                  <input
                    type="text"
                    className={`coupon-input${couponStatus === 'error' ? ' error' : ''}`}
                    value={coupon}
                    onChange={(e) => { setCoupon(e.target.value); setCouponStatus(''); setCouponMessage(''); }}
                    placeholder="Nhập mã giảm giá"
                    disabled={couponBusy}
                  />
                  <button
                    type="submit"
                    className="coupon-apply-btn"
                    disabled={couponBusy || !coupon.trim()}
                  >
                    {couponBusy ? 'Đang kiểm tra...' : 'Áp dụng'}
                  </button>
                </div>
                {couponMessage && (
                  <p className={`coupon-msg ${couponStatus}`}>{couponMessage}</p>
                )}
              </form>
            )}
          </div>

          {/* Summary lines */}
          <div className="summary-lines">
            <div className="summary-line">
              <span className="label">Tạm tính</span>
              <span className="value">{formatVND(subtotal)}</span>
            </div>
            <div className="summary-line shipping">
              <span className="label">Phí vận chuyển</span>
              <span className={`value${shipping === 0 ? ' free' : ''}`}>
                {shipping === 0 ? 'Miễn phí' : formatVND(shipping)}
              </span>
            </div>
            {discount > 0 && (
              <div className="summary-line discount">
                <span className="label">Giảm giá</span>
                <span className="value">-{formatVND(discount)}</span>
              </div>
            )}
          </div>

          <div className="summary-total">
            <span className="label">Tổng cộng</span>
            <span className="value">{formatVND(total)}</span>
          </div>

          <button type="button" className="cart-checkout-btn" onClick={handleCheckout}>
            Tiến hành thanh toán
          </button>

          <Link to="/" className="cart-continue-link">
            <ArrowLeft size={16} /> Tiếp tục mua sắm
          </Link>
        </aside>
      </div>

      {/* Recently viewed products */}
      <RecentlyViewed />
    </section>
  );
}

function CartPage() {
  return <CartPageInner />;
}

export default memo(CartPage);
