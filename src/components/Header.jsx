import { memo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Crown, Heart, LogIn, LogOut, Menu, ShoppingBag, ShoppingCart, User, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import SITE from '../config/site-config';

function Header() {
  const { totalItems, openCart } = useCart();
  const { user, isAuthenticated, isAdmin, authMode, openAuthModal, logout } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="header">
      <Link className="logo" to="/" aria-label={`${SITE.name} trang chủ`}>
        <span><ShoppingBag size={22} aria-hidden /></span>
        {SITE.name}
      </Link>

      <nav className={isMenuOpen ? 'nav nav-open' : 'nav'} aria-label="Điều hướng chính">
        <NavLink to="/" end onClick={() => setIsMenuOpen(false)}>Trang chủ</NavLink>
        <a href="/#products" onClick={() => setIsMenuOpen(false)}>Sản phẩm</a>
        <a href="/#luxury" onClick={() => setIsMenuOpen(false)}>Luxury</a>
        <a href="/#concierge" onClick={() => setIsMenuOpen(false)}>Concierge</a>
        <a href="/#deals" onClick={() => setIsMenuOpen(false)}>Ưu đãi</a>
        <a href="/#reviews" onClick={() => setIsMenuOpen(false)}>Đánh giá</a>
        {isAdmin && <NavLink to="/admin" onClick={() => setIsMenuOpen(false)}>Quản trị</NavLink>}
      </nav>

      <div className="header-actions">
        {authMode === 'unconfigured' ? (
          <span className="auth-unconfigured" title="VITE_CLERK_PUBLISHABLE_KEY chưa được cấu hình">⚠️ Auth</span>
        ) : isAuthenticated ? (
          <div className="user-chip">
            <Link to="/tai-khoan" className="user-chip-link" title="Tài khoản của tôi">
              <User size={16} aria-hidden />
              <span>{user.name}</span>
            </Link>
            <button type="button" onClick={logout} aria-label="Đăng xuất"><LogOut size={16} /></button>
          </div>
        ) : (
          <button type="button" className="icon-button auth-button" onClick={openAuthModal} aria-label="Đăng nhập">
            <LogIn size={18} />
            <span className="auth-label">Đăng nhập</span>
          </button>
        )}

        <a className="vip-pill" href="/#concierge">
          <Crown size={16} aria-hidden />
          VIP
        </a>

        <button type="button" className="icon-button mobile-only" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Mở menu" aria-expanded={isMenuOpen}>
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {isAuthenticated && (
          <Link to="/tai-khoan#wishlist" className="icon-button wishlist-pill" aria-label={`Yêu thích (${wishlistCount})`}>
            <Heart size={18} fill={wishlistCount > 0 ? 'currentColor' : 'none'} />
            {wishlistCount > 0 && <strong>{wishlistCount}</strong>}
          </Link>
        )}

        <button type="button" className="cart-button" onClick={openCart} aria-label={`Mở giỏ hàng (${totalItems} sản phẩm)`}>
          <ShoppingCart size={20} aria-hidden />
          <span>Giỏ hàng</span>
          {totalItems > 0 && <strong>{totalItems}</strong>}
        </button>
      </div>
    </header>
  );
}

export default memo(Header);
