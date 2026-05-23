import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_MIME = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] };

export default function ImageManager({ productId, onImagesChange }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [dropIdx, setDropIdx] = useState(null);

  // Fetch existing images
  const fetchImages = useCallback(async () => {
    if (!productId) { setLoading(false); return; }
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${productId}/images`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setImages(Array.isArray(data) ? data : []);
      onImagesChange?.(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [productId, onImagesChange]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  // Upload handler
  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length || !productId) return;

    for (const file of acceptedFiles) {
      setUploadProgress(`Đang tải: ${file.name}...`);
      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('image', file);

        const res = await fetch(`/api/products/${productId}/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('novashop:authToken') || ''}`,
          },
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        // Refresh images after each upload
        await fetchImages();
      } catch (err) {
        setError(`Lỗi upload "${file.name}": ${err.message}`);
      } finally {
        setUploading(false);
        setUploadProgress('');
      }
    }
  }, [productId, fetchImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 10,
    disabled: uploading || !productId,
    multiple: true,
  });

  // Delete image
  const handleDelete = async (imageId, imageUrl) => {
    if (!confirm('Xóa ảnh này?')) return;
    try {
      setError(null);
      const res = await fetch(`/api/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('novashop:authToken') || ''}`,
        },
      });
      if (!res.ok) throw new Error('Xóa ảnh thất bại');
      await fetchImages();
    } catch (err) {
      setError(err.message);
    }
  };

  // Set primary image
  const handleSetPrimary = async (imageId) => {
    if (!confirm('Đặt ảnh này làm ảnh chính?')) return;
    try {
      setError(null);
      const updated = images.map((img) => ({
        id: img.id,
        sort_order: img.id === imageId ? 0 : (img.sort_order || 1),
      }));
      const res = await fetch(`/api/products/${productId}/images/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('novashop:authToken') || ''}`,
        },
        body: JSON.stringify({ order: updated }),
      });
      if (!res.ok) throw new Error('Cập nhật thất bại');
      await fetchImages();
    } catch (err) {
      setError(err.message);
    }
  };

  // Reorder via drag & drop
  const handleDragStart = (idx) => {
    setDragIdx(idx);
  };

  const handleDragOver = (idx, e) => {
    e.preventDefault();
    setDropIdx(idx);
  };

  const handleDragEnd = async () => {
    if (dragIdx === null || dropIdx === null || dragIdx === dropIdx) {
      setDragIdx(null);
      setDropIdx(null);
      return;
    }

    setReordering(true);
    setError(null);

    const reordered = [...images];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dropIdx, 0, moved);

    const orderPayload = reordered.map((img, idx) => ({
      id: img.id,
      sort_order: idx,
    }));

    try {
      const res = await fetch(`/api/products/${productId}/images/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('novashop:authToken') || ''}`,
        },
        body: JSON.stringify({ order: orderPayload }),
      });
      if (!res.ok) throw new Error('Sắp xếp lại thất bại');
      await fetchImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setReordering(false);
      setDragIdx(null);
      setDropIdx(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 16, color: '#888', fontSize: 14 }}>
        Đang tải hình ảnh...
      </div>
    );
  }

  return (
    <div className="image-manager">
      <style>{`
        .image-manager { width: 100%; }
        .image-upload-zone {
          border: 2px dashed #ccc;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: ${isDragActive ? '#e3f2fd' : '#fafafa'};
          border-color: ${isDragActive ? '#1976d2' : '#ccc'};
        }
        .image-upload-zone:hover {
          border-color: #1976d2;
          background: #f0f7ff;
        }
        .image-upload-zone.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .image-upload-icon { font-size: 36px; margin-bottom: 8px; }
        .image-upload-text { font-size: 14px; color: #666; }
        .image-upload-hint { font-size: 12px; color: #999; margin-top: 4px; }
        .image-upload-progress { font-size: 13px; color: #1976d2; margin-top: 8px; font-weight: 600; }
        .image-error { color: #e53935; font-size: 13px; background: #ffebee; padding: 8px 12px; border-radius: 8px; margin-top: 8px; }
        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }
        .image-item {
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          border: 2px solid #e0e0e0;
          background: #f5f5f5;
          aspect-ratio: 1;
          transition: border-color 0.2s, box-shadow 0.2s;
          cursor: grab;
        }
        .image-item:hover {
          border-color: #1976d2;
          box-shadow: 0 2px 8px rgba(25,118,210,0.2);
        }
        .image-item.dragging {
          opacity: 0.5;
          border-color: #1976d2;
        }
        .image-item.drag-over {
          border-color: #f57c00;
          box-shadow: 0 0 0 3px rgba(245,124,0,0.3);
        }
        .image-item.primary {
          border-color: #43a047;
          box-shadow: 0 2px 8px rgba(67,160,71,0.3);
        }
        .image-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .image-badge {
          position: absolute;
          top: 4px;
          left: 4px;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          z-index: 1;
        }
        .image-badge.primary-badge {
          background: #43a047;
          color: #fff;
        }
        .image-badge.reorder-badge {
          background: #1976d2;
          color: #fff;
        }
        .image-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          gap: 4px;
          padding: 6px;
          background: linear-gradient(transparent, rgba(0,0,0,0.7));
          opacity: 0;
          transition: opacity 0.2s;
        }
        .image-item:hover .image-overlay { opacity: 1; }
        .image-overlay button {
          flex: 1;
          border: none;
          border-radius: 4px;
          padding: 4px 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.15s;
        }
        .image-overlay button:hover { transform: scale(1.05); }
        .btn-star { background: #43a047; color: #fff; }
        .btn-delete { background: #e53935; color: #fff; }
        .image-sort-hint { font-size: 12px; color: #999; margin-top: 8px; text-align: center; }
      `}</style>

      {/* Upload zone */}
      <div {...getRootProps()} className={`image-upload-zone ${(!productId || uploading) ? 'disabled' : ''}`}>
        <input {...getInputProps()} />
        <div className="image-upload-icon">{isDragActive ? '📁' : '📤'}</div>
        {isDragActive ? (
          <p className="image-upload-text">Thả ảnh vào đây...</p>
        ) : (
          <>
            <p className="image-upload-text">
              <strong>Kéo thả ảnh</strong> hoặc click để chọn
            </p>
            <p className="image-upload-hint">JPEG, PNG, WebP — Tối đa 5MB mỗi ảnh</p>
          </>
        )}
      </div>

      {uploadProgress && <div className="image-upload-progress">{uploadProgress}</div>}
      {error && <div className="image-error">{error}</div>}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="image-grid">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className={`image-item ${img.is_primary ? 'primary' : ''} ${dragIdx === idx ? 'dragging' : ''} ${dropIdx === idx ? 'drag-over' : ''}`}
              draggable={!reordering}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(idx, e)}
              onDragEnd={handleDragEnd}
              style={{
                cursor: reordering ? 'wait' : 'grab',
              }}
            >
              <img src={img.image_url} alt={`Ảnh ${idx + 1}`} loading="lazy" />
              {img.is_primary && <span className="image-badge primary-badge">★ Chính</span>}
              {idx === 0 && !img.is_primary && <span className="image-badge reorder-badge">Đầu</span>}

              <div className="image-overlay">
                {!img.is_primary && (
                  <button
                    type="button"
                    className="btn-star"
                    onClick={() => handleSetPrimary(img.id)}
                    title="Đặt làm ảnh chính"
                  >
                    ★ Chính
                  </button>
                )}
                <button
                  type="button"
                  className="btn-delete"
                  onClick={() => handleDelete(img.id, img.image_url)}
                  title="Xóa ảnh"
                >
                  ✕ Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && images.length === 0 && (
        <p style={{ textAlign: 'center', color: '#999', fontSize: 13, marginTop: 12 }}>
          Chưa có ảnh nào
        </p>
      )}

      {images.length > 1 && (
        <p className="image-sort-hint">↕ Kéo thả để sắp xếp thứ tự ảnh</p>
      )}
    </div>
  );
}
