import { memo, useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listVariantsApi } from '../../services/api';
import { formatVND } from '../../utils/format';

/**
 * VariantSelector
 * - Group attributes thành button group (không dropdown)
 * - Disable combinations không tồn tại / hết hàng
 * - Sync selectedVariantId vào URL ?variant=xxx
 * - Callback onChange khi user chọn variant hợp lệ
 *
 * @param {{ productId: string, basePrice: number, baseStock: number, baseImages?: string[], onChange?: (variant: object|null) => void }} props
 */
function VariantSelector({ productId, basePrice = 0, baseStock = 0, baseImages = [], onChange }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAttrs, setSelectedAttrs] = useState({}); // { weight: '5kg', flavor: 'Gà' }
  const [searchParams, setSearchParams] = useSearchParams();

  // Load variants
  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    setLoading(true);
    listVariantsApi(productId)
      .then((list) => {
        if (cancelled) return;
        const active = (list || []).filter((v) => v.status !== 'inactive');
        setVariants(active);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [productId]);

  // Tổng hợp danh sách attribute keys + values
  const attributeMap = useMemo(() => {
    const map = {}; // { weight: Set('5kg', '10kg'), flavor: Set(...) }
    for (const v of variants) {
      const attrs = v.attributes || {};
      for (const [k, val] of Object.entries(attrs)) {
        if (!map[k]) map[k] = new Set();
        map[k].add(val);
      }
    }
    return Object.fromEntries(Object.entries(map).map(([k, set]) => [k, Array.from(set)]));
  }, [variants]);

  const attributeKeys = useMemo(() => Object.keys(attributeMap), [attributeMap]);

  // Khôi phục selection từ URL khi mount
  useEffect(() => {
    const variantId = searchParams.get('variant');
    if (variantId && variants.length > 0) {
      const found = variants.find((v) => v.id === variantId);
      if (found) {
        setSelectedAttrs(found.attributes || {});
      }
    }
  }, [variants, searchParams]);

  // Tìm variant matching selectedAttrs hoàn chỉnh
  const matchedVariant = useMemo(() => {
    if (Object.keys(selectedAttrs).length !== attributeKeys.length) return null;
    return variants.find((v) => {
      const attrs = v.attributes || {};
      return attributeKeys.every((k) => attrs[k] === selectedAttrs[k]);
    }) || null;
  }, [variants, selectedAttrs, attributeKeys]);

  // Notify parent khi matched variant thay đổi
  useEffect(() => {
    if (typeof onChange === 'function') {
      onChange(matchedVariant);
    }
    // Sync URL
    if (matchedVariant) {
      const next = new URLSearchParams(searchParams);
      next.set('variant', matchedVariant.id);
      setSearchParams(next, { replace: true });
    }
  }, [matchedVariant]); // eslint-disable-line react-hooks/exhaustive-deps

  const isCombinationAvailable = useCallback((attrKey, value) => {
    // Một value của attribute là khả dụng nếu tồn tại variant matching mọi attr đã chọn (trừ attrKey) + value mới + stock > 0
    const candidate = { ...selectedAttrs, [attrKey]: value };
    return variants.some((v) => {
      if ((v.stock || 0) <= 0) return false;
      const attrs = v.attributes || {};
      return Object.entries(candidate).every(([k, val]) => attrs[k] === val);
    });
  }, [variants, selectedAttrs]);

  const handlePick = (key, value) => {
    setSelectedAttrs((prev) => {
      // Nếu click vào value đang chọn → bỏ chọn
      if (prev[key] === value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  };

  if (loading) return <div className="variant-loading" aria-live="polite">Đang tải biến thể...</div>;
  if (error) return <div className="variant-error" role="alert">Lỗi: {error}</div>;
  if (variants.length === 0) return null;

  return (
    <div className="variant-selector" data-testid="variant-selector">
      {attributeKeys.map((key) => (
        <div key={key} className="variant-group">
          <label className="variant-label">{key}:</label>
          <div className="variant-options">
            {attributeMap[key].map((value) => {
              const available = isCombinationAvailable(key, value);
              const selected = selectedAttrs[key] === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={`variant-btn ${selected ? 'is-selected' : ''} ${!available ? 'is-disabled' : ''}`}
                  onClick={() => handlePick(key, value)}
                  disabled={!available && !selected}
                  title={!available ? 'Hết hàng' : undefined}
                  aria-pressed={selected}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {matchedVariant && (
        <div className="variant-info">
          <strong>Giá: {formatVND(matchedVariant.price)}</strong>
          {matchedVariant.originalPrice > matchedVariant.price && (
            <span className="variant-old-price">{formatVND(matchedVariant.originalPrice)}</span>
          )}
          <span className="variant-stock">
            {matchedVariant.stock > 0 ? `Còn ${matchedVariant.stock} sản phẩm` : 'Hết hàng'}
          </span>
          {matchedVariant.sku && <small className="variant-sku">SKU: {matchedVariant.sku}</small>}
        </div>
      )}
    </div>
  );
}

export default memo(VariantSelector);
