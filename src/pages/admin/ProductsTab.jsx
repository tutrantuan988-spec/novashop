import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Edit3, Plus, RotateCcw, Search, Trash2, X, Upload, Image as ImageIcon, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useProducts } from '../../context/ProductsContext';
import { fetchCategories } from '../../services/apiV2';
import SITE from '../../config/site-config';
import { formatVND } from '../../utils/format';
import { uploadProductImage } from '../../services/upload';

const LOW_STOCK_THRESHOLD = 10;

const emptyForm = {
  name: '',
  category: 'Thời trang',
  price: '',
  oldPrice: '',
  stock: '',
  badge: '',
  image: '',
  description: '',
  brand: ''
};

function ProductModal({ product, categories, onSave, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState(product ? {
    name: product.name,
    category: product.category,
    price: String(product.price),
    oldPrice: String(product.oldPrice || product.originalPrice || ''),
    stock: String(product.stock || 0),
    badge: product.badge || '',
    image: product.image,
    description: product.description || '',
    brand: product.brand || ''
  } : { ...emptyForm });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(product?.image || '');
  const fileInputRef = useRef(null);

  const onChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const onImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const url = await uploadProductImage(file);
      setForm((current) => ({ ...current, image: url }));
      setImagePreview(url);
    } catch (err) {
      toast.error('Upload ảnh thất bại: ' + err.message);
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleImagePreview = (url) => {
    setForm((current) => ({ ...current, image: url }));
    setImagePreview(url);
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
      brand: form.brand || '',
      image: form.image || 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=900&q=80',
      description: form.description || `Sản phẩm mới của ${SITE.name}.`
    };
    await onSave(product?.id || null, payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content product-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="product-modal-body">
            <div className="product-modal-left">
              <div className="image-preview-area">
                {imagePreview ? (
                  <img src={imagePreview} alt="Xem trước" className="image-preview-img" />
                ) : (
                  <div className="image-preview-placeholder">
                    <ImageIcon size={40} />
                    <span>Chưa có hình ảnh</span>
                  </div>
                )}
              </div>
              <div className="image-upload-actions">
                <input
                  type="text"
                  name="image"
                  value={form.image}
                  onChange={(e) => handleImagePreview(e.target.value)}
                  placeholder="URL hình ảnh"
                />
                <span className="upload-or">hoặc</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={onImageUpload}
                  disabled={uploadingImage}
                  className="file-input-hidden"
                  aria-label="Chọn ảnh từ máy"
                />
                <button
                  type="button"
                  className="secondary-button upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  <Upload size={16} />
                  {uploadingImage ? 'Đang tải lên...' : 'Tải ảnh lên'}
                </button>
              </div>
            </div>
            <div className="product-modal-right">
              <div className="form-grid">
                <label className="full">
                  <span>Tên sản phẩm *</span>
                  <input name="name" required value={form.name} onChange={onChange} />
                </label>
                <label>
                  <span>Danh mục</span>
                  <select name="category" value={form.category} onChange={onChange}>
                    {categories.filter((c) => c !== 'Tất cả').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Thương hiệu</span>
                  <input name="brand" value={form.brand} onChange={onChange} placeholder="Nike, Adidas, Samsung..." />
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
                <label>
                  <span>Badge</span>
                  <input name="badge" value={form.badge} onChange={onChange} placeholder="Mới, Hot, Sale..." />
                </label>
                <label className="full">
                  <span>Mô tả</span>
                  <textarea name="description" value={form.description} onChange={onChange} rows={3} />
                </label>
              </div>
            </div>
          </div>
          <div className="product-modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>Hủy</button>
            <button type="submit" className="primary-button">
              {product ? <><Edit3 size={16} /> Cập nhật</> : <><Plus size={16} /> Thêm sản phẩm</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductsTab() {
  const { items, addProduct, updateProduct, removeProduct, resetProducts } = useProducts();
  const toast = useToast();
  const [categories, setCategories] = useState(['Tất cả']);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState('Tất cả');
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    fetchCategories().then((cats) => {
      if (cats?.names?.length > 1) {
        setCategories(cats.names);
      }
    }).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let result = items.filter((p) => {
      const matchCategory = filter === 'Tất cả' || p.category === filter;
      const matchQuery = p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(query.toLowerCase()));
      return matchCategory && matchQuery;
    });
    result.sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [items, filter, query, sortField, sortDir]);

  const handleSave = async (id, payload) => {
    try {
      if (id) {
        await updateProduct(id, payload);
        toast.success('Đã cập nhật sản phẩm');
      } else {
        await addProduct(payload);
        toast.success('Đã thêm sản phẩm');
      }
      setEditingProduct(null);
      setShowAddModal(false);
    } catch (err) {
      toast.error(err.message || 'Không lưu được sản phẩm');
    }
  };

  const onDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      removeProduct(id)
        .then(() => {
          toast.success('Đã xóa sản phẩm');
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        })
        .catch((err) => toast.error(err.message || 'Không xóa được sản phẩm'));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const bulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Xóa ${selectedIds.size} sản phẩm đã chọn?`)) return;
    selectedIds.forEach((id) => removeProduct(id));
    toast.success(`Đã xóa ${selectedIds.size} sản phẩm`);
    setSelectedIds(new Set());
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown size={14} className="sort-icon" />;
    return sortDir === 'asc' ? <ChevronUp size={14} className="sort-icon active" /> : <ChevronDown size={14} className="sort-icon active" />;
  };

  return (
    <div className="admin-products">
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <button type="button" className="primary-button" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Thêm sản phẩm
          </button>
          {selectedIds.size > 0 && (
            <div className="bulk-actions">
              <span className="bulk-count">{selectedIds.size} đã chọn</span>
              <button type="button" className="secondary-button danger" onClick={bulkDelete}>
                <Trash2 size={14} /> Xóa đã chọn
              </button>
            </div>
          )}
        </div>
        <div className="admin-toolbar-right">
          <div className="admin-search">
            <Search size={16} aria-hidden />
            <input
              type="text"
              placeholder="Tìm tên hoặc thương hiệu..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tìm kiếm sản phẩm"
            />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Lọc danh mục" className="filter-select">
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="button" className="secondary-button" onClick={resetProducts}>
            <RotateCcw size={16} aria-hidden />
          </button>
        </div>
      </div>

      <div className="card-box admin-list">
        <div className="admin-table-wrap">
          <table className="admin-table products-table">
            <thead>
              <tr>
                <th className="col-checkbox">
                  <button type="button" className="checkbox-btn" onClick={toggleSelectAll} aria-label="Chọn tất cả">
                    {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="col-product" onClick={() => handleSort('name')}>
                  Sản phẩm <SortIcon field="name" />
                </th>
                <th className="col-category" onClick={() => handleSort('category')}>
                  Danh mục <SortIcon field="category" />
                </th>
                <th className="col-price" onClick={() => handleSort('price')}>
                  Giá <SortIcon field="price" />
                </th>
                <th className="col-stock" onClick={() => handleSort('stock')}>
                  Tồn kho <SortIcon field="stock" />
                </th>
                <th className="col-actions">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const stock = p.stock ?? 0;
                const stockClass = stock === 0 ? 'stock-out' : stock < LOW_STOCK_THRESHOLD ? 'stock-low' : 'stock-ok';
                const stockLabel = stock === 0 ? 'Hết hàng' : stock < LOW_STOCK_THRESHOLD ? `Sắp hết (${stock})` : String(stock);
                const isSelected = selectedIds.has(p.id);

                return (
                  <tr key={p.id} className={isSelected ? 'row-selected' : ''}>
                    <td className="col-checkbox">
                      <button type="button" className="checkbox-btn" onClick={() => toggleSelect(p.id)} aria-label={`Chọn ${p.name}`}>
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </td>
                    <td className="col-product">
                      <div className="cell-product">
                        <img src={p.image} alt={p.name} loading="lazy" />
                        <div className="cell-product-info">
                          <span>{p.name}</span>
                          {p.brand && <small>{p.brand}</small>}
                        </div>
                      </div>
                    </td>
                    <td className="col-category">
                      <span className="category-badge">{p.category}</span>
                    </td>
                    <td className="col-price">
                      <strong>{formatVND(p.price)}</strong>
                      {p.oldPrice && p.oldPrice > p.price && (
                        <span className="old-price-inline">{formatVND(p.oldPrice)}</span>
                      )}
                    </td>
                    <td className="col-stock">
                      <span className={`stock-badge ${stockClass}`}>{stockLabel}</span>
                    </td>
                    <td className="col-actions">
                      <div className="row-actions">
                        <button type="button" className="icon-action" onClick={() => setEditingProduct(p)} aria-label={`Sửa ${p.name}`}>
                          <Edit3 size={16} />
                        </button>
                        <button type="button" className="icon-action danger" onClick={() => onDelete(p.id)} aria-label={`Xóa ${p.name}`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <PackageIcon size={48} />
              <p>{query || filter !== 'Tất cả' ? 'Không có sản phẩm nào phù hợp.' : 'Chưa có sản phẩm nào.'}</p>
              {!query && filter === 'Tất cả' && (
                <button type="button" className="primary-button" onClick={() => setShowAddModal(true)}>
                  <Plus size={16} /> Thêm sản phẩm đầu tiên
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <ProductModal
          product={null}
          categories={categories}
          onSave={handleSave}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {editingProduct && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onSave={handleSave}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}

export default memo(ProductsTab);
