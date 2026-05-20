import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SITE from '../config/site-config';

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const hasClerk = !!clerkKey && clerkKey.startsWith('pk_');

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function SignInPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, login, loginWithGoogle, authLoading } = useAuth();
  const toast = useToast();
  const redirectTo = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    setSubmitting(true);
    try {
      await login({ email, password });
      toast.success('Đăng nhập thành công!');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        toast.success('Đăng nhập Google thành công!');
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập Google thất bại');
    } finally {
      setGoogleLoading(false);
    }
  };

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
            <div className="auth-fallback">
              <h2>Đăng nhập</h2>
              <p>Clerk authentication is configured. Please use the sign-in modal.</p>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <h2>Đăng nhập</h2>
              <p className="auth-form-subtitle">Nhập email và mật khẩu để đăng nhập vào tài khoản của bạn.</p>

              {error && <div className="auth-error">{error}</div>}

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || authLoading}
                className="google-signin-btn"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  border: '1px solid #dadce0',
                  borderRadius: '8px',
                  background: '#fff',
                  cursor: googleLoading ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#3c4043',
                  marginBottom: '16px',
                  opacity: googleLoading ? 0.7 : 1
                }}
              >
                <GoogleIcon />
                {googleLoading ? 'Đang kết nối Google...' : 'Đăng nhập với Google'}
              </button>

              <div className="auth-divider" style={{
                display: 'flex',
                alignItems: 'center',
                margin: '16px 0',
                color: '#666',
                fontSize: '13px'
              }}>
                <span style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></span>
                <span style={{ padding: '0 12px' }}>hoặc</span>
                <span style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></span>
              </div>

              <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Mật khẩu</label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={submitting || authLoading}
                style={{ width: '100%', marginTop: 8 }}
              >
                {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default SignInPage;
