import { useState, useEffect, useCallback, useRef } from 'react';

const PAGE_SIZE = 10;

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef(null);

  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceTimer.current);
  }, [search]);

  // Reset page when other filters change
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedStatus, sort]);

  // Fetch products with all filters
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedCategory) params.set('category_id', selectedCategory);
      if (selectedStatus) params.set('status', selectedStatus);
      if (sort !== 'newest') params.set('sort', sort);
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String((page - 1) * PAGE_SIZE));

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProducts(Array.isArray(data?.data) ? data.data : []);
      setTotal(data?.total ?? 0);
    } catch (err) {
      setError(err.message);
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, selectedStatus, sort, page]);

  // Fetch categories once
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch categories:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle delete
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa sản phẩm "${name}"?`)) return;
    try {
      setDeleting(id);
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Delete failed');
      }
      setProducts(prev => prev.filter(p => p.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      alert(`Lỗi: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  // Reset all filters
  const handleReset = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setSelectedStatus('');
    setSort('newest');
    setPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters = debouncedSearch || selectedCategory || selectedStatus || sort !== 'newest';

  // Format VND
  const formatVND = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const statusLabels = {
    active: 'Đang bán',
    draft: 'Nháp',
    inactive: 'Ngừng bán',
    out_of_stock: 'Hết hàng',
    deleted: 'Đã xóa'
  };

  const statusColors = {
    active: '#27ae60',
    draft: '#f39c12',
    inactive: '#e74c3c',
    out_of_stock: '#95a5a6',
    deleted: '#c0392b'
  };

  // Pagination
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const fromItem = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const toItem = Math.min(page * PAGE_SIZE, total);

  // Error state (empty data)
  if (error && !loading && products.length === 0) {
    return (
      <div className="plp-container">
        <h1 className="plp-title">Quản lý sản phẩm</h1>
        <div className="plp-error-card">
          <strong>Lỗi tải dữ liệu:</strong> {error}
          <br />
          <button className="plp-retry-btn" onClick={fetchProducts}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="plp-container">
      {/* Header */}
      <div className="plp-header">
        <h1 className="plp-title">Quản lý sản phẩm</h1>
        <a href="/them-san-pham" className="plp-add-btn">
          + Thêm sản phẩm
        </a>
      </div>

      {/* Filter bar */}
      <div className="plp-filter-bar">
        {/* Search */}
        <div className={`plp-filter-group ${debouncedSearch ? 'plp-filter-active' : ''}`}>
          <input
            type="text"
            className="plp-search-input"
            placeholder="🔍 Tìm theo tên sản phẩm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category dropdown */}
        <div className={`plp-filter-group ${selectedCategory ? 'plp-filter-active' : ''}`}>
          <select
            className="plp-select"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Status dropdown */}
        <div className={`plp-filter-group ${selectedStatus ? 'plp-filter-active' : ''}`}>
          <select
            className="plp-select"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="draft">Nháp</option>
            <option value="deleted">Đã xóa</option>
          </select>
        </div>

        {/* Sort dropdown */}
        <div className={`plp-filter-group ${sort !== 'newest' ? 'plp-filter-active' : ''}`}>
          <select
            className="plp-select"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
            <option value="name_asc">Tên A-Z</option>
          </select>
        </div>

        {/* Reset button */}
        <button
          className="plp-reset-btn"
          onClick={handleReset}
          disabled={!hasActiveFilters}
          title="Xóa tất cả bộ lọc"
        >
          ↺ Reset
        </button>
      </div>

      {/* Results count */}
      {!loading && (
        <div className="plp-count-text">
          {hasActiveFilters ? `Tìm thấy ${total} sản phẩm` : `Hiển thị ${fromItem}-${toItem} trong tổng ${total} sản phẩm`}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="plp-loading">
          <div className="plp-spinner" />
          Đang tải sản phẩm...
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="plp-empty">
          <div className="plp-empty-icon">📦</div>
          <h3>{hasActiveFilters ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào'}</h3>
          <p>
            {hasActiveFilters
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'
              : 'Thêm sản phẩm đầu tiên để bắt đầu.'}
          </p>
          {!hasActiveFilters && (
            <a href="/them-san-pham" className="plp-add-btn" style={{ display: 'inline-flex' }}>
              + Thêm sản phẩm
            </a>
          )}
          {hasActiveFilters && (
            <button className="plp-reset-btn" onClick={handleReset} style={{ marginTop: 12 }}>
              ↺ Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Product table */}
      {!loading && products.length > 0 && (
        <div className="plp-table-wrap">
          <table className="plp-table">
            <thead>
              <tr>
                <th style={{ width: 56 }}>Ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th style={{ textAlign: 'right' }}>Giá</th>
                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                <th style={{ textAlign: 'center', width: 160 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="plp-row">
                  <td style={{ width: 56 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 8, overflow: 'hidden',
                      background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {product.image ? (
                        <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      ) : (
                        <span style={{ fontSize: 18, opacity: 0.4 }}>📦</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="plp-name">{product.name}</div>
                    {product.slug && <div className="plp-slug">{product.slug}</div>}
                  </td>
                  <td>
                    <span className="plp-cat-tag">
                      {product.category_name || 'Chưa phân loại'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {formatVND(product.price)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      className="plp-status-badge"
                      style={{
                        background: (statusColors[product.status] || '#666') + '20',
                        color: statusColors[product.status] || '#666'
                      }}
                    >
                      {statusLabels[product.status] || product.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="plp-actions">
                      <a
                        href={`/them-san-pham?edit=${product.id}`}
                        className="plp-btn-edit"
                      >
                        Sửa
                      </a>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={deleting === product.id}
                        className="plp-btn-delete"
                        style={{
                          background: deleting === product.id ? '#ccc' : '#e74c3c',
                          cursor: deleting === product.id ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {deleting === product.id ? 'Đang xóa...' : 'Xóa'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && total > PAGE_SIZE && (
        <div className="plp-pagination">
          <span className="plp-pagination-info">
            Trang {page}/{totalPages}
          </span>
          <div className="plp-pagination-btns">
            <button
              className="plp-page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              ← Trước
            </button>
            <button
              className="plp-page-btn"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Tiếp →
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes plp-spin {
          to { transform: rotate(360deg); }
        }

        .plp-container {
          padding: 40px 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .plp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .plp-title {
          font-size: 24px;
          margin: 0;
        }

        .plp-add-btn {
          padding: 10px 24px;
          background: #27ae60;
          color: #fff;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: background 0.2s;
        }

        .plp-add-btn:hover {
          background: #219a52;
        }

        /* Filter bar */
        .plp-filter-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
          align-items: stretch;
        }

        .plp-filter-group {
          flex: 1;
          min-width: 160px;
        }

        .plp-filter-group:first-child {
          flex: 2;
          min-width: 200px;
        }

        .plp-filter-active .plp-select {
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.15);
        }

        .plp-filter-active .plp-search-input {
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.15);
        }

        .plp-search-input {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .plp-search-input:focus {
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.15);
        }

        .plp-select {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          background: #fff;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .plp-select:focus {
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.15);
        }

        .plp-reset-btn {
          padding: 9px 18px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: #fff;
          color: #666;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .plp-reset-btn:hover:not(:disabled) {
          border-color: #e74c3c;
          color: #e74c3c;
          background: #fff5f5;
        }

        .plp-reset-btn:disabled {
          opacity: 0.4;
          cursor: default;
        }

        /* Results count */
        .plp-count-text {
          font-size: 13px;
          color: #888;
          margin-bottom: 16px;
        }

        /* Loading */
        .plp-loading {
          text-align: center;
          padding: 40px;
          color: #888;
        }

        .plp-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #eee;
          border-top-color: #27ae60;
          border-radius: 50%;
          animation: plp-spin 0.8s linear infinite;
          margin: 0 auto 12px;
        }

        /* Error */
        .plp-error-card {
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 8px;
          padding: 20px;
          color: #856404;
        }

        .plp-retry-btn {
          margin-top: 12px;
          padding: 8px 20px;
          background: #007bff;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        /* Empty */
        .plp-empty {
          text-align: center;
          padding: 60px;
          background: #f9f9f9;
          border-radius: 12px;
          border: 2px dashed #ddd;
        }

        .plp-empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .plp-empty h3 {
          margin: 0 0 8px;
          color: #555;
        }

        .plp-empty p {
          color: #888;
          margin: 0 0 20px;
          font-size: 14px;
        }

        /* Table */
        .plp-table-wrap {
          overflow-x: auto;
        }

        .plp-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }

        .plp-table th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          background: #f5f6fa;
          border-bottom: 2px solid #eee;
        }

        .plp-row {
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.2s;
        }

        .plp-row:hover {
          background: #fafbfc;
        }

        .plp-row td {
          padding: 12px 16px;
        }

        .plp-name {
          font-weight: 500;
        }

        .plp-slug {
          font-size: 12px;
          color: #999;
          margin-top: 2px;
        }

        .plp-cat-tag {
          display: inline-block;
          background: #e8f5e9;
          color: #2e7d32;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .plp-status-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .plp-actions {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .plp-btn-edit {
          padding: 6px 14px;
          background: #3498db;
          color: #fff;
          border-radius: 6px;
          text-decoration: none;
          font-size: 13px;
          transition: background 0.2s;
        }

        .plp-btn-edit:hover {
          background: #2980b9;
        }

        .plp-btn-delete {
          padding: 6px 14px;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          transition: background 0.2s;
        }

        .plp-btn-delete:hover:not(:disabled) {
          background: #c0392b !important;
        }

        /* Pagination */
        .plp-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          padding: 16px 0;
        }

        .plp-pagination-info {
          font-size: 14px;
          color: #666;
        }

        .plp-pagination-btns {
          display: flex;
          gap: 8px;
        }

        .plp-page-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: #fff;
          color: #333;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .plp-page-btn:hover:not(:disabled) {
          border-color: #3498db;
          color: #3498db;
          background: #f0f8ff;
        }

        .plp-page-btn:disabled {
          opacity: 0.4;
          cursor: default;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .plp-filter-bar {
            flex-direction: column;
          }

          .plp-filter-group {
            min-width: 100% !important;
          }

          .plp-reset-btn {
            width: 100%;
          }

          .plp-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
