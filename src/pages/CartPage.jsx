import { memo, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, Trash2, ArrowLeft, Package, Tag } from 'lucide-react';
import { formatVND } from '../utils/format';
import { fetchPgCart, addToPgCart, updatePgCartItem, removePgCartItem, clearPgCart, getSessionId, validateCouponApi } from '../services/api';
import { useCart } from '../context/CartContext';
import SITE from '../config/site-config';

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
    try {
      const result = await validateCouponApi(code, cart?.subtotal || 0);
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
    setCoupon('');
    setAppliedCoupon(null);
    setCouponMessage('');
  };

  const handleCheckout = async () => {
    // Transfer PG cart items to the existing CartContext for the CheckoutPage
    if (cart?.items?.length) {
      cart.items.forEach(item => {
        addToCart(
          { id: item.product_id, name: item.product_name, price: item.price, image: item.product_image, slug: item.product_slug },
          item.quantity,
          item.variant_id ? { id: item.variant_id, price: item.price, attributes: { size: item.variant_label } } : null,
          { skipDrawer: true }
        );
      });
      // Clear PG cart after transfer so items don't reappear if user navigates back
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

  if (loading) {
    return (
      <section className="section" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <ShoppingCart size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
        <p>Đang tải giỏ hàng...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <p style={{ color: '#ef4444', marginBottom: 16 }}>Không thể tải giỏ hàng: {error}</p>
        <button type="button" className="primary-button" onClick={loadCart}>Thử lại</button>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="section" style={{ textAlign: 'center', padding: '80px 24px', maxWidth: 600, margin: '0 auto' }}>
        <div style={{
          background: 'var(--surface)',
          borderRadius: 20,
          border: '1.5px solid var(--border)',
          padding: '60px 32px'
        }}>
          <ShoppingCart size={56} style={{ opacity: 0.2, marginBottom: 20 }} />
          <h2 style={{ marginBottom: 8 }}>Giỏ hàng đang trống</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
            Hãy thêm sản phẩm vào giỏ hàng trước khi thanh toán nhé!
          </p>
          <Link to="/" className="primary-button">
            <ArrowLeft size={18} /> Tiếp tục mua sắm
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section" style={{ maxWidth: 960, margin: '0 auto' }}>
      <div className="section-heading">
        <div>
          <span className="section-kicker"><ShoppingCart size={16} aria-hidden /> Giỏ hàng của bạn</span>
          <h1>Giỏ hàng</h1>
        </div>
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>
          {itemCount} sản phẩm
        </span>
      </div>

      {/* Cart items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item) => {
          const isUpdating = updatingItems.has(item.id);
          const rowTotal = item.price * item.quantity;

          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                background: 'var(--surface)',
                borderRadius: 16,
                border: '1.5px solid var(--border)',
                padding: '16px 20px',
                opacity: isUpdating ? 0.6 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {/* Product image */}
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 12,
                overflow: 'hidden',
                flexShrink: 0,
                background: 'var(--bg)'
              }}>
                {item.product_image ? (
                  <img
                    src={item.product_image}
                    alt={item.product_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                    <Package size={32} />
                  </div>
                )}
              </div>

              {/* Product info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/san-pham/${item.product_slug}`} style={{
                  fontWeight: 600,
                  fontSize: 15,
                  color: 'var(--text)',
                  textDecoration: 'none',
                  display: 'block',
                  marginBottom: 2,
                  lineHeight: 1.4
                }}>
                  {item.product_name}
                </Link>
                {item.variant_label && (
                  <span style={{
                    fontSize: 13,
                    color: 'var(--muted)',
                    display: 'inline-block',
                    padding: '2px 8px',
                    background: 'var(--bg)',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    marginBottom: 8
                  }}>
                    {item.variant_label}
                  </span>
                )}
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
                  {formatVND(item.price)}
                </div>
              </div>

              {/* Quantity controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'var(--bg)',
                borderRadius: 10,
                border: '1px solid var(--border)',
                padding: '2px'
              }}>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item, item.quantity - 1)}
                  disabled={item.quantity <= 1 || isUpdating}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    borderRadius: 8,
                    color: item.quantity <= 1 ? 'var(--border)' : 'var(--text)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  aria-label="Giảm số lượng"
                >
                  <Minus size={16} />
                </button>
                <span style={{
                  minWidth: 28,
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: 15
                }}>
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(item, item.quantity + 1)}
                  disabled={isUpdating}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    borderRadius: 8,
                    color: 'var(--text)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  aria-label="Tăng số lượng"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Row total */}
              <div style={{
                minWidth: 120,
                textAlign: 'right',
                fontWeight: 700,
                fontSize: 15,
                color: 'var(--text)'
              }}>
                {formatVND(rowTotal)}
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                disabled={isUpdating}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 8,
                  color: '#ef4444',
                  opacity: isUpdating ? 0.4 : 0.6,
                  transition: 'opacity 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                aria-label={`Xóa ${item.product_name}`}
              >
                <Trash2 size={18} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Cart summary footer */}
      <div style={{
        marginTop: 24,
        background: 'var(--surface)',
        borderRadius: 20,
        border: '1.5px solid var(--border)',
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        {/* Coupon row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Tag size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          {appliedCoupon ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{
                padding: '6px 12px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                color: '#10b981'
              }}>
                {appliedCoupon.code} — Giảm {formatVND(appliedCoupon.discount || 0)}
              </span>
              <button
                type="button"
                onClick={removeCoupon}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'var(--muted)'
                }}
              >
                Xóa
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Nhập mã giảm giá"
                disabled={couponBusy}
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1.5px solid var(--border)',
                  background: 'var(--bg)',
                  fontSize: 14,
                  color: 'var(--text)',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponBusy || !coupon.trim()}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: couponBusy || !coupon.trim() ? 'var(--border)' : 'var(--accent)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: couponBusy || !coupon.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {couponBusy ? 'Đang kiểm tra...' : 'Áp dụng'}
              </button>
            </>
          )}
        </div>
        {couponMessage && !appliedCoupon && (
          <p style={{ fontSize: 13, color: '#ef4444', margin: 0, paddingLeft: 26 }}>{couponMessage}</p>
        )}

        {/* Totals and checkout */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
          <div>
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>Tạm tính</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1.2 }}>
              {formatVND(cart?.subtotal || 0)}
            </div>
            {appliedCoupon && appliedCoupon.discount > 0 && (
              <div style={{ fontSize: 14, color: '#10b981', fontWeight: 600 }}>
                Giảm giá: -{formatVND(appliedCoupon.discount)}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link to="/" style={{
              padding: '12px 20px',
              borderRadius: 12,
              border: '1.5px solid var(--border)',
              background: 'transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--text)',
              textDecoration: 'none'
            }}>
              Tiếp tục mua
            </Link>
            <button
              type="button"
              className="primary-button"
              onClick={handleCheckout}
              style={{
                padding: '12px 28px',
                fontSize: 15,
                fontWeight: 700
              }}
            >
              Tiến hành thanh toán
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CartPage() {
  return <CartPageInner />;
}

export default memo(CartPage);
