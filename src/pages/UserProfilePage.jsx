import { memo, useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Save, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getProfile, updateProfile } from '../services/apiMongo';
import SITE from '../config/site-config';

function UserProfilePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = `Tài khoản - ${SITE.name}`;
    getProfile()
      .then((res) => {
        const u = res.data || {};
        setForm({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          address: u.addresses?.[0]?.address || ''
        });
      })
      .catch(() => {
        // fallback from Clerk
        setForm({
          name: user?.fullName || '',
          email: user?.primaryEmailAddress?.emailAddress || '',
          phone: '',
          address: ''
        });
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name: form.name, phone: form.phone });
      toast.success('Cập nhật thông tin thành công!');
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
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
    <section className="section" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="section-heading">
        <div>
          <span className="section-kicker"><User size={16} aria-hidden /> Tài khoản</span>
          <h1>Thông tin cá nhân</h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
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
              fontSize: 15
            }}
          />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
            <Mail size={16} /> Email
          </label>
          <input
            type="email"
            value={form.email}
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
              cursor: 'not-allowed'
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
              fontSize: 15
            }}
          />
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
            <MapPin size={16} /> Địa chỉ mặc định
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="Nhập địa chỉ giao hàng"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              border: '1.5px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: 15
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
    </section>
  );
}

export default memo(UserProfilePage);
