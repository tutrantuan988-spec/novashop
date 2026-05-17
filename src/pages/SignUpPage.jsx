import { useEffect } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SignUp } from '@clerk/clerk-react';
import { useAuth } from '../context/AuthContext';
import SITE from '../config/site-config';

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const hasClerk = !!clerkKey && clerkKey.startsWith('pk_');

function SignUpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();
  const redirectTo = location.state?.from?.pathname || '/';

  useEffect(() => {
    document.title = `Đăng ký • ${SITE.name}`;
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
          <span className="section-kicker">{SITE.name} • Tạo tài khoản</span>
          <h1>Mở tài khoản trong vòng 30 giây</h1>
          <p>Đăng ký để nhận ưu đãi thành viên, miễn phí và bảo mật tuyệt đối.</p>
          <ul className="auth-page-benefits">
            <li>Tích điểm và đổi quà mỗi đơn hàng</li>
            <li>Đồng bộ giỏ hàng giữa các thiết bị</li>
            <li>Nhận voucher chào mừng dành cho thành viên mới</li>
          </ul>
          <p className="auth-page-cta">
            Đã có tài khoản? <Link to="/sign-in" state={location.state}>Đăng nhập tại đây</Link>
          </p>
          <p className="auth-page-cta">
            <Link to="/">← Quay lại trang chủ</Link>
          </p>
        </div>

        <div className="auth-page-box">
          {hasClerk ? (
            <SignUp
              path="/sign-up"
              routing="path"
              signInUrl="/sign-in"
              forceRedirectUrl={redirectTo}
              signUpFallbackRedirectUrl={redirectTo}
              appearance={{
                elements: {
                  rootBox: { width: '100%' },
                  card: { boxShadow: 'none', border: 'none', background: 'transparent' }
                }
              }}
            />
          ) : (
            <div className="auth-fallback">
              <h2>Đăng ký</h2>
              <p>Tạo tài khoản để mua sắm thuận tiện hơn.</p>
              <button type="button" className="primary-button" style={{ width: '100%', marginTop: 16 }} onClick={openAuthModal}>
                Đăng ký / Đăng nhập
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default SignUpPage;
