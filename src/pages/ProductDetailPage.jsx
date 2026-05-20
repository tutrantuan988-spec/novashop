import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard, Heart, Minus, Plus, Share2, Shield, ShoppingCart, Star, Truck, Loader } from 'lucide-react';
import { fetchProductBySlug, fetchRelatedProducts } from '../services/apiV2';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import SITE from '../config/site-config';
import ProductCard from '../components/ProductCard';
import ProductReviews from '../components/ProductReviews';
import SocialProof from '../components/SocialProof';
import SEO from '../components/SEO';
import { formatVND } from '../utils/format';

function extractAttributes(product) {
  const map = {};
  const pga = product._pg?.attributes;
  if (Array.isArray(pga)) {
    pga.forEach(a => {
      if (a.attribute_name_vi && a.value_text && !['badge','brand'].includes(a.attribute_slug)) {
        map[a.attribute_name_vi] = a.value_text;
      }
    });
  } else if (pga && typeof pga === 'object') {
    Object.values(pga).forEach(a => {
      if (a.attribute_name_vi && a.value_text && !['badge','brand'].includes(a.attribute_slug)) {
        map[a.attribute_name_vi] = a.value_text;
      }
    });
  }
  return map;
}

const badgeColors = {
  'bán chạy': '#22c55e',
  'giảm giá': '#ef4444',
  'mới': '#3b82f6',
  'hot': '#f97316',
  'sale': '#ef4444',
  'new': '#3b82f6',
  'trending': '#8b5cf6',
};

function ProductDetailPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [activeImage, setActiveImage] = useState(0);
  const [pgImages, setPgImages] = useState([]);
  const [pgImagesLoading, setPgImagesLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  // Derive current stock from selected variant or total stock
  const currentStock = useMemo(() => {
    if (selectedVariant) return selectedVariant.stock;
    if (product?.variants?.length > 0) {
      return product.variants.reduce((sum, v) => sum + v.stock, 0);
    }
    return product?.stock ?? 0;
  }, [product, selectedVariant]);

  // Stock status helpers
  const stockStatus = useMemo(() => {
    if (currentStock <= 0) return { label: 'Hết hàng', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    if (currentStock <= 10) return { label: `Sắp hết — còn ${currentStock}`, color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
    return { label: `Còn ${currentStock} sản phẩm`, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
  }, [currentStock]);

  // Current price from selected variant
  const currentPrice = useMemo(() => {
    if (selectedVariant) return selectedVariant.price || product?.price;
    return product?.price;
  }, [product, selectedVariant]);

  const currentOldPrice = useMemo(() => {
    if (selectedVariant) {
      const sp = selectedVariant.salePrice;
      if (sp > (selectedVariant.price || product?.price)) return sp;
    }
    return product?.oldPrice;
  }, [product, selectedVariant]);

  const handleSelectVariant = useCallback((variant) => {
    setSelectedVariant(variant);
    setQuantity(1);
    // Update image if variant has one
    if (variant.image && activeImage === 0) {
      // variant image is available but we keep main gallery
    }
  }, [activeImage]);

  const renderVariantGroup = useCallback((attrName, label) => {
    const seen = new Set();
    const items = product?.variants?.filter(v => {
      const attr = v.attributes?.find(a => a.attribute_slug === attrName);
      if (!attr || seen.has(attr.value_text)) return false;
      seen.add(attr.value_text);
      return true;
    });
    if (!items || items.length <= 1) return null;
    return (
      <div className="variant-group">
        <h4>{label}</h4>
        <div className="variant-options">
          {items.map(v => {
            const attr = v.attributes?.find(a => a.attribute_slug === attrName);
            if (!attr) return null;
            const isSelected = selectedVariant?.id === v.id;
            return (
              <button
                key={v.id}
                className={`variant-btn ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectVariant(v)}
                disabled={v.stock <= 0}
              >
                {attr.value_text}
              </button>
            );
          })}
        </div>
      </div>
    );
  }, [product, selectedVariant, handleSelectVariant]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setActiveImage(0);
    setQuantity(1);
    setSelectedVariant(null);

    fetchProductBySlug(slug)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setProduct(result);
          // Auto-select the first variant (default or first available)
          if (result.variants?.length > 0) {
            const defaultV = result.variants.find((v) => v.isDefault) || result.variants[0];
            setSelectedVariant(defaultV);
          }
          setSelectedColor(result.colors?.[0] ?? null);
          setSelectedSize(result.sizes?.[0] ?? null);
          document.title = `${result.name} - ${SITE.name}`;
          window.scrollTo({ top: 0, behavior: 'smooth' });

          // Fetch PG product images for the gallery
          setPgImagesLoading(true);
          fetch(`/api/products/${result.id}/images`)
            .then(r => r.json())
            .then(data => {
              if (Array.isArray(data) && data.length > 0) {
                setPgImages(data);
              }
              setPgImagesLoading(false);
            })
            .catch(() => setPgImagesLoading(false));

          // Track recently viewed (once per product load)
          try {
            const key = 'trongdinhstore:recentlyViewed';
            const raw = window.localStorage.getItem(key);
            const list = raw ? JSON.parse(raw) : [];
            const firstImage = result.image;
            const next = [{ id: result.id, slug: result.slug, name: result.name, image: firstImage, price: result.price }, ...list.filter((p) => p.id !== result.id)].slice(0, 8);
            window.localStorage.setItem(key, JSON.stringify(next));
          } catch {}

          // Fetch related products — use the product's category based slug
          fetchRelatedProducts(result.id, 3).then((r) => {
            if (!cancelled) setRelated(r.length > 0 ? r : []);
          }).catch(() => {});

          setLoading(false);
        } else {
          if (!cancelled) {
            setError(true);
            setLoading(false);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <section className="section" style={{ textAlign: 'center', padding: '80px 24px' }}>
        <Loader size={36} className="spin" style={{ opacity: 0.3, marginBottom: 16 }} />
        <p style={{ color: 'var(--muted)' }}>Đang tải sản phẩm...</p>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="section detail-missing">
        <h1>Sản phẩm không tồn tại</h1>
        <p>Sản phẩm bạn tìm có thể đã được gỡ. Hãy quay lại trang chủ để xem thêm sản phẩm khác.</p>
        <Link to="/" className="primary-button">Về trang chủ</Link>
      </section>
    );
  }

  const galleryImages = useMemo(() => {
    if (pgImages.length > 0) return pgImages.map(img => img.image_url);
    if (product.gallery?.length > 0) return product.gallery;
    if (product.image) return [product.image];
    return [];
  }, [pgImages, product]);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: galleryImages.length > 0 ? galleryImages : [product.image],
    sku: String(product.id),
    brand: { '@type': 'Brand', name: SITE.name },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'VND',
      price: currentPrice,
      availability: currentStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
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
          {product.category && (
            <Link to={`/danh-muc/${product._pg?.category_slug || ''}`} className="section-kicker" style={{ textDecoration: 'none' }}>
              {product.category}
            </Link>
          )}
          {product.brand && <span className="detail-brand" style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Thương hiệu: <strong>{product.brand}</strong></span>}
          <h1>{product.name}</h1>
          <div className="detail-meta">
            <span className="rating"><Star size={16} fill="currentColor" aria-hidden /> {product.rating} ({product.reviewCount} đánh giá)</span>
            <span
              className="stock"
              style={{
                color: stockStatus.color,
                background: stockStatus.bg,
                padding: '2px 10px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700
              }}
            >
              {stockStatus.label}
            </span>
          </div>

          <SocialProof productId={product.id} />

          <div className="detail-price">
            <strong>{formatVND(currentPrice)}</strong>
            {currentOldPrice ? <span>{formatVND(currentOldPrice)}</span> : null}
            {currentOldPrice && currentOldPrice > currentPrice && (
              <span style={{
                background: '#ef4444',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                marginLeft: 8
              }}>
                -{Math.round((1 - currentPrice / currentOldPrice) * 100)}%
              </span>
            )}
          </div>

          {product.badge && (
            <span className="product-badge" style={{ background: badgeColors[product.badge.toLowerCase()] || '#ff7a1a' }}>
              {product.badge}
            </span>
          )}

          {product._pg?.attributes && (
            <div className="product-attributes">
              <h4>Thông tin sản phẩm</h4>
              <table>
                <tbody>
                  {Object.entries(extractAttributes(product)).map(([key, val]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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

          {product.variants && product.variants.length > 1 && (
            <div className="variant-section">
              {renderVariantGroup('size', 'Kích thước')}
              {renderVariantGroup('color', 'Màu sắc')}
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
              <button type="button" onClick={() => setQuantity(Math.min(currentStock, quantity + 1))} aria-label="Tăng"><Plus size={16} /></button>
            </div>
          </div>

          <div className="detail-actions">
            <button
              type="button"
              className="primary-button"
              disabled={currentStock <= 0}
              onClick={() => addToCart(product, quantity, selectedVariant)}
              style={{
                opacity: currentStock <= 0 ? 0.5 : 1,
                cursor: currentStock <= 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <ShoppingCart size={18} aria-hidden />
              {currentStock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={currentStock <= 0}
              onClick={() => {
                addToCart(product, quantity, selectedVariant);
                navigate('/thanh-toan');
              }}
              style={{
                background: '#10b981',
                opacity: currentStock <= 0 ? 0.5 : 1,
                cursor: currentStock <= 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <CreditCard size={18} aria-hidden />
              Mua ngay
            </button>
            <button type="button" className="secondary-button" aria-label="Yêu thích" onClick={() => product && toggleWishlist(product.id)}>
              <Heart size={18} fill={product && isInWishlist(product.id) ? 'currentColor' : 'none'} />
            </button>
            <button type="button" className="secondary-button" aria-label="Chia sẻ Facebook" onClick={() => {
              window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400');
            }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>f</span>
            </button>
            <button type="button" className="secondary-button" aria-label="Chia sẻ Zalo" onClick={() => {
              window.open(`https://zalo.me/share?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(product?.name || '')}`, '_blank');
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0068ff' }}>Zalo</span>
            </button>
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
