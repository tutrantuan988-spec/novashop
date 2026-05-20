import { lazy, memo, Suspense, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { RotateCcw, Package, BarChart3, ShoppingBag, Tag, ShieldCheck, RotateCw, Layers } from 'lucide-react';
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

const ProductsTab = lazy(() => import('./admin/ProductsTab'));
const OrdersTab = lazy(() => import('./admin/OrdersTab'));
const AnalyticsTab = lazy(() => import('./admin/AnalyticsTab'));

function AdminPage() {
  const { user, isAdmin } = useAuth();
  const { items, resetProducts } = useProducts();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('products');
  const [tokenRequired, setTokenRequired] = useState(false);
  const [adminVerified, setAdminVerified] = useState(false);
  const [adminTokenInput, setAdminTokenInput] = useState('');
  const [verifyingAdmin, setVerifyingAdmin] = useState(true);

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

  return (
    <section className="section admin" aria-labelledby="admin-title">
      <div className="admin-header">
        <div>
          <span className="section-kicker">Khu vực quản trị</span>
          <h1 id="admin-title">
            {activeTab === 'orders' ? 'Quản lý đơn hàng'
              : activeTab === 'coupons' ? 'Mã giảm giá'
              : activeTab === 'dashboard' ? 'Tổng quan'
              : 'Quản lý sản phẩm'}
          </h1>
          <p>
            {activeTab === 'orders'
              ? `Đơn hàng`
              : activeTab === 'products'
              ? `Tổng sản phẩm: ${items.length}`
              : ''}
          </p>
        </div>
        {activeTab === 'products' && (
          <button type="button" className="secondary-button" onClick={resetProducts}>
            <RotateCcw size={16} aria-hidden /> Tải lại dữ liệu
          </button>
        )}
      </div>

      <div className="admin-tabs">
        <button
          type="button"
          className={activeTab === 'dashboard' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('dashboard')}
        >
          <BarChart3 size={16} aria-hidden /> Tổng quan
        </button>
        <button
          type="button"
          className={activeTab === 'products' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('products')}
        >
          <Package size={16} aria-hidden /> Sản phẩm
        </button>
        <button
          type="button"
          className={activeTab === 'orders' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingBag size={16} aria-hidden /> Đơn hàng
        </button>
        <button
          type="button"
          className={activeTab === 'coupons' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('coupons')}
        >
          <Tag size={16} aria-hidden /> Mã giảm giá
        </button>
        <button
          type="button"
          className={activeTab === 'categories' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('categories')}
        >
          <Layers size={16} aria-hidden /> Danh mục
        </button>
        <button
          type="button"
          className={activeTab === 'returns' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('returns')}
        >
          <RotateCw size={16} aria-hidden /> Đổi/trả
        </button>
        <button
          type="button"
          className={activeTab === 'import' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('import')}
        >
          <Package size={16} aria-hidden /> Import SP
        </button>
      </div>

      <Suspense fallback={<div className="card-box"><p className="empty-result">Đang tải...</p></div>}>
        {activeTab === 'dashboard' && <AnalyticsTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'coupons' && <CouponManager adminEmail={user?.email} />}
        {activeTab === 'categories' && <CategoryManager adminEmail={user?.email} />}
        {activeTab === 'returns' && <ReturnsManager adminEmail={user?.email} />}
        {activeTab === 'import' && <ProductImportManager adminEmail={user?.email} />}
      </Suspense>
    </section>
  );
}

export default memo(AdminPage);
