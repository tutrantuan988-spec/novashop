import { memo, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Clock3, Crown, Gem, Gift, Headphones, LockKeyhole, PackageCheck, Search, ShieldCheck, Sparkles, SlidersHorizontal, Star, Truck, X, Zap } from 'lucide-react';
import { useProducts } from '../context/ProductsContext';
import { categories, reviews } from '../data/products';
import ProductCard from '../components/ProductCard';
import { formatVND } from '../utils/format';
import SITE from '../config/site-config';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Nổi bật' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-asc', label: 'Giá: thấp → cao' },
  { value: 'price-desc', label: 'Giá: cao → thấp' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'popular', label: 'Bán chạy' }
];

function HomePage() {
  const { items } = useProducts();
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const [minRating, setMinRating] = useState(0);
  const [priceMax, setPriceMax] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    document.title = `${SITE.name} - Mua sắm thông minh, phong cách mỗi ngày`;
  }, []);

  const priceCeiling = useMemo(() => {
    if (!items.length) return 0;
    return Math.max(...items.map((p) => Number(p.price) || 0));
  }, [items]);

  useEffect(() => {
    if (priceMax === null && priceCeiling > 0) {
      setPriceMax(priceCeiling);
    }
  }, [priceCeiling, priceMax]);

  const filteredProducts = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    const cap = priceMax ?? priceCeiling;

    let list = items.filter((product) => {
      const matchesCategory = activeCategory === 'Tất cả' || product.category === activeCategory;
      const text = [product.name, product.description, product.category, ...(product.colors || []), ...(product.sizes || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesQuery = !lowerQuery || text.includes(lowerQuery);
      const matchesRating = !minRating || (Number(product.rating) || 0) >= minRating;
      const matchesPrice = !cap || (Number(product.price) || 0) <= cap;
      return matchesCategory && matchesQuery && matchesRating && matchesPrice;
    });

    list = [...list];
    switch (sort) {
      case 'newest':
        list.sort((a, b) => Number(b.id) - Number(a.id));
        break;
      case 'price-asc':
        list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case 'price-desc':
        list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case 'rating':
        list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
        break;
      case 'popular':
        list.sort((a, b) => (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0));
        break;
      default:
        break;
    }
    return list;
  }, [items, activeCategory, query, sort, minRating, priceMax, priceCeiling]);

  const topProducts = useMemo(() => items.slice(0, 4), [items]);

  const activeFilterCount = (activeCategory !== 'Tất cả' ? 1 : 0)
    + (query ? 1 : 0)
    + (minRating > 0 ? 1 : 0)
    + (priceMax !== null && priceMax < priceCeiling ? 1 : 0);

  const resetFilters = () => {
    setActiveCategory('Tất cả');
    setQuery('');
    setSort('featured');
    setMinRating(0);
    setPriceMax(priceCeiling);
  };

  const luxuryCollections = [
    {
      title: 'Signature Wardrobe',
      label: 'Thời trang tuyển chọn',
      image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80'
    },
    {
      title: 'Tech Atelier',
      label: 'Công nghệ premium',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'
    },
    {
      title: 'Travel Objects',
      label: 'Du lịch tinh tế',
      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80'
    }
  ];

  return (
    <>
      <section className="hero premium-hero" id="home">
        <div className="hero-content">
          <div className="eyebrow"><Crown size={18} aria-hidden /> {SITE.name} Privé 2026</div>
          <h1>Mua sắm chuẩn boutique, đẳng cấp trong từng trải nghiệm.</h1>
          <p>{SITE.name} nâng cấp hành trình mua sắm online với sản phẩm tuyển chọn, đóng gói sang trọng, ưu đãi cá nhân hóa và dịch vụ concierge dành cho khách hàng VIP.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#products">Khám phá bộ sưu tập <ArrowRight size={18} aria-hidden /></a>
            <a className="secondary-button" href="#concierge">Dịch vụ VIP</a>
          </div>
          <div className="hero-stats">
            <div><strong>38K+</strong><span>Khách hàng cao cấp</span></div>
            <div><strong>4.96/5</strong><span>Điểm hài lòng</span></div>
            <div><strong>2h</strong><span>Giao nội thành</span></div>
          </div>
          <div className="hero-trust">
            <span><ShieldCheck size={16} aria-hidden /> Xác thực chính hãng</span>
            <span><Gem size={16} aria-hidden /> Đóng gói premium</span>
            <span><LockKeyhole size={16} aria-hidden /> Thanh toán bảo mật</span>
          </div>
        </div>
        <div className="hero-card premium-showcase">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=80"
            alt={`Không gian mua sắm cao cấp ${SITE.name}`}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="floating-card">
            <span>Luxury drop</span>
            <strong>Private sale -45%</strong>
          </div>
          <div className="floating-card floating-card-top">
            <span>VIP concierge</span>
            <strong>Hỗ trợ 1:1</strong>
          </div>
        </div>
      </section>

      <section className="brand-strip" aria-label="Các cam kết nổi bật">
        <span>Curated Selection</span>
        <span>Luxury Packaging</span>
        <span>Same-day Delivery</span>
        <span>VIP Concierge</span>
        <span>Secure Checkout</span>
      </section>

      <section className="benefits" id="benefits" aria-label="Lợi ích khi mua sắm">
        <article><Truck aria-hidden /><div><strong>Giao hỏa tốc</strong><span>2h nội thành, 24h toàn quốc</span></div></article>
        <article><BadgeCheck aria-hidden /><div><strong>Chính hãng xác thực</strong><span>Kiểm định trước khi giao</span></div></article>
        <article><Headphones aria-hidden /><div><strong>Concierge 1:1</strong><span>Tư vấn chọn quà và phối đồ</span></div></article>
        <article><PackageCheck aria-hidden /><div><strong>Đóng gói boutique</strong><span>Hộp quà, thiệp và seal cao cấp</span></div></article>
      </section>

      <section className="section luxury-section" id="luxury" aria-labelledby="luxury-heading">
        <div className="section-heading centered">
          <div>
            <span className="section-kicker"><Gem size={16} aria-hidden /> Curated luxury</span>
            <h2 id="luxury-heading">Bộ sưu tập được tuyển chọn như một showroom cao cấp</h2>
          </div>
        </div>
        <div className="luxury-grid">
          {luxuryCollections.map((collection) => (
            <article className="luxury-card" key={collection.title}>
              <img src={collection.image} alt={collection.title} loading="lazy" decoding="async" />
              <div>
                <span>{collection.label}</span>
                <h3>{collection.title}</h3>
                <a href="#products">Xem bộ sưu tập <ArrowRight size={16} aria-hidden /></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="products" aria-labelledby="products-heading">
        <div className="section-heading">
          <div>
            <span className="section-kicker"><Sparkles size={16} aria-hidden /> Sản phẩm nổi bật</span>
            <h2 id="products-heading">Những món đáng sở hữu hôm nay</h2>
          </div>
          <div className="search-box">
            <Search size={18} aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên, mô tả, màu, size..."
              aria-label="Tìm sản phẩm"
              type="search"
            />
            {query && (
              <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Xoá tìm kiếm">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="categories" role="tablist" aria-label="Danh mục sản phẩm">
          {categories.map((category) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              className={activeCategory === category ? 'active' : ''}
              onClick={() => setActiveCategory(category)}
              key={category}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="filter-bar">
          <button
            type="button"
            className={`filter-toggle ${showFilters ? 'open' : ''}`}
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal size={16} aria-hidden /> Bộ lọc
            {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>

          <div className="sort-select">
            <label htmlFor="sort">Sắp xếp:</label>
            <select id="sort" value={sort} onChange={(event) => setSort(event.target.value)}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <span className="result-count">{filteredProducts.length} sản phẩm</span>

          {activeFilterCount > 0 && (
            <button type="button" className="filter-reset" onClick={resetFilters}>
              <X size={14} aria-hidden /> Xoá bộ lọc
            </button>
          )}
        </div>

        {showFilters && (
          <div className="filter-panel">
            <div className="filter-group">
              <label>
                <span>Giá tối đa: <strong>{formatVND(priceMax ?? priceCeiling)}</strong></span>
                <input
                  type="range"
                  min={0}
                  max={priceCeiling || 100}
                  step={Math.max(10000, Math.round((priceCeiling || 100) / 50))}
                  value={priceMax ?? priceCeiling}
                  onChange={(event) => setPriceMax(Number(event.target.value))}
                />
              </label>
            </div>
            <div className="filter-group">
              <span>Đánh giá tối thiểu</span>
              <div className="rating-pills">
                {[0, 3, 4, 4.5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={minRating === value ? 'rating-pill active' : 'rating-pill'}
                    onClick={() => setMinRating(value)}
                  >
                    {value === 0 ? 'Tất cả' : (
                      <>
                        <Star size={12} fill="currentColor" aria-hidden /> {value}+
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <p className="empty-result">Không tìm thấy sản phẩm phù hợp. Hãy thử thay đổi bộ lọc nhé.</p>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="section editorial-section" aria-labelledby="editorial-heading">
        <div className="editorial-card">
          <div>
            <span className="section-kicker"><Star size={16} aria-hidden /> Editor's pick</span>
            <h2 id="editorial-heading">Top sản phẩm được đội ngũ {SITE.name} đề xuất</h2>
            <p>Danh sách được chọn theo xu hướng, điểm đánh giá, chất lượng hoàn thiện và độ phù hợp với lối sống hiện đại.</p>
          </div>
          <div className="mini-products">
            {topProducts.map((product, index) => (
              <a href={`/san-pham/${product.slug}`} className="mini-product" key={product.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <img src={product.image} alt={product.name} loading="lazy" />
                <div>
                  <strong>{product.name}</strong>
                  <small>{product.category} · {product.rating}★</small>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="deal-section" id="deals" aria-labelledby="deal-heading">
        <div>
          <span className="section-kicker"><Zap size={16} aria-hidden /> Ưu đãi giới hạn</span>
          <h2 id="deal-heading">Private Sale dành cho thành viên mới</h2>
          <p>Nhập mã <strong>NOVA45</strong> để nhận ưu đãi lên đến 45%, kèm gói quà premium miễn phí cho đơn hàng đầu tiên.</p>
          <div className="countdown" aria-label="Đếm ngược ưu đãi">
            <span><Clock3 size={15} aria-hidden /> 12 giờ</span>
            <span>28 phút</span>
            <span>45 giây</span>
          </div>
        </div>
        <a className="primary-button" href="#products">Săn deal ngay <ArrowRight size={18} aria-hidden /></a>
      </section>

      <section className="section concierge-section" id="concierge" aria-labelledby="concierge-heading">
        <div className="concierge-panel">
          <div>
            <span className="section-kicker"><Crown size={16} aria-hidden /> {SITE.name} Concierge</span>
            <h2 id="concierge-heading">Dịch vụ mua sắm cá nhân cho khách hàng VIP</h2>
            <p>Đội ngũ concierge hỗ trợ chọn quà, phối sản phẩm, đặt lịch giao theo khung giờ, gói quà theo dịp và chăm sóc sau mua.</p>
            <a className="primary-button" href="#products">Bắt đầu trải nghiệm VIP</a>
          </div>
          <div className="concierge-list">
            <article><Gift aria-hidden /><strong>Gift advisor</strong><span>Gợi ý quà theo ngân sách và phong cách người nhận.</span></article>
            <article><ShieldCheck aria-hidden /><strong>Premium assurance</strong><span>Kiểm tra ngoại quan, phụ kiện và bảo hành trước khi giao.</span></article>
            <article><Headphones aria-hidden /><strong>Priority support</strong><span>Hỗ trợ ưu tiên qua chat, điện thoại và email.</span></article>
          </div>
        </div>
      </section>

      <section className="section reviews" id="reviews" aria-labelledby="reviews-heading">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Khách hàng nói gì</span>
            <h2 id="reviews-heading">Trải nghiệm được tin chọn</h2>
          </div>
        </div>
        <div className="review-grid">
          {reviews.slice(0, 3).map((review) => (
            <article key={review.id}>
              <div aria-label={`${review.rating} sao`}>{'★'.repeat(review.rating)}</div>
              <p>"{review.content}"</p>
              <strong>{review.name}</strong>
              <span className="reviewer-role">{review.role}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section faq-section" aria-labelledby="faq-heading">
        <div className="section-heading centered">
          <div>
            <span className="section-kicker">Câu hỏi thường gặp</span>
            <h2 id="faq-heading">Mua sắm cao cấp nhưng vẫn dễ dàng</h2>
          </div>
        </div>
        <div className="faq-grid">
          <article><h3>{SITE.name} có gói quà không?</h3><p>Có. Bạn có thể yêu cầu hộp quà, thiệp viết tay và gói theo dịp sinh nhật, kỷ niệm hoặc doanh nghiệp.</p></article>
          <article><h3>Sản phẩm có chính hãng không?</h3><p>Tất cả sản phẩm đều được kiểm định, lưu thông tin bảo hành và hỗ trợ đổi trả theo chính sách.</p></article>
          <article><h3>Có giao nhanh trong ngày không?</h3><p>Có tại một số khu vực nội thành. Hệ thống sẽ gợi ý khung giờ giao nhanh khi bạn thanh toán.</p></article>
        </div>
      </section>
    </>
  );
}

export default memo(HomePage);
