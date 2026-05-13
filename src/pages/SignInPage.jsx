import { useEffect } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import { useAuth } from '../context/AuthContext';
import SITE from '../config/site-config';

const hasClerk = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function SignInPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal, authMode } = useAuth();
  const redirectTo = location.state?.from?.pathname || '/';

  useEffect(() => {
    document.title = `Đăng nhập • ${SITE.name}`;
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <section className="section auth-page">
      <div className="auth-page-card">
        <div className="auth-page-intro">
          <span className="section-kicker">{SITE.name} • Đăng nhập</span>
          <h1>Đăng nhập để tiếp tục mua sắm</h1>
          <p>
            Quản lý đơn hàng, danh sách yêu thích và tích điểm thành viên chỉ trong vài giây.
          </p>
          <ul className="auth-page-benefits">
            <li>Theo dõi đơn hàng & lịch sử mua sắm</li>
            <li>Lưu địa chỉ giao hàng và phương thức thanh toán</li>
            <li>Ưu đãi VIP, mã giảm giá riêng tài khoản</li>
          </ul>
          <p className="auth-page-cta">
            Chưa có tài khoản? <Link to="/sign-up" state={location.state}>Tạo tài khoản mới</Link>
          </p>
          <p className="auth-page-cta">
            <Link to="/">← Quay lại trang chủ</Link>
          </p>
        </div>

        <div className="auth-page-box">
          {hasClerk ? (
            <SignIn
              path="/sign-in"
              routing="path"
              signUpUrl="/sign-up"
              forceRedirectUrl={redirectTo}
              signInFallbackRedirectUrl={redirectTo}
              appearance={{
                elements: {
                  rootBox: { width: '100%' },
                  card: { boxShadow: 'none', border: 'none', background: 'transparent' }
                }
              }}
            />
          ) : (
            <div className="auth-fallback">
              <h2>Đăng nhập</h2>
              <p>Hệ thống đang dùng đăng nhập nội bộ. Vui lòng dùng nút bên dưới.</p>
              {authMode === 'local' ? (
                <button type="button" className="primary-button" onClick={openAuthModal}>
                  Mở form đăng nhập
                </button>
              ) : (
                <p className="auth-warning">
                  Chưa cấu hình <code>VITE_CLERK_PUBLISHABLE_KEY</code>. Liên hệ quản trị viên.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default SignInPage;
