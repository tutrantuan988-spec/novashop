import React, { useState, useRef, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { Upload, FileDown, AlertCircle, CheckCircle, FileText, X, Loader } from 'lucide-react';

/**
 * ProductImportManager — MarkItDown-style Product Import
 * Pattern inspired by microsoft/markitdown
 * Cho phép admin upload CSV/Excel để import hàng loạt sản phẩm
 */
export default function ProductImportManager() {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [dryRunResult, setDryRunResult] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
      setResult(null);
      setDryRunResult(null);
    } else {
      addToast('Vui lòng chọn file CSV hoặc Excel (.xlsx)', 'error');
    }
  }, [addToast]);

  const handleFileSelect = useCallback((e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setDryRunResult(null);
    }
  }, []);

  const removeFile = useCallback(() => {
    setFile(null);
    setResult(null);
    setDryRunResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const importProducts = async (dryRun = false) => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    setDryRunResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = dryRun 
        ? `/api/import/products?dryRun=true`
        : `/api/import/products`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        addToast(data.error || 'Import thất bại', 'error');
        if (dryRun) setDryRunResult({ error: data.error, errors: data.errors || [] });
        else setResult({ error: data.error, errors: data.errors || [] });
      } else {
        if (dryRun) {
          setDryRunResult(data);
          addToast(`Dry-run: ${data.validRows} dòng hợp lệ`, 'info');
        } else {
          setResult(data);
          addToast(`✅ Import thành công ${data.imported} sản phẩm!`, 'success');
        }
      }
    } catch (err) {
      addToast('Lỗi kết nối server: ' + err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async (format) => {
    try {
      const res = await fetch(`/api/import/template?format=${format}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-import-template.${format === 'csv' ? 'csv' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Đã tải template', 'success');
    } catch (err) {
      addToast('Lỗi tải template', 'error');
    }
  };

  return (
    <div className="import-manager">
      <style>{`
        .import-manager {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          max-width: 800px;
          margin: 0 auto;
        }
        .import-manager h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #1a1a2e;
        }
        .import-manager .subtitle {
          color: #666;
          margin: 0 0 24px 0;
          font-size: 0.95rem;
        }
        .dropzone {
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          padding: 40px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #fafafa;
        }
        .dropzone:hover,
        .dropzone.dragging {
          border-color: #ff7a1a;
          background: #fff7ed;
        }
        .dropzone.dragging {
          transform: scale(1.01);
        }
        .dropzone.has-file {
          border-color: #22c55e;
          background: #f0fdf4;
        }
        .dropzone-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          color: #9ca3af;
        }
        .dropzone.dragging .dropzone-icon {
          color: #ff7a1a;
        }
        .dropzone.has-file .dropzone-icon {
          color: #22c55e;
        }
        .dropzone p {
          margin: 0;
          color: #666;
        }
        .dropzone .highlight {
          color: #ff7a1a;
          font-weight: 600;
        }
        .file-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 8px;
        }
        .file-info .name {
          font-weight: 600;
          color: #1a1a2e;
        }
        .file-info .size {
          color: #666;
          font-size: 0.85rem;
        }
        .file-info .remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #ef4444;
          padding: 4px;
        }
        .file-info .remove-btn:hover {
          color: #dc2626;
        }
        .actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        .actions button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-import {
          background: #ff7a1a;
          color: white;
        }
        .btn-import:hover {
          background: #e66a0e;
        }
        .btn-import:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-dry-run {
          background: #f3f4f6;
          color: #374151;
        }
        .btn-dry-run:hover {
          background: #e5e7eb;
        }
        .btn-template {
          background: transparent;
          color: #ff7a1a;
          border: 1px solid #ff7a1a !important;
        }
        .btn-template:hover {
          background: #fff7ed;
        }
        .template-links {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }
        .template-links button {
          background: none;
          border: none;
          color: #ff7a1a;
          cursor: pointer;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .template-links button:hover {
          background: #fff7ed;
        }
        .result-box {
          margin-top: 20px;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid;
        }
        .result-box.success {
          background: #f0fdf4;
          border-color: #bbf7d0;
          color: #166534;
        }
        .result-box.error {
          background: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
        }
        .result-box.warning {
          background: #fffbeb;
          border-color: #fde68a;
          color: #92400e;
        }
        .result-box h4 {
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .result-box .stats {
          display: flex;
          gap: 16px;
          margin: 8px 0;
        }
        .result-box .stats span {
          font-size: 0.9rem;
        }
        .result-box .stats strong {
          font-size: 1.2rem;
        }
        .error-list {
          margin: 8px 0 0 0;
          padding-left: 20px;
          font-size: 0.85rem;
        }
        .error-list li {
          margin: 4px 0;
        }
      `}</style>

      <h2>📦 Import sản phẩm hàng loạt</h2>
      <p className="subtitle">
        Upload file CSV hoặc Excel để import sản phẩm vào cửa hàng
        — hỗ trợ tới 500 sản phẩm mỗi lần
      </p>

      {/* Step 1: Download Template */}
      <div className="template-links">
        <span style={{ color: '#666', fontSize: '0.9rem', marginRight: 8 }}>📄 Tải template:</span>
        <button onClick={() => downloadTemplate('csv')}>
          <FileDown size={16} /> CSV
        </button>
        <button onClick={() => downloadTemplate('excel')}>
          <FileDown size={16} /> Excel (.xlsx)
        </button>
      </div>

      {/* Step 2: Upload */}
      <div
        className={`dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        {!file ? (
          <>
            <Upload className="dropzone-icon" />
            <p>
              Kéo thả file vào đây, hoặc <span className="highlight">chọn file</span>
            </p>
            <p style={{ fontSize: '0.85rem', marginTop: 8, color: '#999' }}>
              Hỗ trợ: CSV, XLSX, XLS — Tối đa 10MB
            </p>
          </>
        ) : (
          <div className="file-info">
            <FileText size={24} color="#22c55e" />
            <span className="name">{file.name}</span>
            <span className="size">({(file.size / 1024).toFixed(1)} KB)</span>
            <button className="remove-btn" onClick={(e) => { e.stopPropagation(); removeFile(); }}>
              <X size={18} />
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* Step 3: Action Buttons */}
      {file && (
        <div className="actions">
          <button className="btn-import" onClick={() => importProducts(false)} disabled={importing}>
            {importing ? <Loader size={18} className="spin" /> : <Upload size={18} />}
            {importing ? 'Đang import...' : '🚀 Import sản phẩm'}
          </button>
          <button className="btn-dry-run" onClick={() => importProducts(true)} disabled={importing}>
            <AlertCircle size={18} />
            Kiểm tra trước (Dry-run)
          </button>
          <button className="btn-template" onClick={() => fileInputRef.current?.click()}>
            <FileText size={18} />
            Chọn file khác
          </button>
        </div>
      )}

      {/* Step 4: Results */}
      {result && !result.error && (
        <div className="result-box success">
          <h4><CheckCircle size={20} /> Import thành công!</h4>
          <div className="stats">
            <span>Đã import: <strong>{result.imported}</strong> sản phẩm</span>
          </div>
          {result.warnings?.length > 0 && (
            <ul className="error-list">
              {result.warnings.map((w, i) => <li key={i}>⚠️ {w}</li>)}
            </ul>
          )}
        </div>
      )}

      {result?.error && (
        <div className="result-box error">
          <h4><AlertCircle size={20} /> Import thất bại</h4>
          <p>{result.error}</p>
          {result.errors?.length > 0 && (
            <ul className="error-list">
              {result.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}

      {dryRunResult && !dryRunResult.error && (
        <div className="result-box warning">
          <h4><CheckCircle size={20} /> Dry-run kết quả</h4>
          <div className="stats">
            <span>Tổng dòng: <strong>{dryRunResult.totalRows}</strong></span>
            <span>Hợp lệ: <strong>{dryRunResult.validRows}</strong></span>
          </div>
          {dryRunResult.warnings?.length > 0 && (
            <ul className="error-list">
              {dryRunResult.warnings.map((w, i) => <li key={i}>⚠️ {w}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
