import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, Heart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';

function MobileBottomNav() {
  const location = useLocation();
  const { items } = useCart();
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="mobile-bottom-nav">
      <Link to="/" className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
        <Home size={22} />
        <span>Trang chủ</span>
      </Link>
      
      <Link to="/products" className={`mobile-nav-item ${location.pathname === '/products' ? 'active' : ''}`}>
        <Search size={22} />
        <span>Tìm kiếm</span>
      </Link>

      <Link to="/cart" className={`mobile-nav-item ${location.pathname === '/cart' ? 'active' : ''}`}>
        <div style={{ position: 'relative' }}>
          <ShoppingCart size={22} />
          {totalItems > 0 && <span className="mobile-nav-badge">{totalItems}</span>}
        </div>
        <span>Giỏ hàng</span>
      </Link>

      <Link to="/wishlist" className={`mobile-nav-item ${location.pathname === '/wishlist' ? 'active' : ''}`}>
        <Heart size={22} />
        <span>Yêu thích</span>
      </Link>

      <Link to="/tai-khoan" className={`mobile-nav-item ${location.pathname.startsWith('/tai-khoan') ? 'active' : ''}`}>
        <User size={22} />
        <span>Tài khoản</span>
      </Link>
    </nav>
  );
}

export default MobileBottomNav;
