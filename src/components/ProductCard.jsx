import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Scale } from 'lucide-react';
import ProgressiveImage from './ProgressiveImage';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useComparison } from '../context/ComparisonContext';
import { formatVND } from '../utils/format';

const CATEGORY_IMAGES = {
  'thời trang': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85&cs=tinysrgb',
  'điện tử': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=85&cs=tinysrgb',
  'gia dụng': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=85&cs=tinysrgb',
  'sách': 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&w=900&q=85&cs=tinysrgb',
  'làm đẹp': 'https://images.unsplash.com/photo-1508704019882-f9cf40e475b4?auto=format&fit=crop&w=900&q=85&cs=tinysrgb',
  'thể thao': 'https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=900&q=85&cs=tinysrgb'
};

function resolveProductImage(product) {
  const source = String(product?.image || '').toLowerCase();
  const hasPetImage = ['dog', 'cat', 'puppy', 'pet', 'paw', 'bone', 'meo', 'cho'].some((k) => source.includes(k));
  
  // Trả về ảnh sản phẩm tùy chỉnh nếu hợp lệ và không chứa từ khóa thú cưng cũ
  if (product?.image && !hasPetImage) {
    return product.image;
  }

  // Chỉ khi không có ảnh riêng mới rơi về ảnh mặc định của danh mục
  const category = String(product?.category || '').toLowerCase();
  const categoryMatch = Object.keys(CATEGORY_IMAGES).find((k) => category.includes(k));
  if (categoryMatch) return CATEGORY_IMAGES[categoryMatch];
  
  return CATEGORY_IMAGES['thời trang'];
}

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { isInCompare, addToCompare, removeFromCompare } = useComparison();
  const liked = isWishlisted(product.id);
  const comparing = isInCompare(product.id);
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <article className="product-card" data-discount={discount > 0}>
      <Link to={`/san-pham/${product.slug}`} className="product-image-wrap" aria-label={`Xem chi tiết ${product.name}`}>
        <div className="product-image-wrapper">
          <ProgressiveImage src={resolveProductImage(product)} alt={product.name} />
        </div>

        {discount > 0 && <span className="badge badge-sale">-{discount}%</span>}
        {product.badge && !discount && <span className="badge badge-custom">{product.badge}</span>}

        <button
          type="button"
          className={`wishlist-btn ${liked ? 'liked' : ''}`}
          aria-label={liked ? 'Bỏ yêu thích' : 'Yêu thích'}
          aria-pressed={liked}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
        >
          <Heart size={18} strokeWidth={liked ? 0 : 2} fill={liked ? 'currentColor' : 'none'} />
        </button>

        <button
          type="button"
          className="quick-add-btn"
          aria-label={`Thêm ${product.name} vào giỏ`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCart(product);
          }}
        >
          <ShoppingBag size={16} />
          <span>Thêm nhanh</span>
        </button>
      </Link>

      <div className="product-info">
        {product.category && (
          <p className="product-category">{product.category}</p>
        )}
        <h3>
          <Link to={`/san-pham/${product.slug}`}>{product.name}</Link>
        </h3>

        <div className="product-rating">
          <Star size={14} fill="currentColor" aria-hidden />
          <span>{product.rating || 4.5}</span>
          <span className="review-count">({product.reviewCount || 0})</span>
          <span className="sold-dot">•</span>
          <span className="sold-count">Đã bán {product.soldCount || Math.floor(Math.random() * 500) + 50}</span>
        </div>

        <div className="product-price-row">
          <div className="price-group">
            <strong className="current-price">{formatVND(product.price)}</strong>
            {product.oldPrice && (
              <span className="old-price">{formatVND(product.oldPrice)}</span>
            )}
          </div>

          <div className="product-actions">
            <button
              type="button"
              className={`compare-btn ${comparing ? 'active' : ''}`}
              onClick={() => comparing ? removeFromCompare(product.id) : addToCompare(product)}
              aria-label={comparing ? 'Bỏ so sánh' : 'Thêm so sánh'}
            >
              <Scale size={15} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default memo(ProductCard);
