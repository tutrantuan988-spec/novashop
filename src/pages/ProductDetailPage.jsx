import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, CreditCard, Heart, Minus, Plus, Share2,
  Shield, ShoppingCart, Star, Truck, Loader, ChevronRight, ChevronDown,
  ChevronLeft, ChevronRight as ChevronRightIcon, MessageSquare,
  RotateCcw, Award, Facebook, MessageCircle
} from 'lucide-react';
import { fetchProductBySlug, fetchRelatedProducts } from '../services/apiV2';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import SITE from '../config/site-config';
import ProductCard from '../components/ProductCard';
import ProductReviews from '../components/ProductReviews';
import ProgressiveImage from '../components/ProgressiveImage';
import SocialProof from '../components/SocialProof';
import StockNotification from '../components/StockNotification';
import SEO from '../components/SEO';
import { formatVND } from '../utils/format';

function extractAttributes(product) {
  const map = {};
  
  // Hỗ trợ trực tiếp mảng attributes của sản phẩm mock/đầy đủ
  if (Array.isArray(product?.attributes)) {
    product.attributes.forEach(a => {
      if (a.key && a.value) {
        map[a.key] = a.value;
      }
    });
    if (Object.keys(map).length > 0) return map;
  }

  const pga = product?._pg?.attributes;
  if (Array.isArray(pga)) {
    pga.forEach(a => {
      if (a.attribute_name_vi && a.value_text && !['badge', 'brand'].includes(a.attribute_slug)) {
        map[a.attribute_name_vi] = a.value_text;
      }
    });
  } else if (pga && typeof pga === 'object') {
    Object.values(pga).forEach(a => {
      if (a.attribute_name_vi && a.value_text && !['badge', 'brand'].includes(a.attribute_slug)) {
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

function AccordionSection({ title, children, defaultOpen = false, icon: Icon }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="accordion-section">
      <button
        type="button"
        className="accordion-trigger"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="accordion-trigger-left">
          {Icon && <Icon size={18} aria-hidden />}
          <span>{title}</span>
        </div>
        <ChevronDown
          size={18}
          className={`accordion-chevron ${open ? 'open' : ''}`}
          aria-hidden
        />
      </button>
      <div className={`accordion-content ${open ? 'open' : ''}`}>
        <div className="accordion-inner">{children}</div>
      </div>
    </div>
  );
}

function ProductDetailPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const navigate = useNavigate();
  const galleryRef = useRef(null);

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
  const [imageZoom, setImageZoom] = useState(false);

  const currentStock = useMemo(() => {
    if (selectedVariant) return selectedVariant.stock;
    if (product?.variants?.length > 0) {
      return product.variants.reduce((sum, v) => sum + v.stock, 0);
    }
    return product?.stock ?? 0;
  }, [product, selectedVariant]);

  const stockStatus = useMemo(() => {
    if (currentStock <= 0) return { label: 'Hết hàng', variant: 'out' };
    if (currentStock <= 10) return { label: `Sắp hết — còn ${currentStock}`, variant: 'low' };
    return { label: `Còn ${currentStock} sản phẩm`, variant: 'in' };
  }, [currentStock]);

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

  const discountPercent = useMemo(() => {
    if (currentOldPrice && currentOldPrice > currentPrice) {
      return Math.round((1 - currentPrice / currentOldPrice) * 100);
    }
    return 0;
  }, [currentPrice, currentOldPrice]);

  const handleSelectVariant = useCallback((variant) => {
    setSelectedVariant(variant);
    setQuantity(1);
  }, []);

  const renderVariantGroup = useCallback((attrName, label) => {
    const seen = new Set();
    const items = product?.variants?.filter(v => {
      const attr = v.attributes?.find(a => a.attribute_slug === attrName);
      if (!attr || seen.has(attr.value_text)) return false;
      seen.add(attr.value_text);
      return true;
    });
    if (!items || items.length <= 1) return null;
    const isColor = attrName === 'color' || attrName === 'mau' || attrName === 'mau-sac';
    const selectedAttr = selectedVariant?.attributes?.find(a => a.attribute_slug === attrName);
    return (
      <div className="variant-group">
        <span className="variant-label">
          {label}{isColor && selectedAttr ? <strong style={{ color: 'var(--ink)', marginLeft: 6, fontWeight: 700 }}>{selectedAttr.value_text}</strong> : null}
        </span>
        <div className={`variant-options${isColor ? ' variant-options-color' : ''}`}>
          {items.map(v => {
            const attr = v.attributes?.find(a => a.attribute_slug === attrName);
            if (!attr) return null;
            const isSelected = selectedVariant?.id === v.id;
            if (isColor) {
              return (
                <button
                  key={v.id}
                  type="button"
                  title={attr.value_text}
                  aria-label={`Màu ${attr.value_text}`}
                  aria-pressed={isSelected}
                  className={`variant-color-swatch ${isSelected ? 'is-selected' : ''} ${v.stock <= 0 ? 'is-disabled' : ''}`}
                  style={{ background: attr.value_text }}
                  onClick={() => handleSelectVariant(v)}
                  disabled={v.stock <= 0}
                />
              );
            }
            return (
              <button
                key={v.id}
                className={`variant-btn ${isSelected ? 'is-selected' : ''} ${v.stock <= 0 ? 'is-disabled' : ''}`}
                onClick={() => handleSelectVariant(v)}
                disabled={v.stock <= 0}
                type="button"
              >
                {attr.value_text}
              </button>
            );
          })}
        </div>
      </div>
    );
  }, [product, selectedVariant, handleSelectVariant]);

  const scrollThumbnails = useCallback((direction) => {
    if (galleryRef.current) {
      const scrollAmount = 90;
      galleryRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }, []);

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
          if (result.variants?.length > 0) {
            const defaultV = result.variants.find((v) => v.isDefault) || result.variants[0];
            setSelectedVariant(defaultV);
          }
          setSelectedColor(result.colors?.[0] ?? null);
          setSelectedSize(result.sizes?.[0] ?? null);
          document.title = `${result.name} - ${SITE.name}`;
          window.scrollTo({ top: 0, behavior: 'smooth' });

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

          try {
            const key = 'lifestyle:recentlyViewed';
            const raw = window.localStorage.getItem(key);
            const list = raw ? JSON.parse(raw) : [];
            const firstImage = result.image;
            const next = [{ id: result.id, slug: result.slug, name: result.name, image: firstImage, price: result.price }, ...list.filter((p) => p.id !== result.id)].slice(0, 8);
            window.localStorage.setItem(key, JSON.stringify(next));
          } catch {}

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
      <section className="section product-detail-loading">
        <Loader size={36} className="spin" />
        <p>Đang tải sản phẩm...</p>
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

  const attributes = extractAttributes(product);

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

  const breadcrumbItems = [
    { label: 'Trang chủ', href: '/' },
    ...(product.category ? [{ label: product.category, href: `/danh-muc/${product._pg?.category_slug || ''}` }] : []),
    { label: product.name, href: null }
  ];

  const handleShare = useCallback((platform) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(product?.name || '');
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      zalo: `https://zalo.me/share?url=${url}&title=${title}`,
      copy: null
    };
    if (platform === 'copy') {
      navigator.clipboard?.writeText(window.location.href);
    } else if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  }, [product]);

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

      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <ol>
          {breadcrumbItems.map((item, i) => (
            <li key={i}>
              {i > 0 && <ChevronRightIcon size={14} aria-hidden />}
              {item.href ? (
                <Link to={item.href}>{item.label}</Link>
              ) : (
                <span aria-current="page">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Back link */}
      <button type="button" className="back-link" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} aria-hidden /> Quay lại
      </button>

      <div className="detail-grid">
        {/* Gallery */}
        <div className="detail-gallery">
          <div className="main-image">
            <ProgressiveImage
              src={galleryImages[activeImage] || product.image}
              alt={product.name}
              onMouseEnter={() => setImageZoom(true)}
              onMouseLeave={() => setImageZoom(false)}
            />
            {product.badge && (
              <span
                className="product-badge"
                style={{ background: badgeColors[product.badge.toLowerCase()] || '#ff7a1a' }}
              >
                {product.badge}
              </span>
            )}
            {discountPercent > 0 && (
              <span className="discount-badge">-{discountPercent}%</span>
            )}
            {galleryImages.length > 1 && (
              <div className="gallery-nav">
                <button
                  type="button"
                  className="gallery-nav-btn"
                  onClick={() => setActiveImage(i => Math.max(0, i - 1))}
                  disabled={activeImage === 0}
                  aria-label="Ảnh trước"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className="gallery-nav-btn"
                  onClick={() => setActiveImage(i => Math.min(galleryImages.length - 1, i + 1))}
                  disabled={activeImage === galleryImages.length - 1}
                  aria-label="Ảnh sau"
                >
                  <ChevronRightIcon size={20} />
                </button>
              </div>
            )}
            <span className="image-counter">{activeImage + 1} / {galleryImages.length}</span>
          </div>

          {galleryImages.length > 1 && (
            <div className="thumbnail-wrapper">
              <button
                type="button"
                className="thumb-scroll-btn"
                onClick={() => scrollThumbnails('left')}
                aria-label="Cuộn trái"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="thumbnails" ref={galleryRef} role="tablist" aria-label="Ảnh sản phẩm">
                {galleryImages.map((src, index) => (
                  <button
                    key={index}
                    type="button"
                    role="tab"
                    aria-selected={activeImage === index}
                    className={`thumb ${activeImage === index ? 'active' : ''}`}
                    onClick={() => setActiveImage(index)}
                  >
                    <ProgressiveImage src={src} alt={`Ảnh ${index + 1} của ${product.name}`} />
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="thumb-scroll-btn"
                onClick={() => scrollThumbnails('right')}
                aria-label="Cuộn phải"
              >
                <ChevronRightIcon size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="detail-info">
          {product.category && (
            <Link
              to={`/danh-muc/${product._pg?.category_slug || ''}`}
              className="section-kicker"
            >
              {product.category}
            </Link>
          )}

          <h1>{product.name}</h1>

          {product.brand && (
            <span className="detail-brand">
              Thương hiệu: <strong>{product.brand}</strong>
            </span>
          )}

          {/* Rating + Review Summary */}
          <div className="detail-meta">
            <div className="rating-summary">
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    size={16}
                    fill={n <= Math.round(product.rating || 0) ? 'currentColor' : 'none'}
                    className={n <= Math.round(product.rating || 0) ? 'filled' : ''}
                    aria-hidden
                  />
                ))}
              </div>
              <span className="rating-value">{product.rating || '0.0'}</span>
              <span className="rating-count">({product.reviewCount || 0} đánh giá)</span>
            </div>
            <span className={`stock-badge stock-${stockStatus.variant}`}>
              {stockStatus.label}
            </span>
          </div>

          <SocialProof productId={product.id} />

          {/* Price */}
          <div className="detail-price">
            <strong className="current-price-display">{formatVND(currentPrice)}</strong>
            {currentOldPrice && (
              <span className="old-price-display">{formatVND(currentOldPrice)}</span>
            )}
            {discountPercent > 0 && (
              <span className="discount-percent">-{discountPercent}%</span>
            )}
          </div>

          {/* Variant Selectors */}
          {product.variants && product.variants.length > 1 && (
            <div className="variant-section">
              {renderVariantGroup('size', 'Kích thước')}
              {renderVariantGroup('color', 'Màu sắc')}
            </div>
          )}

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
                    className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
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
                    className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="option-group">
            <h2>Số lượng</h2>
            <div className="quantity quantity-lg">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Giảm"
                disabled={quantity <= 1}
              >
                <Minus size={16} />
              </button>
              <span aria-live="polite">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                aria-label="Tăng"
                disabled={quantity >= currentStock}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="detail-actions">
            <button
              type="button"
              className="btn-add-cart primary-button"
              disabled={currentStock <= 0}
              onClick={() => addToCart(product, quantity, selectedVariant)}
            >
              <ShoppingCart size={18} aria-hidden />
              {currentStock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
            </button>
            <button
              type="button"
              className="btn-buy-now primary-button"
              disabled={currentStock <= 0}
              onClick={() => {
                addToCart(product, quantity, selectedVariant);
                navigate('/thanh-toan');
              }}
            >
              <CreditCard size={18} aria-hidden />
              Mua ngay
            </button>
            <button
              type="button"
              className={`btn-wishlist secondary-button ${product && isWishlisted(product.id) ? 'active' : ''}`}
              aria-label="Yêu thích"
              onClick={() => product && toggleWishlist(product.id)}
            >
              <Heart size={18} fill={product && isWishlisted(product.id) ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Social Share */}
          <div className="social-share">
            <span className="social-share-label">Chia sẻ:</span>
            <button
              type="button"
              className="share-btn"
              aria-label="Chia sẻ Facebook"
              onClick={() => handleShare('facebook')}
            >
              <Facebook size={16} />
            </button>
            <button
              type="button"
              className="share-btn"
              aria-label="Chia sẻ Zalo"
              onClick={() => handleShare('zalo')}
            >
              <MessageCircle size={16} />
            </button>
            <button
              type="button"
              className="share-btn"
              aria-label="Sao chép liên kết"
              onClick={() => handleShare('copy')}
            >
              <Share2 size={16} />
            </button>
          </div>

          {currentStock <= 0 && (
            <StockNotification productId={product.id} productName={product.name} />
          )}

          {/* Trust Badges */}
          <div className="trust-badges">
            <div className="trust-badge">
              <Truck size={20} aria-hidden />
              <div>
                <strong>Giao nhanh 24-48h</strong>
                <span>Toàn quốc</span>
              </div>
            </div>
            <div className="trust-badge">
              <CheckCircle2 size={20} aria-hidden />
              <div>
                <strong>Chính hãng 100%</strong>
                <span>Cam kết chất lượng</span>
              </div>
            </div>
            <div className="trust-badge">
              <RotateCcw size={20} aria-hidden />
              <div>
                <strong>Đổi trả 7 ngày</strong>
                <span>Miễn phí đổi trả</span>
              </div>
            </div>
            <div className="trust-badge">
              <Shield size={20} aria-hidden />
              <div>
                <strong>Bảo vệ người mua</strong>
                <span>Hoàn tiền nếu không nhận hàng</span>
              </div>
            </div>
          </div>

          {/* Expandable Sections */}
          <div className="product-accordion">
            <AccordionSection title="Mô tả sản phẩm" defaultOpen icon={MessageSquare}>
              <p className="detail-description">{product.description}</p>
            </AccordionSection>

            {Object.keys(attributes).length > 0 && (
              <AccordionSection title="Thông số kỹ thuật" icon={Award}>
                <table className="attributes-table">
                  <tbody>
                    {Object.entries(attributes).map(([key, val]) => (
                      <tr key={key}>
                        <td>{key}</td>
                        <td>{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AccordionSection>
            )}

            <AccordionSection title="Chính sách đổi trả" icon={RotateCcw}>
              <ul className="policy-list">
                <li>Đổi trả miễn phí trong vòng 7 ngày kể từ ngày nhận hàng</li>
                <li>Sản phẩm còn nguyên tem mác, chưa qua sử dụng</li>
                <li>Liên hệ hotline để được hỗ trợ đổi trả nhanh chóng</li>
              </ul>
            </AccordionSection>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <ProductReviews productId={product.id} />

      {/* Related Products */}
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
