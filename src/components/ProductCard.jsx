import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatVND } from '../utils/format';

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const liked = isWishlisted(product.id);

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
          <button type="button" onClick={() => addToCart(product)} aria-label={`Thêm ${product.name} vào giỏ`}>
            <ShoppingBag size={15} aria-hidden />
            Thêm
          </button>
        </div>
      </div>
    </article>
  );
}

export default memo(ProductCard);
