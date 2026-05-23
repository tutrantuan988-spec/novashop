import { lazy, memo, Suspense, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  RotateCcw, Package, BarChart3, ShoppingBag, Tag, ShieldCheck,
  RotateCw, Layers, Users, LayoutDashboard, Menu, X, TrendingUp,
  DollarSign, ShoppingCart, Package as PackageIcon
} from 'lucide-react';
import {
  clearAdminSessionToken,
  getAdminConfigApi,
  getAdminSessionToken,
  setAdminSessionToken,
  verifyAdminApi
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SITE from '../config/site-config';
import { useProducts } from '../context/ProductsContext';
import CouponManager from '../components/CouponManager';
import CategoryManager from '../components/admin/CategoryManager';
import ReturnsManager from '../components/admin/ReturnsManager';
import ProductImportManager from '../components/admin/ProductImportManager';
import { formatVND } from '../utils/format';

const ProductsTab = lazy(() => import('./admin/ProductsTab'));
const OrdersTab = lazy(() => import('./admin/OrdersTab'));
const AnalyticsTab = lazy(() => import('./admin/AnalyticsTab'));
const CustomersTab = lazy(() => import('./admin/CustomersTab'));

const navItems = [
  { key: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { key: 'products', label: 'Sản phẩm', icon: Package },
  { key: 'orders', label: 'Đơn hàng', icon: ShoppingBag },
  { key: 'customers', label: 'Khách hàng', icon: Users },
  { key: 'analytics', label: 'Thống kê', icon: BarChart3 },
  { key: 'coupons', label: 'Mã giảm giá', icon: Tag },
  { key: 'categories', label: 'Danh mục', icon: Layers },
  { key: 'returns', label: 'Đổi/trả', icon: RotateCw },
  { key: 'import', label: 'Import SP', icon: RotateCcw }
];

function StatsCards({ items }) {
  const totalRevenue = items.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);
  const lowStockCount = items.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 10).length;
  const outOfStockCount = items.filter((p) => (p.stock ?? 0) === 0).length;

  const cards = [
    {
      label: 'Tổng doanh thu',
      value: formatVND(totalRevenue),
      icon: DollarSign,
      color: 'stats-revenue',
      trend: '+12.5%'
    },
    {
      label: 'Đơn hàng',
      value: '0',
      icon: ShoppingCart,
      color: 'stats-orders',
      trend: '+3.2%'
    },
    {
      label: 'Sản phẩm',
      value: String(items.length),
      icon: PackageIcon,
      color: 'stats-products',
      trend: null
    },
    {
      label: 'Khách hàng',
      value: '0',
      icon: Users,
      color: 'stats-customers',
      trend: '+8.1%'
    }
  ];

  return (
    <div className="admin-stats-grid">
      {cards.map((card) => (
        <div key={card.key || card.label} className={`stat-card ${card.color}`}>
          <div className="stat-card-header">
            <span className="stat-card-label">{card.label}</span>
            <card.icon size={20} aria-hidden />
          </div>
          <div className="stat-card-value">{card.value}</div>
          {card.trend && (
            <div className="stat-card-trend">
              <TrendingUp size={14} aria-hidden />
              <span>{card.trend}</span>
            </div>
          )}
        </div>
      ))}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="admin-stock-alerts">
          {lowStockCount > 0 && (
            <div className="stock-alert warning">
              <span>{lowStockCount} sản phẩm sắp hết hàng</span>
            </div>
          )}
          {outOfStockCount > 0 && (
            <div className="stock-alert danger">
              <span>{outOfStockCount} sản phẩm hết hàng</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminPage() {
  const { user, isAdmin } = useAuth();
  const { items, resetProducts } = useProducts();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('products');
  const [tokenRequired, setTokenRequired] = useState(false);
  const [adminVerified, setAdminVerified] = useState(false);
  const [adminTokenInput, setAdminTokenInput] = useState('');
  const [verifyingAdmin, setVerifyingAdmin] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = `Quản trị ${SITE.name}`;
  }, []);

  useEffect(() => {
    if (!user?.email || !isAdmin) {
      setVerifyingAdmin(false);
      return;
    }

    let cancelled = false;
    setVerifyingAdmin(true);
    getAdminConfigApi()
      .then(async (config) => {
        if (cancelled) return;
        setTokenRequired(!!config.tokenRequired);
        if (!config.tokenRequired) {
          setAdminVerified(true);
          return;
        }
        const savedToken = getAdminSessionToken();
        if (!savedToken) {
          setAdminVerified(false);
          return;
        }
        await verifyAdminApi(user.email, savedToken);
        if (!cancelled) setAdminVerified(true);
      })
      .catch(() => {
        clearAdminSessionToken();
        if (!cancelled) {
          setTokenRequired(true);
          setAdminVerified(false);
        }
      })
      .finally(() => {
        if (!cancelled) setVerifyingAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.email, isAdmin]);

  const handleAdminTokenSubmit = async (event) => {
    event.preventDefault();
    const token = adminTokenInput.trim();
    if (!token) {
      toast.error('Vui lòng nhập admin secret');
      return;
    }
    try {
      setVerifyingAdmin(true);
      await verifyAdminApi(user.email, token);
      setAdminSessionToken(token);
      setAdminVerified(true);
      setAdminTokenInput('');
      toast.success('Xác thực admin thành công');
    } catch (err) {
      clearAdminSessionToken();
      setAdminVerified(false);
      toast.error(err.message || 'Admin secret không hợp lệ');
    } finally {
      setVerifyingAdmin(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) {
    return (
      <section className="section admin-denied">
        <h1>Bạn không có quyền truy cập</h1>
        <p>Trang này chỉ dành cho tài khoản quản trị viên. Liên hệ admin để được cấp quyền.</p>
        <Link to="/" className="primary-button">Về trang chủ</Link>
      </section>
    );
  }

  if (verifyingAdmin) {
    return (
      <section className="section admin-denied">
        <h1>Đang xác thực quyền quản trị...</h1>
        <p>Vui lòng chờ trong giây lát.</p>
      </section>
    );
  }

  if (tokenRequired && !adminVerified) {
    return (
      <section className="section admin-denied admin-token-gate">
        <div className="card-box">
          <ShieldCheck size={44} aria-hidden />
          <h1>Xác thực admin API</h1>
          <p>Nhập admin secret để mở bảng quản trị. Secret chỉ lưu trong session hiện tại và không được build vào frontend.</p>
          <form onSubmit={handleAdminTokenSubmit}>
            <input
              type="password"
              value={adminTokenInput}
              onChange={(event) => setAdminTokenInput(event.target.value)}
              placeholder="Admin secret"
              autoComplete="current-password"
              aria-label="Admin secret"
            />
            <button type="submit" className="primary-button">Xác thực</button>
          </form>
        </div>
      </section>
    );
  }

  const tabTitle = {
    orders: 'Quản lý đơn hàng',
    coupons: 'Mã giảm giá',
    customers: 'Khách hàng',
    dashboard: 'Tổng quan',
    analytics: 'Thống kê & Phân tích',
    categories: 'Quản lý danh mục',
    returns: 'Quản lý đổi/trả',
    import: 'Nhập sản phẩm',
    products: 'Quản lý sản phẩm'
  };

  const tabDescription = {
    orders: 'Theo dõi và xử lý đơn hàng',
    products: `Tổng sản phẩm: ${items.length}`,
    dashboard: 'Tổng quan cửa hàng',
    customers: 'Quản lý thông tin khách hàng',
    coupons: 'Tạo và quản lý mã giảm giá',
    categories: 'Phân loại sản phẩm',
    returns: 'Xử lý yêu cầu đổi trả',
    import: 'Nhập hàng loạt sản phẩm',
    analytics: 'Phân tích doanh thu và hiệu suất'
  };

  return (
    <section className="section admin-layout" aria-labelledby="admin-title">
      <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <span className="logo-icon">
              <PackageIcon size={20} />
            </span>
            <strong>{SITE.name}</strong>
          </Link>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                className={`sidebar-link ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => handleTabChange(item.key)}
              >
                <Icon size={18} aria-hidden />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở menu"
            >
              <Menu size={22} />
            </button>
            <div>
              <span className="section-kicker">Khu vực quản trị</span>
              <h1 id="admin-title">{tabTitle[activeTab] || 'Quản lý sản phẩm'}</h1>
              <p>{tabDescription[activeTab] || ''}</p>
            </div>
          </div>
          <div className="topbar-right">
            {activeTab === 'products' && (
              <button type="button" className="secondary-button" onClick={resetProducts}>
                <RotateCcw size={16} aria-hidden /> Tải lại dữ liệu
              </button>
            )}
          </div>
        </header>

        {activeTab === 'dashboard' && <StatsCards items={items} />}

        <Suspense fallback={<div className="card-box"><p className="empty-result">Đang tải...</p></div>}>
          {activeTab === 'dashboard' && <AnalyticsTab />}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'customers' && <CustomersTab />}
          {activeTab === 'coupons' && <CouponManager adminEmail={user?.email} />}
          {activeTab === 'categories' && <CategoryManager adminEmail={user?.email} />}
          {activeTab === 'returns' && <ReturnsManager adminEmail={user?.email} />}
          {activeTab === 'import' && <ProductImportManager adminEmail={user?.email} />}
        </Suspense>
      </main>
    </section>
  );
}

export default memo(AdminPage);
