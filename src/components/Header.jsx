import { memo, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowRight, Crown, Heart, LogOut, Menu, Moon, Package, Search, Settings, ShoppingBag, ShoppingCart, Sun, User, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import SITE from '../config/site-config';

function Header() {
  const { totalItems, openCart } = useCart();
  const { user, isAuthenticated, isAdmin, authMode, openAuthModal, logout } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  return (
    <header className="header">
      <Link className="logo" to="/" aria-label={`${SITE.name} trang chủ`}>
        <span><ShoppingBag size={22} aria-hidden /></span>
        <strong>TRỌNG ĐỊNH STORE</strong>
        <small>Trang chủ</small>
      </Link>

      <nav className={isMenuOpen ? 'nav nav-open' : 'nav'} aria-label="Điều hướng chính">
        <a href="/#products" onClick={() => setIsMenuOpen(false)}>{t.nav.products}</a>
        <a href="/#luxury" onClick={() => setIsMenuOpen(false)}>{t.nav.luxury}</a>
        <a href="/#concierge" onClick={() => setIsMenuOpen(false)}>{t.nav.concierge}</a>
        <a href="/#deals" onClick={() => setIsMenuOpen(false)}>{t.nav.deals}</a>
        <a href="/#reviews" onClick={() => setIsMenuOpen(false)}>{t.nav.reviews}</a>
        {isAdmin && <NavLink to="/admin" onClick={() => setIsMenuOpen(false)}>{t.nav.admin}</NavLink>}
      </nav>

      <div className="header-actions">
        {authMode === 'unconfigured' ? (
          <span className="auth-unconfigured" title="VITE_CLERK_PUBLISHABLE_KEY chưa được cấu hình">⚠️ Auth</span>
        ) : isAuthenticated ? (
          <div className="user-chip" style={{ position: 'relative' }}>
            <button
              type="button"
              className="user-chip-link"
              onClick={() => setUserDropdown((d) => !d)}
              aria-haspopup="menu"
              aria-expanded={userDropdown}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <User size={16} aria-hidden />
              <span>{user?.name || 'Tài khoản'}</span>
            </button>
            {userDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  background: 'var(--surface)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 12,
                  padding: '8px',
                  minWidth: 200,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                  zIndex: 100
                }}
              >
                <Link
                  to="/tai-khoan/profile"
                  onClick={() => setUserDropdown(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 8,
                    color: 'var(--text)',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Settings size={16} /> Thông tin cá nhân
                </Link>
                <Link
                  to="/tai-khoan/yeu-thich"
                  onClick={() => setUserDropdown(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 8,
                    color: 'var(--text)',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Heart size={16} /> Yêu thích
                </Link>
                <Link
                  to="/tai-khoan/don-hang"
                  onClick={() => setUserDropdown(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 8,
                    color: 'var(--text)',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Package size={16} /> Đơn hàng của tôi
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setUserDropdown(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 8,
                      color: 'var(--text)',
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 600
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Crown size={16} /> Quản trị
                  </Link>
                )}
                <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
                <button
                  type="button"
                  onClick={() => { setUserDropdown(false); logout(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <LogOut size={16} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <button type="button" className="icon-button auth-button" onClick={openAuthModal} aria-label="Đăng nhập">
            <span className="auth-label">Đăng nhập</span>
            <ArrowRight size={16} />
          </button>
        )}

        <Link to="/tim-kiem" className="icon-button" aria-label="Tìm kiếm" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <Search size={18} />
        </Link>

        <button type="button" className="icon-button lang-toggle" onClick={toggleLang} aria-label="Chuyển ngôn ngữ">
          {lang === 'vi' ? 'EN' : 'VI'}
        </button>

        <button type="button" className="icon-button theme-toggle" onClick={toggleTheme} aria-label={isDark ? 'Chuyển sáng' : 'Chuyển tối'}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <a className="vip-pill" href="/#concierge">
          <Crown size={16} aria-hidden />
          VIP
        </a>

        <button type="button" className="icon-button mobile-only" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Mở menu" aria-expanded={isMenuOpen}>
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {isAuthenticated && (
          <Link to="/tai-khoan/yeu-thich" className="icon-button wishlist-pill" aria-label={`Yêu thích (${wishlistCount})`}>
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
