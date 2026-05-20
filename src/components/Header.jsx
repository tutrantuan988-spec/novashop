import { memo, useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowRight, Crown, Heart, LogOut, Menu, Moon, Package, Search, Settings, ShoppingBag, ShoppingCart, Sun, User, X, ChevronDown, Scale } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useComparison } from '../context/ComparisonContext';
import { fetchCategoryTree } from '../services/apiV2';
import NotificationBell from './ui/NotificationBell';
import SearchBar from './search/SearchBar';
import SITE from '../config/site-config';

function Header() {
  const { totalItems, openCart } = useCart();
  const { user, isAuthenticated, isAdmin, authLoading, openAuthModal, logout } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { compareList } = useComparison();
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [categories, setCategories] = useState([]);
  const [catDropdown, setCatDropdown] = useState(false);

  useEffect(() => {
    fetchCategoryTree().then((tree) => {
      const top = (tree || []).filter((c) => c.is_active !== false && c.show_in_menu !== false);
      setCategories(top);
    }).catch(() => {});
  }, []);

  const navLabels = t?.nav || {
    products: 'Sản phẩm',
    luxury: 'Danh mục',
    concierge: 'Hỗ trợ',
    deals: 'Khuyến mãi',
    reviews: 'Đánh giá',
    admin: 'Quản lý'
  };

  return (
    <header className="header">
      {/* Row 1: Logo + Search + Actions */}
      <div className="header-row1">
        <Link className="logo" to="/" aria-label={`${SITE.name} trang chủ`}>
          <span><ShoppingBag size={22} aria-hidden /></span>
          <strong>{SITE.name}</strong>
          <small>{SITE.slogan}</small>
        </Link>

        <div className="header-search-wrap">
          <SearchBar />
        </div>

        <div className="header-actions">
          {authLoading ? (
            <div className="icon-button auth-skeleton" aria-hidden style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(26,35,64,0.06)', animation: 'pulse 1.5s ease infinite' }} />
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

          <button type="button" className="cart-button" onClick={openCart} aria-label={`Mở giỏ hàng (${totalItems} sản phẩm)`}>
            <ShoppingCart size={20} aria-hidden />
            <span className="cart-label">Giỏ hàng</span>
            {totalItems > 0 && <strong>{totalItems}</strong>}
          </button>

          {isAuthenticated && (
            <Link to="/tai-khoan/yeu-thich" className="icon-button wishlist-pill" aria-label={`Yêu thích (${wishlistCount})`}>
              <Heart size={18} fill={wishlistCount > 0 ? 'currentColor' : 'none'} />
              {wishlistCount > 0 && <strong>{wishlistCount}</strong>}
            </Link>
          )}

          {compareList.length > 0 && (
            <Link to="/so-sanh" className="icon-button compare-pill" aria-label={`So sánh (${compareList.length})`} style={{
              background: 'rgba(139, 92, 246, 0.1)',
              color: '#8b5cf6',
              border: '1.5px solid rgba(139, 92, 246, 0.3)'
            }}>
              <Scale size={18} />
              <strong>{compareList.length}</strong>
            </Link>
          )}

          <NotificationBell />

          <Link to="/tim-kiem" className="icon-button mobile-only" aria-label="Tìm kiếm">
            <Search size={18} />
          </Link>

          <button type="button" className="icon-button mobile-only" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Mở menu" aria-expanded={isMenuOpen}>
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Row 2: Nav links + utils */}
      <div className="header-row2">
        <nav className={isMenuOpen ? 'nav nav-open' : 'nav'} aria-label="Điều hướng chính">
          <NavLink to="/" end onClick={() => setIsMenuOpen(false)}>{navLabels.products}</NavLink>
          <div
            className="nav-dropdown-wrapper"
            style={{ position: 'relative' }}
            onMouseEnter={() => setCatDropdown(true)}
            onMouseLeave={() => setCatDropdown(false)}
          >
            <NavLink
              to="/danh-muc"
              onClick={() => setIsMenuOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {navLabels.luxury} <ChevronDown size={14} style={{ opacity: 0.6 }} />
            </NavLink>
            {catDropdown && categories.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  minWidth: 220,
                  background: 'var(--surface)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 12,
                  padding: 8,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                  zIndex: 200
                }}
              >
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/danh-muc/${cat.slug}`}
                    onClick={() => { setIsMenuOpen(false); setCatDropdown(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      borderRadius: 8,
                      color: 'var(--text)',
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 500
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <NavLink to="/khuyen-mai" onClick={() => setIsMenuOpen(false)}>{navLabels.deals}</NavLink>
          <NavLink to="/blog" onClick={() => setIsMenuOpen(false)}>Blog</NavLink>
          <NavLink to="/danh-gia" onClick={() => setIsMenuOpen(false)}>{navLabels.reviews}</NavLink>
          <NavLink to="/ho-tro" onClick={() => setIsMenuOpen(false)}>{navLabels.concierge}</NavLink>
          {isAdmin && <NavLink to="/admin" onClick={() => setIsMenuOpen(false)}>{navLabels.admin}</NavLink>}
        </nav>

        <div className="header-row2-right">
          <Link className="vip-pill header-vip-pill" to="/ho-tro">
            <Crown size={16} aria-hidden />
            VIP
          </Link>
          <button type="button" className="icon-button lang-toggle" onClick={toggleLang} aria-label="Chuyển ngôn ngữ">
            {lang === 'vi' ? 'EN' : 'VI'}
          </button>
          <button type="button" className="icon-button theme-toggle" onClick={toggleTheme} aria-label={isDark ? 'Chuyển sáng' : 'Chuyển tối'}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}

export default memo(Header);
