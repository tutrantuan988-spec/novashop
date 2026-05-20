import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, Trash2, X, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatVND } from '../utils/format';

const FREE_SHIP_THRESHOLD = 300000;

function CartDrawer() {
  const { items, subtotal, isOpen, closeCart, updateQuantity, removeItem } = useCart();
  const remaining = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100);

  return (
    <>
      <aside
        className={isOpen ? 'cart-drawer open' : 'cart-drawer'}
        aria-hidden={!isOpen}
        aria-label="Giỏ hàng"
      >
        <div className="cart-header">
          <h2>Giỏ hàng của bạn</h2>
          <button type="button" onClick={closeCart} aria-label="Đóng giỏ hàng"><X size={22} /></button>
        </div>
        {items.length === 0 ? (
          <div className="empty-cart">
            <ShoppingCart size={42} aria-hidden />
            <p>Giỏ hàng đang trống</p>
            <Link to="/" className="primary-button" onClick={closeCart}>Tiếp tục mua sắm</Link>
          </div>
        ) : (
          <>
            {remaining > 0 && (
              <div className="free-ship-progress">
                <div className="free-ship-message">
                  <Truck size={14} />
                  <span>Mua thêm <strong>{formatVND(remaining)}</strong> để được <strong>freeship</strong></span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            {remaining <= 0 && (
              <div className="free-ship-achieved">
                <Truck size={14} />
                <span>🎉 Đơn hàng của bạn được <strong>freeship</strong>!</span>
              </div>
            )}
            <div className="cart-items">
              {items.map((item) => (
                <div className="cart-item" key={item.id}>
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <div>
                    <h3>{item.name}</h3>
                    <p>{formatVND(item.price)}</p>
                    <div className="cart-item-actions">
                      <div className="quantity">
                        <button type="button" onClick={() => updateQuantity(item.id, -1)} aria-label="Giảm số lượng"><Minus size={14} /></button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label="Tăng số lượng"><Plus size={14} /></button>
                      </div>
                      <button type="button" className="remove-btn" onClick={() => removeItem(item.id)} aria-label={`Xóa ${item.name}`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-footer">
              <div className="cart-subtotal"><span>Tạm tính</span><strong>{formatVND(subtotal)}</strong></div>
              <Link to="/thanh-toan" className="checkout-btn" onClick={closeCart}>Tiến hành thanh toán</Link>
            </div>
          </>
        )}
      </aside>
      {isOpen && <button type="button" className="overlay" onClick={closeCart} aria-label="Đóng lớp phủ" />}
    </>
  );
}

export default memo(CartDrawer);
