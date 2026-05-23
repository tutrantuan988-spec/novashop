import { memo, useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowRight, Crown, Heart, LogOut, Menu, Moon, Package, Search, Settings, ShoppingCart, Sun, User, X, ChevronDown, Scale, Zap, Shirt, Smartphone, Home, Sparkles, Star, BookOpen } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useComparison } from '../context/ComparisonContext';
import NotificationBell from './ui/NotificationBell';
import SearchBar from './search/SearchBar';
import SITE from '../config/site-config';

const HEADER_CATEGORIES = [
  { name: 'Thời trang', icon: Shirt, count: '2,430 sp', sub: 'Váy, áo, quần, phụ kiện', slug: 'thoi-trang' },
  { name: 'Điện tử', icon: Smartphone, count: '1,280 sp', sub: 'Tai nghe, điện thoại, laptop', slug: 'dien-tu' },
  { name: 'Gia dụng', icon: Home, count: '890 sp', sub: 'Bếp, phòng khách, phòng ngủ', slug: 'do-gia-dung' },
  { name: 'Làm đẹp', icon: Sparkles, count: '1,650 sp', sub: 'Skincare, makeup, nước hoa', slug: 'suc-khoe-lam-dep' },
  { name: 'Thể thao', icon: Star, count: '560 sp', sub: 'Giày, đồ thể thao, yoga', slug: 'the-thao' },
  { name: 'Sách & Văn phòng', icon: BookOpen, count: '340 sp', sub: 'Sách, bút, dụng cụ học tập', slug: 'sach' }
];

