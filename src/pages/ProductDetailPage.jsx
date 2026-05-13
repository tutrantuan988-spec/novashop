import { memo, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Heart, Minus, Plus, Share2, Shield, ShoppingCart, Star, Truck } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import { useCart } from '../context/CartContext';
import SITE from '../config/site-config';
import ProductCard from '../components/ProductCard';
import ProductReviews from '../components/ProductReviews';
import SEO from '../components/SEO';
import { formatVND } from '../utils/format';

function ProductDetailPage() {
  const { slug } = useParams();
  const { items } = useProducts();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const product = useMemo(() => items.find((p) => p.slug === slug), [items, slug]);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
    setSelectedColor(product?.colors?.[0] ?? null);
    setSelectedSize(product?.sizes?.[0] ?? null);
    if (product) {
      document.title = `${product.name} - ${SITE.name}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Track recently viewed
      try {
        const key = 'trongdinhstore:recentlyViewed';
        const raw = window.localStorage.getItem(key);
        const list = raw ? JSON.parse(raw) : [];
        const next = [{ id: product.id, slug: product.slug, name: product.name, image: product.image, price: product.price }, ...list.filter((p) => p.id !== product.id)].slice(0, 8);
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {}
    }
  }, [product]);

  const related = useMemo(() => {
    if (!product) return [];
    return items.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);
  }, [items, product]);

  if (!product) {
    return (
      <section className="section detail-missing">
        <h1>Sản phẩm không tồn tại</h1>
        <p>Sản phẩm bạn tìm có thể đã được gỡ. Hãy quay lại trang chủ để xem thêm sản phẩm khác.</p>
        <Link to="/" className="primary-button">Về trang chủ</Link>
      </section>
    );
  }

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.gallery || [product.image],
    sku: String(product.id),
    brand: { '@type': 'Brand', name: SITE.name },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'VND',
      price: product.price,
      availability: (product.stock ?? 1) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount || 1
    } : undefined
  };

  return (
    <section className="section product-detail">
      <SEO
        title={`${product.name} - ${SITE.name}`}
        description={product.description}
        image={product.image}
        type="product"
        jsonLd={productJsonLd}
        jsonLdId="product-jsonld"
      />
      <button type="button" className="back-link" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} aria-hidden /> Quay lại
      </button>

      <div className="detail-grid">
        <div className="detail-gallery">
          <div className="main-image">
            <img src={product.gallery?.[activeImage] || product.image} alt={product.name} />
            <span className="badge">{product.badge}</span>
          </div>
          {product.gallery && product.gallery.length > 1 && (
            <div className="thumbnails" role="tablist" aria-label="Ảnh sản phẩm">
              {product.gallery.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  role="tab"
                  aria-selected={activeImage === index}
                  className={activeImage === index ? 'thumb active' : 'thumb'}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={src} alt={`Ảnh ${index + 1} của ${product.name}`} loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <span className="section-kicker">{product.category}</span>
          <h1>{product.name}</h1>
          <div className="detail-meta">
            <span className="rating"><Star size={16} fill="currentColor" aria-hidden /> {product.rating} ({product.reviewCount} đánh giá)</span>
            <span className="stock">Còn {product.stock} sản phẩm</span>
          </div>

          <div className="detail-price">
            <strong>{formatVND(product.price)}</strong>
            {product.oldPrice ? <span>{formatVND(product.oldPrice)}</span> : null}
          </div>

          <p className="detail-description">{product.description}</p>

          {product.colors && product.colors.length > 0 && (
            <div className="option-group" role="radiogroup" aria-label="Chọn màu">
              <h2>Màu sắc</h2>
              <div className="colors">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    role="radio"
                    aria-checked={selectedColor === color}
                    aria-label={`Màu ${color}`}
                    className={selectedColor === color ? 'color active' : 'color'}
                    style={{ background: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div className="option-group" role="radiogroup" aria-label="Chọn kích thước">
              <h2>Kích thước</h2>
              <div className="sizes">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    role="radio"
                    aria-checked={selectedSize === size}
                    className={selectedSize === size ? 'size active' : 'size'}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="option-group">
            <h2>Số lượng</h2>
            <div className="quantity quantity-lg">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Giảm"><Minus size={16} /></button>
              <span aria-live="polite">{quantity}</span>
              <button type="button" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} aria-label="Tăng"><Plus size={16} /></button>
            </div>
          </div>

          <div className="detail-actions">
            <button type="button" className="primary-button" onClick={() => addToCart(product, quantity)}>
              <ShoppingCart size={18} aria-hidden /> Thêm vào giỏ
            </button>
            <button type="button" className="secondary-button" aria-label="Yêu thích"><Heart size={18} /></button>
            <button type="button" className="secondary-button" aria-label="Chia sẻ"><Share2 size={18} /></button>
          </div>

          <ul className="detail-policy">
            <li><Truck size={16} aria-hidden /> Giao nhanh 24-48h toàn quốc</li>
            <li><CheckCircle2 size={16} aria-hidden /> Cam kết hàng chính hãng</li>
            <li><Shield size={16} aria-hidden /> Đổi trả miễn phí trong 7 ngày</li>
          </ul>
        </div>
      </div>

      <ProductReviews productId={product.id} />

      {related.length > 0 && (
        <div className="related-section">
          <h2>Sản phẩm liên quan</h2>
          <div className="product-grid">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default memo(ProductDetailPage);
