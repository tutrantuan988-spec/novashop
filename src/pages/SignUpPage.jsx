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

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function validateName(name) {
  if (!name) return 'Vui lòng nhập họ và tên';
  if (name.trim().length < 2) return 'Tên phải có ít nhất 2 ký tự';
  return '';
}

function validateEmail(email) {
  if (!email) return 'Vui lòng nhập email';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ';
  return '';
}

function validatePassword(password) {
  if (!password) return 'Vui lòng nhập mật khẩu';
  if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
  return '';
}

function SignUpPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, register, loginWithGoogle, authLoading } = useAuth();
  const toast = useToast();
  const redirectTo = location.state?.from?.pathname || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });

  const nameError = touched.name ? validateName(name) : '';
  const emailError = touched.email ? validateEmail(email) : '';
  const passwordError = touched.password ? validatePassword(password) : '';
  const confirmError = touched.confirmPassword
    ? confirmPassword !== password
      ? 'Mật khẩu xác nhận không khớp'
      : !confirmPassword
        ? 'Vui lòng xác nhận mật khẩu'
        : ''
    : '';

  const passwordStrength = password.length === 0 ? 0
    : password.length < 6 ? 1
      : password.length < 10 ? 2
        : 3;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    if (validateName(name) || validateEmail(email) || validatePassword(password) || confirmPassword !== password) return;

    setSubmitting(true);
    try {
      await register({ name, email, password });
      toast.success('Đăng ký thành công!');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
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
        toast.success('Đăng ký Google thành công!');
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Đăng ký Google thất bại');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <section className="section auth-page">
      <div className="auth-page-card">
        <div className="auth-page-intro">
          <span className="section-kicker">{SITE.name} • Tạo tài khoản</span>
          <h1>Mở tài khoản trong vòng 30 giây</h1>
          <p>Đăng ký để nhận ưu đãi thành viên, miễn phí vận chuyển và bảo mật tuyệt đối.</p>
          <ul className="auth-page-benefits">
            <li>Tích điểm và đổi quà mỗi đơn hàng</li>
            <li>Đồng bộ giỏ hàng giữa các thiết bị</li>
            <li>Nhận voucher chào mừng dành cho thành viên mới</li>
          </ul>
          <div className="auth-social-proof">
            <div className="auth-avatars">
              <span className="auth-avatar">🎀</span>
              <span className="auth-avatar">�</span>
              <span className="auth-avatar">✨</span>
              <span className="auth-avatar">🌟</span>
              <span className="auth-avatar">⭐</span>
            </div>
            <p className="auth-proof-text">
              <strong>10,000+</strong> khách hàng tin tưởng
            </p>
          </div>
          <p className="auth-page-cta">
            Đã có tài khoản? <Link to="/sign-in" state={location.state}>Đăng nhập tại đây</Link>
          </p>
          <p className="auth-page-cta">
            <Link to="/">← Quay lại trang chủ</Link>
          </p>
        </div>

        <div className="auth-page-box">
          {hasClerk ? (
            <div className="auth-fallback">
              <h2>Đăng ký</h2>
              <p>Clerk authentication is configured. Please use the sign-up modal.</p>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <h2>Tạo tài khoản</h2>
              <p className="auth-form-subtitle">Điền thông tin bên dưới để tạo tài khoản mới.</p>

              {error && <div className="auth-error">{error}</div>}

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || authLoading}
                className="google-signin-btn"
              >
                <GoogleIcon />
                {googleLoading ? 'Đang kết nối Google...' : 'Đăng ký với Google'}
              </button>

              <div className="auth-divider">
                <span className="auth-divider-line" />
                <span className="auth-divider-text">hoặc</span>
                <span className="auth-divider-line" />
              </div>

              <div className={`form-group ${nameError ? 'form-group-error' : name ? 'form-group-valid' : ''}`}>
                <label htmlFor="reg-name">Họ và tên</label>
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                  placeholder="Nguyễn Văn A"
                  autoComplete="name"
                />
                {nameError && <span className="field-error">{nameError}</span>}
              </div>

              <div className={`form-group ${emailError ? 'form-group-error' : email ? 'form-group-valid' : ''}`}>
                <label htmlFor="reg-email">Email</label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                  placeholder="your@email.com"
                  autoComplete="email"
                />
                {emailError && <span className="field-error">{emailError}</span>}
              </div>

              <div className={`form-group ${passwordError ? 'form-group-error' : ''}`}>
                <label htmlFor="reg-password">Mật khẩu</label>
                <div className="password-input-wrapper">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                    placeholder="••••••••"
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {passwordError && <span className="field-error">{passwordError}</span>}
                {password && (
                  <div className="password-strength">
                    <div className="password-strength-bar">
                      <div className={`password-strength-fill strength-${passwordStrength}`} />
                    </div>
                    <span className={`password-strength-label strength-${passwordStrength}`}>
                      {passwordStrength === 1 ? 'Yếu' : passwordStrength === 2 ? 'Trung bình' : 'Mạnh'}
                    </span>
                  </div>
                )}
              </div>

              <div className={`form-group ${confirmError ? 'form-group-error' : confirmPassword && !confirmError ? 'form-group-valid' : ''}`}>
                <label htmlFor="reg-confirm">Xác nhận mật khẩu</label>
                <div className="password-input-wrapper">
                  <input
                    id="reg-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
                    placeholder="••••••••"
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {confirmError && <span className="field-error">{confirmError}</span>}
              </div>

              <button
                type="submit"
                className="primary-button auth-submit-btn"
                disabled={submitting || authLoading}
              >
                {submitting ? (
                  <span className="auth-loading">
                    <span className="spinner" />
                    Đang đăng ký...
                  </span>
                ) : 'Đăng ký'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default SignUpPage;
