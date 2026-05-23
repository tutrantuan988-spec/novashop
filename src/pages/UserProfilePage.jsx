import { memo, useEffect, useState } from 'react';
import { User, Mail, Phone, Lock, Save, Loader, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { updateProfileApi, changePasswordApi, getMeApi } from '../services/api';
import SITE from '../config/site-config';

function UserProfilePage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    document.title = `Thông tin cá nhân - ${SITE.name}`;
    getMeApi()
      .then((res) => {
        setForm({
          name: res.full_name || '',
          phone: res.phone || ''
        });
      })
      .catch(() => {
        setForm({
          name: user?.name || '',
          phone: ''
        });
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfileApi({ full_name: form.name, phone: form.phone });
      toast.success('Cập nhật thông tin thành công!');
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (passwords.new.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    setChangingPassword(true);
    try {
      await changePasswordApi(passwords.current, passwords.new);
      toast.success('Đổi mật khẩu thành công!');
      setPasswords({ current: '', new: '', confirm: '' });
      setShowPasswordSection(false);
    } catch (err) {
      toast.error(err.message || 'Đổi mật khẩu thất bại');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <section className="section" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <Loader size={32} style={{ opacity: 0.3, marginBottom: 12 }} className="spin" />
        <p>Đang tải...</p>
      </section>
    );
  }

  return (
    <section className="section" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="section-heading">
        <div>
          <span className="section-kicker"><User size={16} aria-hidden /> Tài khoản</span>
          <h1>Thông tin cá nhân</h1>
        </div>
      </div>

      {/* Profile form */}
      <form
        onSubmit={handleProfileSubmit}
        style={{
          background: 'var(--surface)',
          borderRadius: 16,
          padding: '32px',
          border: '1.5px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          marginBottom: 24
        }}
      >
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
            <User size={16} /> Họ tên
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              border: '1.5px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: 15,
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
            <Mail size={16} /> Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              border: '1.5px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--muted)',
              fontSize: 15,
              opacity: 0.6,
              cursor: 'not-allowed',
              boxSizing: 'border-box'
            }}
          />
          <small style={{ color: 'var(--muted)', fontSize: 12 }}>Email không thể thay đổi</small>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
            <Phone size={16} /> Số điện thoại
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="Nhập số điện thoại"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              border: '1.5px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: 15,
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          type="submit"
          className="primary-button"
          disabled={saving}
          style={{
            width: '100%',
            padding: '12px 24px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 15,
            fontWeight: 700,
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? <Loader size={18} className="spin" /> : <Save size={18} />}
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>

      {/* Password change */}
      {!showPasswordSection ? (
        <button
          type="button"
          onClick={() => setShowPasswordSection(true)}
          style={{
            width: '100%',
            padding: '16px 24px',
            borderRadius: 16,
            border: '1.5px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <Lock size={18} color="var(--muted)" />
          Đổi mật khẩu
        </button>
      ) : (
        <form
          onSubmit={handlePasswordSubmit}
          style={{
            background: 'var(--surface)',
            borderRadius: 16,
            padding: '32px',
            border: '1.5px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}
        >
          <h2 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={18} color="var(--accent)" /> Đổi mật khẩu
          </h2>

          {[
            { key: 'current', label: 'Mật khẩu hiện tại', placeholder: 'Nhập mật khẩu hiện tại' },
            { key: 'new', label: 'Mật khẩu mới', placeholder: 'Nhập mật khẩu mới (tối thiểu 6 ký tự)' },
            { key: 'confirm', label: 'Xác nhận mật khẩu mới', placeholder: 'Nhập lại mật khẩu mới' }
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                {label}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords[key] ? 'text' : 'password'}
                  value={passwords[key]}
                  onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 16px',
                    borderRadius: 10,
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: 15,
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((p) => ({ ...p, [key]: !p[key] }))}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    padding: 4
                  }}
                >
                  {showPasswords[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={() => {
                setShowPasswordSection(false);
                setPasswords({ current: '', new: '', confirm: '' });
              }}
              style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: 10,
                border: '1.5px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={changingPassword}
              style={{
                flex: 1,
                padding: '12px 24px',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 15,
                fontWeight: 700,
                opacity: changingPassword ? 0.7 : 1
              }}
            >
              {changingPassword ? <Loader size={18} className="spin" /> : <Lock size={18} />}
              {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default memo(UserProfilePage);
