import { useState, useMemo } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';

export default function FilterSidebar({ products, onFilterChange, isOpen, onClose }) {
  const brands = useMemo(() => {
    const set = new Set();
    products?.forEach(p => { if (p.brand) set.add(p.brand); });
    return [...set].sort();
  }, [products]);

  const dynamicAttrs = useMemo(() => {
    const map = {};
    products?.forEach(p => {
      if (p._pg?.attributes) {
        const attrs = Array.isArray(p._pg.attributes) ? p._pg.attributes : Object.values(p._pg.attributes);
        attrs.forEach(a => {
          const label = a.attribute_name_vi || '';
          const val = a.value_text || '';
          if (label && val && !['badge', 'brand', 'weight'].includes(a.attribute_slug)) {
            if (!map[label]) map[label] = { slug: a.attribute_slug, options: new Set() };
            map[label].options.add(val);
          }
        });
      }
    });
    return Object.entries(map).map(([name, data]) => ({ name, slug: data.slug, options: [...data.options].sort() }));
  }, [products]);

  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [sortBy, setSortBy] = useState('default');

  useMemo(() => {
    let filtered = [...(products || [])];
    if (priceMin) filtered = filtered.filter(p => p.price >= Number(priceMin));
    if (priceMax) filtered = filtered.filter(p => p.price <= Number(priceMax));
    if (selectedBrands.length > 0) filtered = filtered.filter(p => selectedBrands.includes(p.brand));
    Object.entries(selectedAttrs).forEach(([attrName, vals]) => {
      if (vals.length === 0) return;
      filtered = filtered.filter(p => {
        const attrs = Array.isArray(p._pg?.attributes) ? p._pg.attributes : Object.values(p._pg?.attributes || {});
        return attrs.some(a => vals.includes(a.value_text));
      });
    });
    if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    else if (sortBy === 'newest') filtered.sort((a, b) => new Date(b._pg?.created_at || 0) - new Date(a._pg?.created_at || 0));
    else filtered.sort((a, b) => (b._pg?.is_featured ? 1 : 0) - (a._pg?.is_featured ? 1 : 0));

    onFilterChange(filtered);
  }, [products, priceMin, priceMax, selectedBrands, selectedAttrs, sortBy, onFilterChange]);

  const clearAll = () => {
    setPriceMin(''); setPriceMax(''); setSelectedBrands([]); setSelectedAttrs({}); setSortBy('default');
  };

  const hasFilters = priceMin || priceMax || selectedBrands.length > 0 || Object.values(selectedAttrs).some(v => v.length > 0);

  return (
    <>
      <div className={`filter-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <aside className={`filter-sidebar ${isOpen ? 'active' : ''}`}>
        <div className="filter-header">
          <h3><SlidersHorizontal size={16} /> Bộ lọc</h3>
          <button className="filter-close" onClick={onClose} aria-label="Đóng"><X size={20} /></button>
        </div>

        <div className="filter-section">
          <h4>Sắp xếp</h4>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="filter-select">
            <option value="default">Mặc định</option>
            <option value="newest">Mới nhất</option>
            <option value="price-asc">Giá: Thấp → Cao</option>
            <option value="price-desc">Giá: Cao → Thấp</option>
          </select>
        </div>

        <div className="filter-section">
          <h4>Khoảng giá</h4>
          <div className="filter-price-range">
            <input type="number" placeholder="Từ" value={priceMin} onChange={e => setPriceMin(e.target.value)} min="0" />
            <span>—</span>
            <input type="number" placeholder="Đến" value={priceMax} onChange={e => setPriceMax(e.target.value)} min="0" />
          </div>
        </div>

        {brands.length > 0 && (
          <div className="filter-section">
            <h4>Thương hiệu</h4>
            <div className="filter-checkboxes">
              {brands.map(b => (
                <label key={b} className="filter-checkbox">
                  <input type="checkbox" checked={selectedBrands.includes(b)}
                    onChange={() => setSelectedBrands(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b])} />
                  <span>{b.charAt(0).toUpperCase() + b.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {dynamicAttrs.map(({ name, slug, options }) => (
          <div key={slug || name} className="filter-section">
            <h4>{name}</h4>
            <div className="filter-checkboxes">
              {options.map(opt => (
                <label key={opt} className="filter-checkbox">
                  <input type="checkbox" checked={(selectedAttrs[name] || []).includes(opt)}
                    onChange={() => setSelectedAttrs(p => {
                      const cur = p[name] || [];
                      const next = cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt];
                      return { ...p, [name]: next };
                    })} />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

        {hasFilters && (
          <button className="filter-clear" onClick={clearAll}>Xoá tất cả bộ lọc</button>
        )}
      </aside>
    </>
  );
}
