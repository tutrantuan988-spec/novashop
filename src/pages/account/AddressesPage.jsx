import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Plus, Star, Trash2, Edit3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  listAddressesApi,
  createAddressApi,
  updateAddressApi,
  deleteAddressApi,
  setDefaultAddressApi
} from '../../services/api';
import { getProvinces, getDistricts, getWards } from '../../data/vnProvinces';

const emptyAddress = {
  label: 'Nhà',
  recipientName: '',
  phone: '',
  province: '',
  district: '',
  ward: '',
  street: '',
  isDefault: false
};

function AddressesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | id
  const [form, setForm] = useState(emptyAddress);

  const provinces = useMemo(() => getProvinces(), []);
  const districts = useMemo(() => getDistricts(form.province), [form.province]);
  const wards = useMemo(() => getWards(form.province, form.district), [form.province, form.district]);

  const refresh = useCallback(async () => {
    if (!user?.id && !user?.email) return;
    setLoading(true);
    try {
      const list = await listAddressesApi(user.id || user.email);
      setAddresses(list);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleEdit = (addr) => {
    setEditing(addr.id);
    setForm({ ...emptyAddress, ...addr });
  };

  const handleNew = () => {
    setEditing('new');
    setForm({ ...emptyAddress });
  };

  const handleCancel = () => {
    setEditing(null);
    setForm(emptyAddress);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id && !user?.email) {
      toast.error('Vui lòng đăng nhập');
      return;
    }
    try {
      const payload = { ...form, userId: user.id || user.email };
      if (editing === 'new') {
        await createAddressApi(payload);
        toast.success('Đã thêm địa chỉ');
      } else {
        await updateAddressApi(editing, payload);
        toast.success('Đã cập nhật');
      }
      setEditing(null);
      setForm(emptyAddress);
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa địa chỉ này?')) return;
    try {
      await deleteAddressApi(id, user.id || user.email);
      toast.success('Đã xóa');
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddressApi(id, user.id || user.email);
      toast.success('Đã đặt làm mặc định');
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!user) {
    return (
      <section className="section" style={{ maxWidth: 600, margin: '40px auto' }}>
        <p>Vui lòng đăng nhập để quản lý địa chỉ.</p>
      </section>
    );
  }

  return (
    <section className="section" style={{ maxWidth: 800, margin: '40px auto' }}>
      <Link to="/tai-khoan" className="back-link"><ArrowLeft size={16} /> Tài khoản</Link>
      <h1>Sổ địa chỉ</h1>

      {loading && <p>Đang tải...</p>}

      {!loading && addresses.length === 0 && editing !== 'new' && (
        <div className="card-box" style={{ textAlign: 'center', padding: 40 }}>
          <MapPin size={40} style={{ opacity: 0.4 }} />
          <p>Chưa có địa chỉ nào</p>
          <button type="button" className="primary-button" onClick={handleNew}>
            <Plus size={16} /> Thêm địa chỉ
          </button>
        </div>
      )}

      {!loading && addresses.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 16, marginBottom: 24 }}>
          {addresses.map((a) => (
            <li key={a.id} className="card-box" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <MapPin size={20} style={{ marginTop: 4, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <strong>{a.label}</strong>
                  {a.isDefault && (
                    <span style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                      Mặc định
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontWeight: 700 }}>{a.recipientName} - {a.phone}</p>
                <p style={{ margin: '4px 0', color: 'var(--muted)', fontSize: 13 }}>
                  {a.street}, {a.ward}, {a.district}, {a.province}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {!a.isDefault && (
                  <button type="button" onClick={() => handleSetDefault(a.id)} title="Đặt mặc định" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Star size={16} />
                  </button>
                )}
                <button type="button" onClick={() => handleEdit(a)} title="Sửa" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Edit3 size={16} />
                </button>
                <button type="button" onClick={() => handleDelete(a.id)} title="Xóa" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!editing && addresses.length > 0 && (
        <button type="button" className="primary-button" onClick={handleNew}>
          <Plus size={16} /> Thêm địa chỉ mới
        </button>
      )}

      {editing && (
        <form onSubmit={handleSubmit} className="card-box" style={{ marginTop: 24 }}>
          <h2 style={{ marginTop: 0 }}>{editing === 'new' ? 'Thêm địa chỉ' : 'Sửa địa chỉ'}</h2>

          <div style={{ display: 'grid', gap: 12 }}>
            <label>
              <span>Nhãn</span>
              <select value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} style={{ width: '100%', padding: 10 }}>
                <option value="Nhà">Nhà</option>
                <option value="Văn phòng">Văn phòng</option>
                <option value="Khác">Khác</option>
              </select>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label>
                <span>Họ tên người nhận *</span>
                <input value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} required style={{ width: '100%', padding: 10 }} />
              </label>
              <label>
                <span>Số điện thoại *</span>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required pattern="0\d{9}" placeholder="0901234567" style={{ width: '100%', padding: 10 }} />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <label>
                <span>Tỉnh / TP *</span>
                <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value, district: '', ward: '' })} required style={{ width: '100%', padding: 10 }}>
                  <option value="">--Chọn--</option>
                  {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                </select>
              </label>
              <label>
                <span>Quận / Huyện *</span>
                <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value, ward: '' })} required disabled={!form.province} style={{ width: '100%', padding: 10 }}>
                  <option value="">--Chọn--</option>
                  {districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
                </select>
              </label>
              <label>
                <span>Phường / Xã *</span>
                <select value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} required disabled={!form.district} style={{ width: '100%', padding: 10 }}>
                  <option value="">--Chọn--</option>
                  {wards.map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
                </select>
              </label>
            </div>

            <label>
              <span>Số nhà, tên đường *</span>
              <input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required style={{ width: '100%', padding: 10 }} />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
              <span>Đặt làm địa chỉ mặc định</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button type="submit" className="primary-button">Lưu</button>
            <button type="button" onClick={handleCancel} className="secondary-button">Hủy</button>
          </div>
        </form>
      )}
    </section>
  );
}

export default AddressesPage;
