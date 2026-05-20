import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Scale } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useComparison } from '../context/ComparisonContext';
import { formatVND } from '../utils/format';

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { isInCompare, addToCompare, removeFromCompare } = useComparison();
  const liked = isWishlisted(product.id);
  const comparing = isInCompare(product.id);

  return (
    <article className="product-card">
      <Link to={`/san-pham/${product.slug}`} className="product-image" aria-label={`Xem chi tiết ${product.name}`}>
        <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
        <span>{product.badge}</span>
        <button
          type="button"
          aria-label={liked ? 'Bỏ yêu thích' : 'Yêu thích'}
          aria-pressed={liked}
          className={liked ? 'wishlist-btn liked' : 'wishlist-btn'}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleWishlist(product.id);
          }}
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
        </button>
      </Link>
      <div className="product-info">
        <div className="product-meta">
          <p>{product.category}</p>
          <span>Nova Select</span>
        </div>
        <h3>
          <Link to={`/san-pham/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="product-short">{product.description}</p>
        <div className="rating" aria-label={`Đánh giá ${product.rating} trên 5`}>
          <Star size={16} fill="currentColor" aria-hidden /> {product.rating}
          <span className="review-count">({product.reviewCount || 0})</span>
        </div>
        <div className="price-row">
          <div>
            <strong>{formatVND(product.price)}</strong>
            {product.oldPrice ? <span>{formatVND(product.oldPrice)}</span> : null}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => comparing ? removeFromCompare(product.id) : addToCompare(product)}
              aria-label={comparing ? 'Bỏ so sánh' : 'Thêm so sánh'}
              style={{
                border: '1.5px solid var(--border)',
                background: comparing ? 'var(--accent)' : 'transparent',
                color: comparing ? '#fff' : 'var(--muted)',
                padding: '6px 8px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
            >
              <Scale size={15} aria-hidden />
            </button>
            <button type="button" onClick={() => addToCart(product)} aria-label={`Thêm ${product.name} vào giỏ`}>
              <ShoppingBag size={15} aria-hidden />
              Thêm
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default memo(ProductCard);
