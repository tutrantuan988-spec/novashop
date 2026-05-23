import { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DynamicProductForm from '../components/DynamicProductForm';
import ImageManager from '../components/ImageManager';
import { uploadProductImage, isUploadConfigured } from '../services/upload';
import './AddProductPage.css';

function toSlug(text) {
  const map = {
    à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a', â: 'a', ầ: 'a', ấ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a',
    è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e', ê: 'e', ề: 'e', ế: 'e', ể: 'e', ễ: 'e', ệ: 'e',
    ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
    ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o', ô: 'o', ồ: 'o', ố: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
    ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u', ư: 'u', ừ: 'u', ứ: 'u', ử: 'u', ữ: 'u', ự: 'u',
    ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
    đ: 'd', Đ: 'd'
  };
  return text
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] || ch)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Nháp' },
  { value: 'active', label: 'Đang bán' },
  { value: 'inactive', label: 'Ngừng bán' }
];

export default function AddProductPage() {
  const { isAdmin, authLoading } = useAuth();

  if (authLoading) {
    return <div className="page-loading"><div className="spinner" aria-hidden /><span>Đang kiểm tra quyền...</span></div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [catsLoading, setCatsLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [pageError, setPageError] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('draft');
  const [attributes, setAttributes] = useState({});

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Validation
  const [errors, setErrors] = useState({});

  // Variants (edit mode only)
  const [variants, setVariants] = useState([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [newVariant, setNewVariant] = useState({ attribute_values: {}, stock: 0, price_override: '' });
  const [variantSubmitting, setVariantSubmitting] = useState(false);
  const [variantError, setVariantError] = useState(null);
  const [categoryFields, setCategoryFields] = useState([]);

  // Image upload for new products
  const [imageUrls, setImageUrls] = useState([]);
  const [primaryImageUrl, setPrimaryImageUrl] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Load categories
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => {
        if (!res.ok) throw new Error('Không thể tải danh mục');
        return res.json();
      })
      .then((data) => {
        setCategories(data);
        setCatsLoading(false);
      })
      .catch((err) => {
        setPageError(err.message);
        setCatsLoading(false);
      });
  }, []);

  // If edit mode: fetch existing product data
  useEffect(() => {
    if (!isEditMode || !editId) {
      return;
    }

    setEditLoading(true);
    fetch(`/api/products/${editId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Không thể tải thông tin sản phẩm');
        return res.json();
      })
      .then((product) => {
        setName(product.name || '');
        setSlug(product.slug || '');
        setPrice(String(product.price ?? ''));
        setStatus(product.status || 'draft');
        setSelectedCategoryId(product.category_id || '');
        setAttributes(typeof product.attributes === 'object' && product.attributes !== null
          ? product.attributes
          : {});
        setEditLoading(false);
      })
      .catch((err) => {
        setPageError(err.message);
        setEditLoading(false);
      });
  }, [isEditMode, editId]);

  // Fetch variants in edit mode
  useEffect(() => {
    if (!isEditMode || !editId) return;

    setVariantsLoading(true);
    fetch(`/api/products/${editId}/variants`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setVariants(data);
        }
        setVariantsLoading(false);
      })
      .catch(() => {
        setVariantsLoading(false);
      });
  }, [isEditMode, editId]);

  // Load category schema fields for variant attribute form
  useEffect(() => {
    if (!selectedCategoryId) {
      setCategoryFields([]);
      return;
    }
    fetch(`/api/categories/${selectedCategoryId}/schema`)
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.fields)) {
          setCategoryFields(data.fields);
        }
      })
      .catch(() => {});
  }, [selectedCategoryId]);

  // Variant CRUD handlers
  const handleAddVariant = async () => {
    const attrs = newVariant.attribute_values || {};
    if (Object.values(attrs).every((v) => !v || String(v).trim() === '')) {
      setVariantError('Vui lòng nhập ít nhất một thuộc tính');
      return;
    }
    setVariantSubmitting(true);
    setVariantError(null);

    try {
      const res = await fetch(`/api/products/${editId}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: '',
          stock: parseInt(newVariant.stock) || 0,
          price_override: newVariant.price_override ? Number(newVariant.price_override) : null,
          attribute_values: attrs
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo biến thể thất bại');

      setVariants((prev) => [...prev, data]);
      setShowVariantForm(false);
      setNewVariant({ attribute_values: {}, stock: 0, price_override: '' });
    } catch (err) {
      setVariantError(err.message);
    } finally {
      setVariantSubmitting(false);
    }
  };

  const handleDeleteVariant = async (variantId) => {
    if (!confirm('Xóa biến thể này?')) return;

    try {
      const res = await fetch(`/api/products/${editId}/variants/${variantId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Xóa biến thể thất bại');
      }

      setVariants((prev) => prev.filter((v) => v.id !== variantId));
    } catch (err) {
      setVariantError(err.message);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = useCallback((val) => {
    setName(val);
    if (!editId) {
      setSlug(toSlug(val));
    }
  }, [editId]);

  const handleCategoryChange = (e) => {
    setSelectedCategoryId(e.target.value);
    setAttributes({});
  };

  const handleAttributesChange = useCallback((vals) => {
    setAttributes(vals);
  }, []);

  // Image upload for new products
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (!isUploadConfigured()) {
      setUploadError('Cloudinary chưa được cấu hình. Vui lòng kiểm tra biến môi trường.');
      return;
    }

    setUploadingImages(true);
    setUploadError(null);

    for (const file of files) {
      try {
        const url = await uploadProductImage(file);
        setImageUrls(prev => [...prev, url]);
        if (!primaryImageUrl) setPrimaryImageUrl(url);
      } catch (err) {
        setUploadError(err.message);
      }
    }

    setUploadingImages(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSetPrimary = (url) => {
    setPrimaryImageUrl(url);
  };

  const handleRemoveImage = (url) => {
    setImageUrls(prev => prev.filter(u => u !== url));
    if (primaryImageUrl === url) {
      setPrimaryImageUrl(imageUrls.find(u => u !== url) || '');
    }
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Tên sản phẩm là bắt buộc';
    if (!slug.trim()) errs.slug = 'Slug là bắt buộc';
    const priceNum = Number(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) errs.price = 'Giá phải lớn hơn 0';
    if (!selectedCategoryId) errs.category = 'Danh mục là bắt buộc';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);

    const body = {
      name: name.trim(),
      slug: slug.trim(),
      price: Number(price),
      category_id: selectedCategoryId,
      status,
      attributes,
      primary_image_url: primaryImageUrl || ''
    };

    try {
      const url = isEditMode ? `/api/products/${editId}` : '/api/products';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      window.location.href = '/quan-ly-san-pham';
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  };

  const pageLoading = catsLoading || editLoading;

  if (pageLoading) {
    return (
      <div className="add-product-page">
        <div className="form-loading" role="status">
          <div className="spinner" aria-hidden />
          <span>
            {isEditMode ? 'Đang tải thông tin sản phẩm...' : 'Đang tải danh mục...'}
          </span>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="add-product-page">
        <h1 className="add-product-title">
          {isEditMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </h1>
        <div className="form-error-message" role="alert">
          <strong>Lỗi:</strong> {pageError}
          <br />
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 12, padding: '8px 20px', background: '#007bff',
              color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer'
            }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const titleLabel = isEditMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới';
  const submitLabel = isEditMode ? 'Lưu thay đổi' : 'Thêm sản phẩm';

  return (
    <div className="add-product-page">
      <h1 className="add-product-title">{titleLabel}</h1>

      <form onSubmit={handleSubmit}>
        {/* Category */}
        <div className="add-product-section">
          <label htmlFor="category-select" className="form-label">
            Danh mục sản phẩm <span className="form-required">*</span>
          </label>
          <select
            id="category-select"
            value={selectedCategoryId}
            onChange={handleCategoryChange}
            disabled={isEditMode}
            className={`form-select category-select${isEditMode ? ' form-select--disabled' : ''}`}
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {isEditMode && (
            <p style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
              Không thể thay đổi danh mục trong chế độ chỉnh sửa
            </p>
          )}
          {errors.category && <p className="form-field-error">{errors.category}</p>}
        </div>

        {/* Basic fields */}
        <div className="add-product-section">
          <div className="form-group">
            <label htmlFor="product-name" className="form-label">
              Tên sản phẩm <span className="form-required">*</span>
            </label>
            <input
              id="product-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="form-input"
              placeholder="VD: Áo thun basic"
              required
            />
            {errors.name && <p className="form-field-error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="product-slug" className="form-label">
              Slug <span className="form-required">*</span>
            </label>
            <input
              id="product-slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="form-input"
              placeholder="VD: ao-thun-basic"
              required
            />
            {!isEditMode && (
              <p style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
                Tự động tạo từ tên sản phẩm. Có thể chỉnh sửa thủ công.
              </p>
            )}
            {errors.slug && <p className="form-field-error">{errors.slug}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="product-price" className="form-label">
              Giá bán (VND) <span className="form-required">*</span>
            </label>
            <input
              id="product-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="form-input"
              placeholder="VD: 299000"
              min="1"
              required
            />
            {errors.price && <p className="form-field-error">{errors.price}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="product-status" className="form-label">
              Trạng thái
            </label>
            <select
              id="product-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-select"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic attributes */}
        {selectedCategoryId && (
          <div className="add-product-section">
            <h2 className="add-product-section-title">Thuộc tính sản phẩm</h2>
            <DynamicProductForm
              key={selectedCategoryId + (isEditMode ? '-edit' : '')}
              categoryId={selectedCategoryId}
              initialValues={attributes}
              onFieldsChange={handleAttributesChange}
            />
          </div>
        )}

        {/* Product Image Upload (new products) */}
        {!isEditMode && (
          <div className="add-product-section">
            <h2 className="add-product-section-title">Hình ảnh sản phẩm</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                border: '2px dashed var(--border)',
                borderRadius: 12,
                padding: 24,
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg)',
                transition: 'all 0.2s'
              }}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(255,122,26,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <p style={{ fontSize: 24, marginBottom: 8 }}>📤</p>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>
                  {uploadingImages ? 'Đang tải lên...' : 'Kéo thả ảnh hoặc click để chọn'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>JPEG, PNG, WebP — Tối đa 5MB mỗi ảnh</p>
              </div>

              {uploadError && (
                <p style={{ color: '#ef4444', fontSize: 13, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8 }}>
                  {uploadError}
                </p>
              )}

              {imageUrls.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                  {imageUrls.map((url, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        aspectRatio: '1',
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: primaryImageUrl === url ? '3px solid #16a34a' : '2px solid var(--border)',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleSetPrimary(url)}
                    >
                      <img src={url} alt={`Ảnh ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {primaryImageUrl === url && (
                        <span style={{
                          position: 'absolute',
                          top: 4,
                          left: 4,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: '#16a34a',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 700
                        }}>
                          ★ Chính
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(url); }}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {imageUrls.length === 0 && !uploadingImages && (
                <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>
                  Chưa có ảnh nào. Ảnh đầu tiên sẽ được đặt làm ảnh chính.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Product Image Manager (edit mode only) */}
        {isEditMode && (
          <div className="add-product-section">
            <h2 className="add-product-section-title">Quản lý hình ảnh</h2>
            <ImageManager productId={editId} onImagesChange={() => {}} />
          </div>
        )}

        {/* Variant management (edit mode only) */}
        {isEditMode && (
          <div className="add-product-section variants-section">
            <h2 className="add-product-section-title">
              Biến thể sản phẩm (SKU)
              <span className="variant-count-badge">{variants.length}</span>
            </h2>

            {variantsLoading ? (
              <div className="form-placeholder">Đang tải biến thể...</div>
            ) : variants.length === 0 && !showVariantForm ? (
              <div className="form-placeholder">Chưa có biến thể nào</div>
            ) : (
              <div className="variants-table-wrapper">
                <table className="variants-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Thuộc tính</th>
                      <th>Giá</th>
                      <th>Tồn kho</th>
                      <th>Trạng thái</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => (
                      <tr key={v.id}>
                        <td className="variant-sku-cell">{v.sku}</td>
                        <td className="variant-attrs-cell">
                          {v.attribute_values && typeof v.attribute_values === 'object'
                            ? Object.entries(v.attribute_values)
                                .filter(([, val]) => val)
                                .map(([k, val]) => (
                                  <span key={k} className="variant-attr-tag">
                                    {k}: {val}
                                  </span>
                                ))
                            : '—'}
                        </td>
                        <td>
                          {v.price_override
                            ? new Intl.NumberFormat('vi-VN').format(v.price_override) + ' ₫'
                            : 'Mặc định'}
                        </td>
                        <td>{v.stock}</td>
                        <td>
                          <span className={`variant-status-${v.status === 'active' ? 'active' : 'inactive'}`}>
                            {v.status === 'active' ? 'Đang bán' : 'Ngừng'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-variant-delete"
                            title="Xóa biến thể"
                            onClick={() => handleDeleteVariant(v.id)}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {variantError && (
              <div className="form-error-message" style={{ marginTop: 12 }} role="alert">
                {variantError}
              </div>
            )}

            {!showVariantForm ? (
              <button
                type="button"
                className="btn-add-variant"
                onClick={() => setShowVariantForm(true)}
              >
                + Thêm biến thể
              </button>
            ) : (
              <div className="variant-form-inline">
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
                  Thông tin biến thể mới
                </h3>
                <div className="variant-form-grid">
                  {/* Attribute fields from category schema */}
                  {categoryFields.map((field) => (
                    <div key={field.key} className="variant-field-group">
                      <label className="variant-field-label">{field.label}</label>
                      {field.type === 'select' ? (
                        <select
                          value={newVariant.attribute_values[field.key] || ''}
                          onChange={(e) => {
                            const updated = { ...newVariant.attribute_values, [field.key]: e.target.value };
                            setNewVariant({ ...newVariant, attribute_values: updated });
                          }}
                          className="variant-field-input"
                        >
                          <option value="">-- Chọn --</option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder={field.label}
                          value={newVariant.attribute_values[field.key] || ''}
                          onChange={(e) => {
                            const updated = { ...newVariant.attribute_values, [field.key]: e.target.value };
                            setNewVariant({ ...newVariant, attribute_values: updated });
                          }}
                          className="variant-field-input"
                        />
                      )}
                    </div>
                  ))}

                  <div className="variant-field-group">
                    <label className="variant-field-label">Giá (VND)</label>
                    <input
                      type="number"
                      placeholder="Giá mặc định"
                      value={newVariant.price_override}
                      onChange={(e) => setNewVariant({ ...newVariant, price_override: e.target.value })}
                      className="variant-field-input"
                    />
                  </div>

                  <div className="variant-field-group">
                    <label className="variant-field-label">Tồn kho <span className="form-required">*</span></label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newVariant.stock}
                      onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 })}
                      className="variant-field-input"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="variant-form-actions">
                  <button
                    type="button"
                    className="btn btn-variant-save"
                    onClick={handleAddVariant}
                    disabled={variantSubmitting}
                  >
                    {variantSubmitting ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-variant-cancel"
                    onClick={() => {
                      setShowVariantForm(false);
                      setVariantError(null);
                      setNewVariant({ attribute_values: {}, stock: 0, price_override: '' });
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit error */}
        {submitError && (
          <div className="form-error-message" role="alert" style={{ marginBottom: 16 }}>
            <strong>Lỗi:</strong> {submitError}
          </div>
        )}

        {/* Submit button */}
        <div className="add-product-actions">
          <button
            type="submit"
            disabled={submitting || !selectedCategoryId}
            className="btn btn-primary btn-submit"
            style={{
              padding: '12px 32px', background: submitting ? '#ccc' : '#27ae60',
              color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600,
              fontSize: 16, cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!submitting) e.target.style.background = '#219a52';
            }}
            onMouseLeave={(e) => {
              if (!submitting) e.target.style.background = '#27ae60';
            }}
          >
            {submitting ? 'Đang lưu...' : submitLabel}
          </button>
          <button
            type="button"
            onClick={() => window.location.href = '/quan-ly-san-pham'}
            style={{
              padding: '12px 24px', background: '#6b7280', color: '#fff',
              border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 16,
              cursor: 'pointer', marginLeft: 12, transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#4b5563'}
            onMouseLeave={(e) => e.target.style.background = '#6b7280'}
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
