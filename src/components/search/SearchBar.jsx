import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';
import { searchProducts } from '../../lib/searchClient';
import { formatVND } from '../../utils/format';

const DEBOUNCE_MS = 300;

/**
 * SearchBar (P8) - autocomplete with debounce + dropdown
 */
function SearchBar({ placeholder = 'Tìm thức ăn, đồ chơi, phụ kiện...', onResult }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await searchProducts(query, { hitsPerPage: 6 });
        setHits(result.hits || []);
        if (typeof onResult === 'function') onResult(result);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [query, onResult]);

  // Close dropdown khi click ra ngoài
  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const submitSearch = useCallback((e) => {
    e?.preventDefault?.();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    navigate(`/tim-kiem?q=${encodeURIComponent(q)}`);
  }, [query, navigate]);

  const highlight = useCallback((text) => {
    if (!query.trim()) return text;
    const idx = String(text || '').toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark>{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  }, [query]);

  return (
    <div className="searchbar" ref={wrapperRef}>
      <form onSubmit={submitSearch} className="searchbar-form" role="search">
        <SearchIcon size={18} className="searchbar-icon" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          aria-label="Tìm sản phẩm"
        />
        {query && (
          <button type="button" className="searchbar-clear" onClick={() => setQuery('')} aria-label="Xóa">
            <X size={16} />
          </button>
        )}
      </form>

      {open && query.trim() && (
        <div className="searchbar-dropdown" role="listbox">
          {loading && <div className="searchbar-status">Đang tìm...</div>}
          {!loading && hits.length === 0 && (
            <div className="searchbar-status">Không tìm thấy kết quả</div>
          )}
          {!loading && hits.map((hit) => (
            <Link
              key={hit.objectID || hit.id}
              to={`/san-pham/${hit.slug || hit.objectID || hit.id}`}
              className="searchbar-item"
              role="option"
              onClick={() => setOpen(false)}
            >
              {hit.image && <img src={hit.image} alt="" loading="lazy" />}
              <div className="searchbar-item-body">
                <strong>{highlight(hit.name)}</strong>
                {hit.brand && <small>{hit.brand}</small>}
              </div>
              <span className="searchbar-item-price">{formatVND(hit.price)}</span>
            </Link>
          ))}
          {!loading && hits.length > 0 && (
            <button type="button" className="searchbar-more" onClick={submitSearch}>
              Xem tất cả kết quả cho "{query}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(SearchBar);
