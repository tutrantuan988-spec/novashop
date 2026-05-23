import { memo, useState } from 'react';
import { LogIn, UserPlus, X } from 'lucide-react';
import { SignIn } from '@clerk/clerk-react';
import { useAuth } from '../context/AuthContext';
import { signInWithFacebookSDK, isFacebookConfigured } from '../lib/facebookAuth';
import SITE from '../config/site-config';


function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function FacebookButton({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      const user = await signInWithFacebookSDK();
      onSuccess?.(user);
    } catch (err) {
      onError?.(err.message || 'Đăng nhập Facebook thất bại');
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      className="social-btn facebook-btn"
      onClick={handleClick}
      disabled={loading}
      aria-label="Đăng nhập bằng Facebook"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden>
        <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
      {loading ? 'Đang kết nối...' : 'Tiếp tục với Facebook'}
    </button>
  );
}

function AuthModal() {
  const { isModalOpen, closeAuthModal, login, loginSocial, loginWithGoogle, register, authMode } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  if (!isModalOpen) return null;

  if (authMode === 'clerk') {
    return (
      <div className="modal-overlay" role="dialog" aria-modal="true">
        <div className="modal" style={{ maxWidth: 420 }}>
          <button type="button" className="modal-close" onClick={closeAuthModal} aria-label="Đóng">
            <X size={20} />
          </button>
          <SignIn
            routing="hash"
            afterSignInUrl="/"
            signUpUrl="/"
            appearance={{
              elements: {
                card: { boxShadow: 'none', border: 'none' },
                headerTitle: { display: 'none' },
                headerSubtitle: { display: 'none' }
              }
            }}
          />
        </div>
      </div>
    );
  }

  const handleFbSuccess = (fbUser) => {
    if (loginSocial) loginSocial(fbUser);
    closeAuthModal();
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const userObj = await loginWithGoogle();
      if (userObj) {
        setSuccess('Đăng nhập Google thành công!');
        setTimeout(() => {
          closeAuthModal();
          setSuccess('');
        }, 600);
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.email || !form.password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    if (form.password.length < 6) {
      setError('Mật khẩu cần tối thiểu 6 ký tự');
      return;
    }
    if (mode === 'register' && form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
        setSuccess('Đăng nhập thành công');
      } else {
        await register({ name: form.name || form.email.split('@')[0], email: form.email, password: form.password });
        setSuccess('Đăng ký thành công');
      }
      setTimeout(() => {
        closeAuthModal();
        setForm({ name: '', email: '', password: '', confirm: '' });
        setSuccess('');
      }, 600);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="modal">
        <button type="button" className="modal-close" onClick={closeAuthModal} aria-label="Đóng">
          <X size={20} />
        </button>
        <header className="modal-header">
          <h2 id="auth-title">{mode === 'login' ? `Đăng nhập ${SITE.name}` : 'Tạo tài khoản mới'}</h2>
          <p>{mode === 'login' ? 'Chào mừng bạn quay lại! Mua sắm dễ dàng hơn khi có tài khoản.' : 'Mở tài khoản trong 1 phút và nhận ngay ưu đãi 10% cho đơn hàng đầu tiên.'}</p>
        </header>
        <form onSubmit={submit} className="auth-form" noValidate>
          {mode === 'register' && (
            <label>
              <span>Họ tên</span>
              <input name="name" value={form.name} onChange={onChange} placeholder="Nguyễn Văn A" autoComplete="name" />
            </label>
          )}
          <label>
            <span>Email</span>
            <input
              name="email"
              type="email"
              required
              value={form.email}
              onChange={onChange}
              placeholder="ban@email.com"
              autoComplete="email"
            />
          </label>
          <label>
            <span>Mật khẩu</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={onChange}
              placeholder="Tối thiểu 6 ký tự"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>
          {mode === 'register' && (
            <label>
              <span>Xác nhận mật khẩu</span>
              <input
                name="confirm"
                type="password"
                required
                minLength={6}
                value={form.confirm}
                onChange={onChange}
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
              />
            </label>
          )}

          {error && <div className="form-error" role="alert">{error}</div>}
          {success && <div className="form-success" role="status">{success}</div>}

          <button type="submit" className="primary-button submit-btn" disabled={loading}>
            {loading ? 'Đang xử lý...' : mode === 'login' ? (<><LogIn size={16} /> Đăng nhập</>) : (<><UserPlus size={16} /> Đăng ký</>)}
          </button>

          <div className="social-divider">
            <span>hoặc</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="google-signin-btn"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <GoogleIcon />
            {loading ? 'Đang kết nối...' : 'Tiếp tục với Google'}
          </button>
        </form>

        {isFacebookConfigured() && (
          <div className="social-divider">
            <span>hoặc</span>
          </div>
        )}
        {isFacebookConfigured() && (
          <FacebookButton
            onSuccess={handleFbSuccess}
            onError={(msg) => setError(msg)}
          />
        )}

        <footer className="modal-footer">
          {mode === 'login' ? (
            <p>Chưa có tài khoản?{' '}
              <button type="button" className="link-btn" onClick={() => { setMode('register'); setError(''); }}>Đăng ký ngay</button>
            </p>
          ) : (
            <p>Đã có tài khoản?{' '}
              <button type="button" className="link-btn" onClick={() => { setMode('login'); setError(''); }}>Đăng nhập</button>
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}

export default memo(AuthModal);
