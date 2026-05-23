import { useState, useEffect } from 'react';

const FIELD_MAPPING = {
  text: (field, value, onChange) => (
    <input
      type="text"
      id={field.key}
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      required={field.required}
      className="form-input"
    />
  ),
  number: (field, value, onChange) => (
    <input
      type="number"
      id={field.key}
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      required={field.required}
      className="form-input"
    />
  ),
  select: (field, value, onChange) => (
    <select
      id={field.key}
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      required={field.required}
      className="form-select"
    >
      <option value="">-- Chọn --</option>
      {(field.options || []).map((opt) => (
        <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
          {typeof opt === 'string' ? opt : opt.label}
        </option>
      ))}
    </select>
  ),
  boolean: (field, value, onChange) => (
    <label className="form-checkbox-label">
      <input
        type="checkbox"
        id={field.key}
        checked={!!value}
        onChange={(e) => onChange(field.key, e.target.checked)}
        className="form-checkbox"
      />
      {field.label}
    </label>
  ),
  date: (field, value, onChange) => (
    <input
      type="date"
      id={field.key}
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      required={field.required}
      className="form-input"
    />
  )
};

export default function DynamicProductForm({ categoryId, onFieldsChange, initialValues }) {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [values, setValues] = useState(initialValues || {});

  useEffect(() => {
    if (!categoryId) {
      setLoading(false);
      setSchema(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/categories/${categoryId}/schema`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Không thể tải schema`);
        return res.json();
      })
      .then((data) => {
        setSchema(data);
        // Initialize values from initialValues or defaults
        const initial = {};
        data.fields.forEach((f) => {
          initial[f.key] = initialValues?.[f.key] ?? (f.type === 'boolean' ? false : '');
        });
        setValues(initial);
        onFieldsChange?.(initial);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [categoryId, initialValues, onFieldsChange]);

  const handleChange = (key, val) => {
    const next = { ...values, [key]: val };
    setValues(next);
    onFieldsChange?.(next);
  };

  if (!categoryId) {
    return <p className="form-placeholder">Vui lòng chọn danh mục sản phẩm</p>;
  }

  if (loading) {
    return (
      <div className="form-loading" role="status">
        <div className="spinner" aria-hidden />
        <span>Đang tải thông tin danh mục...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="form-error-message" role="alert">
        <strong>Lỗi:</strong> {error}
      </div>
    );
  }

  if (!schema || !schema.fields || schema.fields.length === 0) {
    return <p className="form-placeholder">Danh mục này chưa có thuộc tính nào</p>;
  }

  return (
    <div className="dynamic-form">
      <p className="form-category-label">
        Danh mục: <strong>{schema.category?.name}</strong>
      </p>
      {schema.fields.map((field) => {
        const renderer = FIELD_MAPPING[field.type] || FIELD_MAPPING.text;
        return (
          <div key={field.key} className="form-group">
            <label htmlFor={field.key} className="form-label">
              {field.label}
              {field.required && <span className="form-required">*</span>}
            </label>
            {renderer(field, values[field.key], handleChange)}
          </div>
        );
      })}
    </div>
  );
}
