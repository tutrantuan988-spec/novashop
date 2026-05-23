import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, Trash2, X, Truck, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatVND } from '../utils/format';

const FREE_SHIP_THRESHOLD = 300000;

const UPSELL_ITEMS = [
  {
    id: 'upsell-1',
    name: 'Túi tote canvas thời trang',
    price: 150000,
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400',
    slug: 'tui-tote-canvas-thoi-trang'
  },
  {
    id: 'upsell-2',
    name: 'Ốp lưng điện thoại silicone',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    slug: 'op-lung-dien-thoai-silicone'
  },
  {
    id: 'upsell-3',
    name: 'Bình nước thể thao 750ml',
    price: 89000,
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400',
    slug: 'binh-nuoc-the-thao-750ml'
  },
  {
    id: 'upsell-4',
    name: 'Mũ lưỡi trai unisex',
    price: 120000,
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400',
    slug: 'mu-luoi-trai-unisex'
  }
];

function CartDrawer() {
  const { items, subtotal, isOpen, closeCart, updateQuantity, removeItem, addToCart } = useCart();
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
            <ShoppingCart size={56} aria-hidden />
            <p>Giỏ hàng đang trống</p>
            <Link to="/" className="shop-cta" onClick={closeCart}>
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <>
            {remaining > 0 ? (
              <div className="free-ship-progress">
                <div className="free-ship-message">
                  <Truck size={16} />
                  <span>Mua thêm <strong>{formatVND(remaining)}</strong> để được <strong>freeship</strong></span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <div className="free-ship-achieved">
                <Truck size={16} />
                <span>Đơn hàng của bạn được freeship!</span>
              </div>
            )}

            <div className="cart-items">
              {items.map((item) => (
                <div className="cart-item" key={`${item.id}::${item.variantId || ''}`}>
                  <div className="cart-item-img">
                    <img src={item.image} alt={item.name} loading="lazy" />
                  </div>
                  <div className="cart-item-info">
                    <h3>{item.name}</h3>
                    <p className="item-price">{formatVND(item.price)}</p>
                    <div className="cart-item-actions">
                      <div className="quantity">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1, item.variantId)}
                          disabled={item.quantity <= 1}
                          aria-label="Giảm số lượng"
                        >
                          <Minus size={14} />
                        </button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1, item.variantId)}
                          aria-label="Tăng số lượng"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => {
                          if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
                            removeItem(item.id, item.variantId);
                          }
                        }}
                        aria-label={`Xóa ${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="drawer-upsell">
              <h4>Có thể bạn sẽ thích</h4>
              <div className="upsell-scroll">
                {UPSELL_ITEMS.map((item) => (
                  <Link
                    to={`/san-pham/${item.slug}`}
                    className="upsell-card"
                    key={item.id}
                    onClick={() => {
                      addToCart({ id: item.id, name: item.name, price: item.price, image: item.image, slug: item.slug }, 1);
                    }}
                  >
                    <img src={item.image} alt={item.name} loading="lazy" />
                    <div className="upsell-name">{item.name}</div>
                    <div className="upsell-price">{formatVND(item.price)}</div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="cart-footer">
              <div className="cart-subtotal">
                <span>Tạm tính</span>
                <strong>{formatVND(subtotal)}</strong>
              </div>
              <Link to="/thanh-toan" className="checkout-btn" onClick={closeCart}>
                Tiến hành thanh toán <ArrowRight size={18} />
              </Link>
            </div>
          </>
        )}
      </aside>
      {isOpen && <button type="button" className="overlay" onClick={closeCart} aria-label="Đóng lớp phủ" />}
    </>
  );
}

export default memo(CartDrawer);
