import { memo, useState } from 'react';
import { LogIn, UserPlus, X } from 'lucide-react';
import { SignIn } from '@clerk/clerk-react';
import { useAuth } from '../context/AuthContext';
import { signInWithFacebookSDK, isFacebookConfigured } from '../lib/facebookAuth';
import SITE from '../config/site-config';


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
  const { isModalOpen, closeAuthModal, login, loginSocial, register, authMode } = useAuth();
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
