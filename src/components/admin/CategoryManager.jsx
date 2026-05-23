import { memo, useEffect, useState, useCallback } from 'react';
import { Plus, Edit3, Trash2, Check, X, Layers, Loader, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { fetchCategoryTree, invalidateCategoryCache } from '../../services/apiV2';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
const ADMIN_TOKEN = 'dev-admin-token-2026';

function CategoryManager({ adminEmail }) {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name_vi: '', slug: '', description_vi: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name_vi: '', slug: '', description_vi: '', image_url: '' });

  const loadCategories = useCallback(() => {
    setLoading(true);
    invalidateCategoryCache();
    fetchCategoryTree()
      .then((tree) => {
        setCategories(Array.isArray(tree) ? tree : []);
      })
      .catch(() => {
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditForm({ name_vi: cat.name_vi || cat.name || '', slug: cat.slug, description_vi: cat.description_vi || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name_vi: '', slug: '', description_vi: '' });
  };

  const saveEdit = async (id) => {
    if (!editForm.name_vi.trim()) {
      toast.error('Tên danh mục không được để trống');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v2/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': adminEmail, 'Authorization': `Bearer ${ADMIN_TOKEN}` },
        body: JSON.stringify({ name_vi: editForm.name_vi, slug: editForm.slug, description_vi: editForm.description_vi })
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Đã cập nhật danh mục');
      cancelEdit();
      loadCategories();
    } catch (err) {
      toast.error('Lỗi cập nhật: ' + err.message);
    }
  };

  const toggleActive = async (cat) => {
    try {
      const res = await fetch(`${API_BASE}/api/v2/admin/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': adminEmail, 'Authorization': `Bearer ${ADMIN_TOKEN}` },
        body: JSON.stringify({ is_active: !cat.is_active })
      });
      if (!res.ok) throw new Error('Toggle failed');
      toast.success(cat.is_active ? 'Đã tắt danh mục' : 'Đã kích hoạt danh mục');
      loadCategories();
    } catch (err) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.name_vi.trim() || !createForm.slug.trim()) {
      toast.error('Tên và slug không được để trống');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v2/admin/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': adminEmail, 'Authorization': `Bearer ${ADMIN_TOKEN}` },
        body: JSON.stringify({
          name_vi: createForm.name_vi,
          slug: createForm.slug,
          description_vi: createForm.description_vi,
          image_url: createForm.image_url,
          is_active: true,
          show_in_menu: true
        })
      });
      if (!res.ok) throw new Error('Create failed');
      toast.success('Đã tạo danh mục mới');
      setShowCreate(false);
      setCreateForm({ name_vi: '', slug: '', description_vi: '', image_url: '' });
      loadCategories();
    } catch (err) {
      toast.error('Lỗi tạo: ' + err.message);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Xoá danh mục này?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/v2/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-email': adminEmail, 'Authorization': `Bearer ${ADMIN_TOKEN}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Đã xoá danh mục');
      loadCategories();
    } catch (err) {
      toast.error('Lỗi xoá: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="card-box" style={{ textAlign: 'center', padding: 40 }}>
        <Loader size={24} className="spin" style={{ opacity: 0.3 }} />
      </div>
    );
  }

  return (
    <div className="card-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Layers size={20} />
          <h3 style={{ margin: 0 }}>Quản lý danh mục / ngành hàng</h3>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="secondary-button" onClick={loadCategories} style={{ padding: '8px 12px' }}>
            <RefreshCw size={16} />
          </button>
          <button type="button" className="primary-button" onClick={() => setShowCreate(!showCreate)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Thêm danh mục
          </button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ background: 'var(--bg)', borderRadius: 12, padding: 20, marginBottom: 20, display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
          <input
            value={createForm.name_vi}
            onChange={(e) => setCreateForm({ ...createForm, name_vi: e.target.value })}
            placeholder="Tên danh mục (VD: Thời trang)"
            style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
          <input
            value={createForm.slug}
            onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
            placeholder="Slug (VD: thoi-trang)"
            style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
          <input
            value={createForm.description_vi}
            onChange={(e) => setCreateForm({ ...createForm, description_vi: e.target.value })}
            placeholder="Mô tả ngắn"
            style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', gridColumn: 'span 2' }}
          />
          <input
            value={createForm.image_url}
            onChange={(e) => setCreateForm({ ...createForm, image_url: e.target.value })}
            placeholder="URL hình ảnh (tuỳ chọn)"
            style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', gridColumn: 'span 2' }}
          />
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>Huỷ</button>
            <button type="submit" className="primary-button">Tạo danh mục</button>
          </div>
        </form>
      )}

      {categories.length === 0 ? (
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Chưa có danh mục nào. Tạo danh mục đầu tiên để bắt đầu.</p>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 10,
                background: 'var(--bg)',
                border: '1.5px solid var(--border)',
                gap: 12
              }}
            >
              {editingId === cat.id ? (
                <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    value={editForm.name_vi}
                    onChange={(e) => setEditForm({ ...editForm, name_vi: e.target.value })}
                    style={{ flex: 1, minWidth: 140, padding: '6px 10px', borderRadius: 6, border: '1.5px solid var(--accent)', background: 'var(--surface)', color: 'var(--text)' }}
                  />
                  <input
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                    style={{ flex: 1, minWidth: 120, padding: '6px 10px', borderRadius: 6, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  />
                  <input
                    value={editForm.description_vi}
                    onChange={(e) => setEditForm({ ...editForm, description_vi: e.target.value })}
                    placeholder="Mô tả"
                    style={{ flex: 2, minWidth: 200, padding: '6px 10px', borderRadius: 6, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  />
                  <button type="button" onClick={() => saveEdit(cat.id)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
                    <Check size={16} />
                  </button>
                  <button type="button" onClick={cancelEdit} style={{ background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', color: 'var(--muted)' }}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong>{cat.name_vi || cat.name}</strong>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      /{cat.slug} {cat.is_active === false && <span style={{ color: '#ef4444' }}>(tắt)</span>}
                    </span>
                  </div>
                  {cat.description_vi && (
                    <span style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cat.description_vi}
                    </span>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => toggleActive(cat)} style={{ background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: cat.is_active === false ? '#22c55e' : '#f59e0b', fontSize: 12, fontWeight: 600 }}>
                  {cat.is_active === false ? 'Bật' : 'Tắt'}
                </button>
                {editingId !== cat.id && (
                  <>
                    <button type="button" onClick={() => startEdit(cat)} style={{ background: 'transparent', border: '1.5px solid var(--border)', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: 'var(--muted)' }}>
                      <Edit3 size={14} />
                    </button>
                    <button type="button" onClick={() => deleteCategory(cat.id)} style={{ background: 'transparent', border: '1.5px solid #ef4444', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: '#ef4444' }}>
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(CategoryManager);