function Header() {
  const { totalItems, openCart } = useCart();
  const { user, isAuthenticated, isAdmin, authLoading, openAuthModal, logout } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { compareList } = useComparison();
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [catDropdown, setCatDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userDropdownRef = useRef(null);
  const catDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdown(false);
      }
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
        setCatDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
    <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="header-row1">
        <Link className="logo" to="/" aria-label={`${SITE.name} trang chủ`} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <span className="logo-icon" style={{ fontSize: '26px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🎀</span>
          <strong className="font-pacifico" style={{ fontSize: '22px', color: '#E91E8C', fontWeight: 'normal' }}>Lifestyle</strong>
        </Link>

        <div className="header-search-wrap">
          <SearchBar />
        </div>

        <div className="header-actions">
          {authLoading ? (
            <div className="icon-button auth-skeleton" aria-hidden />
          ) : isAuthenticated ? (
            <div className="user-chip" ref={userDropdownRef}>
              <button
                type="button"
                className="user-chip-link"
                onClick={() => setUserDropdown((d) => !d)}
                aria-haspopup="menu"
                aria-expanded={userDropdown}
              >
                <User size={16} aria-hidden />
                <span>{user?.name || 'Tài khoản'}</span>
              </button>
              {userDropdown && (
                <div className="user-dropdown-menu">
                  <Link to="/tai-khoan/profile" onClick={() => setUserDropdown(false)}>
                    <Settings size={16} /> Thông tin cá nhân
                  </Link>
                  <Link to="/tai-khoan/yeu-thich" onClick={() => setUserDropdown(false)}>
                    <Heart size={16} /> Yêu thích
                  </Link>
                  <Link to="/tai-khoan/don-hang" onClick={() => setUserDropdown(false)}>
                    <Package size={16} /> Đơn hàng của tôi
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setUserDropdown(false)}>
                      <Crown size={16} /> Quản trị
                    </Link>
                  )}
                  <div className="dropdown-divider" />
                  <button
                    type="button"
                    onClick={() => { setUserDropdown(false); logout(); }}
                    className="dropdown-logout-btn"
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
            {totalItems > 0 && <strong className="cart-badge">{totalItems}</strong>}
          </button>

          {isAuthenticated && (
            <Link to="/tai-khoan/yeu-thich" className="icon-button wishlist-pill" aria-label={`Yêu thích (${wishlistCount})`}>
              <Heart size={18} fill={wishlistCount > 0 ? 'currentColor' : 'none'} />
              {wishlistCount > 0 && <strong>{wishlistCount}</strong>}
            </Link>
          )}

          {compareList.length > 0 && (
            <Link to="/so-sanh" className="icon-button compare-pill" aria-label={`So sánh (${compareList.length})`}>
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

      <div className="header-row2">
        <nav className={isMenuOpen ? 'nav nav-open' : 'nav'} aria-label="Điều hướng chính">
          <NavLink
            to="/"
            end
            onClick={() => setIsMenuOpen(false)}
            className={({ isActive }) => `kitty-nav-item${isActive ? ' active' : ''}`}
            data-kitty="home"
          >
            <span className="kitty-nav-frame">{navLabels.home}</span>
            <span className="kitty-nav-cat" aria-hidden="true" />
          </NavLink>
          <div className="nav-dropdown-wrapper" ref={catDropdownRef}>
            <NavLink
              to="/danh-muc"
              className={({ isActive }) => `nav-dropdown-trigger kitty-nav-item${isActive ? ' active' : ''}`}
              data-kitty="category"
              onMouseEnter={() => setCatDropdown(true)}
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
                setCatDropdown((v) => !v);
              }}
            >
              <span className="kitty-nav-frame">
                {navLabels.luxury} <ChevronDown size={14} aria-hidden />
              </span>
              <span className="kitty-nav-cat" aria-hidden="true" />
            </NavLink>
            {catDropdown && (
              <div className="nav-mega-menu">
                {HEADER_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                  <Link
                    key={cat.slug}
                    to={`/danh-muc/${cat.slug}`}
                    className="nav-mega-item"
                    onClick={() => { setIsMenuOpen(false); setCatDropdown(false); }}
                  >
                    <span className="nav-mega-icon"><Icon size={16} /></span>
                    <span className="nav-mega-body">
                      <strong>{cat.name}</strong>
                      <small>{cat.sub}</small>
                    </span>
                    <em>{cat.count}</em>
                  </Link>
                )})}
              </div>
            )}
          </div>
          <NavLink
            to="/flash-sale"
            onClick={() => setIsMenuOpen(false)}
            className={({ isActive }) => `kitty-nav-item${isActive ? ' active' : ''}`}
            data-kitty="promo"
          >
            <span className="kitty-nav-frame">{navLabels.deals}</span>
            <span className="kitty-nav-cat" aria-hidden="true" />
          </NavLink>
          <NavLink
            to="/blog"
            onClick={() => setIsMenuOpen(false)}
            className={({ isActive }) => `kitty-nav-item${isActive ? ' active' : ''}`}
            data-kitty="blog"
          >
            <span className="kitty-nav-frame">Blog</span>
            <span className="kitty-nav-cat" aria-hidden="true" />
          </NavLink>
          <NavLink
            to="/danh-gia"
            onClick={() => setIsMenuOpen(false)}
            className={({ isActive }) => `kitty-nav-item${isActive ? ' active' : ''}`}
            data-kitty="review"
          >
            <span className="kitty-nav-frame">{navLabels.reviews}</span>
            <span className="kitty-nav-cat" aria-hidden="true" />
          </NavLink>
          <NavLink
            to="/ho-tro"
            onClick={() => setIsMenuOpen(false)}
            className={({ isActive }) => `kitty-nav-item${isActive ? ' active' : ''}`}
            data-kitty="support"
          >
            <span className="kitty-nav-frame">{navLabels.concierge}</span>
            <span className="kitty-nav-cat" aria-hidden="true" />
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) => `kitty-nav-item${isActive ? ' active' : ''}`}
              data-kitty="admin"
            >
              <span className="kitty-nav-frame">{navLabels.admin}</span>
              <span className="kitty-nav-cat" aria-hidden="true" />
            </NavLink>
          )}
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
