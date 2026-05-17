import { memo, useMemo, useState } from 'react';
import { Edit3, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useProducts } from '../../context/ProductsContext';
import SITE from '../../config/site-config';
import { categories } from '../../data/products';
import { formatVND } from '../../utils/format';
import { uploadProductImage } from '../../services/upload';

const LOW_STOCK_THRESHOLD = 10;

const emptyForm = {
  name: '',
  category: 'Thức ăn cho chó',
  price: '',
  oldPrice: '',
  stock: '',
  badge: '',
  image: '',
  description: ''
};

function ProductsTab() {
  const { items, addProduct, updateProduct, removeProduct, resetProducts } = useProducts();
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('Tất cả');
  const [query, setQuery] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      const matchCategory = filter === 'Tất cả' || p.category === filter;
      const matchQuery = p.name.toLowerCase().includes(query.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [items, filter, query]);

  const onChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const onImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const url = await uploadProductImage(file);
      setForm((current) => ({ ...current, image: url }));
      toast.success('Upload ảnh thành công');
    } catch (err) {
      toast.error('Upload ảnh thất bại: ' + err.message);
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      category: form.category,
      price: Number(form.price) || 0,
      oldPrice: Number(form.oldPrice) || 0,
      originalPrice: Number(form.oldPrice) || 0,
      stock: Number(form.stock) || 0,
      badge: form.badge || 'Mới',
      image: form.image || 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=900&q=80',
      description: form.description || `Sản phẩm mới của ${SITE.name}.`
    };
    try {
      if (editingId) {
        await updateProduct(editingId, payload);
        setEditingId(null);
        toast.success('Đã cập nhật sản phẩm');
      } else {
        await addProduct(payload);
        toast.success('Đã thêm sản phẩm');
      }
      setForm(emptyForm);
    } catch (err) {
      toast.error(err.message || 'Không lưu được sản phẩm');
    }
  };

  const onEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      oldPrice: String(product.oldPrice || product.originalPrice || ''),
      stock: String(product.stock || 0),
      badge: product.badge || '',
      image: product.image,
      description: product.description || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      removeProduct(id)
        .then(() => {
          toast.success('Đã xóa sản phẩm');
          if (editingId === id) {
            setEditingId(null);
            setForm(emptyForm);
          }
        })
        .catch((err) => toast.error(err.message || 'Không xóa được sản phẩm'));
    }
  };

  return (
    <div className="admin-grid">
      <form className="card-box admin-form" onSubmit={onSubmit}>
        <h2>{editingId ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h2>
        <div className="form-grid">
          <label className="full">
            <span>Tên sản phẩm *</span>
            <input name="name" required value={form.name} onChange={onChange} />
          </label>
          <label>
            <span>Danh mục</span>
            <select name="category" value={form.category} onChange={onChange}>
              {categories.filter((c) => c !== 'Tất cả').map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>
            <span>Badge</span>
            <input name="badge" value={form.badge} onChange={onChange} placeholder="Mới, Hot, Sale..." />
          </label>
          <label>
            <span>Giá bán (VND) *</span>
            <input name="price" type="number" min="0" required value={form.price} onChange={onChange} />
          </label>
          <label>
            <span>Giá cũ (VND)</span>
            <input name="oldPrice" type="number" min="0" value={form.oldPrice} onChange={onChange} />
          </label>
          <label>
            <span>Tồn kho</span>
            <input name="stock" type="number" min="0" value={form.stock} onChange={onChange} />
          </label>
          <label className="full">
            <span>Hình ảnh</span>
            <div className="file-input-row">
              <input
                type="text"
                name="image"
                value={form.image}
                onChange={onChange}
                placeholder="URL hình ảnh"
              />
              <span className="file-input-or">hoặc</span>
              <input
                type="file"
                accept="image/*"
                onChange={onImageUpload}
                disabled={uploadingImage}
                aria-label="Chọn ảnh từ máy"
              />
              {uploadingImage && <span className="upload-spinner">Đang tải ảnh lên...</span>}
            </div>
          </label>
          <label className="full">
            <span>Mô tả</span>
            <textarea name="description" value={form.description} onChange={onChange} rows={3} />
          </label>
        </div>
        <button type="submit" className="primary-button">
          {editingId ? <><Edit3 size={16} aria-hidden /> Cập nhật</> : <><Plus size={16} aria-hidden /> Thêm sản phẩm</>}
        </button>
      </form>

      <div className="card-box admin-list">
        <div className="admin-list-header">
          <h2>Danh sách sản phẩm ({items.length})</h2>
          <div className="admin-filters">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Lọc danh mục">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="admin-search">
              <Search size={16} aria-hidden />
              <input
                type="text"
                placeholder="Tìm tên sản phẩm..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Tìm kiếm sản phẩm"
              />
            </div>
            <button type="button" className="secondary-button" onClick={resetProducts}>
              <RotateCcw size={16} aria-hidden /> Tải lại
            </button>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="cell-product">
                      <img src={p.image} alt={p.name} loading="lazy" />
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td>{p.category}</td>
                  <td>{formatVND(p.price)}</td>
                  <td>
                    {(p.stock ?? 0) === 0 ? (
                      <span style={{ background: 'rgba(239,68,68,0.12)', color: '#991b1b', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                        Hết hàng
                      </span>
                    ) : (p.stock ?? 0) < LOW_STOCK_THRESHOLD ? (
                      <span style={{ background: 'rgba(245,158,11,0.15)', color: '#92400e', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                        Sắp hết ({p.stock})
                      </span>
                    ) : (
                      p.stock
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="icon-action" onClick={() => onEdit(p)} aria-label={`Sửa ${p.name}`}>
                        <Edit3 size={16} />
                      </button>
                      <button type="button" className="icon-action danger" onClick={() => onDelete(p.id)} aria-label={`Xóa ${p.name}`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="empty-result">Không có sản phẩm nào phù hợp.</p>}
        </div>
      </div>
    </div>
  );
}

export default memo(ProductsTab);
