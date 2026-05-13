import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { formatVND } from '../utils/format';

const STORAGE_KEY = 'trongdinhstore:recentlyViewed';

function RecentlyViewed() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      setItems([]);
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="section recently-viewed" aria-labelledby="recent-heading">
      <div className="section-heading">
        <span className="section-kicker"><Clock size={16} aria-hidden /> Vừa xem</span>
        <h2 id="recent-heading">Sản phẩm bạn đã xem gần đây</h2>
      </div>
      <div className="recent-grid">
        {items.map((p) => (
          <Link to={`/san-pham/${p.slug}`} className="recent-card" key={p.id}>
            <img src={p.image} alt={p.name} loading="lazy" />
            <div>
              <strong>{p.name}</strong>
              <span>{formatVND(p.price)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default memo(RecentlyViewed);
