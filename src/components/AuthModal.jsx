import { memo, useState } from 'react';
import { LogIn, UserPlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function AuthModal() {
  const { isModalOpen, closeAuthModal, login, register, authMode } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  if (authMode === 'clerk' || !isModalOpen) return null;

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
          <h2 id="auth-title">{mode === 'login' ? 'Đăng nhập NovaShop' : 'Tạo tài khoản mới'}</h2>
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
